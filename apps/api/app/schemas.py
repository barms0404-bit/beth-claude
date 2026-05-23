"""Pydantic models — API contracts and inter-agent payloads.

Two model families live here:
  - Inter-agent payloads — the canonical specialist contract (see docs/AGENTS.md).
  - API-facing models — mirror apps/web/lib/api.ts; keep the two in sync.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from enum import Enum

from pydantic import BaseModel, Field, model_validator


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


class PriceScenario(BaseModel):
    """One leg of a three-scenario probabilistic forecast."""

    price: float
    scenario: str               # what has to be TRUE for this price to print


class ProbabilisticForecast(BaseModel):
    """Three-scenario forecast replacing single-point price targets.

    Probability weights are FIXED 25 / 50 / 25; specialists vary prices and
    scenario narratives. `expected_value` is computed server-side from the
    three prices — specialists do NOT emit it.
    """

    bear_case_25pct: PriceScenario
    base_case_50pct: PriceScenario
    bull_case_25pct: PriceScenario
    probability_thesis_correct: float = Field(ge=0.0, le=1.0)
    expected_value: float = 0.0     # computed below; ignored on input
    key_uncertainties: list[str] = []

    @model_validator(mode="after")
    def _compute_expected_value(self) -> "ProbabilisticForecast":
        self.expected_value = round(
            0.25 * self.bear_case_25pct.price
            + 0.50 * self.base_case_50pct.price
            + 0.25 * self.bull_case_25pct.price,
            4,
        )
        return self


class VariantPerception(str, Enum):
    consensus = "consensus"        # team thesis matches the street consensus
    variant = "variant"            # team has a differentiated angle, not opposite
    contrarian = "contrarian"      # team takes the opposite side of consensus


class MarketPositioning(BaseModel):
    """The team's read on the trade's positioning + edge.

    `consensus_target` and `crowding_score` are SPECIALIST ESTIMATES today —
    a real positioning feed (13F concentration + options skew) and an analyst-
    estimate aggregator are not yet wired. Strict citation mode still applies.
    """

    variant_perception: VariantPerception
    crowding_score: int = Field(ge=1, le=10, description="1 untouched ... 10 maximally crowded long")
    evidence_strength: int = Field(ge=1, le=10, description="1 weak ... 10 ironclad")
    consensus_target: float | None = None       # 12m street PT, specialist estimate
    consensus_target_vs_team_target_pct: float | None = None  # computed server-side
    notes: str = ""


class NewIdea(BaseModel):
    """A name the specialist is surfacing for the Top 50."""

    ticker: str
    thesis: str
    conviction_1_10: int = Field(ge=1, le=10)
    time_horizon: str = Field(description="e.g. '2-6 weeks', '6-12 months'")
    key_risk: str
    # Probabilistic forecast — required by the OUTPUT_CONTRACT but optional
    # in schema so binary/event-driven trades (where a distribution is wrong)
    # can set forecast=null and explain in the thesis.
    forecast: ProbabilisticForecast | None = None
    # Variant perception + crowding + evidence strength. Mandated by OUTPUT_CONTRACT
    # for every new_idea; optional in schema so the orchestrator can detect-and-drop
    # contrarian+weak picks before engine ingest.
    market_positioning: MarketPositioning | None = None


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


class ChartExplanation(BaseModel):
    """Three-part plain-English caption — required on every ChartSpec."""

    why_this_chart: str        # 1-2 sentences — what investment question it answers
    how_to_read: str           # 2-3 sentences — axes, key markers, good vs bad
    key_takeaway: str          # 1 sentence — the actionable insight


class ChartSpec(BaseModel):
    """Chart Specialist output — two render specs + structured explainer + PNG."""

    chart_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    chart_type: str                    # candlestick | line | bar | scatter | heatmap | treemap | sankey | area
    title: str
    recharts_spec: dict = {}           # interactive web version
    plotly_spec: dict = {}             # what kaleido renders for the email PNG
    plotly_python_code: str = ""       # documentation — equivalent Python, never exec'd
    explanation: ChartExplanation
    png_url: str | None = None
    requested_by: str                  # human persona of the requesting analyst (parent)
    agent_key: str                     # registry key of the requesting analyst
    source: str = "Polygon.io, AA Research"
    rendered_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


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
    conviction: int = Field(ge=1, le=10)
    thesis: str
    leadSpecialist: str                # human persona name
    lastUpdated: datetime


class IndexQuote(BaseModel):
    """One Row-1 market-snapshot tile."""

    label: str                          # display label, e.g. "S&P 500"
    symbol: str                         # display symbol, e.g. "SPY"
    price: float | None = None
    changePct: float | None = None


class NewsItem(BaseModel):
    title: str
    url: str
    publisher: str = ""
    publishedAt: datetime | None = None
    summary: str = ""


class ActivityItem(BaseModel):
    """One entry in the specialist activity feed."""

    persona: str
    agentKey: str
    slot: ReportSlot
    keyTakeaway: str
    timestamp: datetime


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
    marketCap: float | None = None
    employees: int | None = None
    homepage: str | None = None
    sector: str | None = None
    listDate: str | None = None
    notes: list[SpecialistNote] = []


class PriceBar(BaseModel):
    date: str        # YYYY-MM-DD
    close: float
    volume: int


class Top50Entry(BaseModel):
    """One row of the live Top 50 ranking — mirrors the top_50_snapshots table."""

    rank: int
    previous_rank: int | None = None     # None => new entry this cycle
    ticker: str
    company_name: str
    price: float | None = None
    day_change_pct: float | None = None
    ytd_change_pct: float | None = None
    composite_score: float
    lead_specialist: str
    contributing_specialists: list[str] = []
    thesis_summary: str
    conviction_avg: float
    time_horizon: str
    # --- Specialist overlays (populated by the orchestrator post-rebuild) ---
    dividend_yield: float | None = None        # Holloway, current yield %
    dividend_safety: int | None = None         # Holloway, 1-10
    value_score: float | None = None           # Whitlock, margin-of-safety %
    duration_sensitivity: str | None = None    # "high" | "medium" | "low" (sector-derived)


class Top50Snapshot(BaseModel):
    """A full ranking captured at one point in time."""

    snapshot_time: datetime
    entries: list[Top50Entry] = []


class ArchivedReport(BaseModel):
    """One archived report HTML on disk, surfaced to the dashboard."""

    slot: str             # e.g. 'market_prep'
    date: str             # YYYY-MM-DD folder name
    generated_at: datetime
    url: str              # static-mounted path, e.g. /reports/2026-05-22/market_prep.html


# --------------------------------------------------------------------------
# Primary Source Verification (PSV) — high-conviction recommendations only
# --------------------------------------------------------------------------
class ClaimType(str, Enum):
    earnings = "earnings"            # revenue / EPS / margin claims -> 10-K, 10-Q, 8-K
    guidance = "guidance"            # forward outlook -> press release, transcript
    analyst_rating = "analyst_rating"  # broker upgrade/downgrade
    patent = "patent"                # IP claim -> USPTO
    regulatory = "regulatory"        # FDA/FCC/FTC approval / action
    ma = "ma"                        # M&A -> 8-K, press release
    insider = "insider"              # insider trade -> Form 4
    institutional = "institutional"  # 13F position
    industry = "industry"            # industry stat -> trade association
    other = "other"


class VerificationStatus(str, Enum):
    verified = "verified"                # claim matches primary source quote
    discrepancy = "discrepancy"          # source contradicts the claim
    unverified = "unverified"            # source searched, claim not found
    source_unavailable = "source_unavailable"  # source category not reachable (paywalled / unstructured)
    skipped = "skipped"                  # PSV did not run (e.g. no Anthropic key)


class ClaimVerification(BaseModel):
    """Result of one verification pass against a primary source."""

    claim_text: str
    claim_type: ClaimType
    status: VerificationStatus
    primary_source_url: str | None = None
    exact_quote: str | None = None
    verification_timestamp: datetime
    discrepancies_found: str | None = None
    notes: str = ""


class OverallVerification(str, Enum):
    verified = "verified"               # all claims verified
    caveat_required = "caveat_required" # 1+ claims unverified / discrepant / unavailable
    skipped = "skipped"


# --------------------------------------------------------------------------
# Data Validation Agent — cross-source verified data packets
# --------------------------------------------------------------------------
class DataKind(str, Enum):
    equity_price = "equity_price"
    treasury_yield = "treasury_yield"
    fundamentals = "fundamentals"
    economic_data = "economic_data"


class ConfidenceStatus(str, Enum):
    verified = "verified"               # variance under threshold across >=2 sources
    flagged = "flagged"                 # variance over threshold but reconcilable
    excluded = "excluded"               # sources fundamentally disagree -> drop
    stale = "stale"                     # data exceeded the freshness window
    insufficient_sources = "insufficient_sources"  # <2 sources returned a value


class SourceReading(BaseModel):
    source: str                         # 'polygon' | 'yahoo' | 'fred' | 'treasury_gov' | 'bls'
    value: float | None = None
    fetched_at: datetime
    age_seconds: float | None = None
    error: str | None = None


class VerifiedDataPoint(BaseModel):
    """One field after cross-source validation. Specialists see only these."""

    field: str                          # e.g. 'AAPL.price', 'DGS10', 'CPIAUCSL'
    kind: DataKind
    value: float | None                 # reconciled value (mean / single source)
    confidence: float = Field(ge=0.0, le=1.0)
    status: ConfidenceStatus
    variance: float | None = None       # absolute (yields) or relative (others)
    threshold: float
    sources: list[SourceReading] = []
    verified_at: datetime
    notes: str = ""


class VerifiedDataPacket(BaseModel):
    """Bundle of validated points handed to a specialist or surfaced via API."""

    points: list[VerifiedDataPoint] = []
    verified_at: datetime
    overall_confidence: float = Field(ge=0.0, le=1.0)


# --------------------------------------------------------------------------
# Citation Enforcement Agent — breadth sweep on every specialist output
# --------------------------------------------------------------------------
class CitationRuling(str, Enum):
    verified = "verified"          # claim is accompanied by a citation tag
    distorted = "distorted"        # cited source exists but claim misrepresents it
    uncited = "uncited"            # factual claim without any citation tag
    fabricated = "fabricated"      # cited source does not contain the claim


class ClaimRuling(BaseModel):
    claim: str                     # short snippet of the claim
    sentence: str                  # full sentence containing the claim
    field_path: str                # e.g. 'key_takeaway' or 'new_ideas[2].thesis'
    ruling: CitationRuling
    cited_source: str | None = None
    action_taken: str              # 'passed_through' | 'marked_uncited' | 'stripped' | 'rewritten'
    notes: str = ""


class CitationReport(BaseModel):
    """Per-specialist enforcement output. Attached to every Report."""

    agent_key: str
    specialist: str                # persona name
    original_output_id: str        # uuid generated at enforcement time
    rulings: list[ClaimRuling] = []
    claims_total: int = 0
    verified_count: int = 0
    uncited_count: int = 0
    distorted_count: int = 0
    fabricated_count: int = 0
    hallucination_rate: float = 0.0   # (uncited + distorted + fabricated) / claims_total
    strict_mode: bool = False         # whether sanitization was applied to the SpecialistReport
    verified_at: datetime


# --------------------------------------------------------------------------
# specialist_recommendations — closed-loop trade tracking
# --------------------------------------------------------------------------
class RecommendationAction(str, Enum):
    long = "long"
    short = "short"
    avoid = "avoid"
    watch = "watch"


class SpecialistRecommendation(BaseModel):
    """One specialist's recommendation — lifecycle from filing to close.

    Written when a specialist files a `new_idea`; updated by the close
    endpoint when the trade exits. Drives per-specialist track records
    feeding the Top 50 engine's TRACK_RECORD map.
    """

    recommendation_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    agent_key: str
    specialist: str                                       # persona name
    ticker: str
    action: RecommendationAction = RecommendationAction.long
    conviction_1_10: int = Field(ge=1, le=10)
    time_horizon: str
    thesis_summary: str

    entry_price: float | None = None
    entry_timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    target_price: float | None = None
    stop_loss: float | None = None
    thesis_assumptions: list[str] = []
    catalyst_expected: str | None = None
    catalyst_date_estimate: str | None = None             # ISO date, free-form OK

    closed: bool = False
    exit_price: float | None = None
    exit_timestamp: datetime | None = None
    realized_return: float | None = None                  # percent
    vs_benchmark_return: float | None = None              # percent vs SPY (computed at close)
    hit_target: bool | None = None
    thesis_validated: bool | None = None
    post_mortem_notes: str | None = None

    # Variant perception + crowding + evidence (specialist-estimated today)
    variant_perception: VariantPerception | None = None
    crowding_score: int | None = Field(default=None, ge=1, le=10)
    evidence_strength: int | None = Field(default=None, ge=1, le=10)
    consensus_target: float | None = None
    consensus_target_vs_team_target_pct: float | None = None  # computed server-side


class CloseRecommendationRequest(BaseModel):
    """POST body to mark a SpecialistRecommendation closed."""

    exit_price: float
    exit_timestamp: datetime | None = None
    hit_target: bool | None = None
    thesis_validated: bool | None = None
    post_mortem_notes: str | None = None


# --------------------------------------------------------------------------
# Market Regime Detection Agent
# --------------------------------------------------------------------------
class VolatilityRegime(str, Enum):
    low = "low"             # VIX < 15
    normal = "normal"       # 15-20
    elevated = "elevated"   # 20-30
    crisis = "crisis"       # > 30


class RateRegime(str, Enum):
    easing = "easing"
    holding = "holding"
    hiking = "hiking"
    inverted = "inverted"   # curve inversion, independent of Fed direction


class CreditRegime(str, Enum):
    tight = "tight"
    normal = "normal"
    stressed = "stressed"
    crisis = "crisis"


class FactorRegime(str, Enum):
    growth_led = "growth_led"
    value_led = "value_led"
    quality_led = "quality_led"
    mixed = "mixed"


class BreadthRegime(str, Enum):
    broad_rally = "broad_rally"
    narrow_leadership = "narrow_leadership"
    broad_selloff = "broad_selloff"
    rotation = "rotation"


class LiquidityRegime(str, Enum):
    abundant = "abundant"
    normal = "normal"
    tightening = "tightening"
    stressed = "stressed"


class RegimeClassification(BaseModel):
    """One dimension's call — label, confidence, short rationale."""

    label: str
    confidence: float = Field(ge=0.0, le=1.0)
    rationale: str = ""


