"""Market Regime Detection Agent.

Runs each morning (7:00 AM AZ via the scheduler). Classifies six dimensions:

  volatility | rate | credit | factor | breadth | liquidity

Hybrid logic:
  - Rules-based for volatility / rate / credit / liquidity (clear thresholds).
  - LLM-driven for factor and breadth (contextual), plus historical analogs
    and regime-transition probability.

Specialist weight multipliers are derived deterministically from the
classifications via ``services.regime.compose_specialist_weights``. The LLM
classifies; weighting is a pure function of the labels.

Output: RegimeSnapshot persisted via `services.regime.set_snapshot`. The
Top 50 engine reads `regime_weight(agent_key)` on every pick aggregation.
"""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone

from app.schemas import RegimeClassification, RegimeSnapshot
from app.services import fred, market_data, regime
from app.services.anthropic_client import call_agent

logger = logging.getLogger("regime_detector")


# --- Rules-based dimensions ----------------------------------------------
def _classify_volatility(vix: float | None) -> RegimeClassification:
    if vix is None:
        return RegimeClassification(label="normal", confidence=0.2, rationale="VIX unavailable")
    if vix < 15:
        return RegimeClassification(label="low", confidence=0.9, rationale=f"VIX {vix:.2f} < 15")
    if vix < 20:
        return RegimeClassification(label="normal", confidence=0.9, rationale=f"VIX {vix:.2f} in 15-20")
    if vix < 30:
        return RegimeClassification(label="elevated", confidence=0.9, rationale=f"VIX {vix:.2f} in 20-30")
    return RegimeClassification(label="crisis", confidence=0.95, rationale=f"VIX {vix:.2f} > 30")


def _classify_rate(t10y2y: float | None, dff_change_30d: float | None) -> RegimeClassification:
    if t10y2y is not None and t10y2y < 0:
        return RegimeClassification(
            label="inverted", confidence=0.95,
            rationale=f"2s10s spread {t10y2y:.2f} (inverted)",
        )
    if dff_change_30d is None:
        return RegimeClassification(label="holding", confidence=0.4, rationale="DFF change unavailable")
    if dff_change_30d < -0.10:
        return RegimeClassification(label="easing", confidence=0.85, rationale=f"DFF down {abs(dff_change_30d):.2f}pp / 30d")
    if dff_change_30d > 0.10:
        return RegimeClassification(label="hiking", confidence=0.85, rationale=f"DFF up {dff_change_30d:.2f}pp / 30d")
    return RegimeClassification(label="holding", confidence=0.8, rationale="DFF flat / 30d")


def _classify_credit(hy_oas: float | None) -> RegimeClassification:
    """HY OAS thresholds: tight <3.5, normal 3.5-5, stressed 5-8, crisis >8."""
    if hy_oas is None:
        return RegimeClassification(label="normal", confidence=0.2, rationale="HY OAS unavailable")
    if hy_oas < 3.5:
        return RegimeClassification(label="tight", confidence=0.85, rationale=f"HY OAS {hy_oas:.2f}% < 3.5")
    if hy_oas < 5.0:
        return RegimeClassification(label="normal", confidence=0.85, rationale=f"HY OAS {hy_oas:.2f}% in 3.5-5")
    if hy_oas < 8.0:
        return RegimeClassification(label="stressed", confidence=0.85, rationale=f"HY OAS {hy_oas:.2f}% in 5-8")
    return RegimeClassification(label="crisis", confidence=0.9, rationale=f"HY OAS {hy_oas:.2f}% > 8")


def _classify_liquidity(walcl_change_90d: float | None, rrp: float | None) -> RegimeClassification:
    """Fed balance sheet trajectory + RRP. Rough heuristic; refine with real data."""
    if walcl_change_90d is None:
        return RegimeClassification(label="normal", confidence=0.2, rationale="WALCL unavailable")
    pct = walcl_change_90d
    if pct < -2.0:
        return RegimeClassification(label="tightening", confidence=0.8, rationale=f"WALCL -{abs(pct):.1f}% / 90d (QT)")
    if pct > 2.0:
        return RegimeClassification(label="abundant", confidence=0.8, rationale=f"WALCL +{pct:.1f}% / 90d (QE)")
    return RegimeClassification(label="normal", confidence=0.7, rationale="balance sheet roughly flat / 90d")


