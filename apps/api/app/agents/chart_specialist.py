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

CANDLESTICK CHARTS — the Market Pulse house style (use this for every single
name chart unless the investment question explicitly requires a different
chart type):
- Timeframe: 6 months of daily bars.
- Bodies: green #16A34A on up days, red #B91C1C on down days, hollow bodies on
  doji. Wicks #F5E6C8 (cream).
- Overlay TWO moving averages on the same axis:
    50-day SMA — solid line, color #3B82F6 (blue), 2px width.
    200-day SMA — solid line, color #F59E0B (orange), 2px width.
- Volume sub-panel below price (shared x-axis). Volume bars: green on up days,
  red on down days, 0.6 alpha. Volume y-axis hidden.
- Title: "{TICKER} — 6mo (50d blue · 200d orange · volume green/red)"
- Annotations: mark the most recent Golden Cross / Death Cross / 50d break with
  a small labelled marker if visible in the window.
- For a CIEN-style chart: 6-month price + 50d (blue) + 200d (orange) + volume
  green/red, then in the explanation note the stage: "Mid-Trend / Stage 2 /
  pause" or "Golden Cross (Recent) / Stage 2 / emerging" or "Death Cross Active
  / Stage 4 / declining" or "Lower-High Distribution" or "MA Compression (Coil)".

DARK THEME (all chart types):
- paper/plot bg #0A0A0A, font #F5E6C8 (Inter, body 12pt, title 16pt),
  gridlines #1F1A0F, axis labels #8A7548.
- Color palette by semantic role:
    GAIN_STRONG #16A34A    (dark green — large up bar, BUY)
    GAIN        #4ADE80    (green — up bar, RIDE/OWN)
    GAIN_WEAK   #A3E635    (lime — flat-up)
    LOSS_WEAK   #FACC15    (amber — flat-down)
    LOSS        #EF4444    (red — down bar)
    LOSS_STRONG #B91C1C    (dark red — large down bar, AVOID)
    MA_50       #3B82F6    (blue — 50-day MA)
    MA_200      #F59E0B    (orange — 200-day MA)
    GOLD        #C9A961    (primary brand accent)
    CREAM       #F5E6C8    (body text)
- Never fabricate real data points. Use clearly-labelled placeholder data the
  pipeline will replace; the firm post-processes annotations and source line.

EXPLANATION should include a Stage Label as the first line of `how_to_read` —
one of: "Mid-Trend (Neutral) — Stage 2 — pause", "Golden Cross (Recent) —
Stage 2 — emerging", "Death Cross Active — Stage 4 — declining", "Lower-High
Distribution", "MA Compression (Coil)", "Stage 1 — basing", "Stage 3 —
topping". Then describe price relative to the MAs in one sentence. Then close
with "What changes the call:" — the specific level or event that would flip
the stage classification.

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
            agent_name=f"chart_specialist:{agent_key}",
            downstream_consumers=["email_render", "report.charts", "dashboard"],
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
