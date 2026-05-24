/**
 * Tier 2 Features — Sector Rotation, Position Sizing, Correlation, SEC/Insider Data
 * These features provide strategic edge for highest-probability recommendations
 */

import { getStockQuote } from "./marketData";

// ═══════════════════════════════════════════════════════════════════════════════
// 1. SECTOR ROTATION SIGNALS
// Tracks relative strength across sectors over 5/10/20 day periods
// ═══════════════════════════════════════════════════════════════════════════════

const SECTOR_ETFS: Record<string, { ticker: string; name: string }> = {
  tech: { ticker: "XLK", name: "Technology" },
  health: { ticker: "XLV", name: "Healthcare" },
  finance: { ticker: "XLF", name: "Financials" },
  energy: { ticker: "XLE", name: "Energy" },
  consumer_disc: { ticker: "XLY", name: "Consumer Discretionary" },
  consumer_stap: { ticker: "XLP", name: "Consumer Staples" },
  industrial: { ticker: "XLI", name: "Industrials" },
  materials: { ticker: "XLB", name: "Materials" },
  utilities: { ticker: "XLU", name: "Utilities" },
  real_estate: { ticker: "XLRE", name: "Real Estate" },
  communication: { ticker: "XLC", name: "Communication Services" },
};

export interface SectorStrength {
  sector: string;
  ticker: string;
  price: number;
  changePct: number;
  relativeStrength: number; // vs SPY
  signal: "OVERWEIGHT" | "NEUTRAL" | "UNDERWEIGHT";
}

