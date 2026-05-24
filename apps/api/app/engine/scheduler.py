"""APScheduler jobs — Top 50 polling + the daily report emails.

Cadence (changed 2026-05-23):
  - Top 50 poll: every 15 minutes, market hours only (NYSE 9:30-16:00 ET).
  - Weekday reports (Mon-Fri): cron at 7:30 / 11:00 / 13:30 America/Phoenix.
  - Sunday pre-market wrap: cron at 7:00 PM America/New_York — one hour
    after CME Globex futures reopen for the new week (Sun 6 PM ET).
  - Weekday regime classification: 7:00 AM America/Phoenix (30 min before
    the morning report so weights are live when Beth dispatches).
  - Sunday regime classification: 6:30 PM America/New_York (30 min before
    the Sunday pre-market wrap).
  - NO reports on Saturday. NO Sunday-morning reports.

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

# Weekday reports — (slot value, hour, minute) in Arizona time.
WEEKDAY_REPORT_SCHEDULE: list[tuple[str, int, int]] = [
    ("market_prep", 7, 30),
    ("mid_day", 11, 0),
    ("market_close", 13, 30),
]

# Sunday pre-market wrap — fires 1 hour after CME Globex futures reopen.
# Futures reopen Sun 6 PM ET; +1 hr = Sun 7 PM ET. Use America/New_York
# so DST shifts auto-track (no AZ recalc needed when EDT swaps to EST).
SUNDAY_PREMARKET_HOUR_ET = 19  # 7 PM ET
SUNDAY_PREMARKET_MINUTE_ET = 0
SUNDAY_PREMARKET_SLOT = "market_prep"  # reuse market_prep slot — week-ahead is a prep flavor


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


async def _regime_job() -> None:
    """Morning regime classification — runs 7:00 AM AZ before the prep report."""
    from app.agents.regime_detector import detector

    try:
        snap = await detector.detect()
        logger.info(
            "Regime classified — vol=%s rate=%s factor=%s",
            snap.volatility.label, snap.rate.label, snap.factor.label,
        )
    except Exception as exc:
        logger.warning("Regime classification failed: %s", exc)


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

    # --- Weekday reports (Mon-Fri only) ---
    for slot_value, hour, minute in WEEKDAY_REPORT_SCHEDULE:
        _scheduler.add_job(
            _report_job,
            CronTrigger(
                day_of_week="mon-fri",
                hour=hour,
                minute=minute,
                timezone=settings.schedule_timezone,
            ),
            args=[slot_value],
            id=f"report_{slot_value}",
            max_instances=1,
            coalesce=True,
        )

    # --- Sunday pre-market wrap (1 hour after futures reopen) ---
    _scheduler.add_job(
        _report_job,
        CronTrigger(
            day_of_week="sun",
            hour=SUNDAY_PREMARKET_HOUR_ET,
            minute=SUNDAY_PREMARKET_MINUTE_ET,
            timezone="America/New_York",
        ),
        args=[SUNDAY_PREMARKET_SLOT],
        id="report_sunday_premarket",
        max_instances=1,
        coalesce=True,
    )

    # --- Regime classification — fires 30 min before each report day ---
    # Weekday: 7:00 AM AZ (30 min before 7:30 AM market_prep).
    _scheduler.add_job(
        _regime_job,
        CronTrigger(
            day_of_week="mon-fri",
            hour=7,
            minute=0,
            timezone=settings.schedule_timezone,
        ),
        id="regime_detect_weekday",
        max_instances=1,
        coalesce=True,
    )
    # Sunday: 6:30 PM ET (30 min before 7:00 PM ET pre-market wrap).
    _scheduler.add_job(
        _regime_job,
        CronTrigger(
            day_of_week="sun",
            hour=18,
            minute=30,
            timezone="America/New_York",
        ),
        id="regime_detect_sunday",
        max_instances=1,
        coalesce=True,
    )

    _scheduler.start()
    logger.info(
        "Scheduler started — Top 50 every 15m (market hours), "
        "weekday reports Mon-Fri at 7:30/11:00/13:30 %s, "
        "Sunday pre-market at 7:00 PM ET (1hr after Globex reopen), "
        "regime detect Mon-Fri 7:00 %s + Sun 6:30 PM ET. "
        "NO Saturday reports. NO Sunday-morning reports.",
        settings.schedule_timezone, settings.schedule_timezone,
    )


def stop_scheduler() -> None:
    global _scheduler
    if _scheduler is not None:
        _scheduler.shutdown(wait=False)
        _scheduler = None
