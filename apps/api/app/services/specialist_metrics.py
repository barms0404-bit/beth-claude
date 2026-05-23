"""Per-specialist running metrics — counters for the Citation Enforcement Agent.

Persisted to ``apps/api/.audit/specialist_metrics.json`` (gitignored, same path
family as the audit log). One JSON object keyed by ``agent_key``. Thread-safe
read-modify-write because the orchestrator may enforce in parallel across the
roster.

Schema migration to Supabase ``specialist_metrics`` lands with persistence.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from threading import Lock

logger = logging.getLogger("specialist_metrics")

_FILE = Path(__file__).resolve().parents[2] / ".audit" / "specialist_metrics.json"
_LOCK = Lock()

_FIELDS = (
    "claims_total",
    "verified_count",
    "uncited_count",
    "distorted_count",
    "fabricated_count",
    "reports_seen",
)


def _empty_record() -> dict[str, float | int]:
    return {f: 0 for f in _FIELDS} | {"hallucination_rate": 0.0}


def all_metrics() -> dict[str, dict]:
    if not _FILE.exists():
        return {}
    try:
        return json.loads(_FILE.read_text())
    except (json.JSONDecodeError, OSError) as exc:
        logger.warning("specialist_metrics load failed: %s", exc)
        return {}


def update(agent_key: str, deltas: dict[str, int]) -> dict:
    """Atomically merge deltas into the agent's record and recompute the rate."""
    with _LOCK:
        data = all_metrics()
        rec = data.setdefault(agent_key, _empty_record())
        for k, v in deltas.items():
            if k in _FIELDS:
                rec[k] = int(rec.get(k, 0)) + int(v)
        total = int(rec.get("claims_total", 0))
        hallucinations = (
            int(rec.get("uncited_count", 0))
            + int(rec.get("distorted_count", 0))
            + int(rec.get("fabricated_count", 0))
        )
        rec["hallucination_rate"] = (hallucinations / total) if total else 0.0
        try:
            _FILE.parent.mkdir(parents=True, exist_ok=True)
            _FILE.write_text(json.dumps(data, indent=2))
        except OSError as exc:
            logger.warning("specialist_metrics write failed: %s", exc)
        return rec
