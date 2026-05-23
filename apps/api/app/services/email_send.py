"""Render, archive, and send a Beth report by email.

End-to-end pipeline:
  Report  ->  PNG charts via kaleido
          ->  HTML render (email_render)
          ->  archive to <project_root>/reports/YYYY-MM-DD/<slot>.html
          ->  POST via Resend

Resend send is skipped (no error) when RESEND_API_KEY is unset, so the render
and archive pipeline is exercisable locally before SMTP creds land.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from pathlib import Path

import resend

from app.config import get_settings
from app.engine.top50 import engine
from app.schemas import Report
from app.services import charts as charts_svc
from app.services.email_render import render_report_email, subject_for

logger = logging.getLogger("email")

# Archive root: <app_root>/reports — also static-mounted at /reports in main.py.
# In Docker (WORKDIR /app): __file__ = /app/app/services/email_send.py → parents[2] = /app
# In local dev:              __file__ = .../apps/api/app/services/email_send.py → parents[2] = apps/api
_APP_ROOT = Path(__file__).resolve().parents[2]
_ARCHIVE_DIR = _APP_ROOT / "reports"


def archive_root() -> Path:
    _ARCHIVE_DIR.mkdir(parents=True, exist_ok=True)
    return _ARCHIVE_DIR


def _archive_path(report: Report) -> Path:
    day = report.generated_at.strftime("%Y-%m-%d")
    folder = archive_root() / day
    folder.mkdir(parents=True, exist_ok=True)
    return folder / f"{report.slot.value}.html"


async def send_report(report: Report) -> dict:
    """Render -> archive -> send. Returns subject, archive path, sent flag."""
    settings = get_settings()

    # 1. PNGs for every chart the report carries.
    #    Prefer the disk-cached render written by the Chart Specialist; fall back
    #    to live re-render only if the cache file is missing or unreadable.
    png_data: dict[int, bytes] = {}
    cache_dir = charts_svc.charts_cache_dir()
    for i, ch in enumerate(report.charts):
        png: bytes | None = None
        cached = cache_dir / f"{ch.chart_id}.png"
        if cached.exists():
            try:
                png = cached.read_bytes()
            except OSError:
                png = None
        if png is None:
            png = charts_svc.plotly_to_png(ch.plotly_spec)
        if png is not None:
            png_data[i] = png

    # 2. Render the HTML body.
    snapshot = engine.current()
    html = render_report_email(report=report, snapshot=snapshot, png_data=png_data)
    subject = subject_for(report)

    # 3. Archive to disk (always — regardless of send outcome).
    path = _archive_path(report)
    path.write_text(html, encoding="utf-8")
    logger.info("Report archived: %s", path)

    # 4. Send via Resend if a key is configured.
    sent = False
    error: str | None = None
    if settings.resend_api_key:
        try:
            resend.api_key = settings.resend_api_key
            resp = resend.Emails.send(
                {
                    "from": settings.report_from_email,
                    "to": [settings.report_to_email],
                    "subject": subject,
                    "html": html,
                }
            )
            logger.info("Resend accepted: %s", resp)
            sent = True
        except Exception as exc:
            logger.warning("Resend send failed: %s", exc)
            error = str(exc)
    else:
        logger.info("RESEND_API_KEY not set — report archived only (not sent).")

    return {
        "subject": subject,
        "archive_path": str(path),
        "archive_url": f"/reports/{path.parent.name}/{path.name}",
        "sent": sent,
        "error": error,
    }


def list_archive(limit: int = 30) -> list[dict]:
    """Newest archived reports first. Returns up to `limit` items."""
    root = archive_root()
    if not root.exists():
        return []
    items: list[dict] = []
    for day_dir in sorted(root.iterdir(), reverse=True):
        if not day_dir.is_dir():
            continue
        for file in sorted(day_dir.iterdir(), reverse=True):
            if file.suffix != ".html":
                continue
            stat = file.stat()
            items.append(
                {
                    "slot": file.stem,
                    "date": day_dir.name,
                    "generated_at": datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat(),
                    "url": f"/reports/{day_dir.name}/{file.name}",
                }
            )
            if len(items) >= limit:
                return items
    return items
