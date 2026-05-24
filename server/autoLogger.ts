/**
 * Auto-Logger — Parses AI research output and automatically logs recommendations
 * Also provides conviction calibration and earnings calendar
 */

import { getStockQuote } from "./marketData";
import { logRecommendationSupabase } from "./supabaseClient";

// ═══════════════════════════════════════════════════════════════════════════════
// 1. AUTO-LOG RECOMMENDATIONS FROM AI OUTPUT
// Parses specialist research text and extracts actionable recommendations
// ═══════════════════════════════════════════════════════════════════════════════

interface ParsedRecommendation {
  ticker: string;
  action: string;
  conviction: number;
  priceTarget?: string;
  timeHorizon?: string;
  thesis?: string;
}

export function parseRecommendationsFromResearch(research: string): ParsedRecommendation[] {
  const recs: ParsedRecommendation[] = [];

  // Pattern 1: "TOP RECOMMENDATION" section format
  const topRecMatch = research.match(/TOP RECOMMENDATION[:\s]*([A-Z]{1,5})[,\s]*(?:conviction[:\s]*)?(\d+)\/10[,\s]*(STRONG BUY|BUY|HOLD|SELL|SPECULATIVE|ACCUMULATE|CAUTION|BARBELL|MONITOR)/i);
  if (topRecMatch) {
    recs.push({
      ticker: topRecMatch[1],
      conviction: parseInt(topRecMatch[2]),
      action: topRecMatch[3].toUpperCase(),
    });
  }

  // Pattern 2: Look for "conviction X" near ticker symbols
  const convictionPattern = /\b([A-Z]{2,5})\b[^.]*?(?:conviction|conv)[:\s]*(\d+)(?:\/10)?[^.]*?(STRONG BUY|BUY|HOLD|SELL|SPECULATIVE|ACCUMULATE)/gi;
  let match;
  while ((match = convictionPattern.exec(research)) !== null) {
    const ticker = match[1];
    if (!["THE", "FOR", "AND", "BUT", "NOT", "ARE", "HAS", "WAS", "ALL", "CAN", "MAY"].includes(ticker)) {
      if (!recs.find(r => r.ticker === ticker)) {
        recs.push({
          ticker,
          conviction: parseInt(match[2]),
          action: match[3].toUpperCase(),
        });
      }
    }
  }

  // Pattern 3: Look for price targets
  const targetPattern = /\b([A-Z]{2,5})\b[^.]*?(?:target|price target)[:\s]*\$?([\d,]+(?:\.\d+)?(?:\s*-\s*\$?[\d,]+(?:\.\d+)?)?)/gi;
  while ((match = targetPattern.exec(research)) !== null) {
    const existing = recs.find(r => r.ticker === match![1]);
    if (existing) {
      existing.priceTarget = `$${match[2]}`;
    }
  }

  // Pattern 4: Look for time horizons
  const horizonPattern = /\b([A-Z]{2,5})\b[^.]*?(?:time horizon|horizon|timeframe)[:\s]*([\d]+-?\d*\s*(?:month|months|year|years|weeks|days))/gi;
  while ((match = horizonPattern.exec(research)) !== null) {
    const existing = recs.find(r => r.ticker === match![1]);
    if (existing) {
      existing.timeHorizon = match[2];
    }
  }

  return recs;
}

