"""Plotly figure helpers — HD PNG export, brand layout, reproducibility code.

Each ChartSpec carries a `plotly_spec` (`{"data": [...], "layout": {...}}`). This
module:
  - renders that spec to PNG bytes via kaleido at HD-print resolution (1600x900
    base, scale=2 → 3200x1800 effective);
  - merges brand layout + annotations (source, date, requesting-analyst badge);
  - persists rendered PNGs to .charts_cache/ so /charts/{id}.png can serve them;
  - generates an equivalent Python snippet (never executed) for reproducibility.
"""

from __future__ import annotations

import copy
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Any

import plotly.io as pio

logger = logging.getLogger("charts")

# Brand layout — overridden by anything the spec sets explicitly.
_BRAND_LAYOUT: dict[str, Any] = {
    "paper_bgcolor": "#0A0A0A",
    "plot_bgcolor": "#0A0A0A",
    "font": {"color": "#F5E6C8", "family": "Inter, system-ui, sans-serif", "size": 12},
    "title": {"font": {"color": "#F5E6C8", "size": 16}},
    "xaxis": {
        "gridcolor": "#1F1A0F",
        "linecolor": "#1F1A0F",
        "tickfont": {"color": "#8A7548"},
        "title": {"font": {"color": "#8A7548"}},
    },
    "yaxis": {
        "gridcolor": "#1F1A0F",
        "linecolor": "#1F1A0F",
        "tickfont": {"color": "#8A7548"},
        "title": {"font": {"color": "#8A7548"}},
    },
    "colorway": ["#C9A961", "#F5E6C8", "#A88B4A", "#EF4444", "#4ADE80"],
    "margin": {"l": 60, "r": 30, "t": 50, "b": 70},
}


# --- PNG cache -------------------------------------------------------------
# Lives at <project_root>/apps/api/.charts_cache/ (gitignored).
_CACHE_DIR = Path(__file__).resolve().parents[2] / ".charts_cache"


def charts_cache_dir() -> Path:
    _CACHE_DIR.mkdir(parents=True, exist_ok=True)
    return _CACHE_DIR


# --- Brand annotations -----------------------------------------------------
def brand_plotly_spec(
    spec: dict | None,
    *,
    title: str,
    requested_by: str,
    source: str = "Polygon.io, AA Research",
    rendered_at: datetime | None = None,
) -> dict:
    """Merge brand layout + source/date/analyst annotations into a Plotly spec."""
    if not spec or not isinstance(spec, dict):
        spec = {"data": [], "layout": {}}
    figure = {
        "data": spec.get("data", []),
        "layout": copy.deepcopy(_BRAND_LAYOUT),
    }
    # Layer the LLM's layout on top, then enforce branded title + annotations.
    layout = spec.get("layout") or {}
    figure["layout"].update(layout)
    if title:
        figure["layout"]["title"] = {
            **(figure["layout"].get("title") or {}),
            "text": title,
        }

    stamp = (rendered_at or datetime.utcnow()).strftime("%Y-%m-%d")
    annotations = list(figure["layout"].get("annotations") or [])
    annotations.extend(
        [
            {
                "text": f"Source: {source}",
                "xref": "paper",
                "yref": "paper",
                "x": 0,
                "y": -0.18,
                "xanchor": "left",
                "yanchor": "top",
                "showarrow": False,
                "font": {"color": "#8A7548", "size": 10},
            },
            {
                "text": f"{stamp} · {requested_by}",
                "xref": "paper",
                "yref": "paper",
                "x": 1,
                "y": -0.18,
                "xanchor": "right",
                "yanchor": "top",
                "showarrow": False,
                "font": {"color": "#8A7548", "size": 10},
            },
        ]
    )
    figure["layout"]["annotations"] = annotations
    return figure


# --- HD PNG export ---------------------------------------------------------
def plotly_to_png(
    plotly_spec: dict | None,
    *,
    width: int = 1600,   # HD base — scale doubles to 3200 native pixels
    height: int = 900,
    scale: int = 2,
) -> bytes | None:
    """Render a (branded) Plotly figure to PNG bytes. None on failure."""
    if not plotly_spec or not isinstance(plotly_spec, dict):
        return None
    try:
        return pio.to_image(plotly_spec, format="png", width=width, height=height, scale=scale)
    except Exception as exc:
        logger.warning("plotly_to_png failed: %s", exc)
        return None


def persist_png(chart_id: str, png_bytes: bytes) -> str:
    """Write PNG bytes to the cache dir; return the public URL path."""
    path = charts_cache_dir() / f"{chart_id}.png"
    path.write_bytes(png_bytes)
    return f"/charts/{chart_id}.png"


# --- Reproducibility -------------------------------------------------------
def spec_to_python_code(spec: dict) -> str:
    """Generate a self-contained Python snippet that recreates the figure.

    Never executed server-side — purely a reference for analysts who want to
    open the chart in a notebook.
    """
    try:
        spec_json = json.dumps(spec, indent=2)
    except (TypeError, ValueError):
        spec_json = "{}"
    return (
        "# Auto-generated by Armstrong Arikat Chart Specialist.\n"
        "# Reproduces the chart from the Plotly JSON spec.\n"
        "import json\n"
        "import plotly.graph_objects as go\n\n"
        "SPEC = json.loads(r'''" + spec_json + "''')\n\n"
        "fig = go.Figure(SPEC)\n"
        "fig.show()\n"
        "# Export HD PNG:\n"
        "# fig.write_image('chart.png', width=1600, height=900, scale=2)\n"
    )
