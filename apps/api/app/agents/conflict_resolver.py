"""Conflict Resolution Protocol — surface specialist disagreement on the same name.

Detection is rules-based (cheap, deterministic):
  - opposite_actions   one specialist bull, another bear on the ticker
  - conviction_spread  bullish convictions span >= 3 points
  - forecast_divergence base_case prices differ by > 25%

For each conflicted ticker, one LLM call identifies the CRUX (the specific fact
or interpretation that differs), classifies it (data_resolvable vs interpretation),
and produces a weighted verdict per Brian's spec:
  - data_resolvable    -> wait_for_data
  - interpretation     -> present_both | lean_bull | lean_bear | no_position

Surfaced disagreement is alpha. Hidden disagreement is a blow-up waiting to
happen.
"""

from __future__ import annotations

import asyncio
import json
import logging
from datetime import datetime, timezone

from app.schemas import (
    ConflictReport,
    ConflictType,
    ConflictVerdict,
    CruxType,
    SpecialistReport,
    SpecialistView,
)
from app.services.anthropic_client import call_agent

logger = logging.getLogger("conflict_resolver")

CONVICTION_SPREAD_THRESHOLD = 3
FORECAST_DIVERGENCE_PCT = 0.25

_BULLISH_ACTIONS = {"long", "buy", "add"}
_BEARISH_ACTIONS = {"avoid", "sell", "trim", "watch"}

_RESOLVER_SYSTEM = """\
You are the Conflict Resolution Agent at Armstrong Arikat Private Wealth Group.
Two or more specialists disagree on the same name. Your job is to surface the
disagreement honestly, identify the crux, and recommend an action.

Workflow per Brian's spec:
1. Identify the CRUX — the specific fact or interpretation that differs.
   Be specific. "They disagree on growth" is too vague; "they disagree on
   whether FY26 hyperscaler capex exceeds $300B" is the crux.
2. Classify the crux:
   - "data_resolvable" — a specific piece of data would settle the dispute.
   - "interpretation"   — a judgment call; no single data point settles it.
3. Weighted synthesis given the views, evidence strength, and apparent
   regime fit. Pick ONE verdict:
   - "wait_for_data"    — the data is coming; surface the dispute, hold off.
   - "present_both"     — interpretation gap that's a judgment call; show
                          both views, Brian decides.
   - "lean_bull"        — bull case carries on weighted evidence.
   - "lean_bear"        — bear case carries on weighted evidence.
   - "no_position"      — disagreement is noisy / nothing is asymmetric; pass.

Respond with ONLY a JSON object:
{
  "crux": "the specific point of disagreement, one sentence",
  "crux_type": "data_resolvable | interpretation",
  "verdict": "wait_for_data | present_both | lean_bull | lean_bear | no_position",
  "recommended_action": "one-line guidance for Brian"
}

Never paper over disagreement to produce a clean narrative.
"""


# --- Detection ----------------------------------------------------------------
def _collect_views(outputs: list[SpecialistReport]) -> dict[str, list[SpecialistView]]:
    """Group every covered_names_commentary + new_ideas view by ticker."""
    by_ticker: dict[str, list[SpecialistView]] = {}
    for sr in outputs:
        # Bullish picks (new_ideas)
        for idea in sr.new_ideas:
            if not idea.ticker:
                continue
            base_case = (
                idea.forecast.base_case_50pct.price if idea.forecast is not None else None
            )
            evidence = (
                idea.market_positioning.evidence_strength
                if idea.market_positioning is not None
                else None
            )
            by_ticker.setdefault(idea.ticker.upper(), []).append(
                SpecialistView(
                    agent_key=sr.agent_key,
                    specialist=sr.specialist,
                    stance="bullish",
                    action=None,
                    conviction=idea.conviction_1_10,
                    thesis=idea.thesis,
                    base_case_price=base_case,
                    evidence_strength=evidence,
                )
            )
        # Covered names with explicit action
        for cn in sr.covered_names_commentary:
            if not cn.ticker:
                continue
            action = (cn.action or "").lower()
            stance = (
                "bullish"
                if action in _BULLISH_ACTIONS
                else "bearish"
                if action in _BEARISH_ACTIONS
                else "neutral"
            )
            by_ticker.setdefault(cn.ticker.upper(), []).append(
                SpecialistView(
                    agent_key=sr.agent_key,
                    specialist=sr.specialist,
                    stance=stance,
                    action=action or None,
                    conviction=None,
                    thesis=cn.narrative or "",
                    base_case_price=None,
                    evidence_strength=None,
                )
            )
    return by_ticker