export async function autoLogFromResearch(
  specialistSlug: string,
  specialistName: string,
  research: string
): Promise<number> {
  const parsed = parseRecommendationsFromResearch(research);
  let logged = 0;

  for (const rec of parsed) {
    try {
      // Get current price for the ticker
      const quote = await getStockQuote(rec.ticker);
      if (!quote) continue;

      await logRecommendationSupabase({
        specialist_slug: specialistSlug,
        specialist_name: specialistName,
        ticker: rec.ticker,
        action: rec.action,
        conviction: rec.conviction,
        price_at_rec: quote.price,
        price_target: rec.priceTarget,
        time_horizon: rec.timeHorizon,
        thesis: rec.thesis || research.slice(0, 300),
      });
      logged++;
    } catch (e) {
      console.warn(`[AutoLog] Failed to log ${rec.ticker}:`, e);
    }
  }

  return logged;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. CONVICTION CALIBRATION
// Analyzes relationship between conviction scores and actual outcomes
// ═══════════════════════════════════════════════════════════════════════════════

const SUPABASE_URL = "https://aufdpgioooxbujzrxacv.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1ZmRwZ2lvb294YnVqenJ4YWN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NDYxNjcsImV4cCI6MjA5NTEyMjE2N30.svfu2nTHxl4J200gok29DqjAGvPn3ax-mVdQbWVBPSo";

async function supabaseGet(path: string) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` },
  });
  if (!resp.ok) return null;
  return await resp.json();
}

export interface CalibrationData {
  specialist_slug: string;
  specialist_name: string;
  conviction_level: number;
  total_at_level: number;
  hits_at_level: number;
  hit_rate_at_level: number;
  avg_return_at_level: number;
  calibration_gap: number; // Difference between expected (conviction/10) and actual hit rate
}

export async function getConvictionCalibration(slug?: string): Promise<CalibrationData[]> {
  const filter = slug ? `&specialist_slug=eq.${slug}` : "";
  const closedRecs = await supabaseGet(`recommendations?status=in.(hit,miss)${filter}&order=created_at.desc`);
  if (!closedRecs || closedRecs.length === 0) return [];

  // Group by specialist + conviction level
  const groups: Record<string, { hits: number; total: number; returns: number[]; name: string; slug: string; conviction: number }> = {};

  for (const rec of closedRecs) {
    const key = `${rec.specialist_slug}-${rec.conviction}`;
    if (!groups[key]) {
      groups[key] = { hits: 0, total: 0, returns: [], name: rec.specialist_name, slug: rec.specialist_slug, conviction: rec.conviction };
    }
    groups[key].total++;
    if (rec.status === "hit") groups[key].hits++;
    if (rec.return_pct !== null) groups[key].returns.push(rec.return_pct);
  }

  return Object.values(groups).map(g => ({
    specialist_slug: g.slug,
    specialist_name: g.name,
    conviction_level: g.conviction,
    total_at_level: g.total,
    hits_at_level: g.hits,
    hit_rate_at_level: g.total > 0 ? Math.round((g.hits / g.total) * 100) / 100 : 0,
    avg_return_at_level: g.returns.length > 0 ? Math.round((g.returns.reduce((a, b) => a + b, 0) / g.returns.length) * 100) / 100 : 0,
    calibration_gap: Math.round(((g.total > 0 ? g.hits / g.total : 0) - (g.conviction / 10)) * 100) / 100,
  })).sort((a, b) => b.conviction_level - a.conviction_level);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. EARNINGS CALENDAR
// Tracks upcoming earnings for covered stocks and flags them in research
// ═══════════════════════════════════════════════════════════════════════════════

interface EarningsEvent {
  ticker: string;
  company: string;
  date: string;
  daysUntil: number;
  estimate?: string;
}

// Earnings dates for major covered stocks (updated periodically)
// In production, this would pull from Alpha Vantage EARNINGS_CALENDAR endpoint
const KNOWN_EARNINGS: Record<string, { date: string; company: string }> = {
  NVDA: { date: "2026-05-28", company: "NVIDIA" },
  CRM: { date: "2026-05-28", company: "Salesforce" },
  DELL: { date: "2026-05-29", company: "Dell Technologies" },
  COST: { date: "2026-05-29", company: "Costco" },
  AVGO: { date: "2026-06-12", company: "Broadcom" },
  ORCL: { date: "2026-06-12", company: "Oracle" },
  ADBE: { date: "2026-06-12", company: "Adobe" },
};

export async function getUpcomingEarnings(tickers?: string[]): Promise<EarningsEvent[]> {
  const now = new Date();
  const events: EarningsEvent[] = [];

  // Check Alpha Vantage for earnings calendar if key available
  const avKey = process.env.ALPHA_VANTAGE_KEY;
  if (avKey && tickers) {
    for (const ticker of tickers.slice(0, 3)) {
      try {
        const resp = await fetch(`https://www.alphavantage.co/query?function=EARNINGS&symbol=${ticker}&apikey=${avKey}`);
        if (resp.ok) {
          const data = await resp.json();
          if (data.quarterlyEarnings && data.quarterlyEarnings[0]) {
            const nextEarnings = data.quarterlyEarnings[0];
            if (nextEarnings.reportedDate) {
              const earningsDate = new Date(nextEarnings.reportedDate);
              const daysUntil = Math.round((earningsDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              if (daysUntil >= -7 && daysUntil <= 30) {
                events.push({
                  ticker,
                  company: ticker,
                  date: nextEarnings.reportedDate,
                  daysUntil,
                  estimate: nextEarnings.estimatedEPS ? `EPS est: $${nextEarnings.estimatedEPS}` : undefined,
                });
              }
            }
          }
        }
      } catch { /* skip */ }
    }
  }

  // Supplement with known earnings dates
  for (const [ticker, info] of Object.entries(KNOWN_EARNINGS)) {
    if (tickers && !tickers.includes(ticker)) continue;
    const earningsDate = new Date(info.date);
    const daysUntil = Math.round((earningsDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntil >= -3 && daysUntil <= 14 && !events.find(e => e.ticker === ticker)) {
      events.push({ ticker, company: info.company, date: info.date, daysUntil });
    }
  }

  return events.sort((a, b) => a.daysUntil - b.daysUntil);
}

export function getEarningsWarning(tickers: string[]): string {
  const now = new Date();
  const warnings: string[] = [];

  for (const [ticker, info] of Object.entries(KNOWN_EARNINGS)) {
    if (!tickers.includes(ticker)) continue;
    const earningsDate = new Date(info.date);
    const daysUntil = Math.round((earningsDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntil >= 0 && daysUntil <= 7) {
      warnings.push(`⚠️ EARNINGS ALERT: ${ticker} (${info.company}) reports in ${daysUntil} days (${info.date}). Adjust conviction for binary event risk.`);
    }
  }

  return warnings.length > 0 ? "\n\n" + warnings.join("\n") : "";
}
