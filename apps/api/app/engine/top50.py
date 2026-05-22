"""The Top 50 recommendation engine.

Beth polls all specialists every 15 minutes during market hours. Each poll's
`new_ideas` are folded into a rolling pick store; the engine then re-ranks:

    pick weight = conviction x track_record x thematic_relevance x decay
    composite   = sum(pick weights for a ticker) x confirmation_bonus
    decay       = 0.95 ^ hours_since_publication
    confirmation= 1.5x when 2+ distinct specialists name the same ticker

Only the latest pick per (specialist, ticker) is kept — re-naming a ticker
refreshes that specialist's pick, it does not stack.
"""

from __future__ import annotations

import logging
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Awaitable, Callable
from zoneinfo import ZoneInfo

from app.schemas import SpecialistReport, Top50Entry, Top50Snapshot
from app.services import market_data

logger = logging.getLogger("top50")

# --- Tunable algorithm constants ------------------------------------------
HOURLY_DECAY = 0.95          # weight multiplier per hour since publication
CONFIRMATION_BONUS = 1.5     # applied when 2+ distinct specialists name a ticker
PICK_TTL_HOURS = 48          # picks older than this are pruned (decayed to noise)
TOP_N = 50

# --- Pluggable formula inputs (neutral until real data exists) ------------
# track_record: populated by the outcome-scoring loop once picks are graded.
TRACK_RECORD: dict[str, float] = {}

# thematic_relevance: ticker -> weight. Empty => a neutral 1.0. Populate with
# the firm's priority-theme tickers to tilt the ranking toward the house view.
THEME_TICKER_WEIGHTS: dict[str, float] = {}


def track_record(agent_key: str) -> float:
    """Specialist reliability multiplier — 1.0 until graded by the outcome loop."""
    return TRACK_RECORD.get(agent_key, 1.0)


def thematic_relevance(ticker: str) -> float:
    """Ticker relevance to firm themes — 1.0 until THEME_TICKER_WEIGHTS is set."""
    return THEME_TICKER_WEIGHTS.get(ticker.upper(), 1.0)


def market_open(now: datetime | None = None) -> bool:
    """NYSE regular hours: 9:30-16:00 ET, weekdays. Holidays not handled."""
    et = (now or datetime.now(timezone.utc)).astimezone(ZoneInfo("America/New_York"))
    if et.weekday() >= 5:
        return False
    minutes = et.hour * 60 + et.minute
    return 570 <= minutes < 960


@dataclass
class SpecialistPick:
    ticker: str
    agent_key: str
    specialist: str            # human persona name
    conviction: int            # 1-10
    thesis: str
    time_horizon: str
    published_at: datetime

    def weight(self, now: datetime) -> float:
        hours = max((now - self.published_at).total_seconds() / 3600.0, 0.0)
        decay = HOURLY_DECAY**hours
        return (
            self.conviction
            * track_record(self.agent_key)
            * thematic_relevance(self.ticker)
            * decay
        )


OnUpdate = Callable[[Top50Snapshot], Awaitable[None]]


