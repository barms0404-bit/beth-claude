"""The Chart Specialist — embedded sub-agent that satisfies any parent
specialist's chart request.

For each `ChartRequest` it produces:
  - an interactive Recharts spec for the web dashboard;
  - a Plotly figure (`plotly_spec`) — what kaleido renders for the email PNG;
  - an equivalent Python snippet (`plotly_python_code`) for reproducibility;
  - a structured three-part explanation (why / how to read / key takeaway);
  - a persisted HD PNG at /charts/{chart_id}.png.

Brand annotations (source, date, requesting-analyst badge) are added
programmatically after the model returns, so every chart is branded consistently
regardless of LLM output.
"""

from __future__ import annotations

import logging

from app.schemas import ChartExplanation, ChartRequest, ChartSpec
from app.services import charts as charts_svc
from app.services.anthropic_client import call_agent

logger = logging.getLogger("chart_specialist")

_VALID_CHART_TYPES = {
    "candlestick", "line", "bar", "scatter", "heatmap",
    "treemap", "sankey", "area",
}

_SYSTEM = """\
You are the Chart Specialist at Armstrong Arikat Private Wealth Group. You are
embedded within whichever specialist requested the chart — their persona is
your byline. A research analyst asked for a chart; produce everything the firm
needs to render it in two places (interactive web + HD email PNG) and explain it
to the PM.

DESIGN
- Pick the chart_type that best answers the investment question: candlestick
  (OHLC), line (continuous time series), bar (categorical comparison), scatter
  (relationship between two variables), heatmap (matrix intensity), treemap
  (hierarchical composition), sankey (flow), area (cumulative).
- Dark theme: paper/plot bg #0A0A0A, font #F5E6C8 (Inter, body 12pt, title 16pt),
  gridlines #1F1A0F, primary series #C9A961, secondary #F5E6C8, positive #C9A961,
  negative #EF4444, axis labels #8A7548.
- Never fabricate real data points. Use clearly-labelled placeholder data the
  pipeline will replace; the firm post-processes annotations and source line.

EXPLAIN
- why_this_chart: 1-2 sentences on what investment question the chart answers.
- how_to_read: 2-3 sentences walking through axes, key markers, and what reads
  as good vs bad.
- key_takeaway: 1 sentence — the actionable insight.

Respond with ONLY a JSON object:
{
  "chart_type": "candlestick | line | bar | scatter | heatmap | treemap | sankey | area",
  "title": "chart title",
  "recharts_spec": { ...interactive web chart definition... },
  "plotly_spec": { "data": [...], "layout": {...} },
  "explanation": {
    "why_this_chart": "...",
    "how_to_read": "...",
    "key_takeaway": "..."
  }
}
"""


class ChartSpecialist:
    """Stateless sub-agent — one instance per process, parent persona passed in."""

    key = "chart"

    async def render(
        self, request: ChartRequest, *, requested_by: str, agent_key: str
    ) -> ChartSpec:
        user_message = (
            f"Requesting analyst: {requested_by}\n"
            f"Chart type hint: {request.chart_type}\n"
            f"Data needed: {request.data_needed}\n"
            f"Why this chart: {request.why_this_chart}\n\n"
            "Design the chart, both render specs, and the structured explanation."
        )
        reply = await call_agent(
            system_prompt=_SYSTEM,
            user_message=user_message,
            temperature=0.3,
            max_tokens=4096,
        )
        try:
            data = reply.as_json()
        except Exception as exc:
            logger.warning("Chart Specialist returned non-JSON: %s", exc)
            return self._fallback(request, requested_by, agent_key, reason=str(exc))

        chart_type = data.get("chart_type", request.chart_type or "line")
        if chart_type not in _VALID_CHART_TYPES:
            chart_type = "line"

        title = data.get("title", request.chart_type or "Chart")
        raw_plotly = data.get("plotly_spec") or {}
        recharts_spec = data.get("recharts_spec") or {}
        explanation_raw = data.get("explanation") or {}

        # Build the branded plotly spec (annotations / source / date / persona).
        plotly_spec = charts_svc.brand_plotly_spec(
            raw_plotly, title=title, requested_by=requested_by
        )
        plotly_python_code = charts_svc.spec_to_python_code(plotly_spec)

        # Render + persist the HD PNG. Failures degrade png_url to None.
        png_url: str | None = None
        png_bytes = charts_svc.plotly_to_png(plotly_spec)
        # We need the chart_id before we persist; create the ChartSpec first
        # with placeholder png_url, then patch after writing the file.

        explanation = ChartExplanation(
            why_this_chart=explanation_raw.get("why_this_chart", ""),
            how_to_read=explanation_raw.get("how_to_read", ""),
            key_takeaway=explanation_raw.get("key_takeaway", ""),
        )
        spec = ChartSpec(
            chart_type=chart_type,
            title=title,
            recharts_spec=recharts_spec,
            plotly_spec=plotly_spec,
            plotly_python_code=plotly_python_code,
            explanation=explanation,
            requested_by=requested_by,
            agent_key=agent_key,
        )
        if png_bytes is not None:
            try:
                png_url = charts_svc.persist_png(spec.chart_id, png_bytes)
            except Exception as exc:
                logger.warning("Chart %s persist failed: %s", spec.chart_id, exc)
        spec.png_url = png_url
        return spec

    @staticmethod
    def _fallback(
        request: ChartRequest, requested_by: str, agent_key: str, *, reason: str
    ) -> ChartSpec:
        """Return a minimal ChartSpec when the LLM reply can't be parsed."""
        return ChartSpec(
            chart_type=request.chart_type or "line",
            title=request.chart_type or "Chart",
            recharts_spec={},
            plotly_spec={},
            plotly_python_code="",
            explanation=ChartExplanation(
                why_this_chart=request.why_this_chart,
                how_to_read="Chart render unavailable.",
                key_takeaway=f"Chart Specialist parse error: {reason}",
            ),
            png_url=None,
            requested_by=requested_by,
            agent_key=agent_key,
        )
