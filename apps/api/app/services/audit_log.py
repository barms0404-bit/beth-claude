"""Structured per-call audit log.

One JSONL line per LLM invocation across the fleet, at
``apps/api/.audit/audit_log.jsonl`` (gitignored). Same persistence pattern as
the topical audit log + specialist_metrics — Supabase ``audit_log`` table
replaces this when DB writes wire.

`call_agent` in `services/anthropic_client.py` calls `log_invocation` after
every reply; audit failures never break the LLM path.
"""

from __future__ import annotations

import json
import logging
import uuid
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock
from typing import Any

logger = logging.getLogger("audit_log")

_FILE = Path(__file__).resolve().parents[2] / ".audit" / "audit_log.jsonl"
_LOCK = Lock()


def log_invocation(
    *,
    agent_name: str,
    input_context: dict[str, Any],
    output_response: str,
    tool_calls_made: list[dict] | None = None,
    tools_results: list[dict] | None = None,
    model_version: str = "",
    temperature: float | None = None,
    confidence_scores: dict | None = None,
    citations: list[str] | None = None,
    downstream_consumers: list[str] | None = None,
    prompt_tokens: int = 0,
    output_tokens: int = 0,
    cache_read_tokens: int = 0,
) -> None:
    """Append one row to the audit log. Never raises to the caller."""
    entry = {
        "log_id": str(uuid.uuid4()),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "agent_name": agent_name,
        "input_context": input_context,
        "output_response": output_response,
        "tool_calls_made": tool_calls_made or [],
        "tools_results": tools_results or [],
        "model_version": model_version,
        "temperature": temperature,
        "confidence_scores": confidence_scores or {},
        "citations": citations or [],
        "downstream_consumers": downstream_consumers or [],
        "prompt_tokens": prompt_tokens,
        "output_tokens": output_tokens,
        "cache_read_tokens": cache_read_tokens,
    }
    try:
        with _LOCK:
            _FILE.parent.mkdir(parents=True, exist_ok=True)
            with _FILE.open("a", encoding="utf-8") as f:
                f.write(json.dumps(entry, default=str) + "\n")
    except (OSError, TypeError, ValueError) as exc:
        logger.warning("audit_log write failed: %s", exc)


def query_log(
    *,
    agent_name: str | None = None,
    since_iso: str | None = None,
    limit: int = 100,
) -> list[dict]:
    """Newest-first filtered query. Empty filters returns the latest `limit` rows."""
    if not _FILE.exists():
        return []
    out: list[dict] = []
    try:
        with _FILE.open("r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    entry = json.loads(line)
                except json.JSONDecodeError:
                    continue
                if agent_name and entry.get("agent_name") != agent_name:
                    continue
                if since_iso and entry.get("timestamp", "") < since_iso:
                    continue
                out.append(entry)
    except OSError as exc:
        logger.warning("audit_log read failed: %s", exc)
        return []
    out.sort(key=lambda e: e.get("timestamp", ""), reverse=True)
    return out[:limit]
