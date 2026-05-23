"""The Red Team Agent — adversarial critique before the report reaches Brian.

For each top-conviction Top 50 entry, produce a structured attack covering:

  1. Steelman bear case (consensus pricing, smart-money other side, precedent)
  2. Cognitive biases (recency, confirmation, narrative, anchoring, survivorship)
  3. Logical errors (correlation/causation, selection, time-period gaming, apples/oranges)
  4. Assumptions with fragility 1-10
  5. Position sizing sanity (does conviction justify size? max drawdown? symmetry?)
  6. Kill shot — the one piece of evidence that would prove the thesis wrong

Distinct from Whitlock's `bear_case_addendum`:
  - Whitlock: narrative value-investor contrarian, one SpecialistReport across
    the bull-skew set.
  - Red Team: structured per-ticker critique, rationalist attacker voice,
    JSON output Beth integrates into the final report.

Targets are capped at 8 per report (LLM cost discipline).
"""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone

from app.schemas import (
    AssumptionCheck,
    RedTeamCritique,
    Top50Entry,
    Top50Snapshot,
)
from app.services.anthropic_client import call_agent

logger = logging.getLogger("red_team")

CONVICTION_FLOOR = 7.0   # only attack picks above this conviction
MAX_ATTACKS_PER_REPORT = 8

_SYSTEM = """\
You are the Red Team Agent at Armstrong Arikat Private Wealth Group. A
recommendation has cleared the specialist pipeline, the PSV verifier (for
high-conviction picks), and the Citation Enforcement Agent. Your job is to
attack it BEFORE the PM sees it. The best ideas get stronger when attacked —
your purpose is not to kill, but to ensure only ideas that survive scrutiny
reach Brian.

Deliver a structured critique covering all six dimensions:

1. STEELMAN BEAR CASE
   - Strongest argument against the trade.
   - What consensus is already pricing in.
   - What smart money on the other side believes.
   - Recent precedent that invalidates the thesis.

2. COGNITIVE BIASES — flag any of:
   - recency       (over-weighting recent moves)
   - confirmation  (did the specialist seek disconfirming evidence?)
   - narrative     (too clean a story?)
   - anchoring     (price targets anchored to round numbers or highs?)
   - survivorship  (cherry-picked winner comparisons?)

3. LOGICAL ERRORS — flag any of:
   - correlation_vs_causation
   - selection_bias
   - time_period_gaming
   - apples_to_oranges

4. ASSUMPTIONS — list every assumption underlying the thesis. Score fragility
   1-10 (10 = most likely to break). Identify the assumption most likely to
   fail.

5. POSITION SIZING — does the conviction justify the implied position size?
   What's the max drawdown if the thesis is wrong? Is the risk/reward
   asymmetric (good) or symmetric (suspect)?

6. KILL SHOT — the one piece of evidence that would prove the thesis wrong.
   Is it already publicly available? What would need to happen for YOU to
   short this name?

OVERALL — set bear_stronger_than_bull=true only when the bear case is
MATERIALLY stronger than the bull, not merely "valid". End with a one-line
verdict.

Respond with ONLY a JSON object:
{
  "steelman_bear": "...",
  "consensus_pricing": "...",
  "cognitive_biases": ["recency", "narrative", ...],
  "logical_errors": ["selection_bias", ...],
  "assumptions": [
    {"assumption": "...", "fragility": 1-10, "rationale": "..."}
  ],
  "position_sizing_view": "...",
  "max_drawdown_estimate": "...",
  "risk_reward_symmetry": "asymmetric | symmetric",
  "kill_shot": "...",
  "bear_stronger_than_bull": true|false,
  "overall_verdict": "..."
}

Be sharp. Be specific. Generic critiques waste Brian's time.
"""


