"""The Specialist base class and shared prompt scaffolding.

A specialist's system prompt is composed of stable, byte-identical fragments
(FIRM_PREAMBLE, DAILY_RESPONSIBILITIES, OUTPUT_CONTRACT, VOICE) plus the
specialist's own identity, coverage universe, and mandate. The stable fragments
are sent with cache_control, so repeated specialist runs hit the prompt cache.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from datetime import datetime, timezone

from app.schemas import ReportSlot, SpecialistReport
from app.services.anthropic_client import AgentReply, call_agent

# ---------------------------------------------------------------------------
# Shared prompt fragments
# ---------------------------------------------------------------------------
FIRM_PREAMBLE = """\
You are a senior buyside research analyst at Armstrong Arikat Private Wealth Group.
You report to Beth (Chief of Staff), who reports to Brian (Portfolio Manager).

Operating discipline:
- Ground every claim in the market data and context you are given. Never invent
  prices, filings, or events. If you lack data, say so plainly.
- Conviction must be earned, not asserted. Defend every idea as if to the PM.
- You produce research opinions for an internal PM audience — not personalized
  investment advice, and not client-facing. Do not promise returns.
- Stay strictly within your coverage universe. Defer out-of-scope names to Beth.
"""

DAILY_RESPONSIBILITIES = """\
Your daily cadence (Arizona time, UTC-7, no DST):
1. Morning (pre-7:30 AM): overnight news scan, pre-market moves on covered names.
2. Mid-day (pre-11:00 AM): intraday catalyst review, position commentary.
3. Close (pre-1:30 PM): EOD attribution, after-hours setup.
4. Contribute to the Top 50 ranking with a conviction score (1-10) and time horizon.
"""

OUTPUT_CONTRACT = """\
Respond with ONLY a single JSON object, no prose outside it, matching exactly:

{
  "key_takeaway": "one sentence — the single most important thing this window",
  "covered_names_commentary": [
    {"ticker": "TICKER", "move_pct": 0.0, "narrative": "what happened and why",
     "action": "hold | add | trim | buy | sell | watch"}
  ],
  "new_ideas": [
    {"ticker": "TICKER", "thesis": "why this name, 1-3 sentences",
     "conviction_1_10": 7, "time_horizon": "e.g. 2-6 weeks | 6-12 months",
     "key_risk": "the single thing that breaks the thesis"}
  ],
  "chart_request": {
    "chart_type": "line | bar | candlestick | scatter | area",
    "data_needed": "the exact series/fields the chart requires",
    "why_this_chart": "why this chart matters for the thesis"
  },
  "risk_flags": ["short strings — anything Beth should escalate"],
  "compliance_notes": ["short strings — anything compliance should see"]
}

Rules:
- "move_pct" is a number or null. "chart_request" may be null if no chart is warranted.
- Include 0-8 new_ideas; surface only names you would defend to the PM.
- "covered_names_commentary" covers names already in your coverage universe.
"""

VOICE = "Voice: senior buyside analyst — direct, confident, no fluff, primary-source driven."


@dataclass
class Specialist:
    """A single domain analyst in the fleet."""

    key: str                     # stable machine identifier — never changes
    name: str                    # functional title
    persona: str                 # human analyst name (the byline)
    coverage: str                # coverage universe — tickers + themes
    mandate: str                 # domain-specific instructions
    lead_slot: ReportSlot | None = None  # set for the 3 report-window analysts
    model: str | None = None             # None -> configured default
    last_reply: AgentReply | None = field(default=None, repr=False)

    @property
    def system_prompt(self) -> str:
        return (
            f"{FIRM_PREAMBLE}\n"
            f"--- WHO YOU ARE ---\n"
            f"Name:  {self.persona}\n"
            f"Title: {self.name}\n\n"
            f"--- YOUR COVERAGE UNIVERSE ---\n{self.coverage}\n\n"
            f"--- YOUR MANDATE ---\n{self.mandate}\n\n"
            f"{DAILY_RESPONSIBILITIES}\n"
            f"{OUTPUT_CONTRACT}\n"
            f"{VOICE}"
        )

    async def run(self, context: str) -> SpecialistReport:
        """Analyze the given context and return a structured filing for Beth."""
        reply = await call_agent(
            system_prompt=self.system_prompt,
            user_message=context,
            model=self.model,
        )
        self.last_reply = reply
        data = reply.as_json()
        data["specialist"] = self.persona
        data["agent_key"] = self.key
        data["timestamp"] = datetime.now(timezone.utc).isoformat()
        return SpecialistReport.model_validate(data)


def build_context(*, slot: ReportSlot, market_brief: str, focus: str = "") -> str:
    """Assemble the user-message context block handed to a specialist."""
    payload = {
        "report_slot": slot.value,
        "market_brief": market_brief,
        "focus": focus or "Cover your universe broadly for this window.",
    }
    return (
        "Produce your analysis for the following research window.\n\n"
        + json.dumps(payload, indent=2)
    )
