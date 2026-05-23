"""Market regime singleton + specialist weight composition.

The Regime Detector Agent runs each morning, classifies six dimensions, and
sets the current snapshot here. The Top 50 engine reads
``regime_weight(agent_key)`` per specialist when computing composite scores.

Persistence: the latest snapshot also appends to
``apps/api/.audit/regime.jsonl`` (gitignored). On process restart the last
line of that file rehydrates the singleton so the engine never reweights to
neutral simply because the API was redeployed.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path
from threading import Lock

from app.schemas import RegimeSnapshot

logger = logging.getLogger("regime")

_FILE = Path(__file__).resolve().parents[2] / ".audit" / "regime.jsonl"
_LOCK = Lock()

# --- Per-regime specialist weight maps -----------------------------------
# Read by `compose_specialist_weights`. Missing entries default to 1.0.
# Cap range applied at composition time: [WEIGHT_FLOOR, WEIGHT_CEILING].
WEIGHT_FLOOR = 0.5
WEIGHT_CEILING = 1.5

# Factor regime — Brian's explicit mapping anchors this dimension.
FACTOR_WEIGHTS: dict[str, dict[str, float]] = {
    "growth_led": {
        "ai_datacenter": 1.3,
        "training_chip": 1.3,
        "inference_stack": 1.3,
        "tech_generalist": 1.2,
        "robotics": 1.2,
        "quantum": 1.1,
        "value_investor": 0.8,
        "dividend_aristocrat": 0.8,
    },
    "value_led": {
        "value_investor": 1.3,
        "dividend_aristocrat": 1.2,
        "energy_infra": 1.2,
        "consumer_internet": 1.1,
        "ai_datacenter": 0.8,
        "training_chip": 0.8,
        "quantum": 0.8,
    },
    "quality_led": {
        "dividend_aristocrat": 1.2,
        "value_investor": 1.1,
        "tech_generalist": 1.1,
        "healthcare_biotech": 1.1,
        "quantum": 0.8,
    },
    "mixed": {},
}

# Volatility regime — defensives bid in crisis, growth bid in calm.
VOL_WEIGHTS: dict[str, dict[str, float]] = {
    "crisis": {
        "fixed_income": 1.3,
        "macro_strategy": 1.3,
        "value_investor": 1.2,
        "dividend_aristocrat": 1.2,
        "training_chip": 0.8,
        "ai_datacenter": 0.8,
        "robotics": 0.8,
        "quantum": 0.8,
    },
    "elevated": {
        "macro_strategy": 1.2,
        "fixed_income": 1.2,
        "quantum": 0.8,
    },
    "normal": {},
    "low": {
        "training_chip": 1.1,
        "ai_datacenter": 1.1,
        "robotics": 1.1,
    },
}

# Credit regime
CREDIT_WEIGHTS: dict[str, dict[str, float]] = {
    "crisis": {
        "fixed_income": 1.3,
        "value_investor": 1.2,
        "macro_strategy": 1.2,
        "training_chip": 0.8,
        "quantum": 0.8,
    },
    "stressed": {
        "fixed_income": 1.2,
        "value_investor": 1.1,
    },
    "normal": {},
    "tight": {
        "ai_datacenter": 1.1,
        "consumer_internet": 1.1,
    },
}

# Rate regime
RATE_WEIGHTS: dict[str, dict[str, float]] = {
    "easing": {
        "ai_datacenter": 1.2,
        "training_chip": 1.2,
        "inference_stack": 1.2,
        "robotics": 1.1,
    },
    "holding": {},
    "hiking": {
        "value_investor": 1.2,
        "dividend_aristocrat": 1.1,
        "energy_infra": 1.1,
        "ai_datacenter": 0.9,
        "training_chip": 0.9,
    },
    "inverted": {
        "macro_strategy": 1.2,
        "fixed_income": 1.2,
        "value_investor": 1.1,
    },
}


def compose_specialist_weights(
    *,
    volatility: str,
    rate: str,
    credit: str,
    factor: str,
) -> dict[str, float]:
    """Multiply weights from each dimension, cap to [WEIGHT_FLOOR, WEIGHT_CEILING]."""
    dimensions = [
        VOL_WEIGHTS.get(volatility, {}),
        RATE_WEIGHTS.get(rate, {}),
        CREDIT_WEIGHTS.get(credit, {}),
        FACTOR_WEIGHTS.get(factor, {}),
    ]
    weights: dict[str, float] = {}
    keys = {k for d in dimensions for k in d}
    for key in keys:
        product = 1.0
        for d in dimensions:
            product *= d.get(key, 1.0)
        product = max(WEIGHT_FLOOR, min(WEIGHT_CEILING, product))
        if product != 1.0:
            weights[key] = round(product, 4)
    return weights


# --- Singleton current snapshot ------------------------------------------
_current: RegimeSnapshot | None = None


def _try_rehydrate() -> RegimeSnapshot | None:
    """Load the last snapshot from .audit/regime.jsonl on import."""
    if not _FILE.exists():
        return None
    try:
        with _FILE.open("rb") as f:
            try:
                f.seek(-2, 2)
                while f.read(1) != b"\n":
                    f.seek(-2, 1)
            except OSError:
                f.seek(0)
            last = f.readline().decode("utf-8").strip()
        if not last:
            return None
        return RegimeSnapshot.model_validate_json(last)
    except Exception as exc:
        logger.warning("regime rehydrate failed: %s", exc)
        return None


_current = _try_rehydrate()


def current_snapshot() -> RegimeSnapshot | None:
    return _current


def set_snapshot(snapshot: RegimeSnapshot) -> None:
    """Replace the current snapshot and append to the JSONL log."""
    global _current
    with _LOCK:
        _current = snapshot
        try:
            _FILE.parent.mkdir(parents=True, exist_ok=True)
            with _FILE.open("a", encoding="utf-8") as f:
                f.write(json.dumps(snapshot.model_dump(mode="json")) + "\n")
        except OSError as exc:
            logger.warning("regime persist failed: %s", exc)


def regime_weight(agent_key: str) -> float:
    """Per-specialist multiplier from the current snapshot. 1.0 when none."""
    snap = current_snapshot()
    if snap is None:
        return 1.0
    return snap.specialist_weights.get(agent_key, 1.0)
