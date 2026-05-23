/**
 * Thin client for the FastAPI backend. Server Components call these directly;
 * client components poll via `usePolling`. Keep types in sync with
 * apps/api/app/schemas.py.
 */
const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export interface Recommendation {
  rank: number;
  symbol: string;
  name: string;
  price: number | null;
  dailyPct: number | null;
  ytdPct: number | null;
  conviction: number;
  thesis: string;
  leadSpecialist: string;
  lastUpdated: string;
}

export interface SpecialistNote {
  agentKey: string;
  agentName: string;
  commentary: string;
}

export interface TickerDetail {
  symbol: string;
  name: string;
  description: string;
  price: number | null;
  dailyPct: number | null;
  ytdPct: number | null;
  marketCap: number | null;
  employees: number | null;
  homepage: string | null;
  sector: string | null;
  listDate: string | null;
  notes: SpecialistNote[];
}

export interface PriceBar {
  date: string;
  close: number;
  volume: number;
}

export interface Top50Entry {
  rank: number;
  previous_rank: number | null;
  ticker: string;
  company_name: string;
  price: number | null;
  day_change_pct: number | null;
  ytd_change_pct: number | null;
  composite_score: number;
  lead_specialist: string;
  contributing_specialists: string[];
  thesis_summary: string;
  conviction_avg: number;
  time_horizon: string;
  // --- Specialist overlays (populated by the orchestrator) ---
  dividend_yield: number | null;        // Holloway, current yield %
  dividend_safety: number | null;       // Holloway, 1-10
  value_score: number | null;           // Whitlock, margin-of-safety %
  duration_sensitivity: "high" | "medium" | "low" | null;
}

export interface Top50Snapshot {
  snapshot_time: string;
  entries: Top50Entry[];
}

export interface ArchivedReport {
  slot: string;
  date: string;
  generated_at: string;
  url: string;
}

export type ClaimType =
  | "earnings"
  | "guidance"
  | "analyst_rating"
  | "patent"
  | "regulatory"
  | "ma"
  | "insider"
  | "institutional"
  | "industry"
  | "other";

export type VerificationStatus =
  | "verified"
  | "discrepancy"
  | "unverified"
  | "source_unavailable"
  | "skipped";

export type OverallVerification = "verified" | "caveat_required" | "skipped";

export interface ClaimVerification {
  claim_text: string;
  claim_type: ClaimType;
  status: VerificationStatus;
  primary_source_url: string | null;
  exact_quote: string | null;
  verification_timestamp: string;
  discrepancies_found: string | null;
  notes: string;
}

export interface RecommendationVerification {
  agent_key: string;
  persona: string;
  ticker: string;
  conviction_1_10: number;
  thesis: string;
  overall: OverallVerification;
  claims: ClaimVerification[];
  verified_at: string;
}

export interface ReportSummary {
  id: string;
  slot: "market_prep" | "mid_day" | "market_close";
  title: string;
  generatedAt: string;
}

export interface IndexQuote {
  label: string;
  symbol: string;
  price: number | null;
  changePct: number | null;
}

export interface NewsItem {
  title: string;
  url: string;
  publisher: string;
  publishedAt: string | null;
  summary: string;
}

export interface ActivityItem {
  persona: string;
  agentKey: string;
  slot: "market_prep" | "mid_day" | "market_close";
  keyTakeaway: string;
  timestamp: string;
}

export interface ChartExplanation {
  why_this_chart: string;
  how_to_read: string;
  key_takeaway: string;
}

export interface ChartSpec {
  chart_id: string;
  chart_type: string;
  title: string;
  recharts_spec: Record<string, unknown>;
  plotly_spec: Record<string, unknown>;
  plotly_python_code: string;
  explanation: ChartExplanation;
  png_url: string | null;
  requested_by: string;
  agent_key: string;
  source: string;
  rendered_at: string;
}

export interface ReportFull {
  slot: "market_prep" | "mid_day" | "market_close";
  title: string;
  summary: string;
  recommendations: Recommendation[];
  charts: ChartSpec[];
  disclaimer: string;
  generated_at: string;
}

/** Server-side fetch with a short ISR window. */
async function getJson<T>(path: string, revalidate = 60): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { next: { revalidate } });
  if (!res.ok) throw new Error(`API ${path} -> ${res.status}`);
  return res.json() as Promise<T>;
}

/** Browser-side fetch — used by the polling hook. Absolute URL to the API. */
export function apiUrl(path: string): string {
  return `${BASE}${path}`;
}

// ---- Healthcare Command Center types ----------------------------------
export type CatalystType =
  | "phase_1_data" | "phase_2_data" | "phase_3_data"
  | "interim_analysis" | "pdufa" | "adcomm" | "filing"
  | "approval" | "launch" | "conference";

export type AsymmetryScore = "favorable" | "neutral" | "unfavorable";
export type CatalystStatus = "upcoming" | "occurred" | "postponed";
export type ReviewType = "standard" | "priority" | "breakthrough" | "accelerated";
export type PDUFAStatus = "upcoming" | "approved" | "crl" | "withdrawn" | "delayed";
export type PipelinePhase =
  | "preclinical" | "phase_1" | "phase_2" | "phase_3" | "filed" | "approved";
export type HealthcareSpecialistOwner = "biotech_smid" | "big_pharma" | "healthcare_tools";

