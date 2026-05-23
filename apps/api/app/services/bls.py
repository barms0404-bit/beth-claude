"""BLS direct API — STUB second source for economic data.

BLS publishes monthly Employment Situation (CES) and CPI directly. FRED ingests
those same prints, so cross-checking is mostly catching transmission errors,
not independent re-keying. Wire a real adapter here against
``https://api.bls.gov/publicAPI/v2/timeseries/data/{series_id}`` when needed.

Current state: returns None. The Validator treats this as the second source
being unavailable and falls back to insufficient_sources for econ-data points.
"""

from __future__ import annotations


async def get_latest(series_id: str) -> float | None:
    """Latest value for a BLS series. Stub returns None until wired."""
    return None
