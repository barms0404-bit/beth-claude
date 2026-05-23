"""USPTO PatentsView v1 adapter — patent verification source.

Free, no auth (45 req/min rate limit). Caches aggressively because patent
records are immutable once granted.

Used by the PSV verifier to satisfy `ClaimType.patent`:
  1. The verifier resolves the ticker -> company assignee via Polygon.
  2. We pull recent patents granted to that assignee.
  3. The verifier hands the patent list + the claim to an LLM, which
     compares and emits an exact_quote that we post-validate.

API reference: https://search.patentsview.org/docs/
"""

from __future__ import annotations

import logging

import httpx

from app.services.cache import async_ttl_cache

logger = logging.getLogger("uspto")

_BASE = "https://search.patentsview.org/api/v1/patent/"
_HEADERS = {
    "Accept": "application/json",
    "Content-Type": "application/json",
    "User-Agent": "Armstrong Arikat Research Terminal brian@cccballers.com",
}
_FIELDS = [
    "patent_id",
    "patent_title",
    "patent_abstract",
    "patent_date",
    "assignees.assignee_organization",
]


@async_ttl_cache(ttl_open=3600, ttl_closed=86_400)
async def search_patents_by_assignee(
    assignee: str, limit: int = 20
) -> list[dict]:
    """Recent patents granted to one assignee organization, newest first."""
    if not assignee:
        return []
    payload = {
        "q": {"assignees.assignee_organization": assignee},
        "f": _FIELDS,
        "s": [{"patent_date": "desc"}],
        "o": {"size": min(limit, 100), "matched_subentities_only": True},
    }
    async with httpx.AsyncClient(timeout=20.0, headers=_HEADERS) as client:
        try:
            resp = await client.post(_BASE, json=payload)
            resp.raise_for_status()
            return resp.json().get("patents", []) or []
        except (httpx.HTTPError, ValueError) as exc:
            logger.warning("PatentsView assignee=%s failed: %s", assignee, exc)
            return []


@async_ttl_cache(ttl_open=3600, ttl_closed=86_400)
async def search_patents(
    query: str, assignee: str | None = None, limit: int = 20
) -> list[dict]:
    """Text search across title + abstract, optionally narrowed by assignee."""
    if not query:
        return []
    text_block = {
        "_or": [
            {"_text_any": {"patent_title": query}},
            {"_text_any": {"patent_abstract": query}},
        ]
    }
    q = (
        {"_and": [text_block, {"assignees.assignee_organization": assignee}]}
        if assignee
        else text_block
    )
    payload = {
        "q": q,
        "f": _FIELDS,
        "s": [{"patent_date": "desc"}],
        "o": {"size": min(limit, 100)},
    }
    async with httpx.AsyncClient(timeout=20.0, headers=_HEADERS) as client:
        try:
            resp = await client.post(_BASE, json=payload)
            resp.raise_for_status()
            return resp.json().get("patents", []) or []
        except (httpx.HTTPError, ValueError) as exc:
            logger.warning("PatentsView text=%r failed: %s", query, exc)
            return []


def patents_as_text(patents: list[dict], max_chars: int = 30_000) -> str:
    """Concatenate patents into a single text blob for LLM verification.

    Format: "<id> · <date> · <assignee> — <title>\\n<abstract>\\n---\\n"
    Truncates to ~30k chars (model context budget).
    """
    chunks: list[str] = []
    used = 0
    for p in patents:
        assignees = [
            a.get("assignee_organization", "")
            for a in (p.get("assignees") or [])
            if isinstance(a, dict)
        ]
        chunk = (
            f"{p.get('patent_id', '?')} · {p.get('patent_date', '?')} · "
            f"{', '.join(a for a in assignees if a) or '?'}\n"
            f"Title: {p.get('patent_title', '')}\n"
            f"Abstract: {p.get('patent_abstract', '')}\n---\n"
        )
        used += len(chunk)
        if used > max_chars:
            break
        chunks.append(chunk)
    return "".join(chunks)
