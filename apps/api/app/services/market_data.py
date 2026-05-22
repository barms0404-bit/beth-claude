"""Polygon.io REST adapter — cached, backoff-wrapped, batch where possible.

Surface:
  get_quote(symbol)            -> Quote      (single symbol; delegates to batch)
  get_quotes(symbols)          -> {sym: Quote}  (batch /v2/snapshot/.../tickers)
  get_dashboard_snapshot()     -> [IndexQuote]  (the 8 Row-1 tiles)
  get_ticker_details(symbol)   -> dict           (cached 1h)
  get_news(symbol, limit)      -> [dict]         (cached 5m)
  get_history(symbol, days)    -> [dict]         (cached 5m)
  get_year_open_close(symbol)  -> float | None   (cached 12h — drives YTD%)

All requests retry on 5xx / network errors with exponential backoff (3 attempts).
Prices are normalized to 2 decimals at construction time. Tier issues degrade
to None fields gracefully.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import date, timedelta

import httpx
from tenacity import (
    retry,
    retry_if_exception,
    stop_after_attempt,
    wait_exponential,
)

from app.config import get_settings
from app.services.cache import async_ttl_cache

logger = logging.getLogger("market_data")

_BASE = "https://api.polygon.io"


# --- Data classes ---------------------------------------------------------
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


# --- Helpers --------------------------------------------------------------
def round2(value: float | None) -> float | None:
    """Normalize a price to 2 decimals. None passes through."""
    if value is None:
        return None
    return round(float(value), 2)


def _retryable(exc: BaseException) -> bool:
    """Retry transient errors only — 4xx auth/notfound never changes on retry."""
    if isinstance(exc, httpx.HTTPStatusError):
        return exc.response.status_code >= 500
    return isinstance(exc, (httpx.TransportError, httpx.TimeoutException))


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(min=0.5, max=8),
    retry=retry_if_exception(_retryable),
    reraise=True,
)
async def _http_get(client: httpx.AsyncClient, url: str, params: dict) -> httpx.Response:
    resp = await client.get(url, params=params)
    resp.raise_for_status()
    return resp


# --- Batch quotes (preferred for any list of 1+ symbols) ------------------
async def get_quotes(symbols: list[str]) -> dict[str, Quote]:
    """Batch snapshot for many symbols in a single Polygon call. Fills YTD lazily."""
    settings = get_settings()
    if not symbols:
        return {}
    upper = [s.upper() for s in symbols]
    if not settings.polygon_api_key:
        return {s: Quote(symbol=s) for s in upper}

    out: dict[str, Quote] = {s: Quote(symbol=s) for s in upper}
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await _http_get(
                client,
                f"{_BASE}/v2/snapshot/locale/us/markets/stocks/tickers",
                params={"tickers": ",".join(upper), "apiKey": settings.polygon_api_key},
            )
            for t in resp.json().get("tickers", []) or []:
                sym = (t.get("ticker") or "").upper()
                if sym not in out:
                    continue
                day = t.get("day") or t.get("lastTrade") or {}
                out[sym] = Quote(
                    symbol=sym,
                    price=round2(day.get("c") or day.get("p")),
                    daily_pct=t.get("todaysChangePerc"),
                    volume=day.get("v"),
                )
        except httpx.HTTPError as exc:
            logger.warning("batch snapshot failed: %s", exc)

    # Fill YTD using the per-symbol year-open close cache.
    for sym, quote in out.items():
        if quote.price is None:
            continue
        year_open = await get_year_open_close(sym)
        if year_open:
            quote.ytd_pct = round((quote.price - year_open) / year_open * 100, 2)
    return out


async def get_quote(symbol: str) -> Quote:
    """Single-symbol convenience — delegates to the batch endpoint."""
    quotes = await get_quotes([symbol])
    return quotes.get(symbol.upper(), Quote(symbol=symbol.upper()))


# --- Dashboard snapshot (Row 1) -------------------------------------------
@async_ttl_cache(ttl_open=60, ttl_closed=300)
async def get_dashboard_snapshot() -> list[IndexQuote]:
    """The 8 Row-1 tiles. Indices/crypto degrade to None when the tier is absent."""
    settings = get_settings()
    if not settings.polygon_api_key:
        return [IndexQuote(label=l, symbol=s) for l, s, _, _ in SNAPSHOT_TICKERS]

    results: list[IndexQuote] = []
    async with httpx.AsyncClient(timeout=10.0) as client:
        for label, disp, pticker, kind in SNAPSHOT_TICKERS:
            try:
                if kind == "stock":
                    q = await _stock_snapshot(client, pticker, settings.polygon_api_key)
                    results.append(
                        IndexQuote(label=label, symbol=disp, price=round2(q.price), change_pct=q.daily_pct)
                    )
                else:
                    price, pct = await _prev_agg(client, pticker, settings.polygon_api_key)
                    results.append(
                        IndexQuote(label=label, symbol=disp, price=round2(price), change_pct=pct)
                    )
            except httpx.HTTPError:
                results.append(IndexQuote(label=label, symbol=disp))
    return results


# --- Reference + history --------------------------------------------------
@async_ttl_cache(ttl_open=3600, ttl_closed=86400)
async def get_ticker_details(symbol: str) -> dict:
    """Polygon ticker reference: name, description, market cap, etc."""
    settings = get_settings()
    if not settings.polygon_api_key:
        return {}
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await _http_get(
                client,
                f"{_BASE}/v3/reference/tickers/{symbol.upper()}",
                params={"apiKey": settings.polygon_api_key},
            )
            return resp.json().get("results", {}) or {}
        except httpx.HTTPError as exc:
            logger.warning("ticker_details %s failed: %s", symbol, exc)
            return {}


@async_ttl_cache(ttl_open=300, ttl_closed=900)
async def get_news(symbol: str, limit: int = 10) -> list[dict]:
    """Recent Polygon news for one ticker."""
    settings = get_settings()
    if not settings.polygon_api_key:
        return []
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await _http_get(
                client,
                f"{_BASE}/v2/reference/news",
                params={
                    "ticker": symbol.upper(),
                    "limit": limit,
                    "apiKey": settings.polygon_api_key,
                },
            )
            return resp.json().get("results", []) or []
        except httpx.HTTPError as exc:
            logger.warning("news %s failed: %s", symbol, exc)
            return []


@async_ttl_cache(ttl_open=300, ttl_closed=3600)
async def get_history(symbol: str, days: int = 120) -> list[dict]:
    """Daily OHLC bars for the trailing `days` calendar days."""
    settings = get_settings()
    if not settings.polygon_api_key:
        return []
    start = (date.today() - timedelta(days=days)).isoformat()
    end = date.today().isoformat()
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await _http_get(
                client,
                f"{_BASE}/v2/aggs/ticker/{symbol.upper()}/range/1/day/{start}/{end}",
                params={"apiKey": settings.polygon_api_key, "sort": "asc", "limit": 5000},
            )
            results = resp.json().get("results") or []
            return [
                {
                    "date": date.fromtimestamp(bar["t"] / 1000).isoformat(),
                    "close": round2(bar.get("c")),
                    "volume": int(bar.get("v", 0)),
                }
                for bar in results
                if bar.get("c") is not None
            ]
        except httpx.HTTPError as exc:
            logger.warning("history %s failed: %s", symbol, exc)
            return []


@async_ttl_cache(ttl_open=21600, ttl_closed=43200)
async def get_dividends(symbol: str, limit: int = 24) -> list[dict]:
    """Polygon dividend history for a ticker — used by the dividend specialist.

    Returns up to `limit` records with: ex_dividend_date, cash_amount, frequency,
    declaration_date, pay_date. Cached 6-12h (dividend schedules change rarely).
    """
    settings = get_settings()
    if not settings.polygon_api_key:
        return []
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await _http_get(
                client,
                f"{_BASE}/v3/reference/dividends",
                params={
                    "ticker": symbol.upper(),
                    "limit": limit,
                    "order": "desc",
                    "sort": "ex_dividend_date",
                    "apiKey": settings.polygon_api_key,
                },
            )
            return resp.json().get("results", []) or []
        except httpx.HTTPError as exc:
            logger.warning("dividends %s failed: %s", symbol, exc)
            return []


@async_ttl_cache(ttl_open=21600, ttl_closed=43200)
async def get_year_open_close(symbol: str) -> float | None:
    """The first trading-day close of the current calendar year. Drives YTD%."""
    settings = get_settings()
    if not settings.polygon_api_key:
        return None
    year_start = date(date.today().year, 1, 1).isoformat()
    today = date.today().isoformat()
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await _http_get(
                client,
                f"{_BASE}/v2/aggs/ticker/{symbol.upper()}/range/1/day/{year_start}/{today}",
                params={"apiKey": settings.polygon_api_key, "sort": "asc", "limit": 1},
            )
            results = resp.json().get("results") or []
            return round2(results[0].get("c")) if results else None
        except httpx.HTTPError as exc:
            logger.warning("year_open %s failed: %s", symbol, exc)
            return None


# --- Internals (used by get_dashboard_snapshot) ---------------------------
async def _stock_snapshot(client: httpx.AsyncClient, symbol: str, key: str) -> Quote:
    resp = await _http_get(
        client,
        f"{_BASE}/v2/snapshot/locale/us/markets/stocks/tickers/{symbol}",
        params={"apiKey": key},
    )
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
    """Previous-session close + intraday % change — works for indices/crypto with I:/X: prefixes."""
    resp = await _http_get(
        client,
        f"{_BASE}/v2/aggs/ticker/{polygon_ticker}/prev",
        params={"apiKey": key},
    )
    results = resp.json().get("results") or []
    if not results:
        return None, None
    bar = results[0]
    close, open_ = bar.get("c"), bar.get("o")
    pct = round((close - open_) / open_ * 100, 2) if close and open_ else None
    return close, pct
