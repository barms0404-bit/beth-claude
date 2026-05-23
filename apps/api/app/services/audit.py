"""Audit log writer — append-only JSONL at apps/api/.audit/validation.jsonl.

Written on every validation event with ``status`` other than ``verified``.
JSONL is the right shape for streaming append; Supabase persistence lands
later (one row per event in an ``audit_log`` table).
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

logger = logging.getLogger("audit")

_AUDIT_DIR = Path(__file__).resolve().parents[2] / ".audit"


def audit_dir() -> Path:
    _AUDIT_DIR.mkdir(parents=True, exist_ok=True)
    return _AUDIT_DIR


def log_event(channel: str, event: dict[str, Any]) -> None:
    """Append one event to <audit_dir>/<channel>.jsonl. Never raises to caller."""
    try:
        line = json.dumps(
            {"ts": datetime.now(timezone.utc).isoformat(), "channel": channel, **event},
            default=str,
        )
        path = audit_dir() / f"{channel}.jsonl"
        with path.open("a", encoding="utf-8") as f:
            f.write(line + "\n")
    except Exception as exc:
        logger.warning("audit log failed for %s: %s", channel, exc)
