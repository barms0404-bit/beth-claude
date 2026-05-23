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
};
