"""Polygon.io market-data adapter (real-time stocks tier).

Returns ``None`` fields gracefully when no API key is configured or when a
request hits a Polygon tier the account does not hold (e.g. Indices, Crypto),
so the dashboard can degrade instead of erroring.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta

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


@dataclass
class IndexQuote:
    label: str
    symbol: str
    price: float | None = None
    change_pct: float | None = None


# Row-1 market-snapshot tiles. kind drives which Polygon endpoint is used.
#   (label, display symbol, polygon ticker, kind)
SNAPSHOT_TICKERS: list[tuple[str, str, str, str]] = [
    ("S&P 500", "SPY", "SPY", "stock"),
    ("Nasdaq 100", "QQQ", "QQQ", "stock"),
    ("S&P Equal Wt", "RSP", "RSP", "stock"),
    ("Russell 2000", "IWM", "IWM", "stock"),
    ("Volatility", "VIX", "I:VIX", "index"),
    ("US 10Y", "10Y", "I:US10Y", "index"),
    ("Dollar Index", "DXY", "I:DXY", "index"),
    ("Bitcoin", "BTC", "X:BTCUSD", "crypto"),
]


# --------------------------------------------------------------------------
# Single-symbol quote (stocks)
# --------------------------------------------------------------------------
async def get_quote(symbol: str) -> Quote:
    """Live snapshot + year-to-date change for one US-listed symbol."""
    settings = get_settings()
    symbol = symbol.upper()
    if not settings.polygon_api_key:
        return Quote(symbol=symbol)

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            snap = await _snapshot(client, symbol, settings.polygon_api_key)
            snap.ytd_pct = await _ytd_pct(client, symbol, snap.price, settings.polygon_api_key)
            return snap
        except httpx.HTTPError:
            return Quote(symbol=symbol)


async def get_quotes(symbols: list[str]) -> dict[str, Quote]:
    """Convenience batch wrapper — one Quote per requested symbol."""
    out: dict[str, Quote] = {}
    for sym in symbols:
        out[sym.upper()] = await get_quote(sym)
    return out


# --------------------------------------------------------------------------
# Dashboard market snapshot (Row 1)
# --------------------------------------------------------------------------
async def get_dashboard_snapshot() -> list[IndexQuote]:
    """The 8 Row-1 tiles. Indices/crypto degrade to None if the tier is absent."""
    settings = get_settings()
    results: list[IndexQuote] = []
    if not settings.polygon_api_key:
        return [IndexQuote(label=l, symbol=s) for l, s, _, _ in SNAPSHOT_TICKERS]

    async with httpx.AsyncClient(timeout=10.0) as client:
        for label, disp, pticker, kind in SNAPSHOT_TICKERS:
            try:
                if kind == "stock":
                    q = await _snapshot(client, pticker, settings.polygon_api_key)
                    results.append(
                        IndexQuote(label=label, symbol=disp, price=q.price, change_pct=q.daily_pct)
                    )
                else:
                    price, pct = await _prev_agg(client, pticker, settings.polygon_api_key)
                    results.append(
                        IndexQuote(label=label, symbol=disp, price=price, change_pct=pct)
                    )
            except httpx.HTTPError:
                results.append(IndexQuote(label=label, symbol=disp))
    return results


# --------------------------------------------------------------------------
# Reference data — company details + news
# --------------------------------------------------------------------------
async def get_ticker_details(symbol: str) -> dict:
    """Polygon ticker reference: name, description, market cap, etc."""
    settings = get_settings()
    symbol = symbol.upper()
    if not settings.polygon_api_key:
        return {}
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(
                f"{_BASE}/v3/reference/tickers/{symbol}",
                params={"apiKey": settings.polygon_api_key},
            )
            resp.raise_for_status()
            return resp.json().get("results", {}) or {}
        except httpx.HTTPError:
            return {}


async def get_history(symbol: str, days: int = 120) -> list[dict]:
    """Daily OHLC bars for the trailing `days` calendar days."""
    settings = get_settings()
    symbol = symbol.upper()
    if not settings.polygon_api_key:
        return []
    start = (date.today() - timedelta(days=days)).isoformat()
    end = date.today().isoformat()
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(
                f"{_BASE}/v2/aggs/ticker/{symbol}/range/1/day/{start}/{end}",
                params={"apiKey": settings.polygon_api_key, "sort": "asc", "limit": 5000},
            )
            resp.raise_for_status()
            results = resp.json().get("results") or []
            return [
                {
                    "date": date.fromtimestamp(bar["t"] / 1000).isoformat(),
                    "close": bar.get("c"),
                    "volume": int(bar.get("v", 0)),
                }
                for bar in results
                if bar.get("c") is not None
            ]
        except httpx.HTTPError:
            return []


async def get_news(symbol: str, limit: int = 10) -> list[dict]:
    """Recent Polygon news articles for a ticker."""
    settings = get_settings()
    symbol = symbol.upper()
    if not settings.polygon_api_key:
        return []
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.get(
                f"{_BASE}/v2/reference/news",
                params={"ticker": symbol, "limit": limit, "apiKey": settings.polygon_api_key},
            )
            resp.raise_for_status()
            return resp.json().get("results", []) or []
        except httpx.HTTPError:
            return []


# --------------------------------------------------------------------------
# Internal helpers
# --------------------------------------------------------------------------
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


async def _prev_agg(
    client: httpx.AsyncClient, polygon_ticker: str, key: str
) -> tuple[float | None, float | None]:
    """Previous-session close + intraday % change — works for indices and crypto."""
    url = f"{_BASE}/v2/aggs/ticker/{polygon_ticker}/prev"
    resp = await client.get(url, params={"apiKey": key})
    resp.raise_for_status()
    results = resp.json().get("results") or []
    if not results:
        return None, None
    bar = results[0]
    close, open_ = bar.get("c"), bar.get("o")
    pct = round((close - open_) / open_ * 100, 2) if close and open_ else None
    return close, pct


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