def _detect_conflict_types(views: list[SpecialistView]) -> list[ConflictType]:
    if len(views) < 2:
        return []
    types: list[ConflictType] = []
    stances = {v.stance for v in views}
    if "bullish" in stances and "bearish" in stances:
        types.append(ConflictType.opposite_actions)
    bullish_convictions = [v.conviction for v in views if v.conviction is not None]
    if (
        len(bullish_convictions) >= 2
        and max(bullish_convictions) - min(bullish_convictions) >= CONVICTION_SPREAD_THRESHOLD
    ):
        types.append(ConflictType.conviction_spread)
    bases = [v.base_case_price for v in views if v.base_case_price]
    if len(bases) >= 2:
        mn, mx = min(bases), max(bases)
        if mn and (mx - mn) / mn > FORECAST_DIVERGENCE_PCT:
            types.append(ConflictType.forecast_divergence)
    return types


# --- Per-ticker resolution ----------------------------------------------------
async def _resolve_one(ticker: str, views: list[SpecialistView]) -> ConflictReport | None:
    conflict_types = _detect_conflict_types(views)
    if not conflict_types:
        return None
    now = datetime.now(timezone.utc)
    payload = {
        "ticker": ticker,
        "conflict_types": [c.value for c in conflict_types],
        "views": [v.model_dump() for v in views],
    }
    reply = await call_agent(
        system_prompt=_RESOLVER_SYSTEM,
        user_message=json.dumps(payload, indent=2),
        temperature=0.2,
        max_tokens=1024,
        agent_name=f"conflict_resolver:{ticker}",
        downstream_consumers=["report.conflicts", "email_render"],
    )
    try:
        data = reply.as_json()
    except Exception as exc:
        logger.warning("Conflict resolver parse failed for %s: %s", ticker, exc)
        return ConflictReport(
            ticker=ticker,
            conflict_types=conflict_types,
            views=views,
            crux=f"Conflict detected but LLM parse failed: {exc}",
            crux_type=CruxType.interpretation,
            verdict=ConflictVerdict.present_both,
            recommended_action="Surface to Brian for manual review.",
            detected_at=now,
        )

    crux_type = CruxType(data.get("crux_type", "interpretation"))
    verdict = ConflictVerdict(data.get("verdict", "present_both"))
    return ConflictReport(
        ticker=ticker,
        conflict_types=conflict_types,
        views=views,
        crux=data.get("crux", ""),
        crux_type=crux_type,
        verdict=verdict,
        recommended_action=data.get("recommended_action", ""),
        detected_at=now,
    )


# --- Public entry -------------------------------------------------------------
class ConflictResolver:
    """Stateless — one instance shared by Beth."""

    async def resolve(self, outputs: list[SpecialistReport]) -> list[ConflictReport]:
        by_ticker = _collect_views(outputs)
        candidates = [
            (tk, views)
            for tk, views in by_ticker.items()
            if _detect_conflict_types(views)
        ]
        if not candidates:
            return []
        results = await asyncio.gather(
            *(_resolve_one(tk, views) for tk, views in candidates),
            return_exceptions=True,
        )
        out: list[ConflictReport] = []
        for r in results:
            if isinstance(r, ConflictReport):
                out.append(r)
            elif isinstance(r, Exception):
                logger.warning("Conflict resolution failed: %s", r)
        return out


resolver = ConflictResolver()
