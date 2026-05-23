"""The Data Validation Agent.

Every data point that reaches a specialist must pass through here. For each
field we hit two or more independent sources, compute variance, score
confidence, and stamp a status:

  verified              variance under threshold across >=2 sources
  flagged               variance over threshold but under 2x (likely reconcilable)
  excluded              sources disagree by more than 2x threshold -> drop
  stale                 all sources are older than the freshness window
  insufficient_sources  <2 sources returned a value -> single-source confidence 0.3

Per Brian's spec:

  equity prices    0.1%  relative
  treasury yields  1 bps absolute
  fundamentals     2%    relative
  economic data    exact

Audit log: every non-verified event appends to apps/api/.audit/validation.jsonl.
Specialists never see raw API responses — only `VerifiedDataPoint` /
`VerifiedDataPacket` payloads from this agent.
"""

from __future__ import annotations

import asyncio
import logging
import statistics
from datetime import datetime, timezone

from app.engine.top50 import market_open
from app.schemas import (
    ConfidenceStatus,
    DataKind,
    SourceReading,
    VerifiedDataPacket,
    VerifiedDataPoint,
)
from app.services import audit, bls, fred, market_data, treasury, yahoo

logger = logging.getLogger("validator")

THRESHOLDS: dict[DataKind, float] = {
    DataKind.equity_price: 0.001,     # 0.1% relative
    DataKind.treasury_yield: 0.01,    # 1 bps absolute (yields quoted in %)
    DataKind.fundamentals: 0.02,      # 2% relative
    DataKind.economic_data: 0.0,      # exact
}

STALE_CLOSED = 3600     # 1 hr off-hours (the slow side; market-hours threshold
                        # is settings.stale_threshold_minutes * 60 — kept in sync
                        # with the specialist prompt's temporal-discipline ruler).
SINGLE_SOURCE_CONFIDENCE = 0.3


