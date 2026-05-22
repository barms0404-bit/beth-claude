"""The Chart Specialist — a sub-agent Beth calls to satisfy specialists' chart requests.

For each ChartRequest it produces everything the terminal needs to render the chart
in two places: an interactive Recharts spec for the web dashboard and a Plotly figure
for HD PNG export in email reports — plus a plain-English explainer covering WHY the
chart matters and HOW to read it.
"""

from __future__ import annotations

from app.schemas import ChartRequest, ChartSpec
from app.services.anthropic_client import call_agent

_SYSTEM = """\
You are the Chart Specialist sub-agent at Armstrong Arikat Private Wealth Group.
A research analyst has requested a chart. Produce everything the firm needs to
render it in two places: the interactive web terminal and the HD email reports.

Dark theme: paper/plot background #0A0A0A, font color #F5E6C8, gridlines #1F1A0F,
primary series #C9A961, positive #4ADE80, negative #EF4444.

Deliver:
- chart_explanation: 2-3 paragraphs, plain English — WHY this chart matters for the
  thesis, and HOW to read it (what the axes mean, what a reader should look for).
- recharts_spec: a JSON object describing the interactive web chart — chart type, a
  data array with clearly-labelled placeholder rows the pipeline will replace, axis
  keys, and series configuration.
- plotly_spec: a complete Plotly figure object ({"data": [...], "layout": {...}})
  suitable for HD PNG export in email reports.

Never fabricate real data points. Use clearly-labelled placeholder data the pipeline
will replace with live values.

Respond with ONLY a JSON object:
{
  "title": "chart title",
  "chart_explanation": "why it matters and how to read it",
  "recharts_spec": { ... },
  "plotly_spec": { "data": [...], "layout": {...} }
}
"""


class ChartSpecialist:
    """Stateless sub-agent. One instance is shared by Beth."""

    key = "chart"

    async def render(
        self, request: ChartRequest, *, requested_by: str, agent_key: str
    ) -> ChartSpec:
        user_message = (
            f"Requesting analyst: {requested_by}\n"
            f"Chart type: {request.chart_type}\n"
            f"Data needed: {request.data_needed}\n"
            f"Why this chart: {request.why_this_chart}\n\n"
            "Design the chart, both render specs, and the explainer."
        )
        reply = await call_agent(
            system_prompt=_SYSTEM,
            user_message=user_message,
            temperature=0.3,
        )
        data = reply.as_json()
        return ChartSpec(
            title=data.get("title", request.chart_type),
            chart_explanation=data.get("chart_explanation", ""),
            recharts_spec=data.get("recharts_spec", {}),
            plotly_spec=data.get("plotly_spec", {}),
            png_url=None,  # TODO(step 4): export PNG from plotly_spec via kaleido
            requested_by=requested_by,
            agent_key=agent_key,
        )
