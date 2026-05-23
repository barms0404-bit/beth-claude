"""Primary Source Verification (PSV) agent.

Pipeline per high-conviction recommendation (`new_idea.conviction_1_10 >= 8`):

  1. Claim extraction — an LLM pulls verifiable factual assertions from the thesis.
  2. Per-claim verification — each claim is routed by `claim_type` to a primary
     source. SEC EDGAR handles earnings, guidance, M&A, insider, and institutional.
     Patent/regulatory/analyst/industry return ``source_unavailable`` until their
     adapters land.
  3. Quote post-validation — when an LLM claims "verified", the returned
     ``exact_quote`` must appear character-for-character in the source text; if
     not, the status is downgraded to ``discrepancy``.
  4. Aggregation — one ``RecommendationVerification`` per recommendation, with
     ``overall = verified`` only when every claim verified, else ``caveat_required``.

Trust nothing. Verify everything.
"""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone

from app.schemas import (
    ClaimType,
    ClaimVerification,
    NewIdea,
    OverallVerification,
    RecommendationVerification,
    VerificationStatus,
)
from app.services import market_data, openfda, sec_edgar, uspto
from app.services.anthropic_client import call_agent

logger = logging.getLogger("verifier")

CONVICTION_THRESHOLD = 8

# Claim types routable to SEC EDGAR.
_EDGAR_TYPES = {
    ClaimType.earnings,
    ClaimType.guidance,
    ClaimType.ma,
    ClaimType.insider,
    ClaimType.institutional,
}

# Map claim type -> preferred SEC form(s) to fetch.
_EDGAR_FORMS: dict[ClaimType, tuple[str, ...]] = {
    ClaimType.earnings: ("10-K", "10-Q"),
    ClaimType.guidance: ("8-K", "10-Q", "10-K"),
    ClaimType.ma: ("8-K",),
    ClaimType.insider: ("4",),
    ClaimType.institutional: ("13F-HR", "13F-HR/A"),
}

_VALID_STATUSES = {s.value for s in VerificationStatus}

# --- Prompts --------------------------------------------------------------
_EXTRACT_SYSTEM = """You are the Primary Source Verification claim-extractor at
Armstrong Arikat Private Wealth Group. Your job: read a research thesis and
identify the FACTUAL CLAIMS that must be verified against primary sources.

What counts as a claim:
- Specific historical fact ("revenue grew 28% in Q3").
- Specific forward statement attributed to the company ("management guided to $X").
- Specific event ("the FDA approved drug X on Y").
- Specific data point attributed to a source ("IDC says X").

What is NOT a claim (do not extract):
- Forward-looking analyst opinion ("we expect", "we think").
- Qualitative views ("dominant", "best in class").
- Common-knowledge facts ("NVIDIA makes GPUs").

For each claim, classify it as exactly one of:
  earnings | guidance | analyst_rating | patent | regulatory |
  ma | insider | institutional | industry | other

Respond with ONLY a JSON object:
{
  "claims": [
    {"text": "verbatim factual assertion", "claim_type": "earnings"}
  ]
}

If the thesis contains zero verifiable factual claims, return {"claims": []}.
Cap at 6 claims; pick the most material.
"""

_VERIFY_SYSTEM = """You are the Primary Source Verification verifier at
Armstrong Arikat Private Wealth Group. You will be given a factual claim and
the relevant primary-source text. Decide:

- "verified" if the source explicitly supports the claim. Provide the exact
  quote from the source (verbatim — must be a substring of the source text).
- "discrepancy" if the source contradicts the claim. Provide the contradicting
  quote in `exact_quote` and explain in `discrepancies_found`.
- "unverified" if the source does not address the claim.

Respond with ONLY a JSON object:
{
  "status": "verified | discrepancy | unverified",
  "exact_quote": "verbatim substring of the source text, or empty",
  "discrepancies_found": "describe the contradiction, or empty",
  "notes": "any caveats — empty is fine"
}

NEVER invent or paraphrase quotes. `exact_quote` MUST appear character-for-character
in the source text.
"""


