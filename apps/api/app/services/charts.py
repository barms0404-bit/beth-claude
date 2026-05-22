"""Plotly figure -> PNG bytes via kaleido. Used for HD chart embeds in email.

Each ChartSpec carries a `plotly_spec` ({"data": [...], "layout": {...}}). This
module renders that spec to a single PNG. Failures degrade to ``None`` so a bad
spec from the Chart Specialist never breaks the whole email.
"""

from __future__ import annotations

import logging
from typing import Any

import plotly.io as pio

logger = logging.getLogger("charts")

# Brand-aligned defaults — overridden by anything the spec sets explicitly.
_BRAND_LAYOUT: dict[str, Any] = {
    "paper_bgcolor": "#0A0A0A",
    "plot_bgcolor": "#0A0A0A",
    "font": {"color": "#F5E6C8", "family": "Inter, system-ui, sans-serif"},
    "xaxis": {"gridcolor": "#1F1A0F", "linecolor": "#1F1A0F", "tickfont": {"color": "#8A7548"}},
    "yaxis": {"gridcolor": "#1F1A0F", "linecolor": "#1F1A0F", "tickfont": {"color": "#8A7548"}},
    "margin": {"l": 40, "r": 20, "t": 30, "b": 40},
}


def plotly_to_png(
    plotly_spec: dict | None,
    *,
    width: int = 600,
    height: int = 360,
    scale: int = 2,  # 2x for HD on retina mail clients
) -> bytes | None:
    """Render a Plotly figure spec to PNG bytes. None on failure."""
    if not plotly_spec or not isinstance(plotly_spec, dict):
        return None
    try:
        figure = {
            "data": plotly_spec.get("data", []),
            "layout": {**_BRAND_LAYOUT, **(plotly_spec.get("layout") or {})},
        }
        return pio.to_image(figure, format="png", width=width, height=height, scale=scale)
    except Exception as exc:
        logger.warning("plotly_to_png failed: %s", exc)
        return None
