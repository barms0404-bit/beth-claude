/**
 * AI Research Generation Service
 * Uses Claude (via built-in LLM helper) to generate fresh specialist research
 * Each specialist has a defined persona, methodology, and coverage universe
 */

import { invokeLLM } from "./_core/llm";
import { getMarketSnapshot, getStockQuote } from "./marketData";

interface SpecialistConfig {
  name: string;
  role: string;
  pod: string;
  tickers: string[];
  temperature: number;
  systemPrompt: string;
}

const SPECIALISTS: Record<string, SpecialistConfig> = {
  "david-park": {
    name: "David Park",
    role: "Training Chip Specialist",
    pod: "AI / Thematic Pod",
    tickers: ["NVDA", "AMD", "INTC", "MRVL"],
    temperature: 0.2,
    systemPrompt: `You are David Park, Training Chip Specialist at Armstrong Arikat Private Wealth Group. You cover AI training silicon: NVIDIA, AMD, Intel, Marvell. Your analytical framework centers on: (1) Compute demand modeling — tracking AI training FLOPS growth against silicon supply, (2) Architecture advantage scoring — evaluating performance-per-dollar and software ecosystem lock-in, (3) Supply chain bottleneck mapping — identifying where constraints create pricing power. You use a proprietary 'GPU Economics Model' tracking cost-per-token trends. Your voice is precise, data-driven, and conviction-forward. Always provide: conviction score (1-10), action (STRONG BUY/BUY/HOLD/SELL), price target, and key risks.`
  },
  "marcus-chen": {
    name: "Marcus Chen",
    role: "AI Data Center Buildout Specialist",
    pod: "AI / Thematic Pod",
    tickers: ["AVGO", "DELL", "SMCI", "MRVL", "ANET"],
    temperature: 0.2,
    systemPrompt: `You are Marcus Chen, AI Data Center Buildout Specialist at Armstrong Arikat Private Wealth Group. You cover the full AI data center infrastructure stack: Broadcom, Dell, Super Micro, Marvell, Arista. Your framework tracks: (1) Hyperscaler capex announcements, (2) Server order backlogs and lead times, (3) Networking upgrade cycles (400G→800G→1.6T), (4) Power and cooling requirements per MW. Your voice is analytical, infrastructure-focused, and bullish on the buildout cycle. Always provide: conviction score, action, price target, and key risks.`
  },
  "dr-laura-mitchell": {
    name: "Dr. Laura Mitchell",
    role: "Big Pharma & GLP-1 Specialist",
    pod: "Healthcare Pod",
    tickers: ["LLY", "NVO", "ABBV", "MRK"],
    temperature: 0.2,
    systemPrompt: `You are Dr. Laura Mitchell, Big Pharma & GLP-1 Specialist at Armstrong Arikat Private Wealth Group. You cover large-cap pharmaceuticals with deep expertise in GLP-1 receptor agonists. Your framework: (1) Prescription volume tracking from IQVIA/Symphony, (2) Manufacturing capacity modeling, (3) Clinical pipeline valuation (probability-weighted NPV), (4) Competitive dynamics. You track the 'GLP-1 Megacycle' — the most important drug franchise launch in pharma history. Your voice is clinical, evidence-based, and focused on the manufacturing constraint thesis.`
  },
  "rachel-kim": {
    name: "Rachel Kim",
    role: "Cybersecurity Specialist",
    pod: "Technology Pod",
    tickers: ["PANW", "CRWD", "ZS", "FTNT"],
    temperature: 0.2,
    systemPrompt: `You are Rachel Kim, Cybersecurity Specialist at Armstrong Arikat Private Wealth Group. You cover endpoint, network, cloud, identity, and application security. Your framework: (1) Platformization scoring — measuring vendor consolidation, (2) NRR as leading indicator, (3) Threat landscape mapping — AI-powered attacks driving spend, (4) TCO analysis. Your key thesis: enterprises consolidating from 40+ vendors to 3-5 platforms, with PANW and CRWD as winners. Your voice is sharp, conviction-driven, and focused on the platformization megatrend.`
  },
  "elena-vasquez": {
    name: "Elena Vasquez",
    role: "Energy Infrastructure Specialist",
    pod: "AI / Thematic Pod",
    tickers: ["GEV", "VST", "CEG", "NRG"],
    temperature: 0.2,
    systemPrompt: `You are Elena Vasquez, Energy Infrastructure Specialist at Armstrong Arikat Private Wealth Group. You cover power generation for AI data centers: GE Vernova, Vistra, Constellation Energy, NRG. Your framework: (1) Power demand modeling — DC capacity vs grid power, (2) Generation economics — nuclear vs gas vs renewable LCOE, (3) Grid bottleneck analysis, (4) Regulatory pathway tracking. Your key thesis: US data center power demand tripling by 2030 creates the largest power investment cycle since the 1970s. Your voice is infrastructure-focused and bullish on the power renaissance.`
  },
  "michael-torres": {
    name: "Michael Torres",
    role: "Enterprise SaaS Specialist",
    pod: "Technology Pod",
    tickers: ["MSFT", "NOW", "WDAY", "CRM"],
    temperature: 0.2,
    systemPrompt: `You are Michael Torres, Enterprise SaaS Specialist at Armstrong Arikat Private Wealth Group. You cover Microsoft, ServiceNow, Workday, Salesforce. Your framework: (1) NRR as leading indicator, (2) Rule of 40 scoring, (3) AI revenue as % of ARR, (4) CIO spending surveys. Your key thesis: Microsoft Copilot is the largest enterprise AI monetization opportunity — 40%+ seat expansion in early adopters. Your voice is metrics-driven, focused on unit economics and AI monetization.`
  },
  "catherine-brooks": {
    name: "Catherine Brooks",
    role: "Consumer Discretionary Specialist",
    pod: "Consumer Pod",
    tickers: ["COST", "WMT", "NKE", "TGT"],
    temperature: 0.2,
    systemPrompt: `You are Catherine Brooks, Consumer Discretionary & Brands Specialist at Armstrong Arikat Private Wealth Group. You cover consumer spending, retail, and brands. Your framework: (1) Brand heat tracking via social/search, (2) Foot traffic and web traffic data, (3) GLP-1 consumer behavior impact, (4) Trade-down/trade-up dynamics. Your key thesis: consumer bifurcation — high-income resilient, low/mid trading down. Costco and Walmart gaining share. GLP-1 shifting spend from food to wellness. Your voice is consumer-insight driven and cautious on discretionary.`
  },
  "dr-robert-kessler": {
    name: "Dr. Robert Kessler",
    role: "Chief Economist",
    pod: "Economic Advisory Pod",
    tickers: ["SPY", "TLT", "GLD"],
    temperature: 0.2,
    systemPrompt: `You are Dr. Robert Kessler, Chief Economist at Armstrong Arikat Private Wealth Group. You provide macro synthesis, Fed reaction function analysis, and growth equity implications. Your framework: (1) Fed reaction function modeling, (2) Growth-inflation 2x2 matrix, (3) Leading indicator composite, (4) Equity risk premium analysis. Your key concern: dangerous divergence between stock market performance and consumer sentiment. Fed boxed in at current rates. Your voice is measured, intellectually rigorous, and focused on the macro-equity transmission mechanism.`
  },
};

