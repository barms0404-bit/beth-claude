/**
 * Supabase Client — Performance Tracking via Supabase Realtime
 * Replaces local DB for performance data, enables real-time subscriptions
 */

const SUPABASE_URL = "https://aufdpgioooxbujzrxacv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1ZmRwZ2lvb294YnVqenJ4YWN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NDYxNjcsImV4cCI6MjA5NTEyMjE2N30.svfu2nTHxl4J200gok29DqjAGvPn3ax-mVdQbWVBPSo";

async function supabaseRequest(path: string, options: RequestInit = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      "Prefer": options.method === "POST" ? "return=representation" : "return=minimal",
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const err = await response.text();
    console.error(`[Supabase] ${path} error:`, err);
    return null;
  }
  
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

// --- Recommendations ---

export async function logRecommendationSupabase(rec: {
  specialist_slug: string;
  specialist_name: string;
  ticker: string;
  action: string;
  conviction: number;
  price_at_rec: number;
  price_target?: string;
  time_horizon?: string;
  thesis?: string;
}) {
  return await supabaseRequest("recommendations", {
    method: "POST",
    body: JSON.stringify({ ...rec, status: "active" }),
  });
}

export async function closeRecommendationSupabase(id: number, currentPrice: number, originalPrice: number, action: string) {
  const returnPct = ((currentPrice - originalPrice) / originalPrice) * 100;
  const isHit = (action.includes("BUY") && returnPct > 0) || (action === "SELL" && returnPct < 0);

  return await supabaseRequest(`recommendations?id=eq.${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      status: isHit ? "hit" : "miss",
      price_at_close: currentPrice,
      return_pct: Math.round(returnPct * 100) / 100,
      closed_at: new Date().toISOString(),
    }),
  });
}

export async function getActiveRecommendationsSupabase() {
  return await supabaseRequest("recommendations?status=eq.active&order=created_at.desc&limit=50");
}

export async function getAllRecommendationsSupabase() {
  return await supabaseRequest("recommendations?order=created_at.desc&limit=100");
}

// --- Specialist Performance ---

export async function upsertSpecialistPerformance(stats: {
  specialist_slug: string;
  specialist_name: string;
  total_recs: number;
  hits: number;
  misses: number;
  hit_rate: number;
  avg_return: number;
  best_return: number;
  worst_return: number;
  weight: number;
}) {
  return await supabaseRequest("specialist_performance", {
    method: "POST",
    headers: { "Prefer": "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify({ ...stats, last_updated: new Date().toISOString() }),
  });
}

export async function getSpecialistPerformanceSupabase() {
  return await supabaseRequest("specialist_performance?order=hit_rate.desc");
}

// --- Agent Runs ---

export async function logAgentRunSupabase(run: {
  specialist_slug: string;
  specialist_name: string;
  run_type: string;
  status: string;
  duration_ms?: number;
  tokens_used?: number;
  research_preview?: string;
  model_used?: string;
}) {
  return await supabaseRequest("agent_runs", {
    method: "POST",
    body: JSON.stringify(run),
  });
}

export async function getRecentRunsSupabase(limit = 20) {
  return await supabaseRequest(`agent_runs?order=created_at.desc&limit=${limit}`);
}

// Export Supabase config for frontend real-time subscriptions
export const SUPABASE_CONFIG = {
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY,
};
