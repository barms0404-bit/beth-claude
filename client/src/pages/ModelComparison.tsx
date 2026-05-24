/*
 * Model Comparison — Armstrong Arikat Research Terminal
 * Shows when Claude, OpenAI, and Gemini disagree on the same stock
 * Highlights conflicts for Beth's conflict resolution protocol
 */

import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw, Brain, Zap, AlertTriangle } from "lucide-react";
import { Streamdown } from "streamdown";

const LOGO_URL = "/manus-storage/aa-logo_4d0e4c30.png";

// Stocks to compare across models
const COMPARISON_TICKERS = [
  { ticker: "NVDA", specialists: ["david-park", "sarah-nakamura"] },
  { ticker: "AVGO", specialists: ["marcus-chen", "elena-vasquez"] },
  { ticker: "LLY", specialists: ["dr-laura-mitchell", "dr-nathan-cole"] },
  { ticker: "PANW", specialists: ["rachel-kim", "michael-torres"] },
  { ticker: "MSFT", specialists: ["michael-torres", "andrew-walsh"] },
  { ticker: "META", specialists: ["andrew-walsh", "sophia-reyes"] },
];

const MODEL_COLORS: Record<string, string> = {
  claude: "#C9A961",
  manus: "#C9A961",
  openai: "#4ADE80",
  gemini: "#60A5FA",
};

const MODEL_LABELS: Record<string, string> = {
  claude: "Claude (Anthropic)",
  manus: "Manus/Claude",
  openai: "GPT-4o (OpenAI)",
  gemini: "Gemini 2.5 (Google)",
};

