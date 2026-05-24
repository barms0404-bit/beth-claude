/*
 * Intelligence Dashboard — Armstrong Arikat Research Terminal
 * Fed Futures, Sector Rotation, Short Interest, Contrarian Alerts, Institutional Holdings
 * Interactive charts and real-time data
 */

import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, TrendingUp, TrendingDown, AlertTriangle, BarChart3, Target, Zap } from "lucide-react";

const LOGO_URL = "/manus-storage/aa-logo_4d0e4c30.png";

export default function Intelligence() {
  const [selectedTicker, setSelectedTicker] = useState("NVDA");
  const { data: fedData } = trpc.intelligence.fedFutures.useQuery();
  const { data: sectorData } = trpc.intelligence.sectorRotation.useQuery();
  const { data: shortData } = trpc.intelligence.shortInterest.useQuery({ ticker: selectedTicker });
  const { data: holdingsData } = trpc.intelligence.holdings.useQuery({ ticker: selectedTicker });
  const { data: contrarianData } = trpc.intelligence.contrarian.useQuery();
  const { data: healthData } = trpc.intelligence.portfolioHealth.useQuery();

  const tickers = ["NVDA", "AVGO", "AMD", "LLY", "MSFT", "PANW", "META", "TSLA", "SMCI", "ARM"];

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
              <h1 className="text-[#C9A961] text-xl font-semibold" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Intelligence Center</h1>
              <p className="text-[#8A7548] text-xs">Fed Futures • Sector Rotation • Short Interest • Institutional Holdings • Contrarian Alerts</p>
            </div>
          </div>
        </div>
        {/* Ticker selector */}
        <div className="flex items-center gap-1 px-4 py-2 border-t border-[#1F1A0F] overflow-x-auto">
          <span className="text-[#8A7548] text-[10px] mr-2">TICKER:</span>
          {tickers.map(t => (
            <button key={t} onClick={() => setSelectedTicker(t)} className={`px-2.5 py-1 rounded text-[10px] font-semibold transition-all ${selectedTicker === t ? "bg-[#C9A961]/20 text-[#C9A961] border border-[#C9A961]/50" : "text-[#8A7548] hover:text-[#C9A961]"}`}>{t}</button>
          ))}
        </div>
      </header>

      <main className="relative z-10 px-4 py-6 max-w-[1400px] mx-auto space-y-8">

        {/* Fed Funds Futures */}
        <section>
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#1F1A0F]">
            <Shield className="w-5 h-5 text-[#C9A961]" />
            <h2 className="text-[#C9A961] text-2xl" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Fed Funds Futures</h2>
          </div>
          {fedData ? (
            <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center p-3 bg-[#0A0A0A] rounded border border-[#1F1A0F]">
                  <p className="text-[#8A7548] text-[10px] uppercase">Current Rate</p>
                  <p className="text-[#C9A961] text-xl font-bold">{fedData.currentRate}</p>
                </div>
                <div className="text-center p-3 bg-[#0A0A0A] rounded border border-[#1F1A0F]">
                  <p className="text-[#8A7548] text-[10px] uppercase">Next FOMC</p>
                  <p className="text-[#F5E6C8] text-sm font-medium">{fedData.nextMeeting}</p>
                </div>
                <div className="text-center p-3 bg-[#0A0A0A] rounded border border-[#1F1A0F]">
                  <p className="text-[#8A7548] text-[10px] uppercase">Year-End Forecast</p>
                  <p className="text-[#F5E6C8] text-sm font-medium">{fedData.yearEndRate}</p>
                </div>
                <div className="text-center p-3 bg-[#0A0A0A] rounded border border-[#1F1A0F]">
                  <p className="text-[#8A7548] text-[10px] uppercase">Stance</p>
                  <p className={`text-sm font-bold ${fedData.marketExpectation === "HAWKISH" ? "text-[#EF4444]" : fedData.marketExpectation === "DOVISH" ? "text-[#4ADE80]" : "text-[#F59E0B]"}`}>{fedData.marketExpectation}</p>
                </div>
              </div>
              {/* Probability Bar Chart */}
              <div className="flex items-end gap-2 h-32 mb-3">
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-[#EF4444]/20 rounded-t" style={{ height: `${fedData.probHike}%` }}>
                    <div className="w-full h-full bg-[#EF4444]/60 rounded-t"></div>
                  </div>
                  <p className="text-[#EF4444] text-xs font-bold mt-1">{fedData.probHike}%</p>
                  <p className="text-[#8A7548] text-[9px]">HIKE</p>
                </div>
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-[#F59E0B]/20 rounded-t" style={{ height: `${fedData.probHold}%` }}>
                    <div className="w-full h-full bg-[#F59E0B]/60 rounded-t"></div>
                  </div>
                  <p className="text-[#F59E0B] text-xs font-bold mt-1">{fedData.probHold}%</p>
                  <p className="text-[#8A7548] text-[9px]">HOLD</p>
                </div>
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-[#4ADE80]/20 rounded-t" style={{ height: `${fedData.probCut}%` }}>
                    <div className="w-full h-full bg-[#4ADE80]/60 rounded-t"></div>
                  </div>
                  <p className="text-[#4ADE80] text-xs font-bold mt-1">{fedData.probCut}%</p>
                  <p className="text-[#8A7548] text-[9px]">CUT</p>
                </div>
              </div>
              <p className="text-[#F5E6C8] text-xs leading-relaxed">{fedData.commentary}</p>
            </div>
          ) : <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-6 text-center"><p className="text-[#8A7548] text-xs">Loading Fed data...</p></div>}
        </section>

        {/* Sector Rotation */}
        <section>
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#1F1A0F]">
            <BarChart3 className="w-5 h-5 text-[#C9A961]" />
            <h2 className="text-[#C9A961] text-2xl" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Sector Rotation</h2>
            <span className="text-[#8A7548] text-xs ml-2">Relative strength vs SPY</span>
          </div>
          {sectorData && sectorData.length > 0 ? (
            <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-5">
              {/* Horizontal bar chart */}
              <div className="space-y-2">
                {(sectorData as any[]).map((s: any) => (
                  <div key={s.ticker} className="flex items-center gap-3">
                    <span className="text-[#F5E6C8] text-xs w-32 text-right">{s.sector}</span>
                    <span className="text-[#8A7548] text-[10px] w-10">{s.ticker}</span>
                    <div className="flex-1 h-6 bg-[#0A0A0A] rounded relative overflow-hidden">
                      <div
                        className={`absolute top-0 h-full rounded ${s.relativeStrength >= 0 ? "bg-[#4ADE80]/40 left-1/2" : "bg-[#EF4444]/40 right-1/2"}`}
                        style={{ width: `${Math.min(Math.abs(s.relativeStrength) * 20, 50)}%` }}
                      ></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-[10px] font-bold ${s.relativeStrength >= 0 ? "text-[#4ADE80]" : "text-[#EF4444]"}`}>
                          {s.relativeStrength >= 0 ? "+" : ""}{s.relativeStrength.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                    <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded w-24 text-center ${s.signal === "OVERWEIGHT" ? "bg-[#4ADE80]/20 text-[#4ADE80]" : s.signal === "UNDERWEIGHT" ? "bg-[#EF4444]/20 text-[#EF4444]" : "bg-[#8A7548]/20 text-[#8A7548]"}`}>
                      {s.signal}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-6 text-center"><p className="text-[#8A7548] text-xs">Loading sector data...</p></div>}
        </section>

        {/* Short Interest + Holdings for selected ticker */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Short Interest */}
          <section>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#1F1A0F]">
              <AlertTriangle className="w-5 h-5 text-[#F59E0B]" />
              <h2 className="text-[#C9A961] text-lg" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Short Interest — {selectedTicker}</h2>
            </div>
            {shortData ? (
              <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-5">
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 bg-[#0A0A0A] rounded border border-[#1F1A0F] text-center">
                    <p className="text-[#8A7548] text-[9px] uppercase">% of Float Short</p>
                    <p className={`text-xl font-bold ${shortData.shortPctFloat > 15 ? "text-[#EF4444]" : shortData.shortPctFloat > 8 ? "text-[#F59E0B]" : "text-[#4ADE80]"}`}>{shortData.shortPctFloat.toFixed(1)}%</p>
                  </div>
                  <div className="p-3 bg-[#0A0A0A] rounded border border-[#1F1A0F] text-center">
                    <p className="text-[#8A7548] text-[9px] uppercase">Days to Cover</p>
                    <p className="text-[#F5E6C8] text-xl font-bold">{shortData.daysTocover.toFixed(1)}</p>
                  </div>
                </div>
                {/* Visual gauge */}
                <div className="relative h-8 bg-[#0A0A0A] rounded overflow-hidden mb-2">
                  <div className={`absolute top-0 left-0 h-full rounded ${shortData.signal === "SQUEEZE_RISK" ? "bg-[#EF4444]/60" : shortData.signal === "ELEVATED" ? "bg-[#F59E0B]/60" : "bg-[#4ADE80]/60"}`} style={{ width: `${Math.min(shortData.shortPctFloat * 2.5, 100)}%` }}></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-[10px] font-bold uppercase ${shortData.signal === "SQUEEZE_RISK" ? "text-[#EF4444]" : shortData.signal === "ELEVATED" ? "text-[#F59E0B]" : "text-[#4ADE80]"}`}>{shortData.signal.replace("_", " ")}</span>
                  </div>
                </div>
                <div className="flex justify-between text-[9px] text-[#8A7548]">
                  <span>0%</span><span>10%</span><span>20%</span><span>30%</span><span>40%+</span>
                </div>
              </div>
            ) : <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-6 text-center"><p className="text-[#8A7548] text-xs">Loading...</p></div>}
          </section>

          {/* Institutional Holdings */}
          <section>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#1F1A0F]">
              <Target className="w-5 h-5 text-[#C9A961]" />
              <h2 className="text-[#C9A961] text-lg" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Top Holders — {selectedTicker}</h2>
            </div>
            <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-4 max-h-[300px] overflow-y-auto">
              {holdingsData && holdingsData.length > 0 ? (
                <div className="space-y-2">
                  {(holdingsData as any[]).slice(0, 10).map((h: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded bg-[#0A0A0A]">
                      <div className="flex-1">
                        <p className="text-[#F5E6C8] text-xs font-medium truncate">{h.institution}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[#8A7548] text-[10px]">{(h.shares / 1000000).toFixed(1)}M shares</span>
                        <span className={`text-[10px] font-bold ${h.changeShares > 0 ? "text-[#4ADE80]" : h.changeShares < 0 ? "text-[#EF4444]" : "text-[#8A7548]"}`}>
                          {h.changeShares > 0 ? "+" : ""}{h.changeShares !== 0 ? (h.changePct).toFixed(1) + "%" : "—"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[#8A7548] text-xs text-center py-4">Institutional holdings data loading or unavailable for {selectedTicker}.</p>
              )}
            </div>
          </section>
        </div>

        {/* Contrarian Alerts */}
        <section>
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#1F1A0F]">
            <Zap className="w-5 h-5 text-[#4ADE80]" />
            <h2 className="text-[#C9A961] text-2xl" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Consensus vs Contrarian Alerts</h2>
            <span className="text-[#8A7548] text-xs ml-2">Where your AI disagrees with Wall Street</span>
          </div>
          {contrarianData && contrarianData.length > 0 ? (
            <div className="space-y-3">
              {(contrarianData as any[]).map((alert: any, i: number) => (
                <div key={i} className={`bg-[#0F0F0F] border rounded-lg p-4 ${alert.significance === "HIGH" ? "border-[#4ADE80]/50" : "border-[#1F1A0F]"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-[#C9A961] text-sm font-bold">{alert.ticker}</span>
                      <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded ${alert.alertType === "AI_MORE_BULLISH" ? "bg-[#4ADE80]/20 text-[#4ADE80]" : "bg-[#EF4444]/20 text-[#EF4444]"}`}>
                        {alert.alertType.replace(/_/g, " ")}
                      </span>
                      <span className={`text-[9px] uppercase px-2 py-0.5 rounded ${alert.significance === "HIGH" ? "bg-[#C9A961]/20 text-[#C9A961]" : "bg-[#8A7548]/20 text-[#8A7548]"}`}>
                        {alert.significance}
                      </span>
                    </div>
                    <span className="text-[#F5E6C8] text-xs">Divergence: {alert.divergencePct > 0 ? "+" : ""}{alert.divergencePct.toFixed(0)}%</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-2">
                    <div className="p-2 bg-[#0A0A0A] rounded">
                      <p className="text-[#8A7548] text-[9px]">AI Target</p>
                      <p className="text-[#4ADE80] text-sm font-bold">${alert.aiTarget?.toFixed(0)} <span className="text-[10px] text-[#8A7548]">(Conv {alert.aiConviction})</span></p>
                    </div>
                    <div className="p-2 bg-[#0A0A0A] rounded">
                      <p className="text-[#8A7548] text-[9px]">Wall Street Target</p>
                      <p className="text-[#F5E6C8] text-sm font-bold">${alert.wallStreetTarget?.toFixed(0)}</p>
                    </div>
                  </div>
                  <p className="text-[#F5E6C8] text-xs">{alert.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-6 text-center">
              <Zap className="w-6 h-6 text-[#8A7548] mx-auto mb-2" />
              <p className="text-[#8A7548] text-xs">Contrarian alerts generate when active recommendations diverge from Wall Street consensus. Run All Agents first to populate.</p>
            </div>
          )}
        </section>

        {/* Portfolio Health */}
        {healthData && (
          <section>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#1F1A0F]">
              <Shield className="w-5 h-5 text-[#C9A961]" />
              <h2 className="text-[#C9A961] text-2xl" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Portfolio Health</h2>
            </div>
            <div className={`bg-[#0F0F0F] border rounded-lg p-5 ${(healthData as any).level === "HIGH" ? "border-[#EF4444]/50" : "border-[#1F1A0F]"}`}>
              <div className="flex items-center gap-3 mb-3">
                <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded ${(healthData as any).level === "HIGH" ? "bg-[#EF4444]/20 text-[#EF4444]" : (healthData as any).level === "MEDIUM" ? "bg-[#F59E0B]/20 text-[#F59E0B]" : "bg-[#4ADE80]/20 text-[#4ADE80]"}`}>
                  {(healthData as any).level} CONCENTRATION
                </span>
                <span className="text-[#F5E6C8] text-xs">Top Sector: {(healthData as any).topSector} ({(healthData as any).concentrationPct}%)</span>
              </div>
              <p className="text-[#F5E6C8] text-sm">{(healthData as any).message}</p>
              {/* Diversification gauge */}
              <div className="mt-3 relative h-4 bg-[#0A0A0A] rounded overflow-hidden">
                <div className="absolute top-0 left-0 h-full bg-[#C9A961]/40 rounded" style={{ width: `${(healthData as any).diversificationScore}%` }}></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[#C9A961] text-[9px] font-bold">Diversification: {(healthData as any).diversificationScore}/100</span>
                </div>
              </div>
            </div>
          </section>
        )}

        <footer className="border-t border-[#1F1A0F] pt-6 pb-8 text-center">
          <img src={LOGO_URL} alt="Armstrong Arikat" className="h-10 mx-auto mb-2 opacity-60" />
          <p className="text-[#8A7548] text-[10px]">Intelligence data refreshes with each page load. Fed futures from FRED. Short interest from Polygon.io. Institutional holdings from SEC 13F filings. Contrarian alerts compare AI targets vs Wall Street consensus from Alpha Vantage.</p>
        </footer>
      </main>
    </div>
  );
}
