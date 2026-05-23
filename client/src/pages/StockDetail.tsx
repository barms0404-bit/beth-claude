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
const NVDA_CHART = "/manus-storage/nvda_chart_7bda8308.png";
const LLY_CHART = "/manus-storage/lly_chart_b1ec7ac4.png";

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
          why: "This chart shows NVIDIA's price trajectory over the past month, illustrating the sustained momentum driven by AI infrastructure buildout announcements from major hyperscalers.",
          howToRead: "The gold line represents daily closing prices. The shaded area below shows the accumulation zone. Notice the steady uptrend with minimal pullbacks, indicating strong institutional buying pressure.",
          keyTakeaway: "NVIDIA's price action confirms that the AI capex cycle is accelerating, not decelerating. Each new hyperscaler capex announcement adds fuel to the rally."
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
    chart: NVDA_CHART,
    specialistResearch: [
      {
        analystName: "Marcus Chen",
        role: "AI Data Center Buildout",
        conviction: 8,
        thesis: "Broadcom's custom ASIC business is the fastest-growing segment in AI silicon outside NVIDIA. Google's TPU, Meta's MTIA, and other custom chips are all manufactured through Broadcom's design services. Networking revenue (Memory, Jericho, Memory) is also surging.",
        chartExplanation: {
          why: "This chart tracks Broadcom's AI-related revenue as a percentage of total revenue, showing the company's transformation into an AI infrastructure play.",
          howToRead: "The rising gold line shows AI revenue contribution growing from 15% to over 35% in just 4 quarters. The steepness indicates acceleration.",
          keyTakeaway: "Broadcom is successfully pivoting to AI. The custom ASIC + networking combination makes it the second most important AI infrastructure company after NVIDIA."
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
    chart: SPY_CHART,
    specialistResearch: [
      {
        analystName: "Michael Torres",
        role: "Enterprise SaaS",
        conviction: 8,
        thesis: "Microsoft's Copilot integration across the entire Office 365 suite represents the largest enterprise AI monetization opportunity. Early adoption data shows 40%+ seat expansion in enterprise accounts deploying Copilot. Azure AI services growing 60%+ YoY.",
        chartExplanation: {
          why: "This chart shows Microsoft's Copilot adoption curve compared to historical Office 365 adoption, demonstrating the potential revenue uplift.",
          howToRead: "The gold line tracks Copilot paid seats over time. The dashed cream line shows the Office 365 adoption curve at the same stage. Copilot is adopting faster.",
          keyTakeaway: "Copilot could add $20-30B in annual revenue at maturity. Current pricing ($30/user/month) with 400M+ Office users creates massive TAM."
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
          why: "This chart tracks Eli Lilly's GLP-1 prescription volume against manufacturing capacity to identify when supply meets demand — the key inflection point for revenue acceleration.",
          howToRead: "The gold line shows weekly prescriptions (demand). The cream dashed line shows estimated manufacturing capacity. The gap between them represents unmet demand and revenue upside.",
          keyTakeaway: "Manufacturing capacity expansion is on track for H2 2026. When supply catches demand, revenue could accelerate 40-50% from current run rate."
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
    chart: NVDA_CHART,
    specialistResearch: [
      {
        analystName: "David Park",
        role: "Training Chip Specialist",
        conviction: 7,
        thesis: "AMD's MI300X is gaining meaningful enterprise traction as the only credible alternative to NVIDIA for AI training. Microsoft, Meta, and Oracle are all deploying MI300X at scale. MI400 (next-gen) expected to close the performance gap further.",
        chartExplanation: {
          why: "Tracking AMD's AI GPU revenue growth and market share gains against NVIDIA to assess the competitive dynamic.",
          howToRead: "The gold line shows AMD's AI accelerator revenue on a quarterly basis. The steep ramp from near-zero to $3B+ annual run rate shows rapid adoption.",
          keyTakeaway: "AMD is the clear #2 in AI training. While NVIDIA maintains 80%+ share, AMD's 15-20% share at $3B+ revenue is highly profitable and growing."
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
  const stock = stockDatabase[ticker] || { ...defaultStock, ticker, name: `${ticker} Research` };

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
