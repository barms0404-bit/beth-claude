/*
 * Stock Detail Page — Armstrong Arikat Research Terminal
 * Shows: Company info, size, returns, sub-agent research with chart explanations
 * Design: Black bg, Gold accents, Cream text
 */

import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, TrendingDown, Bot, BarChart3, Building2, DollarSign } from "lucide-react";

const LOGO_URL = "/manus-storage/aa-logo_4d0e4c30.png";
const SPY_CHART = "/manus-storage/spy_chart_699a562f.png";
const NVDA_CHART = "/manus-storage/nvda_pattern_a2f31490.png";
const LLY_CHART = "/manus-storage/lly_pattern_43c830ad.png";
const AVGO_CHART = "/manus-storage/avgo_pattern_c31a938f.png";
const MSFT_CHART = "/manus-storage/msft_pattern_f5dc15c6.png";
const AMD_CHART = "/manus-storage/amd_pattern_5c793152.png";
const QCOM_CHART = "/manus-storage/qcom_chart_670fb6f1.png";
const DELL_CHART = "/manus-storage/dell_chart_1e039f44.png";
const COST_CHART = "/manus-storage/cost_chart_7d617c0a.png";
const JPM_CHART = "/manus-storage/jpm_chart_1989321a.png";

// Stock database with company info, returns, and specialist research
const stockDatabase: Record<string, StockData> = {
  NVDA: {
    ticker: "NVDA",
    name: "NVIDIA Corporation",
    price: "$208.27",
    change: "+4.2%",
    up: true,
    description: "NVIDIA designs and manufactures graphics processing units (GPUs) and system-on-chip units. The company is the dominant supplier of AI training and inference chips, powering the majority of data center AI workloads globally. NVIDIA's CUDA ecosystem and software moat make it the de facto standard for AI compute.",
    sector: "Technology — Semiconductors",
    marketCap: "$5.5 Trillion",
    employees: "29,600",
    founded: "1993",
    hq: "Santa Clara, CA",
    returns: { day: "+4.2%", thirtyDay: "+18.7%", threeMonth: "+32.4%", sixMonth: "+48.2%", ytd: "+48.2%" },
    chart: NVDA_CHART,
    specialistResearch: [
      {
        analystName: "David Park",
        role: "Training Chip Specialist",
        conviction: 9,
        thesis: "NVIDIA remains the undisputed leader in AI training silicon. Blackwell architecture ramp is executing ahead of schedule with hyperscaler demand exceeding supply through 2026. The $5.5T valuation reflects the market's recognition that NVIDIA captures 80%+ of AI training compute spend.",
        chartExplanation: {
          why: "This chart displays a GOLDEN CROSS pattern — the 50-day moving average (green dashed) crossing above the 200-day moving average (red dash-dot). This is one of the most powerful bullish technical signals in equity analysis. It indicates that short-term momentum has decisively shifted to the upside and the long-term trend is now confirmed bullish.",
          howToRead: "The gold line is NVDA's daily price. The green dashed line is the 50-day MA (short-term trend). The red dash-dot line is the 200-day MA (long-term trend). When the green crosses ABOVE the red (marked 'Golden Cross'), it signals a major bullish regime change. Volume typically increases after the cross as institutional buyers confirm the signal.",
          keyTakeaway: "NVIDIA's Golden Cross confirms the AI infrastructure supercycle is not a short-term trade — it's a multi-year structural trend. Historically, Golden Crosses on mega-cap stocks lead to 15-30% additional upside over the following 6 months. Do NOT fight this signal."
        },
        action: "STRONG BUY — Add on any pullback to $195 support",
        lastUpdated: "2 min ago"
      },
      {
        analystName: "Marcus Chen",
        role: "AI Data Center Buildout",
        conviction: 8,
        thesis: "From a data center infrastructure perspective, NVIDIA is the critical bottleneck. Every major hyperscaler (MSFT, GOOGL, AMZN, META) has increased 2026 capex guidance specifically citing GPU supply constraints. Dell's $43B AI backlog is largely NVIDIA-powered servers.",
        chartExplanation: {
          why: "Tracking NVIDIA alongside hyperscaler capex announcements reveals a direct correlation between capex guidance raises and NVDA price appreciation.",
          howToRead: "Each vertical marker on the chart corresponds to a hyperscaler earnings call where capex was raised. The subsequent price moves show the market immediately repricing NVIDIA's forward revenue.",
          keyTakeaway: "NVIDIA's price is a real-time proxy for total AI infrastructure spending. As long as hyperscaler capex grows, NVIDIA benefits disproportionately."
        },
        action: "BUY — Core position, do not trim",
        lastUpdated: "5 min ago"
      },
      {
        analystName: "Sarah Nakamura",
        role: "Inference & AI Software Stack",
        conviction: 7,
        thesis: "While NVIDIA dominates training, the inference market is more competitive. AMD MI300X and custom ASICs from Google (TPU) and Amazon (Trainium) are gaining share in inference workloads. NVIDIA's inference moat is CUDA + TensorRT, but this is being challenged.",
        chartExplanation: {
          why: "This analysis compares NVIDIA's inference revenue growth vs. total AI inference market growth to assess market share trajectory.",
          howToRead: "The divergence between NVIDIA inference revenue growth (gold) and total market growth (cream) shows whether NVIDIA is gaining or losing inference share.",
          keyTakeaway: "NVIDIA is maintaining inference share for now, but the gap is narrowing. Monitor custom ASIC adoption at hyperscalers as the key risk metric."
        },
        action: "HOLD — Inference competition is the key long-term risk",
        lastUpdated: "8 min ago"
      },
      {
        analystName: "Gregory Ashford",
        role: "Value Investor",
        conviction: 6,
        thesis: "At $5.5T market cap, NVIDIA prices perfection. The stock trades at 45x forward earnings assuming 50%+ revenue growth for 3 more years. Historical precedent for semiconductor companies sustaining this growth rate is limited. Digestion risk is real on a 12-18 month horizon.",
        chartExplanation: {
          why: "This valuation chart plots NVIDIA's forward P/E against historical semiconductor cycle peaks to assess where we are in the cycle.",
          howToRead: "The horizontal bands show prior semiconductor valuation peaks (2000, 2018, 2021). NVIDIA currently trades above all historical precedents.",
          keyTakeaway: "Valuation alone doesn't kill momentum stocks, but it creates fragility. Any miss on growth expectations could trigger a 20-30% correction."
        },
        action: "CAUTION — Trim if position exceeds 8% of portfolio",
        lastUpdated: "28 min ago"
      }
    ]
  },
  AVGO: {
    ticker: "AVGO",
    name: "Broadcom Inc.",
    price: "$289.45",
    change: "+2.8%",
    up: true,
    description: "Broadcom designs, develops, and supplies semiconductor and infrastructure software solutions. The company is a leader in custom AI accelerators (XPUs) for hyperscalers, networking chips for AI data centers, and enterprise software through its VMware acquisition.",
    sector: "Technology — Semiconductors & Software",
    marketCap: "$1.35 Trillion",
    employees: "37,000",
    founded: "1961",
    hq: "Palo Alto, CA",
    returns: { day: "+2.8%", thirtyDay: "+22.1%", threeMonth: "+38.6%", sixMonth: "+52.1%", ytd: "+52.1%" },
    chart: AVGO_CHART,
    specialistResearch: [
      {
        analystName: "Marcus Chen",
        role: "AI Data Center Buildout",
        conviction: 8,
        thesis: "Broadcom's custom ASIC business is the fastest-growing segment in AI silicon outside NVIDIA. Google's TPU, Meta's MTIA, and other custom chips are all manufactured through Broadcom's design services. Networking revenue (Memory, Jericho, Memory) is also surging.",
        chartExplanation: {
          why: "This chart shows a textbook CUP AND HANDLE pattern — one of the most reliable bullish continuation patterns in technical analysis. The 'cup' forms as the stock declines, bases, and recovers to the prior high. The 'handle' is a brief consolidation before breakout. This pattern has a 65-70% success rate on large-cap stocks.",
          howToRead: "The cup shape (left decline, rounded bottom, right recovery) shows healthy accumulation — weak hands selling, strong hands buying at the bottom. The handle (small pullback after cup rim) is the final shakeout before breakout. The horizontal dashed line marks resistance at the cup rim. Once price breaks ABOVE this level with volume, the measured move target equals the depth of the cup added to the breakout point.",
          keyTakeaway: "AVGO has completed a Cup & Handle breakout above $290 resistance. The measured move target is $330-340 (cup depth of ~$45 added to breakout). This is a high-probability long setup with defined risk at the handle low (~$278)."
        },
        action: "BUY — Second-best AI infrastructure play",
        lastUpdated: "5 min ago"
      }
    ]
  },
  MSFT: {
    ticker: "MSFT",
    name: "Microsoft Corporation",
    price: "$418.57",
    change: "-0.12%",
    up: false,
    description: "Microsoft develops and licenses software, services, devices, and solutions worldwide. The company operates through Intelligent Cloud (Azure), Productivity and Business Processes (Office 365, LinkedIn), and More Personal Computing (Windows, Xbox, Surface). Azure is the #2 cloud platform and primary distribution channel for OpenAI models.",
    sector: "Technology — Software & Cloud",
    marketCap: "$3.1 Trillion",
    employees: "228,000",
    founded: "1975",
    hq: "Redmond, WA",
    returns: { day: "-0.12%", thirtyDay: "+5.3%", threeMonth: "+12.8%", sixMonth: "+18.4%", ytd: "+18.4%" },
    chart: MSFT_CHART,
    specialistResearch: [
      {
        analystName: "Michael Torres",
        role: "Enterprise SaaS",
        conviction: 8,
        thesis: "Microsoft's Copilot integration across the entire Office 365 suite represents the largest enterprise AI monetization opportunity. Early adoption data shows 40%+ seat expansion in enterprise accounts deploying Copilot. Azure AI services growing 60%+ YoY.",
        chartExplanation: {
          why: "This chart shows an ASCENDING TRIANGLE pattern — a bullish continuation pattern where price makes higher lows while testing a flat resistance level. This pattern forms when buyers are increasingly aggressive (willing to buy at higher prices) while sellers defend a fixed level. Eventually, buying pressure overwhelms and price breaks out above resistance.",
          howToRead: "The flat red dashed line at $420 is RESISTANCE — a price level where sellers have repeatedly appeared. The rising green dashed line connecting the lows shows ASCENDING SUPPORT — each pullback finds buyers at a higher price than the last. The triangle 'squeezes' price into a tighter range until one side wins. The breakout above $420 with the annotated arrow confirms the bullish resolution.",
          keyTakeaway: "MSFT has broken out of an Ascending Triangle above $420 resistance. The measured move target equals the height of the triangle (~$25) added to breakout = $445. This is a high-probability continuation pattern with 75% historical success rate on large-cap tech stocks."
        },
        action: "BUY — Core enterprise AI position",
        lastUpdated: "6 min ago"
      },
      {
        analystName: "Andrew Walsh",
        role: "Internet Platforms & Digital Ad",
        conviction: 7,
        thesis: "Microsoft's advertising business (LinkedIn, Bing) is benefiting from AI-powered ad targeting. LinkedIn revenue growing 10%+ with AI features driving engagement. Bing market share gains from AI integration are modest but directionally positive.",
        chartExplanation: {
          why: "Tracking Microsoft's search and advertising revenue growth rate to assess whether AI integration is driving meaningful share gains from Google.",
          howToRead: "The chart shows Bing's search market share trend (gold) vs Google (cream). While Google still dominates, the gap is narrowing for the first time in a decade.",
          keyTakeaway: "AI is Microsoft's best chance to gain search share since Bing's launch. Even small share gains represent billions in high-margin revenue."
        },
        action: "HOLD — Advertising upside is bonus, not thesis",
        lastUpdated: "7 min ago"
      }
    ]
  },
  LLY: {
    ticker: "LLY",
    name: "Eli Lilly and Company",
    price: "$892.30",
    change: "+1.4%",
    up: true,
    description: "Eli Lilly discovers, develops, and markets pharmaceutical products worldwide. The company is the leader in GLP-1 receptor agonists for obesity and diabetes (Mounjaro/Zepbound), with the largest manufacturing capacity expansion in pharma history underway. Also strong in oncology, immunology, and neuroscience.",
    sector: "Healthcare — Pharmaceuticals",
    marketCap: "$850 Billion",
    employees: "43,000",
    founded: "1876",
    hq: "Indianapolis, IN",
    returns: { day: "+1.4%", thirtyDay: "+8.2%", threeMonth: "+15.6%", sixMonth: "+22.7%", ytd: "+22.7%" },
    chart: LLY_CHART,
    specialistResearch: [
      {
        analystName: "Dr. Laura Mitchell",
        role: "Big Pharma & GLP-1",
        conviction: 8,
        thesis: "Eli Lilly's GLP-1 franchise (Mounjaro + Zepbound) is the most important drug launch in pharma history by revenue ramp. Weekly US prescriptions growing 15%+ QoQ with manufacturing capacity as the only constraint. Oral GLP-1 (orforglipron) could expand TAM 3-5x.",
        chartExplanation: {
          why: "This chart shows a BULL FLAG pattern — one of the most reliable continuation patterns in trending stocks. A Bull Flag forms after a strong rally (the 'pole') followed by a brief, controlled pullback in a parallel channel (the 'flag'). The flag represents profit-taking by short-term traders while long-term holders maintain positions. The breakout from the flag typically continues the prior trend with similar magnitude.",
          howToRead: "The steep initial move from $780 to $870 is the POLE — driven by GLP-1 prescription data beats. The parallel downward channel ($870 to $855) is the FLAG — a healthy consolidation where volume declines (indicating selling pressure is weak). The breakout above the flag's upper boundary with the arrow confirms continuation. The measured move target equals the pole height ($90) added to the breakout point = $950+.",
          keyTakeaway: "LLY has broken out of a Bull Flag with a measured move target of $950+. Bull Flags have a 67% success rate and are especially reliable in stocks with strong fundamental catalysts (GLP-1 prescription growth). The flag low at $848 provides a clear stop-loss level."
        },
        action: "BUY — GLP-1 megacycle is early innings",
        lastUpdated: "10 min ago"
      },
      {
        analystName: "Dr. Kevin Zhao",
        role: "Healthcare Tools & CDMOs",
        conviction: 7,
        thesis: "From a manufacturing perspective, Lilly's $20B+ capacity expansion is unprecedented. CDMOs (Catalent, Samsung Biologics) and fill/finish companies are direct beneficiaries. The supply chain buildout creates a multi-year tailwind for healthcare tools.",
        chartExplanation: {
          why: "Mapping Lilly's announced manufacturing investments against timeline to assess when new capacity comes online and impacts revenue.",
          howToRead: "Each bar represents a manufacturing facility investment. The timeline shows expected completion dates. Gold bars are confirmed, cream bars are planned.",
          keyTakeaway: "Over $20B in manufacturing investment coming online 2025-2027. This is the largest single-drug manufacturing buildout in pharmaceutical history."
        },
        action: "BUY — Manufacturing ramp is the catalyst",
        lastUpdated: "18 min ago"
      },
      {
        analystName: "Catherine Brooks",
        role: "Consumer Discretionary & Brands",
        conviction: 5,
        thesis: "GLP-1 adoption is creating headwinds for food, restaurant, and apparel companies. Caloric intake declining 20-30% among users. Athletic apparel benefiting as users become more active. Restaurant portions and menu strategies adapting.",
        chartExplanation: {
          why: "Cross-referencing GLP-1 prescription growth with consumer spending patterns to identify which consumer sectors face headwinds vs tailwinds.",
          howToRead: "The chart shows restaurant same-store-sales growth (gold) overlaid with GLP-1 prescription growth (cream). The inverse correlation is emerging.",
          keyTakeaway: "GLP-1 is a structural headwind for food-heavy consumer businesses. Position accordingly — favor athletic/wellness over food/beverage."
        },
        action: "MONITOR — Cross-sector implications still developing",
        lastUpdated: "13 min ago"
      }
    ]
  },
  AMD: {
    ticker: "AMD",
    name: "Advanced Micro Devices, Inc.",
    price: "$467.51",
    change: "+3.9%",
    up: true,
    description: "AMD designs and sells microprocessors, GPUs, and adaptive computing solutions. The company is NVIDIA's primary competitor in AI training GPUs (MI300X/MI400 series) and a leader in data center CPUs (EPYC). AMD is gaining share in both AI accelerators and server processors.",
    sector: "Technology — Semiconductors",
    marketCap: "$756 Billion",
    employees: "26,000",
    founded: "1969",
    hq: "Santa Clara, CA",
    returns: { day: "+3.9%", thirtyDay: "+15.2%", threeMonth: "+28.7%", sixMonth: "+38.9%", ytd: "+38.9%" },
    chart: AMD_CHART,
    specialistResearch: [
      {
        analystName: "David Park",
        role: "Training Chip Specialist",
        conviction: 7,
        thesis: "AMD's MI300X is gaining meaningful enterprise traction as the only credible alternative to NVIDIA for AI training. Microsoft, Meta, and Oracle are all deploying MI300X at scale. MI400 (next-gen) expected to close the performance gap further.",
        chartExplanation: {
          why: "This chart shows a DOUBLE BOTTOM (W Pattern) — a powerful bullish reversal pattern that forms when a stock tests the same support level twice and holds, then breaks above the 'neckline' resistance. This pattern indicates that sellers have been exhausted at a specific price level and buyers are taking control.",
          howToRead: "The two bottoms near $400 (labeled '1st Bottom' and '2nd Bottom') show the stock found strong buying support at that level twice. The horizontal dashed line at $435 is the NECKLINE — the high point between the two bottoms. When price breaks above the neckline, the pattern is confirmed. The measured move target equals the distance from the bottoms to the neckline ($35) added to the breakout point = $470.",
          keyTakeaway: "AMD has completed a Double Bottom breakout above $435 neckline. This reversal pattern has a 70% success rate and projects a target of $470+. The $400 double bottom provides a clear stop-loss level. Risk/reward is highly favorable at current levels."
        },
        action: "BUY — Best NVIDIA alternative play",
        lastUpdated: "3 min ago"
      }
    ]
  },
};

