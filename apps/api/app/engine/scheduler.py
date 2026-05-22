"""APScheduler job — polls all specialists every 15 minutes during market hours.

The job is a no-op when the market is closed, and the whole scheduler is disabled
when no Anthropic key is configured (specialists cannot run without it).
"""

from __future__ import annotations

import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from app.config import get_settings
from app.engine.top50 import market_open

logger = logging.getLogger("scheduler")

_scheduler: AsyncIOScheduler | None = None


async def _poll_job() -> None:
    """One 15-minute cycle: skip if the market is closed, else re-rank the Top 50."""
    if not market_open():
        logger.debug("Market closed — skipping Top 50 poll.")
        return
    # Imported lazily to avoid a circular import at module load.
    from app.agents.orchestrator import Beth

    try:
        snapshot = await Beth().refresh_top50()
        logger.info("Top 50 refreshed — %d entries.", len(snapshot.entries))
    except Exception as exc:  # a poll failure must not kill the scheduler
        logger.warning("Top 50 poll failed: %s", exc)


def start_scheduler() -> None:
    """Start the 15-minute poll. No-op without an Anthropic key."""
    global _scheduler
    if not get_settings().has_anthropic:
        logger.info("ANTHROPIC_API_KEY not set — Top 50 scheduler disabled.")
        return
    if _scheduler is not None:
        return
    _scheduler = AsyncIOScheduler(timezone="UTC")
    _scheduler.add_job(
        _poll_job,
        IntervalTrigger(minutes=15),
        id="top50_poll",
        max_instances=1,
        coalesce=True,
    )
    _scheduler.start()
    logger.info("Top 50 scheduler started — 15-minute interval, market hours only.")


def stop_scheduler() -> None:
    global _scheduler
    if _scheduler is not None:
        _scheduler.shutdown(wait=False)
        _scheduler = None