export interface ClinicalCatalyst {
  id?: string;
  ticker: string;
  company_name?: string | null;
  drug_name: string;
  indication?: string | null;
  catalyst_type: CatalystType;
  catalyst_date?: string | null;
  catalyst_date_estimate_range?: string | null;
  probability_of_success?: number | null;
  our_view?: string | null;
  expected_stock_move_pct?: number | null;
  asymmetry_score?: AsymmetryScore | null;
  position_recommendation?: string | null;
  related_companies?: string[];
  status: CatalystStatus;
  result?: string | null;
  result_stock_move_pct?: number | null;
}

export interface PDUFAEntry {
  id?: string;
  ticker: string;
  drug_name: string;
  indication?: string | null;
  pdufa_date: string;
  review_type?: ReviewType | null;
  advisory_committee_meeting: boolean;
  adcomm_date?: string | null;
  approval_probability?: number | null;
  our_view?: string | null;
  commercial_potential_peak_sales_estimate?: number | null;
  status: PDUFAStatus;
  outcome?: string | null;
}

export interface GLP1Snapshot {
  id?: string;
  snapshot_date: string;
  lly_revenue_qoq?: number | null;
  nvo_revenue_qoq?: number | null;
  lly_market_share?: number | null;
  nvo_market_share?: number | null;
  weekly_prescriptions_us?: number | null;
  weekly_new_starts?: number | null;
  manufacturing_capacity_estimate?: string | null;
  pricing_trend_commentary?: string | null;
  insurance_coverage_pct?: number | null;
  recent_indication_expansions?: string[];
  competitive_pipeline_updates?: string | null;
  cross_sector_impact_observations?: string | null;
}

export interface PipelineAsset {
  id?: string;
  ticker: string;
  asset_name: string;
  mechanism?: string | null;
  indication?: string | null;
  therapeutic_area?: string | null;
  current_phase: PipelinePhase;
  probability_of_success?: number | null;
  peak_sales_estimate?: number | null;
  next_catalyst?: string | null;
  next_catalyst_date?: string | null;
  rnpv_estimate?: number | null;
  specialist_owner?: HealthcareSpecialistOwner | null;
}

export interface PatentCliffEntry {
  id?: string;
  ticker: string;
  drug_name: string;
  current_annual_revenue?: number | null;
  composition_patent_expiration?: string | null;
  estimated_loe_date?: string | null;
  biosimilar_or_generic?: "biosimilar" | "generic" | "both" | null;
  expected_first_competitor_date?: string | null;
  modeled_revenue_year_1?: number | null;
  modeled_revenue_year_2?: number | null;
  modeled_revenue_year_3?: number | null;
  mitigation_strategy?: string | null;
}

export interface HealthcareLanding {
  next_catalysts: ClinicalCatalyst[];
  next_pdufas: PDUFAEntry[];
  latest_glp1: GLP1Snapshot | null;
  high_pos_pipeline: PipelineAsset[];
  near_loe_drugs: PatentCliffEntry[];
}

export const api = {
  topRecommendations: () => getJson<Recommendation[]>("/api/recommendations/top"),
  ticker: (symbol: string) => getJson<TickerDetail>(`/api/tickers/${symbol}`),
  tickerNews: (symbol: string) => getJson<NewsItem[]>(`/api/tickers/${symbol}/news`),
  tickerHistory: (symbol: string) =>
    getJson<PriceBar[]>(`/api/tickers/${symbol}/history`, 300),
  reports: () => getJson<ReportSummary[]>("/api/reports"),
  latestReport: () => getJson<ReportFull | null>("/api/reports/latest", 120),
  top50: () => getJson<Top50Snapshot>("/api/top-50", 15),
  marketSnapshot: () => getJson<IndexQuote[]>("/api/market/snapshot", 15),
  activity: () => getJson<ActivityItem[]>("/api/activity", 30),
  reportArchive: () => getJson<ArchivedReport[]>("/api/reports/archive", 60),
  tickerVerifications: (symbol: string) =>
    getJson<RecommendationVerification[]>(`/api/verifications/${symbol}`, 60),

  // Healthcare Command Center
  healthcareLanding: () => getJson<HealthcareLanding>("/api/healthcare", 60),
  clinicalCatalysts: (status: CatalystStatus = "upcoming") =>
    getJson<ClinicalCatalyst[]>(`/api/healthcare/clinical-catalysts?status=${status}`, 120),
  pdufas: (status: PDUFAStatus = "upcoming") =>
    getJson<PDUFAEntry[]>(`/api/healthcare/pdufas?status=${status}`, 120),
  glp1Latest: () => getJson<GLP1Snapshot | null>("/api/healthcare/glp1/latest", 120),
  glp1History: (limit = 52) =>
    getJson<GLP1Snapshot[]>(`/api/healthcare/glp1/history?limit=${limit}`, 120),
  pipeline: (params?: {
    specialist_owner?: HealthcareSpecialistOwner;
    phase?: PipelinePhase;
    min_pos?: number;
    ticker?: string;
  }) => {
    const q = new URLSearchParams();
    if (params?.specialist_owner) q.set("specialist_owner", params.specialist_owner);
    if (params?.phase) q.set("phase", params.phase);
    if (params?.min_pos !== undefined) q.set("min_pos", String(params.min_pos));
    if (params?.ticker) q.set("ticker", params.ticker);
    const qs = q.toString();
    return getJson<PipelineAsset[]>(
      `/api/healthcare/pipeline${qs ? `?${qs}` : ""}`,
      120,
    );
  },
  patentCliffs: (ticker?: string) => {
    const qs = ticker ? `?ticker=${encodeURIComponent(ticker)}` : "";
    return getJson<PatentCliffEntry[]>(`/api/healthcare/patent-cliffs${qs}`, 120);
  },
};
