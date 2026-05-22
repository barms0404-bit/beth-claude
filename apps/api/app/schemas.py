"""Pydantic models — API contracts and inter-agent payloads.

Two model families live here:
  - Inter-agent payloads — the canonical specialist contract (see docs/AGENTS.md).
  - API-facing models — mirror apps/web/lib/api.ts; keep the two in sync.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


# --------------------------------------------------------------------------
# Enums
# --------------------------------------------------------------------------
class ReportSlot(str, Enum):
    market_prep = "market_prep"   # 7:30 AM AZ
    mid_day = "mid_day"           # 11:00 AM AZ
    market_close = "market_close" # 1:30 PM AZ


# --------------------------------------------------------------------------
# Inter-agent payloads — the canonical specialist contract
# --------------------------------------------------------------------------
class CoveredName(BaseModel):
    """Commentary on a name already in the specialist's coverage universe."""

    ticker: str
    move_pct: float | None = None
    narrative: str
    action: str = Field(description="hold | add | trim | buy | sell | watch")


class NewIdea(BaseModel):
    """A name the specialist is surfacing for the Top 50."""

    ticker: str
    thesis: str
    conviction_1_10: int = Field(ge=1, le=10)
    time_horizon: str = Field(description="e.g. '2-6 weeks', '6-12 months'")
    key_risk: str


class ChartRequest(BaseModel):
    """A specialist asks the Chart Specialist sub-agent for one visual."""

    chart_type: str
    data_needed: str
    why_this_chart: str


class SpecialistReport(BaseModel):
    """Structured result of one specialist run — the canonical contract Beth expects."""

    specialist: str            # human persona name, e.g. "Marcus Webb"
    agent_key: str             # stable registry key, e.g. "midday_tactical"
    timestamp: datetime
    key_takeaway: str
    covered_names_commentary: list[CoveredName] = []
    new_ideas: list[NewIdea] = []
    chart_request: ChartRequest | None = None
    risk_flags: list[str] = []
    compliance_notes: list[str] = []


class ChartSpec(BaseModel):
    """Chart Specialist output — interactive + email-export specs plus explainer."""

    title: str
    chart_explanation: str             # 2-3 paragraphs: why it matters / how to read it
    recharts_spec: dict = {}           # interactive web version
    plotly_spec: dict = {}             # HD PNG export for email reports
    png_url: str | None = None
    requested_by: str                  # persona name of the requesting specialist
    agent_key: str


# --------------------------------------------------------------------------
# API-facing models (mirror apps/web/lib/api.ts)
# --------------------------------------------------------------------------
class Recommendation(BaseModel):
    rank: int
    symbol: str
    name: str
    price: float | None = None
    dailyPct: float | None = None
    ytdPct: float | None = None
    thesis: str
    leadSpecialist: str                # human persona name


class SpecialistNote(BaseModel):
    agentKey: str
    agentName: str
    commentary: str


class TickerDetail(BaseModel):
    symbol: str
    name: str
    description: str
    price: float | None = None
    dailyPct: float | None = None
    ytdPct: float | None = None
    notes: list[SpecialistNote] = []


class ReportSummary(BaseModel):
    id: str
    slot: ReportSlot
    title: str
    generatedAt: datetime


class GenerateReportRequest(BaseModel):
    slot: ReportSlot
    dry_run: bool = False


class Report(BaseModel):
    """Beth's aggregated output for one research window."""

    slot: ReportSlot
    title: str
    summary: str
    recommendations: list[Recommendation] = []
    charts: list[ChartSpec] = []
    specialist_reports: list[SpecialistReport] = []  # raw filings, retained for drill-down
    disclaimer: str
    generated_at: datetime