# --- Public entry point ---------------------------------------------------
async def verify_high_conviction(
    new_ideas: list[NewIdea], *, agent_key: str, persona: str
) -> list[RecommendationVerification]:
    """Verify every `new_idea` whose conviction meets the threshold."""
    results: list[RecommendationVerification] = []
    for idea in new_ideas:
        if idea.conviction_1_10 < CONVICTION_THRESHOLD:
            continue
        try:
            result = await _verify_one(idea, agent_key=agent_key, persona=persona)
        except Exception as exc:
            logger.warning(
                "PSV failed for %s/%s: %s — recording as skipped.",
                agent_key,
                idea.ticker,
                exc,
            )
            result = RecommendationVerification(
                agent_key=agent_key,
                persona=persona,
                ticker=idea.ticker.upper(),
                conviction_1_10=idea.conviction_1_10,
                thesis=idea.thesis,
                overall=OverallVerification.skipped,
                claims=[],
                verified_at=datetime.now(timezone.utc),
            )
        results.append(result)
    return results


# --- Per-recommendation pipeline -----------------------------------------
async def _verify_one(
    idea: NewIdea, *, agent_key: str, persona: str
) -> RecommendationVerification:
    ticker = idea.ticker.upper()
    raw_claims = await _extract_claims(idea.thesis, ticker)
    verifications: list[ClaimVerification] = []
    for raw in raw_claims:
        try:
            ctype = ClaimType(raw.get("claim_type", "other"))
        except ValueError:
            ctype = ClaimType.other
        verifications.append(await _verify_claim(raw.get("text", ""), ctype, ticker))

    overall = OverallVerification.verified
    if not verifications:
        # Pure-opinion theses can't be verified — caveat them too.
        overall = OverallVerification.caveat_required
    elif any(
        v.status
        in (
            VerificationStatus.unverified,
            VerificationStatus.discrepancy,
            VerificationStatus.source_unavailable,
        )
        for v in verifications
    ):
        overall = OverallVerification.caveat_required

    return RecommendationVerification(
        agent_key=agent_key,
        persona=persona,
        ticker=ticker,
        conviction_1_10=idea.conviction_1_10,
        thesis=idea.thesis,
        overall=overall,
        claims=verifications,
        verified_at=datetime.now(timezone.utc),
    )


# --- Claim extraction -----------------------------------------------------
async def _extract_claims(thesis: str, ticker: str) -> list[dict]:
    reply = await call_agent(
        system_prompt=_EXTRACT_SYSTEM,
        user_message=f"Ticker: {ticker}\nThesis: {thesis}",
        temperature=0.0,
        max_tokens=1024,
    )
    try:
        data = reply.as_json()
    except Exception as exc:
        logger.warning("Claim extraction failed to parse JSON for %s: %s", ticker, exc)
        return []
    claims = data.get("claims") or []
    return claims[:6]


# --- Per-claim verification ----------------------------------------------
async def _verify_claim(
    claim_text: str, claim_type: ClaimType, ticker: str
) -> ClaimVerification:
    now = datetime.now(timezone.utc)
    if not claim_text.strip():
        return ClaimVerification(
            claim_text=claim_text,
            claim_type=claim_type,
            status=VerificationStatus.skipped,
            verification_timestamp=now,
            notes="Empty claim text.",
        )

    if claim_type in _EDGAR_TYPES:
        return await _verify_via_edgar(claim_text, claim_type, ticker, now)
    if claim_type == ClaimType.patent:
        return await _verify_via_uspto(claim_text, ticker, now)
    if claim_type == ClaimType.regulatory:
        return await _verify_via_openfda(claim_text, ticker, now)

    # Paywalled / unstructured sources — honest about it.
    notes_for: dict[ClaimType, str] = {
        ClaimType.analyst_rating: (
            "Broker research notes are paywalled (institutional only) and "
            "cannot be verified from public sources."
        ),
        ClaimType.industry: (
            "Primary industry sources vary by sector — adapters not wired yet."
        ),
        ClaimType.other: "Claim type does not route to a configured source.",
    }
    return ClaimVerification(
        claim_text=claim_text,
        claim_type=claim_type,
        status=VerificationStatus.source_unavailable,
        verification_timestamp=now,
        notes=notes_for.get(claim_type, ""),
    )