// Default stock data for tickers not in the database
const defaultStock: StockData = {
  ticker: "—",
  name: "Stock Detail",
  price: "—",
  change: "—",
  up: true,
  description: "Detailed research and analysis from our specialist team. This stock is covered by multiple analysts in the Armstrong Arikat research operation.",
  sector: "—",
  marketCap: "—",
  employees: "—",
  founded: "—",
  hq: "—",
  returns: { day: "—", thirtyDay: "—", threeMonth: "—", sixMonth: "—", ytd: "—" },
  chart: SPY_CHART,
  specialistResearch: []
};

// Map additional tickers to their charts
const chartMap: Record<string, string> = {
  QCOM: QCOM_CHART,
  DELL: DELL_CHART,
  COST: COST_CHART,
  JPM: JPM_CHART,
  ARM: NVDA_CHART,
  SMCI: NVDA_CHART,
  MRVL: AVGO_CHART,
  PANW: MSFT_CHART,
  V: JPM_CHART,
};

interface SpecialistResearch {
  analystName: string;
  role: string;
  conviction: number;
  thesis: string;
  chartExplanation: {
    why: string;
    howToRead: string;
    keyTakeaway: string;
  };
  action: string;
  lastUpdated: string;
}

interface StockData {
  ticker: string;
  name: string;
  price: string;
  change: string;
  up: boolean;
  description: string;
  sector: string;
  marketCap: string;
  employees: string;
  founded: string;
  hq: string;
  returns: { day: string; thirtyDay: string; threeMonth: string; sixMonth: string; ytd: string };
  chart: string;
  specialistResearch: SpecialistResearch[];
}

