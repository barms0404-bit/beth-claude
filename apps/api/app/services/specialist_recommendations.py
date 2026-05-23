"""File-backed SpecialistRecommendation store — closed-loop trade tracking.

Append-only JSONL at ``apps/api/.audit/specialist_recommendations.jsonl``
(gitignored). Same persistence pattern as the audit log + specialist_metrics:
holds the line until the Supabase ``specialist_recommendations`` table is
wired, at which point this module swaps to DB writes with the same surface.

Reads pull the full file and filter in Python — fine at the current volume,
fixed when persistence lands.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock

from app.schemas import SpecialistRecommendation

logger = logging.getLogger("specialist_recommendations")

_FILE = (
    Path(__file__).resolve().parents[2] / ".audit" / "specialist_recommendations.jsonl"
)
_LOCK = Lock()


def _ensure_dir() -> None:
    _FILE.parent.mkdir(parents=True, exist_ok=True)


def append(rec: SpecialistRecommendation) -> None:
    """Persist one recommendation. Never raises to the caller."""
    try:
        with _LOCK:
            _ensure_dir()
            with _FILE.open("a", encoding="utf-8") as f:
                f.write(rec.model_dump_json() + "\n")
    except OSError as exc:
        logger.warning("recommendation append failed: %s", exc)


def all_records() -> list[SpecialistRecommendation]:
    if not _FILE.exists():
        return []
    out: list[SpecialistRecommendation] = []
    try:
        with _FILE.open("r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    out.append(SpecialistRecommendation.model_validate_json(line))
                except Exception as exc:
                    logger.debug("skipping malformed record: %s", exc)
    except OSError as exc:
        logger.warning("recommendation read failed: %s", exc)
    return out


def filter_records(
    *,
    agent_key: str | None = None,
    ticker: str | None = None,
    closed: bool | None = None,
    limit: int = 200,
) -> list[SpecialistRecommendation]:
    """Newest first. Empty filters returns the whole tail."""
    records = all_records()
    if agent_key:
        records = [r for r in records if r.agent_key == agent_key]
    if ticker:
        tk = ticker.upper()
        records = [r for r in records if r.ticker.upper() == tk]
    if closed is not None:
        records = [r for r in records if r.closed == closed]
    records.sort(key=lambda r: r.entry_timestamp, reverse=True)
    return records[:limit]


def close(
    recommendation_id: str,
    *,
    exit_price: float,
    exit_timestamp: datetime | None = None,
    hit_target: bool | None = None,
    thesis_validated: bool | None = None,
    post_mortem_notes: str | None = None,
) -> SpecialistRecommendation | None:
    """Mark one recommendation closed; rewrite the file with the updated row.

    File-backed rewrite is fine at low volume — Supabase migration replaces this
    with a single UPDATE when persistence lands. Returns the updated record, or
    None when the id is unknown.
    """
    target: SpecialistRecommendation | None = None
    with _LOCK:
        records = all_records()
        for rec in records:
            if rec.recommendation_id == recommendation_id:
                rec.closed = True
                rec.exit_price = exit_price
                rec.exit_timestamp = exit_timestamp or datetime.now(timezone.utc)
                if rec.entry_price:
                    rec.realized_return = round(
                        (exit_price - rec.entry_price) / rec.entry_price * 100, 4
                    )
                if hit_target is not None:
                    rec.hit_target = hit_target
                if thesis_validated is not None:
                    rec.thesis_validated = thesis_validated
                if post_mortem_notes is not None:
                    rec.post_mortem_notes = post_mortem_notes
                target = rec
                break
        if target is None:
            return None
        try:
            _ensure_dir()
            with _FILE.open("w", encoding="utf-8") as f:
                for rec in records:
                    f.write(rec.model_dump_json() + "\n")
        except OSError as exc:
            logger.warning("recommendation close rewrite failed: %s", exc)
    return target
