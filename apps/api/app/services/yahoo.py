"""Yahoo Finance public quote endpoint — second source for equity-price validation.

Free and unauthenticated. The endpoint is NOT officially supported by Yahoo, so
treat it as a CROSS-CHECK against Polygon, never as the primary live feed.
Rate-limited; we cache aggressively. Failures degrade to None.
"""

from __future__ import annotations

import logging

import httpx

from app.services.cache import async_ttl_cache

logger = logging.getLogger("yahoo")

_URL = "https://query1.finance.yahoo.com/v7/finance/quote"
_HEADERS = {
    # Yahoo rejects the default Python UA — pass a real browser string.
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    ),
}


@async_ttl_cache(ttl_open=60, ttl_closed=300)
async def get_quote(symbol: str) -> dict | None:
    """Raw quote dict or None on any failure."""
    async with httpx.AsyncClient(timeout=10.0, headers=_HEADERS) as client:
        try:
            resp = await client.get(_URL, params={"symbols": symbol.upper()})
            resp.raise_for_status()
            results = resp.json().get("quoteResponse", {}).get("result", []) or []
            return results[0] if results else None
        except httpx.HTTPError as exc:
            logger.debug("Yahoo quote %s failed: %s", symbol, exc)
            return None


async def get_price(symbol: str) -> float | None:
    """Latest regular-market price as a float. None on failure."""
    q = await get_quote(symbol)
    if not q:
        return None
    raw = q.get("regularMarketPrice")
    try:
        return float(raw) if raw is not None else None
    except (TypeError, ValueError):
        return None