# --- LLM-driven dimensions -----------------------------------------------
_LLM_SYSTEM = """\
You are the Market Regime Detection Agent at Armstrong Arikat Private Wealth
Group. Rules-based classifications have already been made for volatility,
rate, credit, and liquidity. Your job is to classify the two contextual
dimensions and provide historical analogs + regime-transition probability.

Classify:
  - factor:  growth_led | value_led | quality_led | mixed
  - breadth: broad_rally | narrow_leadership | broad_selloff | rotation

Use the provided ETF return spreads as evidence:
  - factor:   IWF (growth) vs IWD (value) 30-day return spread
  - breadth:  IWM (small) vs SPY (large) 30-day spread (a PROXY — real
              advance/decline data is not yet wired)

Also produce:
  - historical_analogs: 2-3 past periods this regime resembles (e.g.
    "Q4 2018", "Q1 2016", "Summer 2007").
  - transition_probability_30d: 0.0-1.0 probability that the OVERALL
    regime shifts materially in the next 30 days.

Respond with ONLY a JSON object:
{
  "factor": {"label": "...", "confidence": 0.0-1.0, "rationale": "..."},
  "breadth": {"label": "...", "confidence": 0.0-1.0, "rationale": "..."},
  "historical_analogs": ["...", "..."],
  "transition_probability_30d": 0.0-1.0,
  "notes": "any caveats"
}
"""


async def _classify_contextual(
    *,
    rules_summary: dict,
    iwf_iwd_spread_30d: float | None,
    iwm_spy_spread_30d: float | None,
) -> dict:
    payload = {
        "rules_classifications": rules_summary,
        "iwf_iwd_spread_30d_pct": iwf_iwd_spread_30d,
        "iwm_spy_spread_30d_pct": iwm_spy_spread_30d,
        "note": "iwm_spy spread is a breadth PROXY; treat narrow if SPY >> IWM",
    }
    import json

    reply = await call_agent(
        system_prompt=_LLM_SYSTEM,
        user_message=json.dumps(payload, indent=2),
        temperature=0.2,
        max_tokens=1024,
        agent_name="regime_detector",
        downstream_consumers=["engine.specialist_weights", "report.macro_event"],
    )
    try:
        return reply.as_json()
    except Exception as exc:
        logger.warning("regime LLM parse failed: %s", exc)
        return {
            "factor": {"label": "mixed", "confidence": 0.3, "rationale": "LLM parse failed"},
            "breadth": {"label": "rotation", "confidence": 0.3, "rationale": "LLM parse failed"},
            "historical_analogs": [],
            "transition_probability_30d": 0.3,
            "notes": f"LLM parse error: {exc}",
        }


# --- Data fetch helpers --------------------------------------------------
async def _spread_30d(etf_a: str, etf_b: str) -> float | None:
    """Return the (etf_a vs etf_b) 30-day return spread in percent. None on failure."""
    history_a, history_b = await asyncio.gather(
        market_data.get_history(etf_a, days=45),
        market_data.get_history(etf_b, days=45),
    )
    if not history_a or not history_b:
        return None
    try:
        a_now = history_a[-1]["close"]
        b_now = history_b[-1]["close"]
        # Find a bar ~30 days back (or the oldest if fewer rows).
        a_then = history_a[max(0, len(history_a) - 31)]["close"]
        b_then = history_b[max(0, len(history_b) - 31)]["close"]
        a_ret = (a_now - a_then) / a_then * 100
        b_ret = (b_now - b_then) / b_then * 100
        return round(a_ret - b_ret, 3)
    except (KeyError, TypeError, ZeroDivisionError):
        return None