export default function ModelComparison() {
  const [selectedPair, setSelectedPair] = useState(COMPARISON_TICKERS[0]);

  // Fetch research from both specialists in the pair
  const { data: research1, isLoading: loading1, refetch: refetch1 } = trpc.research.specialist.useQuery(
    { slug: selectedPair.specialists[0] },
    { staleTime: 4 * 60 * 60 * 1000 }
  );
  const { data: research2, isLoading: loading2, refetch: refetch2 } = trpc.research.specialist.useQuery(
    { slug: selectedPair.specialists[1] },
    { staleTime: 4 * 60 * 60 * 1000 }
  );

  const loading = loading1 || loading2;

  return (
    <div className="min-h-screen bg-[#000000] relative">
      {/* Watermark */}
      <div className="fixed inset-0 z-0 pointer-events-none flex items-center justify-center" style={{ opacity: 0.04 }}>
        <img src={LOGO_URL} alt="" className="w-[60vw] max-w-[800px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b-4 border-[#C9A961] bg-[#000000]/97 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="sm" className="bg-transparent border-[#C9A961]/30 text-[#C9A961] hover:bg-[#C9A961]/10 text-xs">
                <ArrowLeft className="w-3 h-3 mr-1" /> Terminal
              </Button>
            </Link>
            <div>
              <h1 className="text-[#C9A961] text-xl font-semibold" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Model Comparison</h1>
              <p className="text-[#8A7548] text-xs">Claude vs OpenAI vs Gemini — Conflict Detection</p>
            </div>
          </div>
          <button onClick={() => { refetch1(); refetch2(); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0A0A0A] rounded border border-[#1F1A0F] hover:border-[#C9A961]/50 transition-colors">
            <RefreshCw className={`w-3 h-3 text-[#C9A961] ${loading ? "animate-spin" : ""}`} />
            <span className="text-[#C9A961] text-[10px] uppercase tracking-[1px]">Regenerate Both</span>
          </button>
        </div>

        {/* Ticker selector */}
        <div className="flex items-center gap-2 px-4 py-2 border-t border-[#1F1A0F] overflow-x-auto">
          {COMPARISON_TICKERS.map((pair) => (
            <button
              key={pair.ticker}
              onClick={() => setSelectedPair(pair)}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                selectedPair.ticker === pair.ticker
                  ? "bg-[#C9A961]/20 text-[#C9A961] border border-[#C9A961]/50"
                  : "text-[#8A7548] hover:text-[#C9A961] hover:bg-[#C9A961]/5 border border-transparent"
              }`}
            >
              {pair.ticker}
            </button>
          ))}
        </div>
      </header>

      <main className="relative z-10 px-4 py-6 max-w-[1400px] mx-auto">
        {/* Model Legend */}
        <div className="flex items-center gap-4 mb-6 p-3 bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg">
          <Brain className="w-4 h-4 text-[#C9A961]" />
          <span className="text-[#8A7548] text-xs">Model Legend:</span>
          {Object.entries(MODEL_LABELS).filter(([k]) => k !== "manus").map(([key, label]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: MODEL_COLORS[key] }}></div>
              <span className="text-[#F5E6C8] text-[10px]">{label}</span>
            </div>
          ))}
        </div>

        {/* Side-by-side comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Specialist 1 */}
          <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 bg-[#0A0A0A] border-b border-[#1F1A0F] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: MODEL_COLORS[research1?.model || "claude"] }}></div>
                <span className="text-[#C9A961] text-sm font-semibold">{research1?.name || selectedPair.specialists[0]}</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: `${MODEL_COLORS[research1?.model || "claude"]}20`, color: MODEL_COLORS[research1?.model || "claude"] }}>
                {MODEL_LABELS[research1?.model || "claude"] || research1?.model}
              </span>
            </div>
            <div className="p-4 max-h-[600px] overflow-y-auto">
              {loading1 ? (
                <div className="flex items-center gap-2 py-4">
                  <RefreshCw className="w-4 h-4 text-[#C9A961] animate-spin" />
                  <p className="text-[#8A7548] text-sm">Generating...</p>
                </div>
              ) : research1?.research ? (
                <div className="text-[#F5E6C8] text-xs leading-relaxed">
                  <Streamdown>{research1.research}</Streamdown>
                </div>
              ) : (
                <p className="text-[#8A7548] text-sm">Click Regenerate to fetch research.</p>
              )}
            </div>
          </div>

          {/* Specialist 2 */}
          <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 bg-[#0A0A0A] border-b border-[#1F1A0F] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: MODEL_COLORS[research2?.model || "openai"] }}></div>
                <span className="text-[#C9A961] text-sm font-semibold">{research2?.name || selectedPair.specialists[1]}</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded" style={{ backgroundColor: `${MODEL_COLORS[research2?.model || "openai"]}20`, color: MODEL_COLORS[research2?.model || "openai"] }}>
                {MODEL_LABELS[research2?.model || "openai"] || research2?.model}
              </span>
            </div>
            <div className="p-4 max-h-[600px] overflow-y-auto">
              {loading2 ? (
                <div className="flex items-center gap-2 py-4">
                  <RefreshCw className="w-4 h-4 text-[#C9A961] animate-spin" />
                  <p className="text-[#8A7548] text-sm">Generating...</p>
                </div>
              ) : research2?.research ? (
                <div className="text-[#F5E6C8] text-xs leading-relaxed">
                  <Streamdown>{research2.research}</Streamdown>
                </div>
              ) : (
                <p className="text-[#8A7548] text-sm">Click Regenerate to fetch research.</p>
              )}
            </div>
          </div>
        </div>

        {/* Second Opinion Section */}
        {(research1?.secondOpinion || research2?.secondOpinion) && (
          <div className="mt-6 bg-[#0F0F0F] border border-[#F59E0B]/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
              <h3 className="text-[#F59E0B] text-sm font-semibold">Second Opinions / Contrarian Views</h3>
            </div>
            {research1?.secondOpinion && (
              <div className="mb-3 p-3 bg-[#0A0A0A] rounded border border-[#1F1A0F]">
                <p className="text-[#8A7548] text-[10px] mb-1">{research1.name} — via {MODEL_LABELS[research1.secondaryModel || ""] || "secondary model"}:</p>
                <p className="text-[#F5E6C8] text-xs leading-relaxed">{research1.secondOpinion}</p>
              </div>
            )}
            {research2?.secondOpinion && (
              <div className="p-3 bg-[#0A0A0A] rounded border border-[#1F1A0F]">
                <p className="text-[#8A7548] text-[10px] mb-1">{research2.name} — via {MODEL_LABELS[research2.secondaryModel || ""] || "secondary model"}:</p>
                <p className="text-[#F5E6C8] text-xs leading-relaxed">{research2.secondOpinion}</p>
              </div>
            )}
          </div>
        )}

        {/* Conflict Resolution Note */}
        <div className="mt-6 bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-[#C9A961]" />
            <h3 className="text-[#C9A961] text-sm font-semibold">Beth's Conflict Resolution Protocol</h3>
          </div>
          <p className="text-[#F5E6C8] text-xs leading-relaxed">
            When models disagree on direction or conviction, Beth applies the conflict resolution framework:
            (1) Identify whether disagreement is factual or interpretive,
            (2) Apply specialist track record weights,
            (3) Check if disagreement is regime-dependent,
            (4) Take a position with explicit caveats noting the dissent.
            Models using different training data often surface risks that a single model misses.
          </p>
        </div>

        {/* Footer */}
        <footer className="border-t border-[#1F1A0F] mt-8 pt-6 pb-8 text-center">
          <img src={LOGO_URL} alt="Armstrong Arikat" className="h-10 mx-auto mb-2 opacity-60" />
          <p className="text-[#8A7548] text-[10px]">Multi-model comparison helps identify blind spots. When all 3 models agree, conviction is highest. When they disagree, deeper analysis is warranted.</p>
        </footer>
      </main>
    </div>
  );
}
