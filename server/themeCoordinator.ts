/**
 * Theme Coordinator — Cross-Pod Intelligence Sharing Layer
 * 
 * Routes relevant research between specialists in the same theme before Beth synthesizes.
 * This catches cross-sector signals that isolated specialists would miss.
 * 
 * Architecture:
 * 1. Specialist generates research
 * 2. Theme Coordinator checks which themes that specialist belongs to
 * 3. Extracts key signals from their research
 * 4. Injects those signals into related specialists' next prompt
 * 5. Beth receives richer, pre-cross-referenced input
 */

// ═══════════════════════════════════════════════════════════════════════════════
// THEME DEFINITIONS — Which specialists share intelligence
// ═══════════════════════════════════════════════════════════════════════════════

export interface Theme {
  id: string;
  name: string;
  description: string;
  members: string[]; // specialist slugs
  signalKeywords: string[]; // keywords that trigger cross-sharing
}

export const THEMES: Theme[] = [
  {
    id: "ai-supercycle",
    name: "AI Supercycle",
    description: "AI infrastructure buildout — chips, data centers, energy, software, inference",
    members: ["david-park", "marcus-chen", "elena-vasquez", "sarah-nakamura", "michael-torres", "james-okafor"],
    signalKeywords: ["GPU", "data center", "power demand", "inference", "training", "Blackwell", "H100", "capex", "hyperscaler", "cloud spend", "AI revenue", "token", "model"],
  },
  {
    id: "healthcare-mega",
    name: "Healthcare Megacycle",
    description: "GLP-1 revolution, biotech M&A wave, consumer health behavior shift",
    members: ["dr-laura-mitchell", "dr-nathan-cole", "dr-kevin-zhao", "catherine-brooks", "daniel-ortiz"],
    signalKeywords: ["GLP-1", "Mounjaro", "Ozempic", "obesity", "weight loss", "restaurant", "food", "consumer spending", "healthcare", "FDA", "clinical trial", "M&A", "patent cliff"],
  },
  {
    id: "geopolitical-defense",
    name: "Geopolitical & Defense",
    description: "US-China, space militarization, cyber warfare, energy security",
    members: ["victoria-sterling", "colonel-derek-hayes", "alexander-petrov", "rachel-kim", "elena-vasquez"],
    signalKeywords: ["China", "Taiwan", "defense", "DoD", "Space Force", "NATO", "sanctions", "cyber", "zero-trust", "nuclear", "uranium", "oil", "OPEC", "Iran"],
  },
  {
    id: "rate-sensitivity",
    name: "Rate Sensitivity & Macro",
    description: "Fed policy, yields, duration, value vs growth rotation",
    members: ["dr-robert-kessler", "claire-donovan", "gregory-ashford", "richard-callahan", "thomas-brennan", "dr-marcus-webb"],
    signalKeywords: ["Fed", "FOMC", "rate", "yield", "Treasury", "inflation", "CPI", "PCE", "duration", "value", "growth", "multiple", "P/E", "risk premium", "recession"],
  },
  {
    id: "space-economy",
    name: "Space Economy",
    description: "SpaceX IPO, commercial space, satellite constellations, lunar economy",
    members: ["colonel-derek-hayes", "victoria-sterling", "elena-vasquez", "rachel-kim"],
    signalKeywords: ["SpaceX", "rocket", "satellite", "orbit", "launch", "Starlink", "lunar", "NASA", "Space Force", "constellation", "LEO"],
  },
  {
    id: "consumer-digital",
    name: "Consumer & Digital Economy",
    description: "E-commerce, fintech, digital advertising, consumer behavior",
    members: ["catherine-brooks", "jessica-huang", "andrew-walsh", "sophia-reyes", "daniel-ortiz"],
    signalKeywords: ["consumer", "spending", "retail", "e-commerce", "GMV", "payments", "digital ad", "ROAS", "travel", "cruise", "hotel"],
  },
  {
    id: "risk-execution",
    name: "Risk & Execution",
    description: "Portfolio risk management, trade execution, options overlay",
    members: ["dr-marcus-webb", "ryan-tanaka", "victoria-chen", "claire-donovan", "gregory-ashford"],
    signalKeywords: ["VaR", "drawdown", "correlation", "hedge", "stop-loss", "VWAP", "execution", "slippage", "options", "covered call", "put", "volatility", "IV", "Greeks", "delta", "gamma"],
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// SIGNAL EXTRACTION — Pull key signals from research output
// ═══════════════════════════════════════════════════════════════════════════════

interface Signal {
  specialist: string;
  specialistName: string;
  theme: string;
  content: string;
  timestamp: string;
}

// In-memory signal store (recent signals from each specialist)
const signalStore: Map<string, Signal[]> = new Map();
const MAX_SIGNALS_PER_THEME = 10;
const SIGNAL_TTL = 8 * 60 * 60 * 1000; // 8 hours

export function extractAndStoreSignals(specialistSlug: string, specialistName: string, research: string): void {
  // Find which themes this specialist belongs to
  const memberThemes = THEMES.filter(t => t.members.includes(specialistSlug));

  for (const theme of memberThemes) {
    // Check if research contains relevant keywords for this theme
    const relevantKeywords = theme.signalKeywords.filter(kw => 
      research.toLowerCase().includes(kw.toLowerCase())
    );

    if (relevantKeywords.length >= 2) {
      // Extract the most relevant sentences (containing keywords)
      const sentences = research.split(/[.!?]+/).filter(s => s.trim().length > 20);
      const relevantSentences = sentences.filter(s => 
        relevantKeywords.some(kw => s.toLowerCase().includes(kw.toLowerCase()))
      ).slice(0, 3);

      if (relevantSentences.length > 0) {
        const signal: Signal = {
          specialist: specialistSlug,
          specialistName,
          theme: theme.id,
          content: relevantSentences.join(". ").slice(0, 400),
          timestamp: new Date().toISOString(),
        };

        // Store signal
        const themeSignals = signalStore.get(theme.id) || [];
        themeSignals.unshift(signal);
        
        // Trim old signals
        const now = Date.now();
        const freshSignals = themeSignals
          .filter(s => now - new Date(s.timestamp).getTime() < SIGNAL_TTL)
          .slice(0, MAX_SIGNALS_PER_THEME);
        
        signalStore.set(theme.id, freshSignals);
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SIGNAL INJECTION — Get cross-pod intelligence for a specialist's prompt
// ═══════════════════════════════════════════════════════════════════════════════

export function getCrossPodIntelligence(specialistSlug: string): string {
  // Find which themes this specialist belongs to
  const memberThemes = THEMES.filter(t => t.members.includes(specialistSlug));
  
  if (memberThemes.length === 0) return "";

  const crossSignals: string[] = [];

  for (const theme of memberThemes) {
    const themeSignals = signalStore.get(theme.id) || [];
    
    // Get signals from OTHER specialists in the same theme (not self)
    const otherSignals = themeSignals.filter(s => s.specialist !== specialistSlug);
    
    if (otherSignals.length > 0) {
      crossSignals.push(`\n[THEME: ${theme.name}] Cross-pod intelligence from your theme colleagues:`);
      for (const signal of otherSignals.slice(0, 3)) {
        crossSignals.push(`  • ${signal.specialistName}: "${signal.content}"`);
      }
    }
  }

  if (crossSignals.length === 0) return "";

  return "\n\nCROSS-POD INTELLIGENCE (from Theme Coordinator — use this to strengthen or challenge your thesis):" + crossSignals.join("\n");
}

// ═══════════════════════════════════════════════════════════════════════════════
// THEME SYNTHESIS — Generate a theme-level summary for Beth
// ═══════════════════════════════════════════════════════════════════════════════

export function getThemeSynthesis(): Array<{
  theme: string;
  name: string;
  signalCount: number;
  specialists: string[];
  latestSignals: string[];
  consensus: string;
}> {
  const syntheses = [];

  for (const theme of THEMES) {
    const signals = signalStore.get(theme.id) || [];
    if (signals.length === 0) continue;

    const uniqueSpecialists = Array.from(new Set(signals.map(s => s.specialistName)));
    const latestSignals = signals.slice(0, 3).map(s => `${s.specialistName}: ${s.content.slice(0, 150)}`);

    // Determine consensus direction
    const bullishKeywords = ["buy", "strong buy", "bullish", "accelerating", "upside", "conviction"];
    const bearishKeywords = ["sell", "caution", "risk", "downside", "bearish", "overvalued"];
    
    let bullCount = 0, bearCount = 0;
    for (const signal of signals) {
      const lower = signal.content.toLowerCase();
      if (bullishKeywords.some(k => lower.includes(k))) bullCount++;
      if (bearishKeywords.some(k => lower.includes(k))) bearCount++;
    }

    let consensus = "NEUTRAL";
    if (bullCount > bearCount * 1.5) consensus = "BULLISH CONSENSUS";
    else if (bearCount > bullCount * 1.5) consensus = "BEARISH CONSENSUS";
    else if (bullCount > 0 && bearCount > 0) consensus = "MIXED — CONFLICT DETECTED";

    syntheses.push({
      theme: theme.id,
      name: theme.name,
      signalCount: signals.length,
      specialists: uniqueSpecialists,
      latestSignals,
      consensus,
    });
  }

  return syntheses;
}

// ═══════════════════════════════════════════════════════════════════════════════
// GET ALL THEMES (for frontend display)
// ═══════════════════════════════════════════════════════════════════════════════

export function getAllThemes() {
  return THEMES.map(t => ({
    id: t.id,
    name: t.name,
    description: t.description,
    memberCount: t.members.length,
    members: t.members,
    activeSignals: (signalStore.get(t.id) || []).length,
  }));
}
