/*
 * Backtesting Dashboard — Armstrong Arikat Research Terminal
 * Visualizes recommendation outcomes, conviction calibration, sector rotation, and portfolio health
 */

import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Target, TrendingUp, TrendingDown, BarChart3, Shield, Zap, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const LOGO_URL = "/manus-storage/aa-logo_4d0e4c30.png";

export default function Backtesting() {
  const { data: calibration } = trpc.learning.calibration.useQuery({});
  const { data: earnings } = trpc.learning.earnings.useQuery({});
  const { data: recs } = trpc.performance.recommendations.useQuery();
  const runBacktest = trpc.learning.backtest.useMutation({
    onSuccess: (data) => toast.success(`Backtest complete: ${data.evaluated} evaluated, ${data.closed} closed, ${data.journalEntries} journal entries`),
    onError: (e) => toast.error(`Backtest failed: ${e.message}`),
  });

  return (
    <div className="min-h-screen bg-[#000000] relative">
      <div className="fixed inset-0 z-0 pointer-events-none flex items-center justify-center" style={{ opacity: 0.04 }}>
        <img src={LOGO_URL} alt="" className="w-[60vw] max-w-[800px]" />
      </div>

      <header className="sticky top-0 z-50 border-b-4 border-[#C9A961] bg-[#000000]/97 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/"><Button variant="outline" size="sm" className="bg-transparent border-[#C9A961]/30 text-[#C9A961] hover:bg-[#C9A961]/10 text-xs"><ArrowLeft className="w-3 h-3 mr-1" /> Terminal</Button></Link>
            <div>
              <h1 className="text-[#C9A961] text-xl font-semibold" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Backtesting & Intelligence</h1>
              <p className="text-[#8A7548] text-xs">Conviction Calibration • Earnings Calendar • Sector Rotation • Portfolio Health</p>
            </div>
          </div>
          <Button onClick={() => runBacktest.mutate()} disabled={runBacktest.isPending} variant="outline" size="sm" className="bg-[#4ADE80]/10 border-[#4ADE80]/40 text-[#4ADE80] hover:bg-[#4ADE80]/20 text-[10px] uppercase">
            {runBacktest.isPending ? "Running..." : "Run Backtest"}
          </Button>
        </div>
      </header>

      <main className="relative z-10 px-4 py-6 max-w-[1400px] mx-auto space-y-8">

        {/* Conviction Calibration */}
        <section>
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#1F1A0F]">
            <Target className="w-5 h-5 text-[#C9A961]" />
            <h2 className="text-[#C9A961] text-2xl" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Conviction Calibration</h2>
            <span className="text-[#8A7548] text-xs ml-2">Are conviction scores accurate?</span>
          </div>

          {calibration && calibration.length > 0 ? (
            <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#C9A961]/20 bg-[#0A0A0A]">
                    <th className="text-left py-2.5 px-3 text-[#C9A961] text-[10px] uppercase tracking-[1px]">Specialist</th>
                    <th className="text-center py-2.5 px-3 text-[#C9A961] text-[10px] uppercase tracking-[1px]">Conviction</th>
                    <th className="text-center py-2.5 px-3 text-[#C9A961] text-[10px] uppercase tracking-[1px]">Actual Hit Rate</th>
                    <th className="text-center py-2.5 px-3 text-[#C9A961] text-[10px] uppercase tracking-[1px]">Expected</th>
                    <th className="text-center py-2.5 px-3 text-[#C9A961] text-[10px] uppercase tracking-[1px]">Gap</th>
                    <th className="text-center py-2.5 px-3 text-[#C9A961] text-[10px] uppercase tracking-[1px]">Avg Return</th>
                    <th className="text-center py-2.5 px-3 text-[#C9A961] text-[10px] uppercase tracking-[1px]">Sample</th>
                  </tr>
                </thead>
                <tbody>
                  {calibration.map((c: any, i: number) => (
                    <tr key={i} className="border-b border-[#1F1A0F]/50 hover:bg-[#C9A961]/5">
                      <td className="py-2.5 px-3 text-[#C9A961] text-xs font-medium">{c.specialist_name}</td>
                      <td className="py-2.5 px-3 text-center text-[#F5E6C8] text-xs">{c.conviction_level}/10</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`text-xs font-bold ${c.hit_rate_at_level >= 0.6 ? "text-[#4ADE80]" : c.hit_rate_at_level >= 0.4 ? "text-[#F59E0B]" : "text-[#EF4444]"}`}>
                          {(c.hit_rate_at_level * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center text-[#8A7548] text-xs">{c.conviction_level * 10}%</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`text-xs font-bold ${c.calibration_gap >= 0 ? "text-[#4ADE80]" : "text-[#EF4444]"}`}>
                          {c.calibration_gap >= 0 ? "+" : ""}{(c.calibration_gap * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className={`py-2.5 px-3 text-center text-xs ${c.avg_return_at_level >= 0 ? "text-[#4ADE80]" : "text-[#EF4444]"}`}>
                        {c.avg_return_at_level >= 0 ? "+" : ""}{c.avg_return_at_level.toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-3 text-center text-[#8A7548] text-xs">{c.total_at_level}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-8 text-center">
              <Target className="w-8 h-8 text-[#8A7548] mx-auto mb-3" />
              <p className="text-[#C9A961] text-sm font-medium mb-1">Calibration Data Building</p>
              <p className="text-[#8A7548] text-xs">Calibration data populates as recommendations are logged and closed. Click "Run All Agents" to start generating recommendations, then run backtest after 30 days.</p>
            </div>
          )}
        </section>

        {/* Earnings Calendar */}
        <section>
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#1F1A0F]">
            <AlertTriangle className="w-5 h-5 text-[#F59E0B]" />
            <h2 className="text-[#C9A961] text-2xl" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Upcoming Earnings</h2>
            <span className="text-[#8A7548] text-xs ml-2">Binary event risk for covered stocks</span>
          </div>

          {earnings && earnings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {earnings.map((e: any, i: number) => (
                <div key={i} className={`bg-[#0F0F0F] border rounded-lg p-4 ${e.daysUntil <= 3 ? "border-[#EF4444]/50" : e.daysUntil <= 7 ? "border-[#F59E0B]/50" : "border-[#1F1A0F]"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[#C9A961] text-sm font-bold">{e.ticker}</span>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${e.daysUntil <= 3 ? "bg-[#EF4444]/20 text-[#EF4444]" : e.daysUntil <= 7 ? "bg-[#F59E0B]/20 text-[#F59E0B]" : "bg-[#8A7548]/20 text-[#8A7548]"}`}>
                      {e.daysUntil === 0 ? "TODAY" : e.daysUntil === 1 ? "TOMORROW" : `${e.daysUntil} DAYS`}
                    </span>
                  </div>
                  <p className="text-[#F5E6C8] text-xs">{e.company}</p>
                  <p className="text-[#8A7548] text-[10px] mt-1">{e.date} {e.estimate ? `• ${e.estimate}` : ""}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-6 text-center">
              <p className="text-[#8A7548] text-xs">No upcoming earnings in the next 14 days for covered stocks.</p>
            </div>
          )}
        </section>

        {/* Active Recommendations Summary */}
        <section>
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#1F1A0F]">
            <BarChart3 className="w-5 h-5 text-[#C9A961]" />
            <h2 className="text-[#C9A961] text-2xl" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Portfolio Health</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-5 text-center">
              <p className="text-[#8A7548] text-[10px] uppercase tracking-[1px]">Active Positions</p>
              <p className="text-[#C9A961] text-3xl font-bold">{recs?.length || 0}</p>
            </div>
            <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-5 text-center">
              <p className="text-[#8A7548] text-[10px] uppercase tracking-[1px]">Avg Conviction</p>
              <p className="text-[#C9A961] text-3xl font-bold">
                {recs && recs.length > 0 ? (recs.reduce((s: number, r: any) => s + (r.conviction || 0), 0) / recs.length).toFixed(1) : "—"}
              </p>
            </div>
            <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-5 text-center">
              <p className="text-[#8A7548] text-[10px] uppercase tracking-[1px]">Diversification Score</p>
              <p className="text-[#4ADE80] text-3xl font-bold">—</p>
              <p className="text-[#8A7548] text-[10px]">Populates with active recs</p>
            </div>
          </div>
        </section>

        {/* How the Learning Loop Works */}
        <section>
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#1F1A0F]">
            <Zap className="w-5 h-5 text-[#4ADE80]" />
            <h2 className="text-[#C9A961] text-2xl" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Learning Loop Status</h2>
          </div>

          <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-5">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {[
                { step: "1", title: "Generate", desc: "AI creates research", status: "active" },
                { step: "2", title: "Auto-Log", desc: "Recs parsed & saved", status: "active" },
                { step: "3", title: "Backtest", desc: "Evaluate at 30 days", status: "waiting" },
                { step: "4", title: "Hindsight", desc: "AI post-mortem", status: "waiting" },
                { step: "5", title: "Evolve", desc: "Lessons → prompts", status: "active" },
              ].map((s) => (
                <div key={s.step} className="text-center p-3 bg-[#0A0A0A] rounded border border-[#1F1A0F]">
                  <p className="text-[#C9A961] text-lg font-bold">{s.step}</p>
                  <p className="text-[#F5E6C8] text-xs font-semibold">{s.title}</p>
                  <p className="text-[#8A7548] text-[10px] mt-1">{s.desc}</p>
                  <span className={`text-[9px] uppercase mt-2 inline-block px-2 py-0.5 rounded ${s.status === "active" ? "bg-[#4ADE80]/20 text-[#4ADE80]" : "bg-[#8A7548]/20 text-[#8A7548]"}`}>
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[#8A7548] text-xs mt-4 text-center">Steps 3-4 activate after 30 days of recommendation data. The system gets smarter every cycle.</p>
          </div>
        </section>

        <footer className="border-t border-[#1F1A0F] pt-6 pb-8 text-center">
          <img src={LOGO_URL} alt="Armstrong Arikat" className="h-10 mx-auto mb-2 opacity-60" />
          <p className="text-[#8A7548] text-[10px]">Backtesting evaluates recommendations at 30-day intervals. Conviction calibration shows the gap between predicted and actual accuracy. The learning loop continuously improves specialist prompts.</p>
        </footer>
      </main>
    </div>
  );
}
