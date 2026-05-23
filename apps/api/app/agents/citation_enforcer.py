"""The Citation Enforcement Agent — breadth sweep on every specialist output.

For every SpecialistReport this agent:
  1. Splits the narrative-bearing fields into sentences.
  2. Pattern-detects FACTUAL CLAIMS (numbers w/ units, dollar amounts, dated
     historical references, attribution verbs).
  3. Looks for a citation tag in the same sentence — `{source: "..."}` or
     `[cite: ...]`.
  4. Applies a ruling: verified | uncited | (distorted / fabricated lift in
     when sourced verification lands).
  5. Updates per-specialist counters and writes audit events.

Strict mode (``CITATION_STRICT_MODE=true``) rewrites uncited factual sentences
in the SpecialistReport itself with ``[citation needed]`` before downstream
consumers (engine, email render) see it. Default OFF — flip it once specialists
can actually cite (tool-use pipeline).

This is complementary to the PSV verifier:
  - PSV — deep verification on conviction-≥8 picks, source-text + exact-quote
    check. Already runs.
  - Citation Enforcer — breadth, pattern-based, every output. Catches what PSV
    doesn't reach.
"""

from __future__ import annotations

import logging
import re
import uuid
from datetime import datetime, timezone

from app.config import get_settings
from app.schemas import (
    CitationReport,
    CitationRuling,
    ClaimRuling,
    SpecialistReport,
)
from app.services import audit, specialist_metrics

logger = logging.getLogger("citation_enforcer")

# --- Claim-detection patterns --------------------------------------------
_NUMBER_WITH_UNIT = re.compile(
    r"\b[+-]?\d+(?:,\d{3})*(?:\.\d+)?\s*"
    r"(?:%|bps|bp|x\b|×|billion|million|trillion|bn\b|tn\b|"
    r"basis\s+points?|percent)",
    re.I,
)
_DOLLAR_AMOUNT = re.compile(
    r"\$\s*\d+(?:,\d{3})*(?:\.\d+)?"
    r"\s*(?:[KMBT]\b|thousand|million|billion|trillion)?",
    re.I,
)
_HISTORICAL_REF = re.compile(
    r"\b(?:since|highest|lowest|largest|smallest|first\s+time|most|fewest|"
    r"biggest|worst|best)\b[^.]{0,80}\b(?:19|20)\d{2}\b",
    re.I,
)
_NAMED_QUOTE = re.compile(
    r"\b(?:said|stated|told|noted|guided\s+to|raised|cut|reported|"
    r"announced|signaled|disclosed)\b",
    re.I,
)
_CITATION_MARK = re.compile(
    r"(?:\{\s*source\s*:\s*[\"'][^\"']+[\"']\s*\})|(?:\[\s*cite\s*:\s*[^\]]+\s*\])",
    re.I,
)

# Tags Holloway and Whitlock already prefix their narratives with — these are
# specialist-emitted structured metadata, NOT uncited claims.
_OVERLAY_TAG = re.compile(r"^\s*\[(?:yield|MoS)\b[^\]]*\]\s*", re.I)


def _split_sentences(text: str) -> list[str]:
    if not text:
        return []
    return [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if s.strip()]


def _is_factual_claim(sentence: str) -> bool:
    return bool(
        _NUMBER_WITH_UNIT.search(sentence)
        or _DOLLAR_AMOUNT.search(sentence)
        or _HISTORICAL_REF.search(sentence)
        or _NAMED_QUOTE.search(sentence)
    )


def _check(sentence: str, field_path: str) -> ClaimRuling | None:
    if not _is_factual_claim(sentence):
        return None
    cite = _CITATION_MARK.search(sentence)
    if cite:
        return ClaimRuling(
            claim=sentence[:160],
            sentence=sentence,
            field_path=field_path,
            ruling=CitationRuling.verified,
            cited_source=cite.group(0),
            action_taken="passed_through",
        )
    return ClaimRuling(
        claim=sentence[:160],
        sentence=sentence,
        field_path=field_path,
        ruling=CitationRuling.uncited,
        cited_source=None,
        action_taken="marked_uncited",
        notes="No citation tag found in the same sentence.",
    )