class Top50Engine:
    """Aggregates rolling specialist picks into a ranked, time-decaying Top 50."""

    def __init__(self) -> None:
        # latest pick per (agent_key, ticker) — re-naming overwrites, never stacks
        self._picks: dict[tuple[str, str], SpecialistPick] = {}
        self._current: Top50Snapshot | None = None
        self._history: list[Top50Snapshot] = []
        self.on_update: OnUpdate | None = None

    # -- ingest -------------------------------------------------------------
    def ingest(self, reports: list[SpecialistReport]) -> None:
        """Fold a fresh poll of specialist reports into the rolling pick store."""
        for report in reports:
            for idea in report.new_ideas:
                ticker = idea.ticker.upper()
                self._picks[(report.agent_key, ticker)] = SpecialistPick(
                    ticker=ticker,
                    agent_key=report.agent_key,
                    specialist=report.specialist,
                    conviction=idea.conviction_1_10,
                    thesis=idea.thesis,
                    time_horizon=idea.time_horizon,
                    published_at=report.timestamp,
                )
        self._prune()

    def _prune(self) -> None:
        cutoff = datetime.now(timezone.utc) - timedelta(hours=PICK_TTL_HOURS)
        for key in [k for k, p in self._picks.items() if p.published_at < cutoff]:
            del self._picks[key]

    # -- aggregate ----------------------------------------------------------
    def _aggregate(self, now: datetime) -> list[dict]:
        """Group picks by ticker, apply the weighted formula, sort, take Top N."""
        by_ticker: dict[str, list[SpecialistPick]] = defaultdict(list)
        for pick in self._picks.values():
            by_ticker[pick.ticker].append(pick)

        scored: list[dict] = []
        for ticker, picks in by_ticker.items():
            weighted = [(p, p.weight(now)) for p in picks]
            base = sum(w for _, w in weighted)
            confirmation = CONFIRMATION_BONUS if len(picks) >= 2 else 1.0
            lead = max(weighted, key=lambda pw: pw[1])[0]
            scored.append(
                {
                    "ticker": ticker,
                    "composite": base * confirmation,
                    "lead": lead,
                    "contributing": sorted({p.specialist for p in picks}),
                    "conviction_avg": sum(p.conviction for p in picks) / len(picks),
                }
            )
        scored.sort(key=lambda s: s["composite"], reverse=True)
        return scored[:TOP_N]

    # -- rebuild (async — enriches with live prices) ------------------------
    async def rebuild(self) -> Top50Snapshot:
        """Re-rank, enrich with live quotes, snapshot, and push if the order changed."""
        now = datetime.now(timezone.utc)
        ranked = self._aggregate(now)
        prev_ranks = self._previous_ranks()

        quotes = await market_data.get_quotes([r["ticker"] for r in ranked])
        entries: list[Top50Entry] = []
        for i, r in enumerate(ranked, start=1):
            q = quotes.get(r["ticker"])
            lead: SpecialistPick = r["lead"]
            entries.append(
                Top50Entry(
                    rank=i,
                    previous_rank=prev_ranks.get(r["ticker"]),
                    ticker=r["ticker"],
                    company_name=r["ticker"],  # TODO(step 2): resolve via securities
                    price=q.price if q else None,
                    day_change_pct=q.daily_pct if q else None,
                    ytd_change_pct=q.ytd_pct if q else None,
                    composite_score=round(r["composite"], 4),
                    lead_specialist=lead.specialist,
                    contributing_specialists=r["contributing"],
                    thesis_summary=lead.thesis,
                    conviction_avg=round(r["conviction_avg"], 2),
                    time_horizon=lead.time_horizon,
                )
            )

        snapshot = Top50Snapshot(snapshot_time=now, entries=entries)
        changed = self._changed(snapshot)
        self._current = snapshot
        self._history.append(snapshot)
        self._history = self._history[-96:]  # ~1 day of 15-minute snapshots
        self._persist(snapshot)

        if changed and self.on_update is not None:
            try:
                await self.on_update(snapshot)
            except Exception as exc:  # a WS failure must never break the engine
                logger.warning("Top50 on_update push failed: %s", exc)
        return snapshot

    # -- helpers ------------------------------------------------------------
    def _previous_ranks(self) -> dict[str, int]:
        if self._current is None:
            return {}
        return {e.ticker: e.rank for e in self._current.entries}

    def _changed(self, snapshot: Top50Snapshot) -> bool:
        if self._current is None:
            return bool(snapshot.entries)
        old = {e.ticker: e.rank for e in self._current.entries}
        new = {e.ticker: e.rank for e in snapshot.entries}
        return old != new

    def _persist(self, snapshot: Top50Snapshot) -> None:
        """TODO(step 2): write 50 rows to top_50_snapshots once Supabase is wired."""
        logger.info(
            "Top50 snapshot %s — %d entries (DB persistence pending Supabase)",
            snapshot.snapshot_time.isoformat(),
            len(snapshot.entries),
        )

    def current(self) -> Top50Snapshot | None:
        return self._current


# Process-wide singleton — shared by the orchestrator, scheduler, and API.
engine = Top50Engine()
