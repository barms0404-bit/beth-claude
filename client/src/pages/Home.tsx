/* 
 * Armstrong Arikat Research Terminal — Sovereign Command Center
 * Design: Military command center meets private banking interface
 * Color: Black background, Gold (#C9A961) for actionable elements, Cream for text
 * Typography: Cormorant Garamond for headings, Inter for body/data
 */

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  ChevronDown,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Globe,
  Activity,
  Shield,
  Briefcase,
  Cpu,
  Heart,
  ShoppingBag,
  Zap,
} from "lucide-react";

const LOGO_URL = "/manus-storage/aa-logo_4d0e4c30.png";
const SPY_CHART = "/manus-storage/spy_chart_699a562f.png";
const NVDA_CHART = "/manus-storage/nvda_chart_7bda8308.png";
const LLY_CHART = "/manus-storage/lly_chart_b1ec7ac4.png";

// Section IDs for navigation
const SECTIONS = {
  snapshot: "market-snapshot",
  macro: "macro-advisory",
  tech: "tech-ai",
  healthcare: "healthcare",
  consumer: "consumer",
  top50: "top-50",
  tactical: "tactical-playbook",
  fixedIncome: "fixed-income",
  dividend: "dividend",
  geopolitical: "geopolitical",
};

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

// Market data
const indexData = [
  { name: "S&P 500", value: "7,473.47", change: "+0.37%", up: true },
  { name: "Nasdaq", value: "26,343.97", change: "+0.19%", up: true },
  { name: "Dow Jones", value: "50,579.70", change: "+0.58%", up: true },
  { name: "10Y Treasury", value: "4.87%", change: "+0.03", up: false },
];

const top50Data = [
  { ticker: "NVDA", company: "NVIDIA Corp", sector: "Technology", conviction: "High", price: "$208.27", change: "+4.2%", catalyst: "AI chip demand, $5.5T valuation" },
  { ticker: "AVGO", company: "Broadcom Inc", sector: "Technology", conviction: "High", price: "$289.45", change: "+2.8%", catalyst: "AI data center networking" },
  { ticker: "MSFT", company: "Microsoft", sector: "Technology", conviction: "High", price: "$418.57", change: "-0.12%", catalyst: "Enterprise AI integration" },
  { ticker: "LLY", company: "Eli Lilly", sector: "Healthcare", conviction: "High", price: "$892.30", change: "+1.4%", catalyst: "GLP-1 prescription growth" },
  { ticker: "COST", company: "Costco", sector: "Consumer", conviction: "Medium", price: "$1,045.20", change: "+0.8%", catalyst: "Defensive inflation play" },
  { ticker: "AMD", company: "AMD", sector: "Technology", conviction: "High", price: "$467.51", change: "+3.9%", catalyst: "AI GPU competition" },
  { ticker: "ARM", company: "ARM Holdings", sector: "Technology", conviction: "High", price: "$245.80", change: "+2.1%", catalyst: "Mobile AI chip architecture" },
  { ticker: "DELL", company: "Dell Technologies", sector: "Technology", conviction: "High", price: "$178.90", change: "+12.4%", catalyst: "$43B AI backlog" },
  { ticker: "QCOM", company: "Qualcomm", sector: "Technology", conviction: "Medium-High", price: "$241.15", change: "+13.0%", catalyst: "Partnership news, edge AI" },
  { ticker: "JPM", company: "JPMorgan Chase", sector: "Financials", conviction: "Medium", price: "$287.40", change: "+0.6%", catalyst: "Strong capital markets" },
];