class RegimeSnapshot(BaseModel):
    """The morning regime read across all six dimensions."""

    classified_at: datetime
    volatility: RegimeClassification
    rate: RegimeClassification
    credit: RegimeClassification
    factor: RegimeClassification
    breadth: RegimeClassification
    liquidity: RegimeClassification
    historical_analogs: list[str] = []                # e.g. ["Q4 2018", "Q1 2016"]
    transition_probability_30d: float = Field(ge=0.0, le=1.0)
    specialist_weights: dict[str, float] = {}         # agent_key -> multiplier
    inputs: dict[str, float | None] = {}              # raw measurements snapshot
    notes: str = ""


# --------------------------------------------------------------------------
# Red Team Agent — adversarial critique of top recommendations
# --------------------------------------------------------------------------
class AssumptionCheck(BaseModel):
    """One assumption underlying a recommendation, scored for fragility."""

    assumption: str
    fragility: int = Field(ge=1, le=10)   # 1 = rock solid, 10 = most likely to break
    rationale: str = ""


class RedTeamCritique(BaseModel):
    """Adversarial critique of one Top 50 entry. Beth integrates into the report."""

    ticker: str
    lead_specialist: str
    conviction: float                       # the entry's conviction_avg
    steelman_bear: str                      # strongest argument against
    consensus_pricing: str                  # what's already priced in
    cognitive_biases: list[str] = []        # recency / confirmation / narrative / anchoring / survivorship
    logical_errors: list[str] = []          # correlation/causation, selection, time-period gaming, apples/oranges
    assumptions: list[AssumptionCheck] = []
    position_sizing_view: str = ""          # is the implied size justified?
    max_drawdown_estimate: str = ""         # downside if thesis breaks
    risk_reward_symmetry: str = ""          # "asymmetric" | "symmetric"
    kill_shot: str = ""                     # the one piece of evidence that would prove it wrong
    bear_stronger_than_bull: bool = False   # the explicit override flag
    overall_verdict: str = ""               # one-line takeaway
    critiqued_at: datetime


class RecommendationVerification(BaseModel):
    """One high-conviction `new_idea` after PSV. Keyed by (agent_key, ticker)."""

    agent_key: str
    persona: str
    ticker: str
    conviction_1_10: int
    thesis: str
    overall: OverallVerification
    claims: list[ClaimVerification] = []
    verified_at: datetime


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
    verifications: list["RecommendationVerification"] = []  # PSV results, conviction>=8 only
    citation_reports: list[CitationReport] = []     # breadth-sweep citation enforcement
    red_team_critiques: list[RedTeamCritique] = []  # adversarial review of top conviction picks
    lead_specialist_key: str | None = None          # e.g. 'fixed_income' on FOMC/CPI/NFP
    bear_case_addendum: SpecialistReport | None = None  # focused contrarian pass by value_investor
    macro_event: str | None = None                  # 'FOMC' | 'CPI' | 'NFP' | None
    disclaimer: str
    generated_at: datetime
