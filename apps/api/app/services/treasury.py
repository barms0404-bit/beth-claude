"""Daily Treasury Yield Curve from treasury.gov — second source for FRED.

Pulls the published daily rates CSV (free, no auth). One CSV per calendar year;
we fetch the current year, parse the most recent row, and pick the requested
tenor. Cached.

Tenors map to FRED series ids on the call side (e.g. DGS10 -> '10 Yr').
"""

from __future__ import annotations

import csv
import io
import logging
from datetime import date

import httpx

from app.services.cache import async_ttl_cache

logger = logging.getLogger("treasury_gov")

_BASE = (
    "https://home.treasury.gov/resource-center/data-chart-center/interest-rates/"
    "daily-treasury-rates.csv/{year}/all"
    "?type=daily_treasury_yield_curve&page&_format=csv"
)
_HEADERS = {"User-Agent": "Armstrong Arikat Research Terminal brian@cccballers.com"}

# FRED series id -> treasury.gov CSV column header.
TENOR_BY_SERIES: dict[str, str] = {
    "DGS1MO": "1 Mo",
    "DGS3MO": "3 Mo",
    "DGS6MO": "6 Mo",
    "DGS1": "1 Yr",
    "DGS2": "2 Yr",
    "DGS3": "3 Yr",
    "DGS5": "5 Yr",
    "DGS7": "7 Yr",
    "DGS10": "10 Yr",
    "DGS20": "20 Yr",
    "DGS30": "30 Yr",
}


@async_ttl_cache(ttl_open=900, ttl_closed=3600)
async def _yield_curve_rows(year: int) -> list[dict[str, str]]:
    """Parsed rows of the current year's daily yield curve CSV. Empty on failure."""
    async with httpx.AsyncClient(timeout=15.0, headers=_HEADERS, follow_redirects=True) as client:
        try:
            resp = await client.get(_BASE.format(year=year))
            resp.raise_for_status()
            reader = csv.DictReader(io.StringIO(resp.text))
            return list(reader)
        except (httpx.HTTPError, csv.Error) as exc:
            logger.warning("treasury.gov yield-curve fetch failed: %s", exc)
            return []


async def get_yield(fred_series: str) -> float | None:
    """Latest yield for a FRED-equivalent tenor. None when unmapped or missing."""
    col = TENOR_BY_SERIES.get(fred_series)
    if not col:
        return None
    rows = await _yield_curve_rows(date.today().year)
    if not rows:
        return None
    # Treasury CSV is descending by date; take the first row that has the tenor.
    for row in rows:
        raw = row.get(col)
        if not raw or raw.strip() in {"", "N/A"}:
            continue
        try:
            return float(raw)
        except ValueError:
            continue
    return None
