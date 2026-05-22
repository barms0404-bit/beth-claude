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

export interface ChartSpec {
  title: string;
  chart_explanation: string;
  recharts_spec: Record<string, unknown>;
  plotly_spec: Record<string, unknown>;
  png_url: string | null;
  requested_by: string;
  agent_key: string;
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
  marketSnapshot: () => getJson<IndexQuote[]>("/api/market/snapshot", 15),
  activity: () => getJson<ActivityItem[]>("/api/activity", 30),
};
