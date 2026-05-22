"""Polygon.io market-data adapter (real-time stocks tier).

Returns ``None`` fields gracefully when no API key is configured, so the agent
framework can be developed and demoed before the Polygon key is wired up.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date

import httpx

from app.config import get_settings

_BASE = "https://api.polygon.io"


@dataclass
class Quote:
    symbol: str
    price: float | None = None
    daily_pct: float | None = None
    ytd_pct: float | None = None
    volume: int | None = None


async def get_quote(symbol: str) -> Quote:
    """Live snapshot + year-to-date change for one symbol."""
    settings = get_settings()
    symbol = symbol.upper()
    if not settings.polygon_api_key:
        return Quote(symbol=symbol)

    async with httpx.AsyncClient(timeout=10.0) as client:
        snap = await _snapshot(client, symbol, settings.polygon_api_key)
        ytd = await _ytd_pct(client, symbol, snap.price, settings.polygon_api_key)
        snap.ytd_pct = ytd
        return snap


async def get_quotes(symbols: list[str]) -> dict[str, Quote]:
    """Convenience batch wrapper — one Quote per requested symbol."""
    out: dict[str, Quote] = {}
    for sym in symbols:
        out[sym.upper()] = await get_quote(sym)
    return out


async def _snapshot(client: httpx.AsyncClient, symbol: str, key: str) -> Quote:
    url = f"{_BASE}/v2/snapshot/locale/us/markets/stocks/tickers/{symbol}"
    resp = await client.get(url, params={"apiKey": key})
    resp.raise_for_status()
    t = resp.json().get("ticker", {})
    day = t.get("day", {}) or t.get("lastTrade", {})
    return Quote(
        symbol=symbol,
        price=day.get("c") or day.get("p"),
        daily_pct=t.get("todaysChangePerc"),
        volume=day.get("v"),
    )


async def _ytd_pct(
    client: httpx.AsyncClient, symbol: str, price: float | None, key: str
) -> float | None:
    """First trading-day close of the current year vs the latest price."""
    if price is None:
        return None
    year_start = date(date.today().year, 1, 1).isoformat()
    today = date.today().isoformat()
    url = f"{_BASE}/v2/aggs/ticker/{symbol}/range/1/day/{year_start}/{today}"
    resp = await client.get(url, params={"apiKey": key, "limit": 1, "sort": "asc"})
    resp.raise_for_status()
    results = resp.json().get("results") or []
    if not results:
        return None
    open_price = results[0].get("c")
    if not open_price:
        return None
    return round((price - open_price) / open_price * 100, 2)
