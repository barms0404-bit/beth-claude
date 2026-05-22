"""The Chart Specialist — a sub-agent BETH calls to satisfy specialists' chart requests.

For each ChartRequest it produces a renderable chart definition (Plotly JSON or a
Recharts-friendly series), a plain-English explainer covering WHY the chart matters
and HOW to read it, and — for email reports — a static PNG export.
"""

from __future__ import annotations

from app.schemas import ChartRequest, ChartSpec
from app.services.anthropic_client import call_agent

_SYSTEM = """\
You are the Chart Specialist at Armstrong Arikat Private Wealth Group. A research
specialist has asked for a chart. Produce a chart definition the firm's terminal can
render, plus an explainer a client can understand.

Rules:
- Prefer Plotly. Use a dark theme: paper/plot background #0A0A0A, font color #F5E6C8,
  gridlines #1F1A0F, primary series color #C9A961.
- The explanation must state, in plain English, WHY this chart matters for the thesis
  and HOW to read it (what the axes mean, what a reader should look for).
- Never fabricate data points. If specific values are not supplied, define the chart
  structure and use clearly labelled placeholder data the pipeline will replace.

Respond with ONLY a JSON object:
{
  "title": "chart title",
  "library": "plotly",
  "spec_json": { ...a complete Plotly figure: {data:[...], layout:{...}}... },
  "explanation": "why it matters and how to read it"
}
"""


class ChartSpecialist:
    """Stateless sub-agent. One instance is shared by BETH."""

    key = "chart"

    async def render(self, request: ChartRequest, *, requested_by: str) -> ChartSpec:
        user_message = (
            f"Requesting specialist: {requested_by}\n"
            f"Symbol: {request.symbol or 'n/a'}\n"
            f"Requested title: {request.title}\n"
            f"Intent: {request.intent}\n\n"
            "Design the chart and explainer."
        )
        reply = await call_agent(
            system_prompt=_SYSTEM,
            user_message=user_message,
            temperature=0.3,
        )
        data = reply.as_json()
        return ChartSpec(
            title=data.get("title", request.title),
            library=data.get("library", "plotly"),
            spec_json=data.get("spec_json", {}),
            explanation=data.get("explanation", ""),
            png_url=None,  # TODO(step 4): export via kaleido and upload for email embeds
            symbol=request.symbol,
            agent_key=requested_by,
        )