export default function Home() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#000000] relative">
      {/* Logo Watermark Background */}
      <div
        className="fixed inset-0 z-0 pointer-events-none flex items-center justify-center"
        style={{ opacity: 0.04 }}
      >
        <img src={LOGO_URL} alt="" className="w-[60vw] max-w-[800px]" />
      </div>

      {/* Top Command Bar */}
      <header className="sticky top-0 z-50 border-b-4 border-[#C9A961] bg-[#000000]/95 backdrop-blur-sm">
        {/* Logo Row */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1F1A0F]">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="Armstrong Arikat" className="h-10 w-auto" />
            <div>
              <h1 className="text-[#C9A961] text-sm font-semibold tracking-[4px] uppercase" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                Research Terminal
              </h1>
              <p className="text-[#8A7548] text-[10px] tracking-[2px] uppercase">
                Private Wealth Group
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[#C9A961] text-xs font-medium">
              {currentTime.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
            <p className="text-[#8A7548] text-[10px]">
              {currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZoneName: "short" })}
            </p>
          </div>
        </div>

        {/* Navigation Buttons Row */}
        <nav className="flex items-center gap-1 px-4 py-2 overflow-x-auto">
          {/* Direct Push Buttons */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => scrollToSection(SECTIONS.snapshot)}
            className="bg-transparent border-[#C9A961]/30 text-[#C9A961] hover:bg-[#C9A961]/10 hover:border-[#C9A961] text-[11px] font-semibold tracking-[1px] uppercase whitespace-nowrap transition-all duration-100 active:scale-[0.97]"
          >
            <Activity className="w-3 h-3 mr-1.5" />
            Market Snapshot
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => scrollToSection(SECTIONS.macro)}
            className="bg-transparent border-[#C9A961]/30 text-[#C9A961] hover:bg-[#C9A961]/10 hover:border-[#C9A961] text-[11px] font-semibold tracking-[1px] uppercase whitespace-nowrap transition-all duration-100 active:scale-[0.97]"
          >
            <Globe className="w-3 h-3 mr-1.5" />
            Macro Advisory
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => scrollToSection(SECTIONS.top50)}
            className="bg-transparent border-[#C9A961]/30 text-[#C9A961] hover:bg-[#C9A961]/10 hover:border-[#C9A961] text-[11px] font-semibold tracking-[1px] uppercase whitespace-nowrap transition-all duration-100 active:scale-[0.97]"
          >
            <BarChart3 className="w-3 h-3 mr-1.5" />
            Top 50
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => scrollToSection(SECTIONS.tactical)}
            className="bg-transparent border-[#C9A961]/30 text-[#C9A961] hover:bg-[#C9A961]/10 hover:border-[#C9A961] text-[11px] font-semibold tracking-[1px] uppercase whitespace-nowrap transition-all duration-100 active:scale-[0.97]"
          >
            <Shield className="w-3 h-3 mr-1.5" />
            Tactical Playbook
          </Button>

          {/* Sector Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="bg-transparent border-[#C9A961]/30 text-[#C9A961] hover:bg-[#C9A961]/10 hover:border-[#C9A961] text-[11px] font-semibold tracking-[1px] uppercase whitespace-nowrap transition-all duration-100 active:scale-[0.97]"
              >
                <Briefcase className="w-3 h-3 mr-1.5" />
                Sectors
                <ChevronDown className="w-3 h-3 ml-1.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#0A0A0A] border-[#C9A961]/30">
              <DropdownMenuItem onClick={() => scrollToSection(SECTIONS.tech)} className="text-[#F5E6C8] hover:bg-[#C9A961]/10 focus:bg-[#C9A961]/10 focus:text-[#C9A961]">
                <Cpu className="w-3 h-3 mr-2 text-[#C9A961]" />
                Technology & AI
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => scrollToSection(SECTIONS.healthcare)} className="text-[#F5E6C8] hover:bg-[#C9A961]/10 focus:bg-[#C9A961]/10 focus:text-[#C9A961]">
                <Heart className="w-3 h-3 mr-2 text-[#C9A961]" />
                Healthcare & Biotech
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => scrollToSection(SECTIONS.consumer)} className="text-[#F5E6C8] hover:bg-[#C9A961]/10 focus:bg-[#C9A961]/10 focus:text-[#C9A961]">
                <ShoppingBag className="w-3 h-3 mr-2 text-[#C9A961]" />
                Consumer Discretionary
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#1F1A0F]" />
              <DropdownMenuItem onClick={() => scrollToSection(SECTIONS.fixedIncome)} className="text-[#F5E6C8] hover:bg-[#C9A961]/10 focus:bg-[#C9A961]/10 focus:text-[#C9A961]">
                <Briefcase className="w-3 h-3 mr-2 text-[#C9A961]" />
                Fixed Income
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => scrollToSection(SECTIONS.dividend)} className="text-[#F5E6C8] hover:bg-[#C9A961]/10 focus:bg-[#C9A961]/10 focus:text-[#C9A961]">
                <TrendingUp className="w-3 h-3 mr-2 text-[#C9A961]" />
                Dividend & Income
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Research Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="bg-transparent border-[#C9A961]/30 text-[#C9A961] hover:bg-[#C9A961]/10 hover:border-[#C9A961] text-[11px] font-semibold tracking-[1px] uppercase whitespace-nowrap transition-all duration-100 active:scale-[0.97]"
              >
                <Zap className="w-3 h-3 mr-1.5" />
                Research
                <ChevronDown className="w-3 h-3 ml-1.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#0A0A0A] border-[#C9A961]/30">
              <DropdownMenuItem onClick={() => scrollToSection(SECTIONS.geopolitical)} className="text-[#F5E6C8] hover:bg-[#C9A961]/10 focus:bg-[#C9A961]/10 focus:text-[#C9A961]">
                <Globe className="w-3 h-3 mr-2 text-[#C9A961]" />
                Geopolitical Strategy
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => scrollToSection(SECTIONS.macro)} className="text-[#F5E6C8] hover:bg-[#C9A961]/10 focus:bg-[#C9A961]/10 focus:text-[#C9A961]">
                <Activity className="w-3 h-3 mr-2 text-[#C9A961]" />
                Economic Advisory
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => scrollToSection(SECTIONS.fixedIncome)} className="text-[#F5E6C8] hover:bg-[#C9A961]/10 focus:bg-[#C9A961]/10 focus:text-[#C9A961]">
                <BarChart3 className="w-3 h-3 mr-2 text-[#C9A961]" />
                Fixed Income Analysis
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-4 py-6 max-w-[1440px] mx-auto space-y-8">

        {/* SECTION: Market Snapshot */}
        <section id={SECTIONS.snapshot}>
          <SectionHeader title="Market Snapshot" subtitle="Live Index Performance" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {indexData.map((idx) => (
              <div
                key={idx.name}
                className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-4 hover:border-[#3A2F1F] transition-colors duration-150"
              >
                <p className="text-[#8A7548] text-xs uppercase tracking-[1px] mb-1">{idx.name}</p>
                <p className="text-[#F5E6C8] text-2xl font-semibold" style={{ fontFamily: "'Inter', sans-serif", fontVariantNumeric: "tabular-nums" }}>
                  {idx.value}
                </p>
                <p className={`text-sm font-medium mt-1 ${idx.up ? "text-[#4ADE80]" : "text-[#EF4444]"}`}>
                  {idx.up ? <TrendingUp className="w-3 h-3 inline mr-1" /> : <TrendingDown className="w-3 h-3 inline mr-1" />}
                  {idx.change}
                </p>
              </div>
            ))}
          </div>
          <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-4">
            <p className="text-[#C9A961] text-sm font-medium mb-3 uppercase tracking-[1px]">S&P 500 — 1 Month Trend</p>
            <img src={SPY_CHART} alt="S&P 500 Chart" className="w-full rounded" />
          </div>
          <div className="mt-4 bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-5">
            <p className="text-[#F5E6C8] text-sm leading-relaxed">
              The S&P 500 continues its record-breaking run, finishing its <strong className="text-[#C9A961]">eighth consecutive week</strong> in the green, closing at 7,473.47. 
              The Dow Jones Industrial Average surged past 50,500, setting fresh record highs. The rally is broad-based with technology, financials, and industrials all contributing. 
              U.S. markets will be closed Monday for Memorial Day. Traders continue to watch for developments in U.S.-Iran peace negotiations and any steps toward reopening the Strait of Hormuz.
            </p>
          </div>
        </section>

        {/* SECTION: Macroeconomic Advisory */}
        <section id={SECTIONS.macro}>
          <SectionHeader title="Macroeconomic Advisory" subtitle="Chief Economist & Fixed Income Strategy" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-5 border-l-4 border-l-[#C9A961]">
              <h4 className="text-[#C9A961] text-lg mb-3" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Chief Economist View</h4>
              <p className="text-[#F5E6C8] text-sm leading-relaxed mb-3">
                The broader macroeconomic picture presents a <strong className="text-[#C9A961]">divergence between stock market performance and consumer sentiment</strong>. 
                While equities soar, the University of Michigan's May Survey of Consumers hit new lows due to persistent inflation and gas prices.
              </p>
              <p className="text-[#F5E6C8] text-sm leading-relaxed mb-3">
                The Fed funds rate is expected to remain steady in the <strong className="text-[#C9A961]">3.50%-3.75% range</strong>, with a growing 37% probability of rate hikes 
                in late 2026 or 2027 if inflation remains sticky. Goldman Sachs has warned of a growing risk that rising yields and inflation could trigger a stock market correction.
              </p>
              <div className="mt-4 p-3 bg-[#0A0A0A] rounded border border-[#1F1A0F]">
                <p className="text-[#8A7548] text-xs uppercase tracking-[1px] mb-1">Key Risk</p>
                <p className="text-[#EF4444] text-sm">Consumer sentiment at new lows while equities at all-time highs — historical divergence often precedes correction.</p>
              </div>
            </div>
            <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-5 border-l-4 border-l-[#C9A961]">
              <h4 className="text-[#C9A961] text-lg mb-3" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Fixed Income Strategy</h4>
              <p className="text-[#F5E6C8] text-sm leading-relaxed mb-3">
                Treasury yields remain elevated near 2007 levels, putting pressure on rate-sensitive sectors. The 10-year yield has risen to approximately 4.87%, 
                while the 2-year remains inverted relative to historical norms.
              </p>
              <p className="text-[#F5E6C8] text-sm leading-relaxed mb-3">
                <strong className="text-[#C9A961]">Recommendation:</strong> Barbell strategy — holding short-duration T-bills for yield while accumulating high-quality corporate credit. 
                Avoid long-duration bonds until the Fed signals a clear pivot.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#0A0A0A] rounded border border-[#1F1A0F]">
                  <p className="text-[#8A7548] text-xs uppercase tracking-[1px]">Fed Funds Rate</p>
                  <p className="text-[#C9A961] text-lg font-semibold">3.50-3.75%</p>
                </div>
                <div className="p-3 bg-[#0A0A0A] rounded border border-[#1F1A0F]">
                  <p className="text-[#8A7548] text-xs uppercase tracking-[1px]">Hike Probability</p>
                  <p className="text-[#EF4444] text-lg font-semibold">37%</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: Technology & AI */}
        <section id={SECTIONS.tech}>
          <SectionHeader title="Technology & AI" subtitle="Thematic Focus — The AI 11" />
          <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-5 mb-4">
            <p className="text-[#F5E6C8] text-sm leading-relaxed mb-4">
              The <strong className="text-[#C9A961]">"AI 11"</strong> has officially replaced the Magnificent 7 as the core driver of tech performance. 
              The semiconductor and AI infrastructure buildout continues at an unprecedented pace, with Dell reporting a record $43 billion AI backlog and 
              NVIDIA surpassing $5.5 trillion in market capitalization.
            </p>
            <img src={NVDA_CHART} alt="NVIDIA Chart" className="w-full rounded mb-4" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { ticker: "NVDA", name: "NVIDIA", price: "$208.27", change: "+4.2%", note: "$5.5T market cap. Most valuable company globally. AI chip demand unprecedented." },
              { ticker: "AVGO", name: "Broadcom", price: "$289.45", change: "+2.8%", note: "Up 106% YoY. Network infrastructure for AI data centers. Custom ASIC leader." },
              { ticker: "MSFT", name: "Microsoft", price: "$418.57", change: "-0.12%", note: "Enterprise AI dominance through Copilot. $3.1T market cap." },
              { ticker: "DELL", name: "Dell Technologies", price: "$178.90", change: "+12.4%", note: "Record $43B AI backlog. AI revenues expected to double to $50B in FY2027." },
            ].map((stock) => (
              <div key={stock.ticker} className="bg-[#0A0A0A] border border-[#1F1A0F] rounded-lg p-4 hover:border-[#3A2F1F] transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-[#C9A961] font-semibold text-sm">{stock.ticker}</span>
                    <span className="text-[#8A7548] text-xs ml-2">{stock.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-[#F5E6C8] text-sm font-medium" style={{ fontVariantNumeric: "tabular-nums" }}>{stock.price}</p>
                    <p className={`text-xs ${stock.change.startsWith("+") ? "text-[#4ADE80]" : "text-[#EF4444]"}`}>{stock.change}</p>
                  </div>
                </div>
                <p className="text-[#F5E6C8]/80 text-xs leading-relaxed">{stock.note}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION: Healthcare & Biotech */}
        <section id={SECTIONS.healthcare}>
          <SectionHeader title="Healthcare & Biotech" subtitle="GLP-1 Megacycle & Biotech M&A" />
          <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-5 mb-4">
            <img src={LLY_CHART} alt="Eli Lilly Chart" className="w-full rounded mb-4" />
            <p className="text-[#F5E6C8] text-sm leading-relaxed">
              The <strong className="text-[#C9A961]">GLP-1 megacycle</strong> continues unabated with Eli Lilly and Novo Nordisk dominating the weight-loss drug market. 
              Manufacturing capacity remains the primary constraint, with both companies investing billions in production expansion. 
              Small-cap biotech is seeing a resurgence as M&A activity picks up, particularly in the oncology space.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#0A0A0A] border border-[#1F1A0F] rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[#C9A961] font-semibold">LLY</span>
                <span className="text-[#4ADE80] text-sm">+1.4%</span>
              </div>
              <p className="text-[#F5E6C8]/80 text-xs">Eli Lilly — GLP-1 prescription growth accelerating. Manufacturing expansion on track. Target: $950+</p>
            </div>
            <div className="bg-[#0A0A0A] border border-[#1F1A0F] rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[#C9A961] font-semibold">NVO</span>
                <span className="text-[#4ADE80] text-sm">+0.9%</span>
              </div>
              <p className="text-[#F5E6C8]/80 text-xs">Novo Nordisk — Wegovy supply improving. Oral GLP-1 pipeline advancing. Duopoly strengthening.</p>
            </div>
          </div>
        </section>

        {/* SECTION: Consumer Discretionary */}
        <section id={SECTIONS.consumer}>
          <SectionHeader title="Consumer Discretionary" subtitle="Inflation Impact & Trade-Down Effect" />
          <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-5">
            <p className="text-[#F5E6C8] text-sm leading-relaxed mb-4">
              Mixed signals in consumer spending. High-end retail remains resilient, but discount retailers like <strong className="text-[#C9A961]">Walmart (WMT)</strong> and 
              <strong className="text-[#C9A961]"> Costco (COST)</strong> are seeing increased foot traffic as consumers trade down due to inflation. 
              Consumer sentiment at new lows creates a cautious outlook for discretionary spending.
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-[#0A0A0A] rounded border border-[#1F1A0F] text-center">
                <p className="text-[#8A7548] text-[10px] uppercase tracking-[1px]">Consumer Sentiment</p>
                <p className="text-[#EF4444] text-lg font-semibold">New Low</p>
              </div>
              <div className="p-3 bg-[#0A0A0A] rounded border border-[#1F1A0F] text-center">
                <p className="text-[#8A7548] text-[10px] uppercase tracking-[1px]">WMT Traffic</p>
                <p className="text-[#4ADE80] text-lg font-semibold">+4.2%</p>
              </div>
              <div className="p-3 bg-[#0A0A0A] rounded border border-[#1F1A0F] text-center">
                <p className="text-[#8A7548] text-[10px] uppercase tracking-[1px]">COST Comps</p>
                <p className="text-[#4ADE80] text-lg font-semibold">+6.8%</p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION: Fixed Income */}
        <section id={SECTIONS.fixedIncome}>
          <SectionHeader title="Fixed Income Analysis" subtitle="Yield Curve & Credit Markets" />
          <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {[
                { label: "2Y Yield", value: "4.52%", status: "neutral" },
                { label: "10Y Yield", value: "4.87%", status: "danger" },
                { label: "30Y Yield", value: "5.12%", status: "danger" },
                { label: "2s10s Spread", value: "+35bps", status: "success" },
              ].map((item) => (
                <div key={item.label} className="p-3 bg-[#0A0A0A] rounded border border-[#1F1A0F] text-center">
                  <p className="text-[#8A7548] text-[10px] uppercase tracking-[1px]">{item.label}</p>
                  <p className={`text-lg font-semibold ${item.status === "danger" ? "text-[#EF4444]" : item.status === "success" ? "text-[#4ADE80]" : "text-[#C9A961]"}`}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-[#F5E6C8] text-sm leading-relaxed">
              The yield curve has normalized with the 2s10s spread turning positive at +35bps, ending the longest inversion in history. 
              However, elevated long-end yields near 2007 levels signal persistent inflation expectations. 
              Investment-grade credit spreads remain tight at ~90bps OAS, while high-yield spreads have widened slightly to ~350bps.
            </p>
          </div>
        </section>

        {/* SECTION: Dividend & Income */}
        <section id={SECTIONS.dividend}>
          <SectionHeader title="Dividend & Income" subtitle="Aristocrat Strategy & Yield Plays" />
          <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-5">
            <p className="text-[#F5E6C8] text-sm leading-relaxed mb-4">
              In the current environment of elevated yields and market uncertainty, <strong className="text-[#C9A961]">dividend aristocrats</strong> provide 
              a defensive anchor. We recommend allocating 10-15% of the portfolio to high-quality dividend growers with 25+ year track records.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1F1A0F]">
                    <th className="text-left py-2 text-[#C9A961] text-xs uppercase tracking-[1px]">Ticker</th>
                    <th className="text-left py-2 text-[#C9A961] text-xs uppercase tracking-[1px]">Company</th>
                    <th className="text-right py-2 text-[#C9A961] text-xs uppercase tracking-[1px]">Yield</th>
                    <th className="text-right py-2 text-[#C9A961] text-xs uppercase tracking-[1px]">Streak</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { ticker: "JNJ", name: "Johnson & Johnson", yield: "3.2%", streak: "62 yrs" },
                    { ticker: "PG", name: "Procter & Gamble", yield: "2.4%", streak: "68 yrs" },
                    { ticker: "KO", name: "Coca-Cola", yield: "2.9%", streak: "62 yrs" },
                    { ticker: "PEP", name: "PepsiCo", yield: "2.7%", streak: "52 yrs" },
                  ].map((d) => (
                    <tr key={d.ticker} className="border-b border-[#1F1A0F]/50 hover:bg-[#C9A961]/5">
                      <td className="py-2 text-[#C9A961] font-medium">{d.ticker}</td>
                      <td className="py-2 text-[#F5E6C8]">{d.name}</td>
                      <td className="py-2 text-right text-[#4ADE80]">{d.yield}</td>
                      <td className="py-2 text-right text-[#F5E6C8]">{d.streak}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* SECTION: Top 50 Recommendations */}
        <section id={SECTIONS.top50}>
          <SectionHeader title="Top 50 Recommendation Engine" subtitle="Composite Scoring & Specialist Polling" />
          <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#C9A961]/30">
                  <th className="text-left py-3 text-[#C9A961] text-xs uppercase tracking-[1px]">#</th>
                  <th className="text-left py-3 text-[#C9A961] text-xs uppercase tracking-[1px]">Ticker</th>
                  <th className="text-left py-3 text-[#C9A961] text-xs uppercase tracking-[1px]">Company</th>
                  <th className="text-left py-3 text-[#C9A961] text-xs uppercase tracking-[1px]">Sector</th>
                  <th className="text-center py-3 text-[#C9A961] text-xs uppercase tracking-[1px]">Conviction</th>
                  <th className="text-right py-3 text-[#C9A961] text-xs uppercase tracking-[1px]">Price</th>
                  <th className="text-right py-3 text-[#C9A961] text-xs uppercase tracking-[1px]">Change</th>
                  <th className="text-left py-3 text-[#C9A961] text-xs uppercase tracking-[1px] pl-4">Catalyst</th>
                </tr>
              </thead>
              <tbody>
                {top50Data.map((stock, i) => (
                  <tr key={stock.ticker} className="border-b border-[#1F1A0F]/50 hover:bg-[#C9A961]/5 transition-colors">
                    <td className="py-3 text-[#8A7548]">{i + 1}</td>
                    <td className="py-3 text-[#C9A961] font-semibold">{stock.ticker}</td>
                    <td className="py-3 text-[#F5E6C8]">{stock.company}</td>
                    <td className="py-3 text-[#8A7548] text-xs">{stock.sector}</td>
                    <td className="py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-[0.5px] font-semibold ${
                        stock.conviction === "High" ? "bg-[#C9A961]/20 text-[#C9A961]" : "bg-[#8A7548]/20 text-[#8A7548]"
                      }`}>
                        {stock.conviction}
                      </span>
                    </td>
                    <td className="py-3 text-right text-[#F5E6C8]" style={{ fontVariantNumeric: "tabular-nums" }}>{stock.price}</td>
                    <td className={`py-3 text-right ${stock.change.startsWith("+") ? "text-[#4ADE80]" : "text-[#EF4444]"}`} style={{ fontVariantNumeric: "tabular-nums" }}>
                      {stock.change}
                    </td>
                    <td className="py-3 text-[#F5E6C8]/70 text-xs pl-4">{stock.catalyst}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* SECTION: Tactical Playbook */}
        <section id={SECTIONS.tactical}>
          <SectionHeader title="Tactical Playbook" subtitle="Actionable Recommendations for Today" />
          <div className="space-y-4">
            {[
              {
                priority: "1",
                title: "Maintain AI Exposure",
                description: "Do not trim winners in the AI infrastructure space (NVDA, AVGO, ARM). The backlog of orders (e.g., Dell's $43B) indicates the cycle is still in early innings. The AI buildout is a multi-year secular trend.",
                action: "HOLD / ADD ON DIPS",
                color: "#4ADE80",
              },
              {
                priority: "2",
                title: "Hedge with Defensive Staples",
                description: "Given the divergence between consumer sentiment and market highs, allocate 10-15% to dividend aristocrats and consumer staples (JNJ, PG, KO, COST). These provide downside protection if the correction materializes.",
                action: "ACCUMULATE",
                color: "#C9A961",
              },
              {
                priority: "3",
                title: "Monitor Treasury Yields",
                description: "Watch the 10-year Treasury closely. If it breaks above 5.0%, growth stocks may see a short-term pullback of 5-8%, presenting a buying opportunity. Set alerts at 4.95% and 5.05%.",
                action: "WATCH / SET ALERTS",
                color: "#F59E0B",
              },
            ].map((item) => (
              <div key={item.priority} className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-5 border-l-4" style={{ borderLeftColor: item.color }}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-[#C9A961] text-2xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                      {item.priority}
                    </span>
                    <h4 className="text-[#F5E6C8] text-base font-medium">{item.title}</h4>
                  </div>
                  <span className="px-3 py-1 rounded text-[10px] uppercase tracking-[1px] font-bold" style={{ backgroundColor: `${item.color}20`, color: item.color }}>
                    {item.action}
                  </span>
                </div>
                <p className="text-[#F5E6C8]/80 text-sm leading-relaxed ml-9">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION: Geopolitical */}
        <section id={SECTIONS.geopolitical}>
          <SectionHeader title="Geopolitical Strategy" subtitle="Global Risk Assessment" />
          <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-5">
            <p className="text-[#F5E6C8] text-sm leading-relaxed mb-4">
              Key geopolitical developments impacting markets this week:
            </p>
            <div className="space-y-3">
              {[
                { event: "U.S.-Iran Peace Negotiations", impact: "Potential reopening of Strait of Hormuz could ease oil supply concerns", risk: "Medium" },
                { event: "China Trade Tensions", impact: "Semiconductor export restrictions tightening; benefiting domestic AI chip makers", risk: "High" },
                { event: "European Energy Policy", impact: "EU accelerating renewable transition; positive for clean energy equities", risk: "Low" },
              ].map((geo) => (
                <div key={geo.event} className="p-3 bg-[#0A0A0A] rounded border border-[#1F1A0F]">
                  <div className="flex justify-between items-start">
                    <p className="text-[#C9A961] text-sm font-medium">{geo.event}</p>
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-[0.5px] font-semibold ${
                      geo.risk === "High" ? "bg-[#EF4444]/20 text-[#EF4444]" : geo.risk === "Medium" ? "bg-[#F59E0B]/20 text-[#F59E0B]" : "bg-[#4ADE80]/20 text-[#4ADE80]"
                    }`}>
                      {geo.risk} Risk
                    </span>
                  </div>
                  <p className="text-[#F5E6C8]/70 text-xs mt-1">{geo.impact}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer / Disclaimer */}
        <footer className="border-t border-[#1F1A0F] pt-6 pb-8">
          <div className="text-center">
            <img src={LOGO_URL} alt="Armstrong Arikat" className="h-12 mx-auto mb-3 opacity-60" />
            <p className="text-[#8A7548] text-[11px] max-w-2xl mx-auto leading-relaxed">
              This report is prepared by Armstrong Arikat Private Wealth Group for internal portfolio management purposes. 
              Not investment advice for third parties. All recommendations subject to verification. 
              Past performance does not indicate future results. Holdings and views subject to change without notice.
            </p>
            <p className="text-[#8A7548] text-[10px] mt-3">
              Generated: {new Date().toISOString()}
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}

// Reusable Section Header Component
function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-4 pb-3 border-b border-[#1F1A0F]">
      <h2 className="text-[#C9A961] text-2xl tracking-[2px]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
        {title}
      </h2>
      <p className="text-[#8A7548] text-xs uppercase tracking-[2px] mt-1">{subtitle}</p>
    </div>
  );
}