class CitationEnforcer:
    """Stateless — one instance shared across the roster."""

    async def enforce(self, sr: SpecialistReport) -> CitationReport:
        """Sweep one specialist's filing and (in strict mode) sanitize it in place."""
        settings = get_settings()
        strict = settings.citation_strict_mode
        rulings: list[ClaimRuling] = []

        for sentence in _split_sentences(sr.key_takeaway or ""):
            r = _check(sentence, "key_takeaway")
            if r:
                rulings.append(r)
        for i, cn in enumerate(sr.covered_names_commentary):
            # Strip the Holloway/Whitlock overlay tag from sentence-splitting so
            # `[yield 3.2% · safety 9/10]` isn't itself flagged as an uncited
            # claim — it IS the citation in their structured emission.
            narrative = _OVERLAY_TAG.sub("", cn.narrative or "")
            for sentence in _split_sentences(narrative):
                r = _check(sentence, f"covered_names_commentary[{i}].narrative")
                if r:
                    rulings.append(r)
        for i, idea in enumerate(sr.new_ideas):
            for sentence in _split_sentences(idea.thesis or ""):
                r = _check(sentence, f"new_ideas[{i}].thesis")
                if r:
                    rulings.append(r)
            for sentence in _split_sentences(idea.key_risk or ""):
                r = _check(sentence, f"new_ideas[{i}].key_risk")
                if r:
                    rulings.append(r)

        verified = sum(1 for r in rulings if r.ruling == CitationRuling.verified)
        uncited = sum(1 for r in rulings if r.ruling == CitationRuling.uncited)
        distorted = sum(1 for r in rulings if r.ruling == CitationRuling.distorted)
        fabricated = sum(1 for r in rulings if r.ruling == CitationRuling.fabricated)
        total = len(rulings)
        rate = (uncited + distorted + fabricated) / total if total else 0.0

        report = CitationReport(
            agent_key=sr.agent_key,
            specialist=sr.specialist,
            original_output_id=str(uuid.uuid4()),
            rulings=rulings,
            claims_total=total,
            verified_count=verified,
            uncited_count=uncited,
            distorted_count=distorted,
            fabricated_count=fabricated,
            hallucination_rate=rate,
            strict_mode=strict,
            verified_at=datetime.now(timezone.utc),
        )

        # Per-specialist running counters (used by /api/citations/metrics).
        specialist_metrics.update(
            sr.agent_key,
            {
                "claims_total": total,
                "verified_count": verified,
                "uncited_count": uncited,
                "distorted_count": distorted,
                "fabricated_count": fabricated,
                "reports_seen": 1,
            },
        )

        # Audit any non-verified events. Single fabrication is flagged critical.
        if uncited or distorted or fabricated:
            audit.log_event(
                "citations",
                {
                    "agent_key": sr.agent_key,
                    "specialist": sr.specialist,
                    "uncited": uncited,
                    "distorted": distorted,
                    "fabricated": fabricated,
                    "claims_total": total,
                    "hallucination_rate": rate,
                    "strict_mode": strict,
                    "critical": fabricated > 0,
                },
            )

        # Strict mode: rewrite uncited sentences in the SpecialistReport itself.
        if strict and uncited:
            self._sanitize_in_place(sr, rulings)

        return report

    @staticmethod
    def _sanitize_in_place(sr: SpecialistReport, rulings: list[ClaimRuling]) -> None:
        """Replace uncited factual sentences with '[citation needed]'."""
        strip = {r.sentence for r in rulings if r.ruling == CitationRuling.uncited}
        if not strip:
            return

        def _sanitize(text: str | None) -> str:
            if not text:
                return text or ""
            sentences = _split_sentences(text)
            return " ".join(
                "[citation needed]" if s in strip else s for s in sentences
            )

        sr.key_takeaway = _sanitize(sr.key_takeaway)
        for cn in sr.covered_names_commentary:
            cn.narrative = _sanitize(cn.narrative)
        for idea in sr.new_ideas:
            idea.thesis = _sanitize(idea.thesis)
            idea.key_risk = _sanitize(idea.key_risk)


# Process-wide singleton.
enforcer = CitationEnforcer()