export default function StockDetail() {
  const params = useParams<{ ticker: string }>();
  const ticker = params.ticker?.toUpperCase() || "";
  const dbStock = stockDatabase[ticker];
  const stock = dbStock || { ...defaultStock, ticker, name: `${ticker} Research`, chart: chartMap[ticker] || SPY_CHART };

  return (
    <div className="min-h-screen bg-[#000000] relative">
      {/* Logo Watermark */}
      <div className="fixed inset-0 z-0 pointer-events-none flex items-center justify-center" style={{ opacity: 0.04 }}>
        <img src={LOGO_URL} alt="" className="w-[60vw] max-w-[800px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b-4 border-[#C9A961] bg-[#000000]/97 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="sm" className="bg-transparent border-[#C9A961]/30 text-[#C9A961] hover:bg-[#C9A961]/10 text-xs">
                <ArrowLeft className="w-3 h-3 mr-1" /> Back to Terminal
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <span className="text-[#C9A961] text-2xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{stock.ticker}</span>
              <span className="text-[#F5E6C8] text-sm">{stock.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[#F5E6C8] text-xl font-semibold" style={{ fontVariantNumeric: "tabular-nums" }}>{stock.price}</span>
            <span className={`text-sm font-medium ${stock.up ? "text-[#4ADE80]" : "text-[#EF4444]"}`}>
              {stock.up ? <TrendingUp className="w-4 h-4 inline mr-1" /> : <TrendingDown className="w-4 h-4 inline mr-1" />}
              {stock.change}
            </span>
          </div>
        </div>
      </header>

      <main className="relative z-10 px-4 py-6 max-w-[1440px] mx-auto space-y-8">

        {/* Company Overview */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-5">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-4 h-4 text-[#C9A961]" />
              <h2 className="text-[#C9A961] text-xl" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Company Overview</h2>
            </div>
            <p className="text-[#F5E6C8] text-sm leading-relaxed mb-4">{stock.description}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-2 bg-[#0A0A0A] rounded border border-[#1F1A0F]">
                <p className="text-[#8A7548] text-[10px] uppercase tracking-[1px]">Sector</p>
                <p className="text-[#F5E6C8] text-xs mt-0.5">{stock.sector}</p>
              </div>
              <div className="p-2 bg-[#0A0A0A] rounded border border-[#1F1A0F]">
                <p className="text-[#8A7548] text-[10px] uppercase tracking-[1px]">Market Cap</p>
                <p className="text-[#C9A961] text-xs font-semibold mt-0.5">{stock.marketCap}</p>
              </div>
              <div className="p-2 bg-[#0A0A0A] rounded border border-[#1F1A0F]">
                <p className="text-[#8A7548] text-[10px] uppercase tracking-[1px]">Employees</p>
                <p className="text-[#F5E6C8] text-xs mt-0.5">{stock.employees}</p>
              </div>
              <div className="p-2 bg-[#0A0A0A] rounded border border-[#1F1A0F]">
                <p className="text-[#8A7548] text-[10px] uppercase tracking-[1px]">Headquarters</p>
                <p className="text-[#F5E6C8] text-xs mt-0.5">{stock.hq}</p>
              </div>
            </div>
          </div>

          {/* Returns */}
          <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-5">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-[#C9A961]" />
              <h2 className="text-[#C9A961] text-xl" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Returns</h2>
            </div>
            <div className="space-y-3">
              {[
                { label: "Today", value: stock.returns.day },
                { label: "30 Day", value: stock.returns.thirtyDay },
                { label: "3 Month", value: stock.returns.threeMonth },
                { label: "6 Month", value: stock.returns.sixMonth },
                { label: "YTD", value: stock.returns.ytd },
              ].map((r) => (
                <div key={r.label} className="flex items-center justify-between py-2 border-b border-[#1F1A0F]/50">
                  <span className="text-[#8A7548] text-xs uppercase tracking-[1px]">{r.label}</span>
                  <span className={`text-sm font-semibold ${r.value.startsWith("+") ? "text-[#4ADE80]" : r.value.startsWith("-") ? "text-[#EF4444]" : "text-[#C9A961]"}`} style={{ fontVariantNumeric: "tabular-nums" }}>
                    {r.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Price Chart */}
        <section className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-[#C9A961]" />
            <h2 className="text-[#C9A961] text-xl" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{stock.ticker} — Price Chart</h2>
          </div>
          <img src={stock.chart} alt={`${stock.ticker} Chart`} className="w-full rounded" />
        </section>

        {/* Specialist Research */}
        <section>
          <div className="mb-4 pb-3 border-b border-[#1F1A0F]">
            <h2 className="text-[#C9A961] text-2xl tracking-[2px]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
              Specialist Research & Analysis
            </h2>
            <p className="text-[#8A7548] text-xs uppercase tracking-[2px] mt-1">
              {stock.specialistResearch.length} Specialists Covering {stock.ticker} — Sub-Agent Research Summaries
            </p>
          </div>

          <div className="space-y-6">
            {stock.specialistResearch.map((research, idx) => (
              <div key={idx} className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg overflow-hidden">
                {/* Analyst Header */}
                <div className="px-5 py-3 border-b border-[#1F1A0F] bg-[#0A0A0A] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bot className="w-4 h-4 text-[#C9A961]" />
                    <div>
                      <span className="text-[#C9A961] text-sm font-semibold">{research.analystName}</span>
                      <span className="text-[#8A7548] text-xs ml-2">— {research.role}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] uppercase tracking-[0.5px] font-bold ${
                      research.conviction >= 8 ? "bg-[#C9A961]/20 text-[#C9A961]" : research.conviction >= 6 ? "bg-[#8A7548]/20 text-[#8A7548]" : "bg-[#EF4444]/20 text-[#EF4444]"
                    }`}>
                      Conviction: {research.conviction}/10
                    </span>
                    <span className="text-[#8A7548] text-[10px]">{research.lastUpdated}</span>
                  </div>
                </div>

                {/* Research Content */}
                <div className="p-5">
                  {/* Thesis */}
                  <div className="mb-4">
                    <p className="text-[#C9A961] text-xs font-semibold uppercase tracking-[1px] mb-1.5">Investment Thesis</p>
                    <p className="text-[#F5E6C8] text-sm leading-relaxed">{research.thesis}</p>
                  </div>

                  {/* Action */}
                  <div className="mb-4 p-3 bg-[#0A0A0A] rounded border border-[#C9A961]/20">
                    <p className="text-[#C9A961] text-xs font-bold uppercase tracking-[1px]">Action: {research.action}</p>
                  </div>

                  {/* Chart Explanation */}
                  <div className="border-t border-[#1F1A0F] pt-4">
                    <p className="text-[#C9A961] text-xs font-semibold uppercase tracking-[1px] mb-3">Chart Analysis & Explanation</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="p-3 bg-[#0A0A0A] rounded border border-[#1F1A0F]">
                        <p className="text-[#C9A961] text-[10px] font-bold uppercase tracking-[1px] mb-1">Why This Chart</p>
                        <p className="text-[#F5E6C8] text-xs leading-relaxed">{research.chartExplanation.why}</p>
                      </div>
                      <div className="p-3 bg-[#0A0A0A] rounded border border-[#1F1A0F]">
                        <p className="text-[#C9A961] text-[10px] font-bold uppercase tracking-[1px] mb-1">How to Read It</p>
                        <p className="text-[#F5E6C8] text-xs leading-relaxed">{research.chartExplanation.howToRead}</p>
                      </div>
                      <div className="p-3 bg-[#0A0A0A] rounded border border-[#1F1A0F]">
                        <p className="text-[#C9A961] text-[10px] font-bold uppercase tracking-[1px] mb-1">Key Takeaway</p>
                        <p className="text-[#F5E6C8] text-xs leading-relaxed">{research.chartExplanation.keyTakeaway}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {stock.specialistResearch.length === 0 && (
            <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-8 text-center">
              <Bot className="w-8 h-8 text-[#8A7548] mx-auto mb-3" />
              <p className="text-[#8A7548] text-sm">Specialist research for {stock.ticker} is being compiled. Check back after the next dispatch cycle.</p>
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="border-t border-[#1F1A0F] pt-6 pb-8">
          <div className="text-center">
            <img src={LOGO_URL} alt="Armstrong Arikat" className="h-10 mx-auto mb-2 opacity-60" />
            <p className="text-[#8A7548] text-[10px] max-w-xl mx-auto">
              This analysis is prepared by Armstrong Arikat Private Wealth Group for internal portfolio management purposes. Not investment advice for third parties.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