class RedTeam:
    """Stateless — one instance shared by Beth."""

    async def attack(self, snapshot: Top50Snapshot) -> list[RedTeamCritique]:
        """Run the critique on the top conviction entries, capped at the budget."""
        candidates = [e for e in snapshot.entries if e.conviction_avg >= CONVICTION_FLOOR]
        # Highest composite_score first — that's where the asymmetric risk lives.
        candidates.sort(key=lambda e: -e.composite_score)
        targets = candidates[:MAX_ATTACKS_PER_REPORT]
        if not targets:
            return []

        results = await asyncio.gather(
            *(self._critique_one(e) for e in targets),
            return_exceptions=True,
        )
        out: list[RedTeamCritique] = []
        for r in results:
            if isinstance(r, RedTeamCritique):
                out.append(r)
            elif isinstance(r, Exception):
                logger.warning("Red Team critique failed: %s", r)
        return out

    async def _critique_one(self, entry: Top50Entry) -> RedTeamCritique:
        contributing = ", ".join(entry.contributing_specialists) or entry.lead_specialist
        user_message = (
            f"Ticker:         {entry.ticker} ({entry.company_name})\n"
            f"Rank:           {entry.rank}\n"
            f"Lead analyst:   {entry.lead_specialist}\n"
            f"Contributing:   {contributing}\n"
            f"Conviction avg: {entry.conviction_avg}/10\n"
            f"Composite:      {entry.composite_score}\n"
            f"Time horizon:   {entry.time_horizon}\n\n"
            f"Bull thesis (as filed by the lead analyst):\n{entry.thesis_summary}\n\n"
            "Attack it."
        )
        reply = await call_agent(
            system_prompt=_SYSTEM,
            user_message=user_message,
            temperature=0.3,
            max_tokens=2048,
        )
        try:
            data = reply.as_json()
        except Exception as exc:
            logger.warning("Red Team JSON parse failed for %s: %s", entry.ticker, exc)
            return self._fallback(entry, reason=str(exc))

        assumptions_raw = data.get("assumptions") or []
        assumptions: list[AssumptionCheck] = []
        for a in assumptions_raw:
            try:
                assumptions.append(
                    AssumptionCheck(
                        assumption=a.get("assumption", ""),
                        fragility=max(1, min(10, int(a.get("fragility", 5)))),
                        rationale=a.get("rationale", ""),
                    )
                )
            except (TypeError, ValueError):
                continue

        return RedTeamCritique(
            ticker=entry.ticker,
            lead_specialist=entry.lead_specialist,
            conviction=entry.conviction_avg,
            steelman_bear=data.get("steelman_bear", ""),
            consensus_pricing=data.get("consensus_pricing", ""),
            cognitive_biases=[str(b) for b in (data.get("cognitive_biases") or [])],
            logical_errors=[str(e) for e in (data.get("logical_errors") or [])],
            assumptions=assumptions,
            position_sizing_view=data.get("position_sizing_view", ""),
            max_drawdown_estimate=data.get("max_drawdown_estimate", ""),
            risk_reward_symmetry=str(data.get("risk_reward_symmetry", "")),
            kill_shot=data.get("kill_shot", ""),
            bear_stronger_than_bull=bool(data.get("bear_stronger_than_bull", False)),
            overall_verdict=data.get("overall_verdict", ""),
            critiqued_at=datetime.now(timezone.utc),
        )

    @staticmethod
    def _fallback(entry: Top50Entry, *, reason: str) -> RedTeamCritique:
        return RedTeamCritique(
            ticker=entry.ticker,
            lead_specialist=entry.lead_specialist,
            conviction=entry.conviction_avg,
            steelman_bear="Critique unavailable (parse error).",
            consensus_pricing="",
            cognitive_biases=[],
            logical_errors=[],
            assumptions=[],
            position_sizing_view="",
            max_drawdown_estimate="",
            risk_reward_symmetry="",
            kill_shot="",
            bear_stronger_than_bull=False,
            overall_verdict=f"Red Team parse error: {reason}",
            critiqued_at=datetime.now(timezone.utc),
        )


# Process-wide singleton.
red_team = RedTeam()
