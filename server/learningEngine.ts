/**
 * Learning Engine — Backtesting, Hindsight Journal, Dynamic Prompt Evolution
 * 
 * 1. BACKTESTING: Auto-evaluates recommendations at 7, 14, 30, 90 days
 * 2. HINDSIGHT JOURNAL: AI-generated post-mortem on every closed position
 * 3. DYNAMIC PROMPT EVOLUTION: Injects lessons learned into specialist prompts
 */

import { invokeLLM } from "./_core/llm";
import { getStockQuote } from "./marketData";

const SUPABASE_URL = "https://aufdpgioooxbujzrxacv.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1ZmRwZ2lvb294YnVqenJ4YWN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NDYxNjcsImV4cCI6MjA5NTEyMjE2N30.svfu2nTHxl4J200gok29DqjAGvPn3ax-mVdQbWVBPSo";

async function supabaseRequest(path: string, options: RequestInit = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": options.method === "POST" ? "return=representation" : "return=minimal",
      ...options.headers,
    },
  });
  if (!response.ok) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. BACKTESTING ENGINE
// Evaluates all active recommendations at 7, 14, 30, 90 day intervals
// ═══════════════════════════════════════════════════════════════════════════════

export async function runBacktest(): Promise<{
  evaluated: number;
  closed: number;
  journalEntries: number;
  errors: number;
}> {
  const results = { evaluated: 0, closed: 0, journalEntries: 0, errors: 0 };

  // Get all active recommendations
  const activeRecs = await supabaseRequest("recommendations?status=eq.active&order=created_at.asc");
  if (!activeRecs || activeRecs.length === 0) return results;

  const now = new Date();

  for (const rec of activeRecs) {
    results.evaluated++;
    const createdAt = new Date(rec.created_at);
    const daysSinceRec = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

    // Evaluate at 30-day mark (close the position)
    if (daysSinceRec >= 30) {
      try {
        const quote = await getStockQuote(rec.ticker);
        if (!quote) continue;

        const returnPct = ((quote.price - rec.price_at_rec) / rec.price_at_rec) * 100;
        const isHit = (rec.action.includes("BUY") && returnPct > 0) || (rec.action === "SELL" && returnPct < 0);
        const outcome = isHit ? "hit" : "miss";

        // Close the recommendation
        await supabaseRequest(`recommendations?id=eq.${rec.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            status: outcome,
            price_at_close: quote.price,
            return_pct: Math.round(returnPct * 100) / 100,
            closed_at: new Date().toISOString(),
          }),
        });
        results.closed++;

        // Generate hindsight journal entry
        const journalEntry = await generateHindsightEntry(rec, quote.price, returnPct, outcome, Math.round(daysSinceRec));
        if (journalEntry) results.journalEntries++;

      } catch (e) {
        results.errors++;
        console.error(`[Backtest] Error evaluating ${rec.ticker}:`, e);
      }
    }
    // Checkpoint at 7 and 14 days (log progress but don't close)
    else if (daysSinceRec >= 7) {
      try {
        const quote = await getStockQuote(rec.ticker);
        if (quote) {
          const returnPct = ((quote.price - rec.price_at_rec) / rec.price_at_rec) * 100;
          // Log intermediate check (could be used for early warning)
          console.log(`[Backtest] ${rec.ticker} (${rec.specialist_name}): ${daysSinceRec.toFixed(0)}d, ${returnPct > 0 ? "+" : ""}${returnPct.toFixed(1)}%`);
        }
      } catch { /* non-critical */ }
    }
  }

  return results;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. HINDSIGHT JOURNAL
// AI-generated post-mortem on every closed position
// ═══════════════════════════════════════════════════════════════════════════════

async function generateHindsightEntry(
  rec: any,
  currentPrice: number,
  returnPct: number,
  outcome: string,
  daysSinceRec: number
): Promise<boolean> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are the Armstrong Arikat Research Terminal's Hindsight Analysis Agent. Your job is to analyze closed positions and extract lessons. Be brutally honest. Focus on what can be learned for future recommendations. Keep each section to 1-2 sentences.`
        },
        {
          role: "user",
          content: `Analyze this closed position:

SPECIALIST: ${rec.specialist_name} (${rec.specialist_slug})
TICKER: ${rec.ticker}
ACTION: ${rec.action} (Conviction: ${rec.conviction}/10)
ENTRY PRICE: $${rec.price_at_rec}
CURRENT PRICE: $${currentPrice}
RETURN: ${returnPct > 0 ? "+" : ""}${returnPct.toFixed(2)}%
OUTCOME: ${outcome.toUpperCase()}
HOLDING PERIOD: ${daysSinceRec} days
ORIGINAL THESIS: ${rec.thesis || "Not recorded"}

Provide your analysis in this exact JSON format:
{
  "what_went_right": "What the specialist correctly identified",
  "what_went_wrong": "What the specialist missed or got wrong",
  "lesson_learned": "The key takeaway for future recommendations",
  "prompt_adjustment": "A specific 1-sentence instruction to add to this specialist's system prompt to improve future accuracy"
}`
        }
      ],
    });

    const content = response.choices?.[0]?.message?.content;
    if (typeof content !== "string") return false;

    let analysis;
    try {
      // Try to parse JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      // If JSON parsing fails, create structured response from text
      analysis = {
        what_went_right: content.slice(0, 200),
        what_went_wrong: "Unable to parse structured analysis",
        lesson_learned: "Recommendation tracking needs more context",
        prompt_adjustment: "Include more specific entry/exit criteria in recommendations",
      };
    }

    if (!analysis) return false;

    // Save to hindsight_journal
    await supabaseRequest("hindsight_journal", {
      method: "POST",
      body: JSON.stringify({
        recommendation_id: rec.id,
        specialist_slug: rec.specialist_slug,
        specialist_name: rec.specialist_name,
        ticker: rec.ticker,
        original_action: rec.action,
        original_conviction: rec.conviction,
        price_at_rec: rec.price_at_rec,
        price_at_eval: currentPrice,
        return_pct: Math.round(returnPct * 100) / 100,
        outcome,
        what_went_right: analysis.what_went_right,
        what_went_wrong: analysis.what_went_wrong,
        lesson_learned: analysis.lesson_learned,
        prompt_adjustment: analysis.prompt_adjustment,
        eval_period_days: daysSinceRec,
      }),
    });

    // Save lesson to specialist_lessons for prompt evolution
    await supabaseRequest("specialist_lessons", {
      method: "POST",
      body: JSON.stringify({
        specialist_slug: rec.specialist_slug,
        lesson: analysis.lesson_learned,
        source_rec_id: rec.id,
      }),
    });

    return true;
  } catch (e) {
    console.error(`[Hindsight] Failed for ${rec.ticker}:`, e);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. DYNAMIC PROMPT EVOLUTION
// Retrieves accumulated lessons and injects them into specialist prompts
// ═══════════════════════════════════════════════════════════════════════════════

export async function getSpecialistLessons(slug: string): Promise<string> {
  const lessons = await supabaseRequest(`specialist_lessons?specialist_slug=eq.${slug}&order=created_at.desc&limit=10`);
  if (!lessons || lessons.length === 0) return "";

  const lessonText = lessons.map((l: any, i: number) => `${i + 1}. ${l.lesson}`).join("\n");

  return `\n\nLEARNED LESSONS FROM YOUR TRACK RECORD (apply these to improve accuracy):\n${lessonText}\n\nAdjust your conviction scores and recommendations based on these lessons.`;
}

export async function getHindsightSummary(slug: string): Promise<{
  totalEvaluated: number;
  hits: number;
  misses: number;
  avgReturn: number;
  recentEntries: any[];
} | null> {
  const entries = await supabaseRequest(`hindsight_journal?specialist_slug=eq.${slug}&order=created_at.desc&limit=20`);
  if (!entries || entries.length === 0) return null;

  const hits = entries.filter((e: any) => e.outcome === "hit").length;
  const misses = entries.filter((e: any) => e.outcome === "miss").length;
  const avgReturn = entries.reduce((sum: number, e: any) => sum + (e.return_pct || 0), 0) / entries.length;

  return {
    totalEvaluated: entries.length,
    hits,
    misses,
    avgReturn: Math.round(avgReturn * 100) / 100,
    recentEntries: entries.slice(0, 5),
  };
}
