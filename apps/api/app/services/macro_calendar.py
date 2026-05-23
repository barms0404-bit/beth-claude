"""Macro event-day detection — drives Beth's "lead with Fixed Income" rule.

Three event types qualify the report to be led by Edward Vance (fixed_income):

  - NFP   — Bureau of Labor Statistics Employment Situation, released the first
            Friday of every month at 8:30 AM ET. Detected algorithmically.
  - CPI   — BLS Consumer Price Index, roughly mid-month. Dates vary by 1-3 days
            so we read them from settings.cpi_dates (Brian fills the calendar
            via env once a year).
  - FOMC  — Federal Reserve rate decision, 8 scheduled meetings per year. Same
            pattern — settings.fomc_dates env list.

`macro_event_today()` returns the event label or None.
"""

from __future__ import annotations

import logging
from datetime import date, datetime, timezone
from zoneinfo import ZoneInfo

from app.config import get_settings

logger = logging.getLogger("macro_calendar")


def _today_et(now: datetime | None = None) -> date:
    """Today in America/New_York — the timezone all major US releases honor."""
    inst = now or datetime.now(timezone.utc)
    return inst.astimezone(ZoneInfo("America/New_York")).date()


def _parse_date_list(raw: str) -> set[date]:
    out: set[date] = set()
    for tok in raw.split(","):
        tok = tok.strip()
        if not tok:
            continue
        try:
            out.add(date.fromisoformat(tok))
        except ValueError:
            logger.warning("macro_calendar: ignoring unparseable date %r", tok)
    return out


def is_nfp_day(today: date | None = None) -> bool:
    """First Friday of the month, in ET."""
    d = today or _today_et()
    if d.weekday() != 4:  # Friday
        return False
    return d.day <= 7


def is_cpi_day(today: date | None = None) -> bool:
    d = today or _today_et()
    return d in _parse_date_list(get_settings().cpi_dates)


def is_fomc_day(today: date | None = None) -> bool:
    d = today or _today_et()
    return d in _parse_date_list(get_settings().fomc_dates)


def macro_event_today(today: date | None = None) -> str | None:
    """Returns 'FOMC' | 'CPI' | 'NFP' | None. FOMC trumps CPI trumps NFP if they collide."""
    d = today or _today_et()
    if is_fomc_day(d):
        return "FOMC"
    if is_cpi_day(d):
        return "CPI"
    if is_nfp_day(d):
        return "NFP"
    return None