async def _verify_via_edgar(
    claim_text: str, claim_type: ClaimType, ticker: str, now: datetime
) -> ClaimVerification:
    """Fetch the most-relevant recent filing and have the LLM compare."""
    form_types = _EDGAR_FORMS.get(claim_type, ("10-K", "10-Q", "8-K"))
    filings = await sec_edgar.recent_filings(ticker, form_types=form_types, limit=2)
    if not filings:
        return ClaimVerification(
            claim_text=claim_text,
            claim_type=claim_type,
            status=VerificationStatus.unverified,
            verification_timestamp=now,
            notes=f"No {'/'.join(form_types)} filings found on EDGAR for {ticker}.",
        )

    filing = filings[0]
    source_text = await sec_edgar.fetch_filing_text(filing["url"])
    if not source_text:
        return ClaimVerification(
            claim_text=claim_text,
            claim_type=claim_type,
            status=VerificationStatus.source_unavailable,
            primary_source_url=filing["url"],
            verification_timestamp=now,
            notes="Filing fetched but text extraction returned empty.",
        )

    reply = await call_agent(
        system_prompt=_VERIFY_SYSTEM,
        user_message=(
            f"Claim: {claim_text}\n\n"
            f"Source: SEC {filing['form']} filed {filing['filing_date']}\n"
            f"Source URL: {filing['url']}\n\n"
            f"Source text (truncated):\n{source_text}"
        ),
        temperature=0.0,
        max_tokens=2048,
    )
    try:
        data = reply.as_json()
    except Exception as exc:
        return ClaimVerification(
            claim_text=claim_text,
            claim_type=claim_type,
            status=VerificationStatus.unverified,
            primary_source_url=filing["url"],
            verification_timestamp=now,
            notes=f"LLM verification reply was not JSON: {exc}",
        )

    status_raw = data.get("status", "unverified")
    quote = (data.get("exact_quote") or "").strip() or None
    notes = data.get("notes") or ""

    # Post-validate: a "verified" without a quote, or with a quote that isn't a
    # substring of the source, gets downgraded.
    if status_raw == "verified":
        if not quote:
            status_raw = "unverified"
            notes = (notes + " | No exact_quote returned despite verified status.").strip(" |")
        elif quote not in source_text:
            status_raw = "discrepancy"
            notes = (
                notes + " | LLM claimed a verbatim quote not found in the source text."
            ).strip(" |")

    if status_raw not in _VALID_STATUSES:
        status_raw = "unverified"

    return ClaimVerification(
        claim_text=claim_text,
        claim_type=claim_type,
        status=VerificationStatus(status_raw),
        primary_source_url=filing["url"],
        exact_quote=quote,
        verification_timestamp=now,
        discrepancies_found=(data.get("discrepancies_found") or None),
        notes=notes,
    )


# --- USPTO + openFDA verification paths ----------------------------------
async def _company_name(ticker: str) -> str | None:
    """Resolve ticker -> company name via Polygon for assignee/firm lookups."""
    details = await market_data.get_ticker_details(ticker)
    name = (details.get("name") or "").strip()
    return name or None


