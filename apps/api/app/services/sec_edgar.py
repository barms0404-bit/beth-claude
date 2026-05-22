"""SEC EDGAR adapter — the workhorse for Primary Source Verification.

Covers earnings (10-K, 10-Q), 8-K disclosures (M&A, guidance), Form 4 insider
trades, and 13F institutional holdings. All endpoints are public and free; SEC
requires a descriptive User-Agent header. Cached aggressively — filings are
immutable.
"""

from __future__ import annotations

import logging
import re

import httpx

from app.services.cache import async_ttl_cache

logger = logging.getLogger("sec_edgar")

# SEC's request guidelines: identify the requester and stay under 10 req/sec.
_HEADERS = {
    "User-Agent": "Armstrong Arikat Research Terminal brian@cccballers.com",
    "Accept-Encoding": "gzip, deflate",
}
_TIMEOUT = httpx.Timeout(30.0, connect=10.0)


# --- CIK lookup -----------------------------------------------------------
@async_ttl_cache(ttl_open=86_400, ttl_closed=86_400)
async def _ticker_cik_map() -> dict[str, str]:
    """SEC's master ticker -> 10-digit zero-padded CIK map. Refreshes daily."""
    async with httpx.AsyncClient(timeout=_TIMEOUT, headers=_HEADERS) as client:
        try:
            resp = await client.get("https://www.sec.gov/files/company_tickers.json")
            resp.raise_for_status()
            data = resp.json()
            return {
                row["ticker"].upper(): str(row["cik_str"]).zfill(10)
                for row in data.values()
            }
        except (httpx.HTTPError, ValueError, KeyError) as exc:
            logger.warning("EDGAR ticker map fetch failed: %s", exc)
            return {}


async def get_cik(ticker: str) -> str | None:
    """10-digit zero-padded CIK for a US-listed ticker. None if unknown."""
    return (await _ticker_cik_map()).get(ticker.upper())


# --- Filings index --------------------------------------------------------
@async_ttl_cache(ttl_open=3600, ttl_closed=21_600)
async def recent_filings(
    ticker: str,
    form_types: tuple[str, ...] = ("10-K", "10-Q", "8-K"),
    limit: int = 5,
) -> list[dict]:
    """Recent filings for a ticker, filtered to the requested form types."""
    cik = await get_cik(ticker)
    if cik is None:
        return []
    async with httpx.AsyncClient(timeout=_TIMEOUT, headers=_HEADERS) as client:
        try:
            resp = await client.get(f"https://data.sec.gov/submissions/CIK{cik}.json")
            resp.raise_for_status()
            recent = resp.json().get("filings", {}).get("recent", {})
        except (httpx.HTTPError, ValueError) as exc:
            logger.warning("EDGAR submissions %s failed: %s", ticker, exc)
            return []

    forms = recent.get("form", [])
    dates = recent.get("filingDate", [])
    accessions = recent.get("accessionNumber", [])
    primary_docs = recent.get("primaryDocument", [])

    cik_int = int(cik)
    out: list[dict] = []
    for form, filing_date, acc, doc in zip(forms, dates, accessions, primary_docs):
        if form not in form_types:
            continue
        acc_clean = acc.replace("-", "")
        out.append(
            {
                "form": form,
                "filing_date": filing_date,
                "accession": acc,
                "primary_doc": doc,
                "url": f"https://www.sec.gov/Archives/edgar/data/{cik_int}/{acc_clean}/{doc}",
            }
        )
        if len(out) >= limit:
            break
    return out


# --- Filing text ----------------------------------------------------------
_TAG = re.compile(r"<[^>]+>")
_SCRIPT = re.compile(r"<script.*?</script>", re.S | re.I)
_STYLE = re.compile(r"<style.*?</style>", re.S | re.I)
_ENTITIES = {"&nbsp;": " ", "&amp;": "&", "&quot;": '"', "&apos;": "'", "&lt;": "<", "&gt;": ">"}
_WS = re.compile(r"\s+")


def _strip_html(html: str) -> str:
    text = _SCRIPT.sub("", html)
    text = _STYLE.sub("", text)
    text = _TAG.sub(" ", text)
    for entity, repl in _ENTITIES.items():
        text = text.replace(entity, repl)
    return _WS.sub(" ", text).strip()


@async_ttl_cache(ttl_open=86_400, ttl_closed=86_400)
async def fetch_filing_text(url: str, max_chars: int = 60_000) -> str:
    """Fetch a filing's primary document and strip to plain text."""
    async with httpx.AsyncClient(
        timeout=_TIMEOUT, headers=_HEADERS, follow_redirects=True
    ) as client:
        try:
            resp = await client.get(url)
            resp.raise_for_status()
            return _strip_html(resp.text)[:max_chars]
        except httpx.HTTPError as exc:
            logger.warning("EDGAR filing fetch %s failed: %s", url, exc)
            return ""