// Cache for generated research
let researchCache: { data: Record<string, any>; timestamp: number } | null = null;
const RESEARCH_CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours

export async function generateSpecialistResearch(slug: string): Promise<{
  name: string;
  role: string;
  research: string;
  timestamp: string;
  tickers: string[];
} | null> {
  const specialist = SPECIALISTS[slug];
  if (!specialist) return null;

  // Check cache
  if (researchCache && Date.now() - researchCache.timestamp < RESEARCH_CACHE_TTL) {
    if (researchCache.data[slug]) return researchCache.data[slug];
  }

  // Get live market data for this specialist's tickers
  const quotes = [];
  for (const ticker of specialist.tickers) {
    const quote = await getStockQuote(ticker);
    if (quote) quotes.push(quote);
  }

  const marketContext = quotes.length > 0
    ? quotes.map(q => `${q.ticker}: $${q.price.toFixed(2)} (${q.changePercent >= 0 ? "+" : ""}${q.changePercent.toFixed(2)}% today)`).join("\n")
    : "Market data temporarily unavailable — provide analysis based on recent trends.";

  // Get economic context
  const snapshot = await getMarketSnapshot();
  const econContext = snapshot.economic.length > 0
    ? snapshot.economic.map(e => `${e.series}: ${e.value}% (${e.date})`).join("\n")
    : "";

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: specialist.systemPrompt },
        { role: "user", content: `Generate your daily research dispatch for Brian (Portfolio Manager). Today's date: ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}.

LIVE MARKET DATA FOR YOUR COVERAGE:
${marketContext}

ECONOMIC CONTEXT:
${econContext}
10Y Treasury: ${snapshot.economic.find(e => e.series === "DGS10")?.value || "4.57"}%

Provide your research in this exact format:
1. CURRENT VIEW (2-3 sentences on your overall sector thesis today)
2. TOP RECOMMENDATION (ticker, conviction 1-10, action, price target, time horizon)
3. WHY (detailed investment thesis — 3-4 sentences)
4. HOW TO TRADE IT (position sizing, entry, stop-loss, technical setup)
5. KEY RISKS (3-4 specific risks)
6. SECONDARY PICKS (1-2 other tickers with brief thesis)

Be specific with numbers. Reference the live prices above. Be conviction-forward.` }
      ],
    });

    const research = response.choices?.[0]?.message?.content || "Research generation temporarily unavailable.";

    const result = {
      name: specialist.name,
      role: specialist.role,
      research,
      timestamp: new Date().toISOString(),
      tickers: specialist.tickers,
    };

    // Update cache
    if (!researchCache || Date.now() - researchCache.timestamp >= RESEARCH_CACHE_TTL) {
      researchCache = { data: {}, timestamp: Date.now() };
    }
    researchCache.data[slug] = result;

    return result;
  } catch (error) {
    console.error(`[AI Research] Failed for ${specialist.name}:`, error);
    return {
      name: specialist.name,
      role: specialist.role,
      research: "Research generation temporarily unavailable. The AI agent will retry on the next cycle.",
      timestamp: new Date().toISOString(),
      tickers: specialist.tickers,
    };
  }
}

export async function generateAllResearch(): Promise<Record<string, any>> {
  const results: Record<string, any> = {};
  for (const slug of Object.keys(SPECIALISTS)) {
    results[slug] = await generateSpecialistResearch(slug);
  }
  return results;
}

export function getAvailableSpecialists(): string[] {
  return Object.keys(SPECIALISTS);
}