async def _dff_change_30d() -> float | None:
    obs = await fred.get_series_observations("DFF", limit=35)
    nums: list[float] = []
    for o in obs:
        raw = o.get("value")
        if raw and raw != ".":
            try:
                nums.append(float(raw))
            except ValueError:
                continue
    if len(nums) < 2:
        return None
    return round(nums[0] - nums[-1], 4)   # observations are desc; first - last


async def _walcl_change_90d() -> float | None:
    obs = await fred.get_series_observations("WALCL", limit=20)   # weekly series
    nums: list[float] = []
    for o in obs:
        raw = o.get("value")
        if raw and raw != ".":
            try:
                nums.append(float(raw))
            except ValueError:
                continue
    if len(nums) < 2:
        return None
    latest, earlier = nums[0], nums[-1]
    if not earlier:
        return None
    return round((latest - earlier) / earlier * 100, 3)


# --- Public entry --------------------------------------------------------
class RegimeDetector:
    """One classification per morning. Stateless — singleton OK."""

    async def detect(self) -> RegimeSnapshot:
        """Fetch inputs, classify all six dimensions, persist the snapshot."""
        (
            vix,
            t10y2y,
            hy_oas,
            dff_30d,
            walcl_90d,
            rrp,
            iwf_iwd,
            iwm_spy,
        ) = await asyncio.gather(
            fred.get_latest("VIXCLS"),
            fred.get_latest("T10Y2Y"),
            fred.get_latest("BAMLH0A0HYM2"),
            _dff_change_30d(),
            _walcl_change_90d(),
            fred.get_latest("RRPONTSYD"),
            _spread_30d("IWF", "IWD"),
            _spread_30d("IWM", "SPY"),
        )

        vol = _classify_volatility(vix)
        rate = _classify_rate(t10y2y, dff_30d)
        credit = _classify_credit(hy_oas)
        liquidity = _classify_liquidity(walcl_90d, rrp)

        rules_summary = {
            "volatility": vol.model_dump(),
            "rate": rate.model_dump(),
            "credit": credit.model_dump(),
            "liquidity": liquidity.model_dump(),
        }
        contextual = await _classify_contextual(
            rules_summary=rules_summary,
            iwf_iwd_spread_30d=iwf_iwd,
            iwm_spy_spread_30d=iwm_spy,
        )
        factor = RegimeClassification.model_validate(
            contextual.get("factor") or {"label": "mixed", "confidence": 0.3, "rationale": ""}
        )
        breadth = RegimeClassification.model_validate(
            contextual.get("breadth") or {"label": "rotation", "confidence": 0.3, "rationale": ""}
        )

        weights = regime.compose_specialist_weights(
            volatility=vol.label,
            rate=rate.label,
            credit=credit.label,
            factor=factor.label,
        )

        snapshot = RegimeSnapshot(
            classified_at=datetime.now(timezone.utc),
            volatility=vol,
            rate=rate,
            credit=credit,
            factor=factor,
            breadth=breadth,
            liquidity=liquidity,
            historical_analogs=[str(a) for a in (contextual.get("historical_analogs") or [])],
            transition_probability_30d=float(
                contextual.get("transition_probability_30d") or 0.3
            ),
            specialist_weights=weights,
            inputs={
                "VIX": vix,
                "T10Y2Y": t10y2y,
                "HY_OAS": hy_oas,
                "DFF_30d_change_pp": dff_30d,
                "WALCL_90d_change_pct": walcl_90d,
                "RRP": rrp,
                "IWF_IWD_30d_pct": iwf_iwd,
                "IWM_SPY_30d_pct": iwm_spy,
            },
            notes=contextual.get("notes", ""),
        )

        regime.set_snapshot(snapshot)
        logger.info(
            "Regime classified — vol=%s rate=%s credit=%s factor=%s breadth=%s liquidity=%s",
            vol.label, rate.label, credit.label, factor.label, breadth.label, liquidity.label,
        )
        return snapshot


# Process-wide singleton.
detector = RegimeDetector()