async def _compare_with_llm(
    *,
    claim_text: str,
    claim_type: ClaimType,
    source_label: str,
    source_url: str | None,
    source_text: str,
    now: datetime,
) -> ClaimVerification:
    """Shared LLM-compare + quote post-validation used by USPTO and openFDA paths."""
    if not source_text:
        return ClaimVerification(
            claim_text=claim_text,
            claim_type=claim_type,
            status=VerificationStatus.unverified,
            primary_source_url=source_url,
            verification_timestamp=now,
            notes=f"{source_label}: no records returned for the claim.",
        )

    reply = await call_agent(
        system_prompt=_VERIFY_SYSTEM,
        user_message=(
            f"Claim: {claim_text}\n\n"
            f"Source: {source_label}\n"
            f"Source URL: {source_url or '(varies per record)'}\n\n"
            f"Source text (truncated):\n{source_text}"
        ),
        temperature=0.0,
        max_tokens=2048,
    )
    try:
        data = reply.as_json()
    except Exception as exc:
        return ClaimVerification(
            claim_text=claim_text,
            claim_type=claim_type,
            status=VerificationStatus.unverified,
            primary_source_url=source_url,
            verification_timestamp=now,
            notes=f"LLM verification reply was not JSON: {exc}",
        )

    status_raw = data.get("status", "unverified")
    quote = (data.get("exact_quote") or "").strip() or None
    notes = data.get("notes") or ""

    if status_raw == "verified":
        if not quote:
            status_raw = "unverified"
            notes = (notes + " | No exact_quote returned despite verified status.").strip(" |")
        elif quote not in source_text:
            status_raw = "discrepancy"
            notes = (
                notes + " | LLM claimed a verbatim quote not found in the source text."
            ).strip(" |")
    if status_raw not in _VALID_STATUSES:
        status_raw = "unverified"

    return ClaimVerification(
        claim_text=claim_text,
        claim_type=claim_type,
        status=VerificationStatus(status_raw),
        primary_source_url=source_url,
        exact_quote=quote,
        verification_timestamp=now,
        discrepancies_found=(data.get("discrepancies_found") or None),
        notes=notes,
    )


async def _verify_via_uspto(
    claim_text: str, ticker: str, now: datetime
) -> ClaimVerification:
    """Resolve ticker -> assignee -> recent patents -> LLM compare."""
    assignee = await _company_name(ticker)
    if not assignee:
        return ClaimVerification(
            claim_text=claim_text,
            claim_type=ClaimType.patent,
            status=VerificationStatus.unverified,
            verification_timestamp=now,
            notes=f"Could not resolve company name for {ticker} via Polygon.",
        )
    patents = await uspto.search_patents_by_assignee(assignee, limit=25)
    source_text = uspto.patents_as_text(patents)
    return await _compare_with_llm(
        claim_text=claim_text,
        claim_type=ClaimType.patent,
        source_label=f"USPTO PatentsView · assignee={assignee}",
        source_url="https://search.patentsview.org/",
        source_text=source_text,
        now=now,
    )


async def _verify_via_openfda(
    claim_text: str, ticker: str, now: datetime
) -> ClaimVerification:
    """Resolve ticker -> company -> labels + recalls -> LLM compare."""
    company = await _company_name(ticker)
    if not company:
        return ClaimVerification(
            claim_text=claim_text,
            claim_type=ClaimType.regulatory,
            status=VerificationStatus.unverified,
            verification_timestamp=now,
            notes=f"Could not resolve company name for {ticker} via Polygon.",
        )
    labels, drug_recalls, device_recalls = await asyncio.gather(
        openfda.search_drug_labels_by_company(company, limit=10),
        openfda.search_drug_recalls(company, limit=10),
        openfda.search_device_recalls(company, limit=10),
        return_exceptions=True,
    )
    text_blocks: list[str] = []
    if isinstance(labels, list):
        text_blocks.append(openfda.records_as_text(labels, "drug_label"))
    if isinstance(drug_recalls, list):
        text_blocks.append(openfda.records_as_text(drug_recalls, "drug_recall"))
    if isinstance(device_recalls, list):
        text_blocks.append(openfda.records_as_text(device_recalls, "device_recall"))
    source_text = "\n".join(b for b in text_blocks if b)
    return await _compare_with_llm(
        claim_text=claim_text,
        claim_type=ClaimType.regulatory,
        source_label=f"openFDA · firm={company}",
        source_url="https://open.fda.gov/",
        source_text=source_text,
        now=now,
    )
