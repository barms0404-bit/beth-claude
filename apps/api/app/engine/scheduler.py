"""APScheduler jobs — Top 50 polling + the three daily report emails.

Two cadences run on one scheduler:

  - Top 50 poll: every 15 minutes, market hours only (NYSE 9:30-16:00 ET).
  - Reports: cron at 7:30 / 11:00 / 13:30 in America/Phoenix (no DST).

The whole scheduler is disabled without an Anthropic key — specialists can't run.
"""

from __future__ import annotations

import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

from app.config import get_settings
from app.engine.top50 import market_open

logger = logging.getLogger("scheduler")

_scheduler: AsyncIOScheduler | None = None

# (slot value, hour, minute) — Arizona time.
REPORT_SCHEDULE: list[tuple[str, int, int]] = [
    ("market_prep", 7, 30),
    ("mid_day", 11, 0),
    ("market_close", 13, 30),
]


# --- Jobs -----------------------------------------------------------------
async def _top50_poll_job() -> None:
    """One 15-minute cycle: skip if the market is closed, else re-rank the Top 50."""
    if not market_open():
        logger.debug("Market closed — skipping Top 50 poll.")
        return
    from app.agents.orchestrator import Beth  # lazy — avoid circular import

    try:
        snapshot = await Beth().refresh_top50()
        logger.info("Top 50 refreshed — %d entries.", len(snapshot.entries))
    except Exception as exc:
        logger.warning("Top 50 poll failed: %s", exc)


async def _report_job(slot_value: str) -> None:
    """One scheduled report: generate -> render -> archive -> send."""
    from app.agents.orchestrator import Beth
    from app.schemas import ReportSlot
    from app.services.email_send import send_report

    try:
        slot = ReportSlot(slot_value)
        report = await Beth().generate_report(slot)
        result = await send_report(report)
        logger.info("Report %s — %s", slot_value, result)
    except Exception as exc:
        logger.warning("Report job %s failed: %s", slot_value, exc)


# --- Lifecycle ------------------------------------------------------------
def start_scheduler() -> None:
    """Start the Top 50 poll + the three report crons. No-op without an Anthropic key."""
    global _scheduler
    settings = get_settings()
    if not settings.has_anthropic:
        logger.info("ANTHROPIC_API_KEY not set — scheduler disabled.")
        return
    if _scheduler is not None:
        return
    _scheduler = AsyncIOScheduler(timezone="UTC")

    _scheduler.add_job(
        _top50_poll_job,
        IntervalTrigger(minutes=15),
        id="top50_poll",
        max_instances=1,
        coalesce=True,
    )

    for slot_value, hour, minute in REPORT_SCHEDULE:
        _scheduler.add_job(
            _report_job,
            CronTrigger(hour=hour, minute=minute, timezone=settings.schedule_timezone),
            args=[slot_value],
            id=f"report_{slot_value}",
            max_instances=1,
            coalesce=True,
        )

    _scheduler.start()
    logger.info(
        "Scheduler started — Top 50 every 15m (market hours), reports at 7:30/11:00/13:30 %s.",
        settings.schedule_timezone,
    )


def stop_scheduler() -> None:
    global _scheduler
    if _scheduler is not None:
        _scheduler.shutdown(wait=False)
        _scheduler = None
