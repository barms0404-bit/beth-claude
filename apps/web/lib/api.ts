/**
 * Thin client for the FastAPI backend. Server Components call these directly;
 * keep return types in sync with apps/api/app/schemas.py.
 */
const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export interface Recommendation {
  rank: number;
  symbol: string;
  name: string;
  price: number | null;
  dailyPct: number | null;
  ytdPct: number | null;
  thesis: string;
  leadSpecialist: string;
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
  notes: SpecialistNote[];
}

export interface ReportSummary {
  id: string;
  slot: "market_prep" | "mid_day" | "market_close";
  title: string;
  generatedAt: string;
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`API ${path} -> ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  topRecommendations: () => getJson<Recommendation[]>("/api/recommendations/top"),
  ticker: (symbol: string) => getJson<TickerDetail>(`/api/tickers/${symbol}`),
  reports: () => getJson<ReportSummary[]>("/api/reports"),
};
