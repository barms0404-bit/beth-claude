"""FRED (Federal Reserve Economic Data) adapter.

Free API from the St. Louis Fed, requires a key. Used by the Fixed Income
specialist for the data Polygon doesn't cover: treasury yields, curve spreads,
credit OAS, real yields, breakevens, Fed balance sheet, macro releases.

Common series referenced by the specialist:

  Curve:        DGS2, DGS5, DGS7, DGS10, DGS20, DGS30
  Spreads:      T10Y2Y (2s10s), T10Y3M (3m10y)
  Real / BE:    DFII10 (10y real yield), T10YIE (10y breakeven)
  Credit OAS:   BAMLC0A0CM (IG), BAMLH0A0HYM2 (HY)
  Fed:          DFF (eff funds), WALCL (balance sheet), RRPONTSYD (RRP)
  Macro:        UNRATE, PAYEMS, CPIAUCSL, PCEPI, CORESTICKM159SFRBATL

Returns empty / None gracefully when no FRED_API_KEY is configured, so the
rest of the system keeps working until the key lands.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any

import httpx
from tenacity import (
    retry,
    retry_if_exception,
    stop_after_attempt,
    wait_exponential,
)

from app.config import get_settings
from app.services.cache import async_ttl_cache

logger = logging.getLogger("fred")

_BASE = "https://api.stlouisfed.org/fred"


def _retryable(exc: BaseException) -> bool:
    if isinstance(exc, httpx.HTTPStatusError):
        return exc.response.status_code >= 500
    return isinstance(exc, (httpx.TransportError, httpx.TimeoutException))


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(min=0.5, max=8),
    retry=retry_if_exception(_retryable),
    reraise=True,
)
async def _get(client: httpx.AsyncClient, path: str, params: dict) -> httpx.Response:
    resp = await client.get(f"{_BASE}{path}", params=params)
    resp.raise_for_status()
    return resp


@async_ttl_cache(ttl_open=900, ttl_closed=3600)
async def get_series_observations(series_id: str, limit: int = 30) -> list[dict[str, Any]]:
    """Recent observations for a FRED series. Empty list if no key configured."""
    settings = get_settings()
    if not settings.fred_api_key:
        return []
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await _get(
                client,
                "/series/observations",
                params={
                    "series_id": series_id,
                    "api_key": settings.fred_api_key,
                    "file_type": "json",
                    "limit": limit,
                    "sort_order": "desc",
                },
            )
            return resp.json().get("observations", []) or []
        except httpx.HTTPError as exc:
            logger.warning("FRED series %s failed: %s", series_id, exc)
            return []


async def get_latest(series_id: str) -> float | None:
    """Most-recent numeric value for a FRED series. None if missing/unparseable."""
    obs = await get_series_observations(series_id, limit=1)
    if not obs:
        return None
    raw = obs[0].get("value")
    try:
        return float(raw) if raw not in (None, "", ".") else None
    except (TypeError, ValueError):
        return None


# --- Convenience composites ----------------------------------------------
async def treasury_curve() -> dict[str, float | None]:
    """The full standard curve as a dict {label: yield_pct}. Parallel fetch."""
    series = [
        ("1M", "DGS1MO"),
        ("3M", "DGS3MO"),
        ("6M", "DGS6MO"),
        ("2Y", "DGS2"),
        ("3Y", "DGS3"),
        ("5Y", "DGS5"),
        ("7Y", "DGS7"),
        ("10Y", "DGS10"),
        ("20Y", "DGS20"),
        ("30Y", "DGS30"),
    ]
    values = await asyncio.gather(*(get_latest(sid) for _, sid in series))
    return dict(zip([label for label, _ in series], values))


async def credit_spreads() -> dict[str, float | None]:
    """IG and HY option-adjusted spreads (BAML indices)."""
    ig, hy = await asyncio.gather(
        get_latest("BAMLC0A0CM"),
        get_latest("BAMLH0A0HYM2"),
    )
    return {"ig_oas": ig, "hy_oas": hy}


async def real_and_breakeven() -> dict[str, float | None]:
    """10Y real yield and 10Y breakeven inflation."""
    real, be = await asyncio.gather(
        get_latest("DFII10"),
        get_latest("T10YIE"),
    )
    return {"real_10y": real, "breakeven_10y": be}