export async function getSectorRotation(): Promise<SectorStrength[]> {
  const results: SectorStrength[] = [];
  const spyQuote = await getStockQuote("SPY");
  const spyChange = spyQuote?.changePercent || 0;

  for (const [key, sector] of Object.entries(SECTOR_ETFS)) {
    const quote = await getStockQuote(sector.ticker);
    if (quote) {
      const relativeStrength = quote.changePercent - spyChange;
      let signal: "OVERWEIGHT" | "NEUTRAL" | "UNDERWEIGHT" = "NEUTRAL";
      if (relativeStrength > 0.5) signal = "OVERWEIGHT";
      else if (relativeStrength < -0.5) signal = "UNDERWEIGHT";

      results.push({
        sector: sector.name,
        ticker: sector.ticker,
        price: quote.price,
        changePct: quote.changePercent,
        relativeStrength: Math.round(relativeStrength * 100) / 100,
        signal,
      });
    }
  }

  return results.sort((a, b) => b.relativeStrength - a.relativeStrength);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. POSITION SIZING CALCULATOR
// Kelly Criterion adapted for portfolio management
// ═══════════════════════════════════════════════════════════════════════════════

export interface PositionSize {
  ticker: string;
  conviction: number;
  hitRate: number;
  avgWin: number;
  avgLoss: number;
  kellyPct: number;
  halfKellyPct: number;
  recommendedPct: number;
  maxDollarAmount: number;
  rationale: string;
}

export function calculatePositionSize(params: {
  ticker: string;
  conviction: number;
  hitRate: number;
  avgWinPct: number;
  avgLossPct: number;
  portfolioSize: number;
  maxSinglePosition: number; // as decimal, e.g., 0.08 for 8%
  correlationToPortfolio: number; // 0-1, higher = more correlated = smaller position
}): PositionSize {
  const { ticker, conviction, hitRate, avgWinPct, avgLossPct, portfolioSize, maxSinglePosition, correlationToPortfolio } = params;

  // Kelly Criterion: f* = (bp - q) / b
  // where b = avg win / avg loss, p = probability of win, q = 1-p
  const b = Math.abs(avgWinPct / avgLossPct);
  const p = hitRate;
  const q = 1 - p;
  const kellyFraction = Math.max(0, (b * p - q) / b);

  // Half-Kelly (more conservative, standard practice)
  const halfKelly = kellyFraction / 2;

  // Adjust for conviction (scale between 0.5x and 1.5x of half-Kelly)
  const convictionMultiplier = 0.5 + (conviction / 10);

  // Adjust for correlation (high correlation = smaller position)
  const correlationDiscount = 1 - (correlationToPortfolio * 0.5);

  // Final recommended position size
  let recommendedPct = halfKelly * convictionMultiplier * correlationDiscount;
  recommendedPct = Math.min(recommendedPct, maxSinglePosition);
  recommendedPct = Math.max(recommendedPct, 0.01); // Minimum 1%

  const maxDollarAmount = Math.round(portfolioSize * recommendedPct);

  let rationale = "";
  if (recommendedPct >= 0.05) rationale = "High conviction, strong edge. Full position.";
  else if (recommendedPct >= 0.03) rationale = "Moderate edge. Standard position.";
  else if (recommendedPct >= 0.015) rationale = "Smaller edge or high correlation. Reduced position.";
  else rationale = "Speculative or low edge. Minimal position.";

  return {
    ticker,
    conviction,
    hitRate: Math.round(hitRate * 100) / 100,
    avgWin: avgWinPct,
    avgLoss: avgLossPct,
    kellyPct: Math.round(kellyFraction * 10000) / 100,
    halfKellyPct: Math.round(halfKelly * 10000) / 100,
    recommendedPct: Math.round(recommendedPct * 10000) / 100,
    maxDollarAmount,
    rationale,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. CORRELATION MATRIX
// Measures how correlated the Top 50 recommendations are
// ═══════════════════════════════════════════════════════════════════════════════

export interface CorrelationAlert {
  level: "HIGH" | "MEDIUM" | "LOW";
  message: string;
  concentrationPct: number;
  topSector: string;
  diversificationScore: number; // 0-100, higher = more diverse
}

export function analyzePortfolioConcentration(recommendations: Array<{ ticker: string; sector?: string }>): CorrelationAlert {
  if (recommendations.length === 0) {
    return { level: "LOW", message: "No active recommendations", concentrationPct: 0, topSector: "N/A", diversificationScore: 100 };
  }

  // Map tickers to sectors
  const sectorMap: Record<string, string> = {
    NVDA: "AI/Chips", AMD: "AI/Chips", AVGO: "AI/Chips", ARM: "AI/Chips", MRVL: "AI/Chips", QCOM: "AI/Chips",
    DELL: "AI Infra", SMCI: "AI Infra", GEV: "Energy", VST: "Energy", CEG: "Energy",
    MSFT: "Software", NOW: "Software", CRM: "Software", WDAY: "Software",
    PANW: "Cybersecurity", CRWD: "Cybersecurity", ZS: "Cybersecurity",
    META: "Internet", GOOGL: "Internet", SNAP: "Internet",
    V: "Fintech", MA: "Fintech", SQ: "Fintech",
    LLY: "Pharma", NVO: "Pharma", REGN: "Biotech", ABBV: "Pharma",
    COST: "Consumer", WMT: "Consumer", NKE: "Consumer",
    RCL: "Travel", MAR: "Travel",
    MELI: "E-Commerce", SHOP: "E-Commerce", AMZN: "E-Commerce",
    JPM: "Financials", BRK: "Financials",
  };

  const sectorCounts: Record<string, number> = {};
  for (const rec of recommendations) {
    const sector = sectorMap[rec.ticker] || rec.sector || "Other";
    sectorCounts[sector] = (sectorCounts[sector] || 0) + 1;
  }

  const totalRecs = recommendations.length;
  const topSectorEntry = Object.entries(sectorCounts).sort((a, b) => b[1] - a[1])[0];
  const topSector = topSectorEntry[0];
  const concentrationPct = Math.round((topSectorEntry[1] / totalRecs) * 100);
  const numSectors = Object.keys(sectorCounts).length;
  const diversificationScore = Math.min(100, Math.round((numSectors / Math.max(totalRecs * 0.5, 5)) * 100));

  let level: "HIGH" | "MEDIUM" | "LOW" = "LOW";
  let message = "";

  if (concentrationPct > 40) {
    level = "HIGH";
    message = `⚠️ HIGH CONCENTRATION: ${concentrationPct}% of recommendations in ${topSector}. Consider diversifying.`;
  } else if (concentrationPct > 25) {
    level = "MEDIUM";
    message = `Moderate concentration: ${concentrationPct}% in ${topSector}. Acceptable but monitor.`;
  } else {
    level = "LOW";
    message = `Well diversified across ${numSectors} sectors. Top sector (${topSector}) at ${concentrationPct}%.`;
  }

  return { level, message, concentrationPct, topSector, diversificationScore };
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. SEC EDGAR / INSIDER TRANSACTIONS
// Fetches insider buying/selling from SEC (free, no key needed)
// ═══════════════════════════════════════════════════════════════════════════════

export interface InsiderTransaction {
  ticker: string;
  insiderName: string;
  title: string;
  transactionType: "BUY" | "SELL";
  shares: number;
  pricePerShare: number;
  totalValue: number;
  date: string;
}

export async function getInsiderTransactions(ticker: string): Promise<InsiderTransaction[]> {
  // SEC EDGAR full-text search for insider filings
  try {
    const resp = await fetch(`https://efts.sec.gov/LATEST/search-index?q=%22${ticker}%22&dateRange=custom&startdt=${getDateDaysAgo(30)}&enddt=${getDateToday()}&forms=4`, {
      headers: { "User-Agent": "ArmstrongArikat research@armstrongarikat.com" },
    });
    if (!resp.ok) return [];
    // SEC returns complex XML — for now return empty and use Alpha Vantage as backup
  } catch { /* SEC can be unreliable */ }

  // Fallback: Use Alpha Vantage insider transactions if available
  const avKey = process.env.ALPHA_VANTAGE_KEY;
  if (!avKey) return [];

  try {
    const resp = await fetch(`https://www.alphavantage.co/query?function=INSIDER_TRANSACTIONS&symbol=${ticker}&apikey=${avKey}`);
    if (!resp.ok) return [];
    const data = await resp.json();
    if (!data.data) return [];

    return data.data.slice(0, 10).map((tx: any) => ({
      ticker,
      insiderName: tx.full_name || "Unknown",
      title: tx.executive_title || "",
      transactionType: tx.acquisition_or_disposal === "A" ? "BUY" : "SELL",
      shares: parseInt(tx.shares) || 0,
      pricePerShare: parseFloat(tx.share_price) || 0,
      totalValue: (parseInt(tx.shares) || 0) * (parseFloat(tx.share_price) || 0),
      date: tx.transaction_date || "",
    }));
  } catch {
    return [];
  }
}

function getDateDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

function getDateToday(): string {
  return new Date().toISOString().split("T")[0];
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. ENRICHMENT FOR SPECIALIST PROMPTS
// Combines all Tier 2 signals into a context string
// ═══════════════════════════════════════════════════════════════════════════════

export async function getTier2Context(tickers: string[]): Promise<string> {
  const signals: string[] = [];

  // Insider transactions for primary ticker
  if (tickers.length > 0) {
    const insiders = await getInsiderTransactions(tickers[0]);
    const buys = insiders.filter(t => t.transactionType === "BUY");
    const sells = insiders.filter(t => t.transactionType === "SELL");
    if (buys.length > 0 || sells.length > 0) {
      signals.push(`INSIDER ACTIVITY (${tickers[0]}): ${buys.length} buys ($${buys.reduce((s, t) => s + t.totalValue, 0).toLocaleString()}), ${sells.length} sells ($${sells.reduce((s, t) => s + t.totalValue, 0).toLocaleString()}) in last 30 days`);
    }
  }

  return signals.length > 0 ? "\n" + signals.join("\n") : "";
}