class Validator:
    """The Data Validation Agent. Wraps every data fetch in cross-source validation."""

    # -- public per-kind validators ---------------------------------------
    async def validate_equity_price(self, ticker: str) -> VerifiedDataPoint:
        ticker = ticker.upper()
        polygon_quote, yahoo_price = await asyncio.gather(
            market_data.get_quote(ticker),
            yahoo.get_price(ticker),
            return_exceptions=True,
        )
        polygon_price = (
            polygon_quote.price
            if hasattr(polygon_quote, "price")
            else None
        )
        yahoo_val = yahoo_price if isinstance(yahoo_price, (int, float)) else None
        now = datetime.now(timezone.utc)
        readings = [
            SourceReading(source="polygon", value=polygon_price, fetched_at=now, age_seconds=0),
            SourceReading(source="yahoo", value=yahoo_val, fetched_at=now, age_seconds=0),
        ]
        return self._reconcile(f"{ticker}.price", DataKind.equity_price, readings)

    async def validate_treasury_yield(self, series_id: str) -> VerifiedDataPoint:
        fred_v, tgov_v = await asyncio.gather(
            fred.get_latest(series_id),
            treasury.get_yield(series_id),
            return_exceptions=True,
        )
        fred_value = fred_v if isinstance(fred_v, (int, float)) else None
        tgov_value = tgov_v if isinstance(tgov_v, (int, float)) else None
        now = datetime.now(timezone.utc)
        readings = [
            SourceReading(source="fred", value=fred_value, fetched_at=now, age_seconds=0),
            SourceReading(source="treasury_gov", value=tgov_value, fetched_at=now, age_seconds=0),
        ]
        return self._reconcile(series_id, DataKind.treasury_yield, readings)

    async def validate_economic_data(self, series_id: str) -> VerifiedDataPoint:
        fred_v, bls_v = await asyncio.gather(
            fred.get_latest(series_id),
            bls.get_latest(series_id),
            return_exceptions=True,
        )
        fred_value = fred_v if isinstance(fred_v, (int, float)) else None
        bls_value = bls_v if isinstance(bls_v, (int, float)) else None
        now = datetime.now(timezone.utc)
        readings = [
            SourceReading(source="fred", value=fred_value, fetched_at=now, age_seconds=0),
            SourceReading(source="bls", value=bls_value, fetched_at=now, age_seconds=0),
        ]
        return self._reconcile(series_id, DataKind.economic_data, readings)

    async def validate_fundamentals(self, field: str) -> VerifiedDataPoint:
        """Schema-only: no fundamentals fetcher is wired yet."""
        now = datetime.now(timezone.utc)
        point = VerifiedDataPoint(
            field=field,
            kind=DataKind.fundamentals,
            value=None,
            confidence=0.0,
            status=ConfidenceStatus.insufficient_sources,
            threshold=THRESHOLDS[DataKind.fundamentals],
            sources=[],
            verified_at=now,
            notes="No fundamentals adapter wired — validation framework only.",
        )
        audit.log_event("validation", point.model_dump(mode="json"))
        return point

    # -- packet helper -----------------------------------------------------
    @staticmethod
    def build_packet(points: list[VerifiedDataPoint]) -> VerifiedDataPacket:
        live = [p for p in points if p.status != ConfidenceStatus.excluded]
        confidences = [p.confidence for p in live]
        return VerifiedDataPacket(
            points=points,
            verified_at=datetime.now(timezone.utc),
            overall_confidence=min(confidences) if confidences else 0.0,
        )

    # -- core reconciliation logic ----------------------------------------
    def _reconcile(
        self, field: str, kind: DataKind, readings: list[SourceReading]
    ) -> VerifiedDataPoint:
        threshold = THRESHOLDS[kind]
        from app.config import get_settings

        stale_open = get_settings().stale_threshold_minutes * 60
        stale_max = stale_open if market_open() else STALE_CLOSED
        now = datetime.now(timezone.utc)

        # Drop stale readings (None age_seconds is treated as fresh).
        fresh = [r for r in readings if r.age_seconds is None or r.age_seconds <= stale_max]
        all_stale = bool(readings) and not fresh

        # Keep only readings that actually returned a value.
        valid = [r for r in fresh if r.value is not None]
        values: list[float] = [float(r.value) for r in valid if r.value is not None]

        # No usable data
        if not values:
            status = ConfidenceStatus.stale if all_stale else ConfidenceStatus.insufficient_sources
            note = (
                "all sources stale" if all_stale else "no source returned a value"
            )
            point = VerifiedDataPoint(
                field=field, kind=kind, value=None, confidence=0.0,
                status=status, threshold=threshold, sources=readings,
                verified_at=now, notes=note,
            )
            audit.log_event("validation", point.model_dump(mode="json"))
            return point

        # Only one source — degrade confidence but pass the value through.
        if len(values) < 2:
            point = VerifiedDataPoint(
                field=field, kind=kind, value=values[0],
                confidence=SINGLE_SOURCE_CONFIDENCE,
                status=ConfidenceStatus.insufficient_sources, threshold=threshold,
                sources=readings, verified_at=now,
                notes=f"only 1 of {len(readings)} sources returned a value",
            )
            audit.log_event("validation", point.model_dump(mode="json"))
            return point

        variance = self._variance(values, kind)

        if kind == DataKind.economic_data:
            # Exact match required.
            if max(values) - min(values) == 0:
                value, status, conf, note = values[0], ConfidenceStatus.verified, 1.0, ""
            else:
                value, status, conf, note = (
                    None,
                    ConfidenceStatus.excluded,
                    0.0,
                    "economic-data sources disagree (exact match required)",
                )
        elif variance <= threshold:
            value, status, conf, note = (
                statistics.mean(values),
                ConfidenceStatus.verified,
                1.0,
                "",
            )
        elif variance <= threshold * 2:
            value, status, conf, note = (
                statistics.median(values),
                ConfidenceStatus.flagged,
                0.5,
                f"variance {variance:.5f} > threshold {threshold}",
            )
        else:
            value, status, conf, note = (
                None,
                ConfidenceStatus.excluded,
                0.0,
                f"sources fundamentally disagree: variance {variance:.5f} (>2x threshold)",
            )

        point = VerifiedDataPoint(
            field=field, kind=kind, value=value, confidence=conf, status=status,
            variance=variance, threshold=threshold, sources=readings,
            verified_at=now, notes=note,
        )
        if status != ConfidenceStatus.verified:
            audit.log_event("validation", point.model_dump(mode="json"))
        return point

    @staticmethod
    def _variance(values: list[float], kind: DataKind) -> float:
        spread = abs(max(values) - min(values))
        if kind == DataKind.treasury_yield:
            return spread  # absolute, percentage points (1bps == 0.01)
        m = sum(values) / len(values)
        if not m:
            return float("inf")
        return spread / abs(m)


# Process-wide singleton.
validator = Validator()
