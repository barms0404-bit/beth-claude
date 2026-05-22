"""The Specialist base class and the shared prompt scaffolding.

Each specialist's system prompt is composed of three parts:

    FIRM_PREAMBLE      identity + compliance discipline (identical for all)
  + <specialist mandate>   the domain-specific instructions
  + OUTPUT_CONTRACT    the JSON schema BETH expects back (identical for all)

Because the preamble and contract are byte-identical across specialists, and
the system prompt is sent with cache_control, repeated runs hit the prompt cache.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field

from app.schemas import ReportSlot, SpecialistOutput
from app.services.anthropic_client import AgentReply, call_agent

# ---------------------------------------------------------------------------
# Shared prompt fragments
# ---------------------------------------------------------------------------
FIRM_PREAMBLE = """\
You are a specialist research analyst at Armstrong Arikat Private Wealth Group,
a registered investment advisory firm. You report to BETH, the firm's chief-of-staff
orchestrator, who aggregates your work into client research reports.

Operating discipline:
- Ground every claim in the market context and data you are given. Never invent
  prices, filings, or events. If you lack data, say so plainly.
- Write for a professional advisor audience: precise, concise, no hype.
- You produce research opinions, NOT personalized investment advice. Do not promise
  returns. All output is reviewed by firm compliance before any client sees it.
- Stay strictly within your stated mandate. Defer out-of-scope names to BETH.
"""

OUTPUT_CONTRACT = """\
Respond with ONLY a single JSON object, no prose outside it, matching:

{
  "headline": "one-sentence top takeaway",
  "commentary": "2-4 paragraph analysis grounded in the provided context",
  "stance": "bullish | neutral | bearish",
  "recommendations": [
    {
      "symbol": "TICKER",
      "thesis": "why this name, in 1-3 sentences",
      "conviction": "bullish | neutral | bearish",
      "score": 0-100
    }
  ],
  "chart_requests": [
    {
      "symbol": "TICKER or null",
      "title": "chart title",
      "intent": "what the chart should show and why it matters"
    }
  ]
}

Include 0-8 recommendations and 0-3 chart_requests as your analysis warrants.
"""


@dataclass
class Specialist:
    """A single domain analyst in the fleet."""

    key: str
    name: str
    mandate: str
    lead_slot: ReportSlot | None = None  # set for the 3 report-window analysts
    model: str | None = None             # None -> use the configured default
    last_reply: AgentReply | None = field(default=None, repr=False)

    @property
    def system_prompt(self) -> str:
        return f"{FIRM_PREAMBLE}\n\n--- YOUR MANDATE: {self.name} ---\n{self.mandate}\n\n{OUTPUT_CONTRACT}"

    async def run(self, context: str) -> SpecialistOutput:
        """Analyze the given context and return structured findings for BETH."""
        reply = await call_agent(
            system_prompt=self.system_prompt,
            user_message=context,
            model=self.model,
        )
        self.last_reply = reply
        data = reply.as_json()
        data["agent_key"] = self.key
        return SpecialistOutput.model_validate(data)


def build_context(*, slot: ReportSlot, market_brief: str, focus: str = "") -> str:
    """Assemble the user-message context block handed to a specialist."""
    payload = {
        "report_slot": slot.value,
        "market_brief": market_brief,
        "focus": focus or "Cover your mandate broadly.",
    }
    return (
        "Produce your analysis for the following research window.\n\n"
        + json.dumps(payload, indent=2)
    )
