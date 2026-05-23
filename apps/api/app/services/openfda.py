"""openFDA adapter — regulatory verification source.

Free, no auth (240 req/min, 1000/day per IP). Cached aggressively.

Used by the PSV verifier to satisfy ``ClaimType.regulatory``:
  - drug labels  (approvals, indications, warnings) via /drug/label.json
  - drug recalls (Class I/II/III) via /drug/enforcement.json
  - device recalls via /device/recall.json

The verifier hands the relevant records + the claim to an LLM, which
compares and emits an exact_quote that we post-validate.

API reference: https://open.fda.gov/apis/
"""

from __future__ import annotations

import logging

import httpx

from app.services.cache import async_ttl_cache

logger = logging.getLogger("openfda")

_BASE = "https://api.fda.gov"
_HEADERS = {
    "Accept": "application/json",
    "User-Agent": "Armstrong Arikat Research Terminal brian@cccballers.com",
}


@async_ttl_cache(ttl_open=3600, ttl_closed=86_400)
async def _query(path: str, search: str, limit: int = 10) -> list[dict]:
    """One-shot openFDA query. Empty list on any failure."""
    if not search:
        return []
    async with httpx.AsyncClient(timeout=15.0, headers=_HEADERS) as client:
        try:
            resp = await client.get(
                f"{_BASE}{path}",
                params={"search": search, "limit": min(limit, 100)},
            )
            # openFDA returns 404 when the search has zero results — treat as empty.
            if resp.status_code == 404:
                return []
            resp.raise_for_status()
            return resp.json().get("results", []) or []
        except (httpx.HTTPError, ValueError) as exc:
            logger.warning("openFDA %s %r failed: %s", path, search, exc)
            return []


# --- Drug labels (approvals + indications + warnings) ---------------------
async def search_drug_labels(
    brand_or_generic: str, limit: int = 10
) -> list[dict]:
    """Search drug labels by brand or generic name."""
    if not brand_or_generic:
        return []
    name = brand_or_generic.replace('"', "")
    search = (
        f"openfda.brand_name:\"{name}\" "
        f"OR openfda.generic_name:\"{name}\" "
        f"OR openfda.substance_name:\"{name}\""
    )
    return await _query("/drug/label.json", search, limit)


async def search_drug_labels_by_company(
    company: str, limit: int = 10
) -> list[dict]:
    """Labels by manufacturer name (openfda.manufacturer_name)."""
    if not company:
        return []
    name = company.replace('"', "")
    return await _query(
        "/drug/label.json",
        f"openfda.manufacturer_name:\"{name}\"",
        limit,
    )


# --- Drug recalls ---------------------------------------------------------
async def search_drug_recalls(
    company: str, limit: int = 10
) -> list[dict]:
    """Class I/II/III drug recalls by recalling firm."""
    if not company:
        return []
    name = company.replace('"', "")
    return await _query(
        "/drug/enforcement.json",
        f"recalling_firm:\"{name}\"",
        limit,
    )


# --- Device recalls -------------------------------------------------------
async def search_device_recalls(
    company: str, limit: int = 10
) -> list[dict]:
    """Device recalls by recalling firm."""
    if not company:
        return []
    name = company.replace('"', "")
    return await _query(
        "/device/recall.json",
        f"recalling_firm:\"{name}\"",
        limit,
    )


# --- Text serializer (LLM context) ---------------------------------------
def records_as_text(records: list[dict], kind: str, max_chars: int = 25_000) -> str:
    """Compact text serialization for LLM verification. Truncates to budget."""
    if not records:
        return ""
    chunks: list[str] = [f"--- openFDA {kind} ---\n"]
    used = len(chunks[0])
    for r in records:
        if kind == "drug_label":
            openfda = (r.get("openfda") or {})
            brand = ", ".join(openfda.get("brand_name") or []) or "?"
            generic = ", ".join(openfda.get("generic_name") or []) or "?"
            mfr = ", ".join(openfda.get("manufacturer_name") or []) or "?"
            indications = " ".join((r.get("indications_and_usage") or [])[:1])[:500]
            warnings = " ".join((r.get("warnings") or [])[:1])[:300]
            chunk = (
                f"BRAND: {brand} | GENERIC: {generic} | MFR: {mfr}\n"
                f"Indications: {indications}\n"
                f"Warnings: {warnings}\n---\n"
            )
        elif kind in ("drug_recall", "device_recall"):
            chunk = (
                f"{r.get('product_description', '?')[:200]}\n"
                f"Recall date: {r.get('recall_initiation_date', '?')} | "
                f"Classification: {r.get('classification', '?')} | "
                f"Firm: {r.get('recalling_firm', '?')}\n"
                f"Reason: {r.get('reason_for_recall', '')[:300]}\n---\n"
            )
        else:
            chunk = str(r)[:500] + "\n---\n"
        used += len(chunk)
        if used > max_chars:
            break
        chunks.append(chunk)
    return "".join(chunks)
