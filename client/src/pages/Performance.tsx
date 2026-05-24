/*
 * Performance Dashboard — Armstrong Arikat Research Terminal
 * Visual leaderboard, hit rates, recommendation history, agent run logs
 */

import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy, TrendingUp, TrendingDown, Activity, Clock, Target, BarChart3 } from "lucide-react";

const LOGO_URL = "/manus-storage/aa-logo_4d0e4c30.png";

export default function Performance() {
  const { data: stats } = trpc.performance.stats.useQuery();
  const { data: runs } = trpc.performance.runs.useQuery();
  const { data: recs } = trpc.performance.recommendations.useQuery();

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
              <h1 className="text-[#C9A961] text-xl font-semibold" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Performance Dashboard</h1>
              <p className="text-[#8A7548] text-xs">Specialist Leaderboard • Hit Rates • Recommendation Tracking</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#C9A961]" />
            <span className="text-[#C9A961] text-xs">{stats?.length || 0} Specialists Tracked</span>
          </div>
        </div>
      </header>

      <main className="relative z-10 px-4 py-6 max-w-[1200px] mx-auto space-y-8">

        {/* Leaderboard */}
        <section>
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#1F1A0F]">
            <Trophy className="w-5 h-5 text-[#C9A961]" />
            <h2 className="text-[#C9A961] text-2xl" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Specialist Leaderboard</h2>
          </div>

          {stats && stats.length > 0 ? (
            <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#C9A961]/20 bg-[#0A0A0A]">
                    <th className="text-left py-2.5 px-3 text-[#C9A961] text-[10px] uppercase tracking-[1px]">Rank</th>
                    <th className="text-left py-2.5 px-3 text-[#C9A961] text-[10px] uppercase tracking-[1px]">Specialist</th>
                    <th className="text-center py-2.5 px-3 text-[#C9A961] text-[10px] uppercase tracking-[1px]">Hit Rate</th>
                    <th className="text-center py-2.5 px-3 text-[#C9A961] text-[10px] uppercase tracking-[1px]">Hits/Misses</th>
                    <th className="text-center py-2.5 px-3 text-[#C9A961] text-[10px] uppercase tracking-[1px]">Avg Return</th>
                    <th className="text-center py-2.5 px-3 text-[#C9A961] text-[10px] uppercase tracking-[1px]">Best</th>
                    <th className="text-center py-2.5 px-3 text-[#C9A961] text-[10px] uppercase tracking-[1px]">Worst</th>
                    <th className="text-center py-2.5 px-3 text-[#C9A961] text-[10px] uppercase tracking-[1px]">Weight</th>
                    <th className="text-center py-2.5 px-3 text-[#C9A961] text-[10px] uppercase tracking-[1px]">Total Recs</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((s, i) => (
                    <tr key={s.specialistSlug} className="border-b border-[#1F1A0F]/50 hover:bg-[#C9A961]/5">
                      <td className="py-2.5 px-3 text-[#8A7548] text-xs">{i + 1}</td>
                      <td className="py-2.5 px-3">
                        <span className="text-[#C9A961] text-xs font-medium cursor-pointer hover:underline" onClick={() => window.location.href = `/analyst/${s.specialistSlug}`}>{s.specialistName}</span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`text-xs font-bold ${(s.hitRate || 0) >= 0.6 ? "text-[#4ADE80]" : (s.hitRate || 0) >= 0.4 ? "text-[#F59E0B]" : "text-[#EF4444]"}`}>
                          {((s.hitRate || 0) * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center text-[#F5E6C8] text-xs">{s.hits}/{s.misses}</td>
                      <td className={`py-2.5 px-3 text-center text-xs font-medium ${(s.avgReturn || 0) >= 0 ? "text-[#4ADE80]" : "text-[#EF4444]"}`}>
                        {(s.avgReturn || 0) >= 0 ? "+" : ""}{(s.avgReturn || 0).toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-3 text-center text-[#4ADE80] text-xs">+{(s.bestReturn || 0).toFixed(1)}%</td>
                      <td className="py-2.5 px-3 text-center text-[#EF4444] text-xs">{(s.worstReturn || 0).toFixed(1)}%</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`text-xs font-semibold ${(s.weight || 1) >= 1.0 ? "text-[#4ADE80]" : "text-[#EF4444]"}`}>
                          {(s.weight || 1).toFixed(2)}x
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center text-[#8A7548] text-xs">{s.totalRecs}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-8 text-center">
              <BarChart3 className="w-8 h-8 text-[#8A7548] mx-auto mb-3" />
              <p className="text-[#C9A961] text-sm font-medium mb-1">No Performance Data Yet</p>
              <p className="text-[#8A7548] text-xs">Performance tracking begins when recommendations are logged and closed. Click "Run All Agents" on the main dashboard to generate research, then recommendations will be tracked automatically.</p>
            </div>
          )}
        </section>

        {/* Active Recommendations */}
        <section>
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#1F1A0F]">
            <Target className="w-5 h-5 text-[#C9A961]" />
            <h2 className="text-[#C9A961] text-2xl" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Active Recommendations</h2>
          </div>

          {recs && recs.length > 0 ? (
            <div className="space-y-2">
              {recs.map((rec) => (
                <div key={rec.id} className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-[#C9A961] text-sm font-bold">{rec.ticker}</span>
                    <span className="text-[#F5E6C8] text-xs">{rec.specialistName}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold ${rec.action.includes("BUY") ? "bg-[#4ADE80]/20 text-[#4ADE80]" : "bg-[#F59E0B]/20 text-[#F59E0B]"}`}>{rec.action}</span>
                    <span className="text-[#8A7548] text-[10px]">Conv: {rec.conviction}/10</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[#F5E6C8] text-xs">Entry: ${rec.priceAtRec?.toFixed(2)}</span>
                    <span className="text-[#C9A961] text-xs">Target: {rec.priceTarget}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold ${rec.status === "active" ? "bg-[#C9A961]/20 text-[#C9A961]" : rec.status === "hit" ? "bg-[#4ADE80]/20 text-[#4ADE80]" : "bg-[#EF4444]/20 text-[#EF4444]"}`}>{rec.status}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-6 text-center">
              <Target className="w-6 h-6 text-[#8A7548] mx-auto mb-2" />
              <p className="text-[#8A7548] text-xs">No active recommendations yet. Recommendations are auto-logged when agents generate research.</p>
            </div>
          )}
        </section>

        {/* Recent Agent Runs */}
        <section>
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#1F1A0F]">
            <Activity className="w-5 h-5 text-[#4ADE80]" />
            <h2 className="text-[#C9A961] text-2xl" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Recent Agent Runs</h2>
          </div>

          {runs && runs.length > 0 ? (
            <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#C9A961]/20 bg-[#0A0A0A]">
                    <th className="text-left py-2 px-3 text-[#C9A961] text-[10px] uppercase tracking-[1px]">Specialist</th>
                    <th className="text-center py-2 px-3 text-[#C9A961] text-[10px] uppercase tracking-[1px]">Type</th>
                    <th className="text-center py-2 px-3 text-[#C9A961] text-[10px] uppercase tracking-[1px]">Status</th>
                    <th className="text-center py-2 px-3 text-[#C9A961] text-[10px] uppercase tracking-[1px]">Duration</th>
                    <th className="text-left py-2 px-3 text-[#C9A961] text-[10px] uppercase tracking-[1px]">Preview</th>
                    <th className="text-right py-2 px-3 text-[#C9A961] text-[10px] uppercase tracking-[1px]">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run) => (
                    <tr key={run.id} className="border-b border-[#1F1A0F]/50 hover:bg-[#C9A961]/5">
                      <td className="py-2 px-3 text-[#C9A961] text-xs font-medium">{run.specialistName}</td>
                      <td className="py-2 px-3 text-center">
                        <span className="text-[#8A7548] text-[10px] uppercase">{run.runType}</span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className={`text-[10px] uppercase font-bold ${run.status === "success" ? "text-[#4ADE80]" : "text-[#EF4444]"}`}>{run.status}</span>
                      </td>
                      <td className="py-2 px-3 text-center text-[#8A7548] text-xs">{run.durationMs ? `${(run.durationMs / 1000).toFixed(1)}s` : "—"}</td>
                      <td className="py-2 px-3 text-[#F5E6C8]/60 text-[10px] max-w-[200px] truncate">{run.researchPreview?.slice(0, 80) || "—"}</td>
                      <td className="py-2 px-3 text-right text-[#8A7548] text-[10px]">{run.createdAt ? new Date(run.createdAt).toLocaleString() : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-6 text-center">
              <Clock className="w-6 h-6 text-[#8A7548] mx-auto mb-2" />
              <p className="text-[#8A7548] text-xs">No agent runs logged yet. Click "Run All Agents" on the main dashboard to start generating research.</p>
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="border-t border-[#1F1A0F] pt-6 pb-8 text-center">
          <img src={LOGO_URL} alt="Armstrong Arikat" className="h-10 mx-auto mb-2 opacity-60" />
          <p className="text-[#8A7548] text-[10px]">Performance tracking updates automatically as recommendations are logged and closed. Hit rates and weights recalculate in real-time.</p>
        </footer>
      </main>
    </div>
  );
}
