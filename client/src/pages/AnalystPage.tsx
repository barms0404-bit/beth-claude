/*
 * Individual Analyst Page — Armstrong Arikat Research Terminal
 * Each analyst gets their own dedicated page with in-depth research
 */

import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bot, TrendingUp, TrendingDown, Target, AlertTriangle, CheckCircle } from "lucide-react";

const LOGO_URL = "/manus-storage/aa-logo_4d0e4c30.png";

interface StockRec {
  ticker: string;
  name: string;
  price: string;
  change: string;
  conviction: number;
  action: string;
  why: string;
  how: string;
  risks: string;
  target: string;
  timeHorizon: string;
}

interface AnalystData {
  name: string;
  role: string;
  pod: string;
  model: string;
  temp: string;
  trackRecord: string;
  hitRate: string;
  weight: string;
  bio: string;
  methodology: string;
  currentView: string;
  recommendations: StockRec[];
}

const analystDatabase: Record<string, AnalystData> = {
  "david-park": {
    name: "David Park",
    role: "Training Chip Specialist",
    pod: "AI / Thematic Pod",
    model: "claude-opus-4-7",
    temp: "0.2",
    trackRecord: "6 months active",
    hitRate: "73%",
    weight: "1.6x",
    bio: "David Park covers the AI training silicon ecosystem including NVIDIA, AMD, and custom training ASICs. His coverage universe spans GPU architectures, high-bandwidth memory (HBM), advanced packaging (CoWoS), and the hyperscaler custom silicon programs. He tracks wafer allocation, foundry capacity, and supply chain dynamics across TSMC, Samsung, and Intel Foundry.",
    methodology: "David's analytical framework centers on three pillars: (1) Compute demand modeling — tracking AI training FLOPS growth against silicon supply, (2) Architecture advantage scoring — evaluating each chip's performance-per-dollar and software ecosystem lock-in, (3) Supply chain bottleneck mapping — identifying where constraints create pricing power. He uses a proprietary 'GPU Economics Model' that tracks cost-per-token trends across generations.",
    currentView: "The AI training compute market is in a structural supply deficit that will persist through 2027. NVIDIA's Blackwell architecture represents a generational leap that competitors cannot match for 18-24 months. The Golden Cross technical pattern confirms institutional capital is flowing into the sector with conviction. AMD is the credible #2 but faces a software ecosystem gap (CUDA moat). Custom ASICs from Google and Amazon are gaining but limited to their own workloads.",
    recommendations: [
      {
        ticker: "NVDA",
        name: "NVIDIA Corporation",
        price: "$208.27",
        change: "+4.2%",
        conviction: 9,
        action: "STRONG BUY",
        why: "NVIDIA captures 80%+ of the AI training compute market with no credible challenger for 18-24 months. The Blackwell B200/GB200 architecture delivers 4x training performance over Hopper at only 2x the price — making it the most cost-effective option for hyperscalers. Every major cloud provider (MSFT, GOOGL, AMZN, META, ORCL) has raised 2026 capex guidance specifically citing GPU supply constraints. The $5.5T valuation reflects the market's recognition that NVIDIA is the picks-and-shovels play for the most important technology shift since the internet.",
        how: "Position sizing: 5-8% of portfolio. Entry: current levels or any pullback to $195 (50-day MA support). The Golden Cross pattern (50-day MA crossing above 200-day MA) historically leads to 18-30% additional upside over 6 months on mega-cap stocks. Add on any pullback that holds the 50-day MA. Do NOT chase above $220 without a consolidation first.",
        risks: "Hyperscaler capex digestion (12-18 month risk), custom ASIC competition from Google TPU v6 and Amazon Trainium3, potential antitrust scrutiny on CUDA ecosystem lock-in, China export restrictions limiting TAM by ~15%.",
        target: "$250-270 (12-month)",
        timeHorizon: "12-18 months"
      },
      {
        ticker: "AMD",
        name: "Advanced Micro Devices",
        price: "$467.51",
        change: "+3.9%",
        conviction: 7,
        action: "BUY",
        why: "AMD's MI300X is the only credible alternative to NVIDIA for AI training at scale. Microsoft, Meta, and Oracle are deploying MI300X in production clusters. The MI400 (next-gen, expected 2025) is designed to close the performance gap with Blackwell. AMD also dominates the data center CPU market with EPYC (gaining share from Intel every quarter). The Double Bottom pattern at $400 support confirms buyers are defending this level aggressively.",
        how: "Position sizing: 3-4% of portfolio. Entry: current levels with stop-loss at $400 (double bottom support). The Double Bottom breakout above $435 neckline projects a measured move target of $470+. Add if MI400 benchmarks exceed expectations. Trim if NVIDIA cuts pricing aggressively (would compress AMD margins).",
        risks: "NVIDIA pricing power could squeeze AMD margins, CUDA software ecosystem advantage remains significant, MI300X thermal issues in dense configurations reported by some customers, Intel Gaudi3 as potential third competitor.",
        target: "$520-550 (12-month)",
        timeHorizon: "12 months"
      }
    ]
  },
  "marcus-chen": {
    name: "Marcus Chen",
    role: "AI Data Center Buildout Specialist",
    pod: "AI / Thematic Pod",
    model: "claude-opus-4-7",
    temp: "0.2",
    trackRecord: "6 months active",
    hitRate: "71%",
    weight: "1.5x",
    bio: "Marcus Chen covers the complete AI data center infrastructure stack — from hyperscaler capex planning through to the physical buildout including networking, cooling, power distribution, and server assembly. His coverage spans Broadcom, Dell, Super Micro, Marvell, Arista Networks, Vertiv, and the major DC REITs.",
    methodology: "Marcus tracks the full capex-to-deployment pipeline: (1) Hyperscaler capex announcements and guidance, (2) Server order backlogs and lead times, (3) Networking upgrade cycles (400G→800G→1.6T), (4) Power and cooling infrastructure requirements per MW of AI compute, (5) Data center construction timelines and permitting bottlenecks. His 'AI Infrastructure Demand Model' maps announced AI capacity against available supply.",
    currentView: "We are in the early innings of a $1T+ infrastructure buildout cycle. Dell's $43B AI backlog is the clearest signal that enterprise demand is real and accelerating. Broadcom's custom ASIC + networking combination makes it the second most important AI infrastructure company after NVIDIA. The Cup & Handle breakout pattern on AVGO projects $330-340 target. Cooling and power are the new bottlenecks — companies solving these constraints command premium valuations.",
    recommendations: [
      {
        ticker: "AVGO",
        name: "Broadcom Inc.",
        price: "$289.45",
        change: "+2.8%",
        conviction: 8,
        action: "BUY",
        why: "Broadcom is the #2 AI infrastructure company after NVIDIA. Three growth vectors: (1) Custom AI ASICs — designing Google's TPU, Meta's MTIA, and other hyperscaler custom chips, growing 100%+ YoY. (2) AI networking — Memory, Jericho switches dominate data center east-west traffic. (3) VMware integration — $70B acquisition creating enterprise software moat. The Cup & Handle pattern breakout above $290 resistance is a textbook high-probability setup with 65-70% historical success rate.",
        how: "Position sizing: 4-5% of portfolio. Entry: current levels with stop at $278 (handle low). Cup & Handle measured move target = cup depth ($45) + breakout point ($290) = $335. Add on any retest of $290 that holds as support. The pattern is confirmed — don't wait for a better entry that may not come.",
        risks: "Custom ASIC customers could in-source design (low probability but existential), VMware integration execution risk, networking competition from Cisco/Arista, China revenue exposure (~15% of total).",
        target: "$330-350 (9-month)",
        timeHorizon: "9-12 months"
      },
      {
        ticker: "DELL",
        name: "Dell Technologies",
        price: "$178.90",
        change: "+12.4%",
        conviction: 8,
        action: "BUY",
        why: "Dell's $43B AI server backlog is the most important data point in enterprise AI infrastructure. It proves that AI demand has moved beyond hyperscalers into enterprise. Dell is the trusted enterprise vendor for AI server deployment — companies that won't buy directly from ODMs go through Dell. AI revenues expected to nearly double to $50B in FY2027. The stock surged 12.4% today on this backlog disclosure — this is the market recognizing the enterprise AI opportunity.",
        how: "Position sizing: 3-4% of portfolio. Entry: current levels or pullback to $165 support. The explosive move today creates a new base — expect consolidation in $170-185 range before next leg. Add if Q2 earnings confirm backlog conversion accelerating. This is a multi-quarter story, not a trade.",
        risks: "AI server margins lower than traditional servers (10-12% vs 15-18%), customer concentration in top 5 hyperscalers, competition from HPE and Lenovo, potential for order cancellations if AI spending slows.",
        target: "$220-240 (12-month)",
        timeHorizon: "12 months"
      }
    ]
  },
  "dr-laura-mitchell": {
    name: "Dr. Laura Mitchell",
    role: "Big Pharma & GLP-1 Specialist",
    pod: "Healthcare Pod",
    model: "claude-opus-4-7",
    temp: "0.2",
    trackRecord: "6 months active",
    hitRate: "78%",
    weight: "1.4x",
    bio: "Dr. Laura Mitchell covers large-cap pharmaceuticals with deep expertise in the GLP-1 receptor agonist class (obesity and diabetes). Her coverage includes Eli Lilly, Novo Nordisk, AbbVie, Merck, Pfizer, and Johnson & Johnson. She tracks clinical trial data, FDA regulatory pathways, manufacturing capacity, prescription trends, and payer dynamics.",
    methodology: "Laura's framework combines: (1) Prescription volume tracking — weekly US GLP-1 prescriptions from IQVIA and Symphony Health, (2) Manufacturing capacity modeling — mapping announced investments against timeline to revenue, (3) Clinical pipeline valuation — probability-weighted NPV of pipeline assets, (4) Competitive dynamics — tracking oral GLP-1 development, next-gen molecules, and biosimilar timelines. Her 'GLP-1 Megacycle Model' projects the total addressable market expansion from current $50B to $150B+ by 2030.",
    currentView: "The GLP-1 megacycle is the most important drug franchise launch in pharmaceutical history by revenue ramp speed. Eli Lilly's Mounjaro/Zepbound and Novo Nordisk's Ozempic/Wegovy are transforming the treatment of obesity, diabetes, cardiovascular disease, and potentially Alzheimer's. Manufacturing capacity is the ONLY constraint — demand far exceeds supply. The Bull Flag pattern on LLY projects $950+ target as manufacturing expansion comes online H2 2026.",
    recommendations: [
      {
        ticker: "LLY",
        name: "Eli Lilly and Company",
        price: "$892.30",
        change: "+1.4%",
        conviction: 8,
        action: "BUY",
        why: "Eli Lilly is winning the GLP-1 race on three fronts: (1) Tirzepatide (Mounjaro/Zepbound) shows superior efficacy vs Novo's semaglutide in head-to-head trials — 22% weight loss vs 15%. (2) Manufacturing capacity expansion of $20B+ is the largest in pharma history, with new facilities coming online H2 2026. (3) Oral GLP-1 (orforglipron) in Phase 3 could expand TAM 3-5x by eliminating injection barrier. Weekly US prescriptions growing 15%+ QoQ with zero signs of demand saturation.",
        how: "Position sizing: 4-5% of portfolio. Entry: current levels with stop at $848 (Bull Flag low). The Bull Flag pattern projects measured move of pole height ($90) + breakout = $950+ target. Add on any pullback to $860-870 range. This is a 3-5 year secular growth story — don't trade it, own it. Manufacturing capacity coming online in H2 2026 is the next catalyst for revenue acceleration.",
        risks: "Manufacturing delays (primary risk), cardiovascular outcomes data weaker than expected, oral GLP-1 Phase 3 miss, competitive pressure from Novo's next-gen CagriSema, potential Medicare price negotiation under IRA, rare but serious side effects emerging in post-market surveillance.",
        target: "$950-1,000 (12-month)",
        timeHorizon: "12-18 months"
      },
      {
        ticker: "NVO",
        name: "Novo Nordisk",
        price: "$142.60",
        change: "+0.9%",
        conviction: 7,
        action: "BUY",
        why: "Novo Nordisk is the GLP-1 pioneer with Ozempic/Wegovy and maintains 39% market share. While Lilly has superior efficacy data, Novo has first-mover advantage in physician familiarity and payer coverage. Wegovy supply improving significantly in 2026. CagriSema (next-gen dual agonist) showing 25%+ weight loss in trials — could leapfrog tirzepatide. Valuation more reasonable than LLY at current levels.",
        how: "Position sizing: 2-3% of portfolio as complement to LLY position. Entry: current levels. Novo is the 'value' play in GLP-1 — lower multiple, improving supply, strong pipeline. Add if CagriSema Phase 3 data confirms superiority. The GLP-1 market is big enough for both companies to win — this is not zero-sum.",
        risks: "Tirzepatide superiority data could accelerate share loss, manufacturing still constrained (though improving), ADR structure adds currency risk (DKK/USD), potential for GLP-1 class-wide safety signal.",
        target: "$170-180 (12-month)",
        timeHorizon: "12 months"
      }
    ]
  },
  "rachel-kim": {
    name: "Rachel Kim",
    role: "Cybersecurity Specialist",
    pod: "Technology Pod",
    model: "claude-opus-4-7",
    temp: "0.2",
    trackRecord: "6 months active",
    hitRate: "62%",
    weight: "1.2x",
    bio: "Rachel Kim covers the cybersecurity sector including endpoint, network, cloud, identity, and application security vendors. Her coverage universe includes Palo Alto Networks, CrowdStrike, Zscaler, Fortinet, SentinelOne, and emerging AI-native security startups. She tracks threat landscape evolution, enterprise security budgets, and vendor consolidation dynamics.",
    methodology: "Rachel's framework focuses on: (1) Platformization scoring — measuring each vendor's ability to consolidate point solutions into a unified platform, (2) Net Revenue Retention (NRR) as the key leading indicator of land-and-expand success, (3) Threat landscape mapping — tracking how AI-powered attacks drive security spending, (4) Total Cost of Ownership (TCO) analysis comparing platform vs best-of-breed approaches. Her 'Cyber Platform Index' ranks vendors on breadth, integration depth, and customer retention.",
    currentView: "The cybersecurity market is undergoing a once-in-a-decade structural shift: platformization. Enterprises are consolidating from 40+ security vendors to 3-5 integrated platforms. Palo Alto Networks and CrowdStrike are the clear winners of this consolidation. AI-powered threats are escalating attack sophistication, making AI-native defense mandatory. Security budgets remain resilient even in uncertain macro — this is non-discretionary spend.",
    recommendations: [
      {
        ticker: "PANW",
        name: "Palo Alto Networks",
        price: "$412.80",
        change: "+1.8%",
        conviction: 9,
        action: "BUY",
        why: "Palo Alto Networks is the #1 cybersecurity platform with the broadest product portfolio (network, cloud, endpoint, SIEM/SOAR, AI security). Their platformization strategy is working — NRR at 25% means existing customers are spending 25% more each year. The 'free trial to paid conversion' strategy initially spooked investors but is now proving out with accelerating billings growth. AI-powered Cortex XSIAM is replacing legacy SIEMs at 10x the economics. Enterprises consolidating to PANW as primary security vendor.",
        how: "Position sizing: 3-4% of portfolio. Entry: current levels. PANW trades at 45x forward earnings but growing billings 20%+ with expanding margins — PEG ratio is reasonable. Add on any pullback to $380 (prior breakout level). The platformization thesis has 3-5 years of runway as enterprises are still early in consolidation. Don't try to time this — own the secular winner.",
        risks: "Platformization strategy execution risk (free trials could cannibalize paid), CrowdStrike competitive pressure in endpoint, Microsoft E5 security bundle as low-cost alternative, potential for large breach at a PANW-protected customer damaging reputation.",
        target: "$500-520 (12-month)",
        timeHorizon: "12-18 months"
      }
    ]
  },
  "victoria-sterling": {
    name: "Victoria Sterling",
    role: "Geopolitical Strategist",
    pod: "Economic Advisory Pod",
    model: "claude-opus-4-7",
    temp: "0.2",
    trackRecord: "6 months active",
    hitRate: "58%",
    weight: "1.0x",
    bio: "Victoria Sterling covers geopolitical risk and its impact on financial markets. Her coverage spans U.S.-China relations, Middle East dynamics, Russia-Ukraine, Taiwan Strait scenarios, energy security, and election/political risk. She maintains scenario probability trees for major geopolitical flashpoints and their market implications.",
    methodology: "Victoria's framework: (1) Scenario probability mapping — assigning probabilities to geopolitical outcomes and their market impact, (2) Supply chain vulnerability assessment — identifying which companies/sectors face geopolitical exposure, (3) Defense and energy security positioning — identifying beneficiaries of elevated geopolitical risk, (4) Event-driven dispatch — providing flash analysis within 15 minutes of material geopolitical developments.",
    currentView: "Four key geopolitical themes dominating markets: (1) U.S.-Iran negotiations creating oil supply optionality — Strait of Hormuz reopening could add 1-2M bbl/day. (2) China semiconductor restrictions escalating — creating winners (domestic chip makers) and losers (US companies with China revenue). (3) Russia-Ukraine frozen conflict keeping European defense budgets elevated. (4) SpaceX IPO at $1.75T creating unprecedented index fund liquidity dynamics. Net assessment: geopolitical risk is elevated but markets are pricing it correctly.",
    recommendations: [
      {
        ticker: "LMT",
        name: "Lockheed Martin",
        price: "$478.50",
        change: "+0.3%",
        conviction: 7,
        action: "BUY",
        why: "European defense spending is structurally higher for the next decade due to Russia-Ukraine. NATO members committed to 2%+ GDP on defense — most are still ramping. Lockheed's F-35 program, missile defense systems, and space assets are all benefiting. The stock provides portfolio insurance against geopolitical escalation — it tends to rally when risk events occur, offsetting losses elsewhere.",
        how: "Position sizing: 2-3% as portfolio hedge. This is not a growth play — it's a geopolitical insurance position. Buy at current levels, add if Russia-Ukraine escalates or Taiwan tensions rise. The stock provides negative correlation to risk-off events, making it valuable beyond its return profile.",
        risks: "Budget sequestration risk if political dynamics shift, F-35 program cost overruns, competition from emerging defense primes, potential peace dividends if geopolitical tensions ease.",
        target: "$520-540 (12-month)",
        timeHorizon: "12-24 months"
      }
    ]
  },
};

// Generate slug from analyst name
function nameToSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/\./g, "");
}

// Get all analyst slugs for routing
const allAnalystSlugs = Object.keys(analystDatabase);

export default function AnalystPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug || "";
  const analyst = analystDatabase[slug];

  if (!analyst) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#C9A961] text-xl mb-4" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Analyst Not Found</p>
          <p className="text-[#8A7548] text-sm mb-4">The analyst page for "{slug}" is being compiled.</p>
          <Link href="/"><Button variant="outline" className="bg-transparent border-[#C9A961]/30 text-[#C9A961]"><ArrowLeft className="w-3 h-3 mr-2" />Back to Terminal</Button></Link>
        </div>
      </div>
    );
  }

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
            <Link href="/"><Button variant="outline" size="sm" className="bg-transparent border-[#C9A961]/30 text-[#C9A961] hover:bg-[#C9A961]/10 text-xs"><ArrowLeft className="w-3 h-3 mr-1" /> Terminal</Button></Link>
            <div>
              <h1 className="text-[#C9A961] text-xl font-semibold" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{analyst.name}</h1>
              <p className="text-[#8A7548] text-xs">{analyst.role} — {analyst.pod}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 bg-[#4ADE80]/10 rounded border border-[#4ADE80]/30">
              <span className="text-[#4ADE80] text-[10px] uppercase tracking-[1px]">Active</span>
            </div>
            <div className="text-right">
              <p className="text-[#C9A961] text-xs">Hit Rate: {analyst.hitRate}</p>
              <p className="text-[#8A7548] text-[10px]">Weight: {analyst.weight}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 px-4 py-6 max-w-[1200px] mx-auto space-y-8">
        {/* Bio & Methodology */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-5">
            <h2 className="text-[#C9A961] text-lg mb-3" style={{ fontFamily: "'Cormorant Garamond', serif" }}>About {analyst.name}</h2>
            <p className="text-[#F5E6C8] text-sm leading-relaxed mb-4">{analyst.bio}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2 bg-[#0A0A0A] rounded border border-[#1F1A0F]">
                <p className="text-[#8A7548] text-[10px] uppercase">Model</p>
                <p className="text-[#F5E6C8] text-xs">{analyst.model}</p>
              </div>
              <div className="p-2 bg-[#0A0A0A] rounded border border-[#1F1A0F]">
                <p className="text-[#8A7548] text-[10px] uppercase">Temperature</p>
                <p className="text-[#F5E6C8] text-xs">{analyst.temp}</p>
              </div>
              <div className="p-2 bg-[#0A0A0A] rounded border border-[#1F1A0F]">
                <p className="text-[#8A7548] text-[10px] uppercase">Hit Rate</p>
                <p className="text-[#4ADE80] text-xs font-semibold">{analyst.hitRate}</p>
              </div>
              <div className="p-2 bg-[#0A0A0A] rounded border border-[#1F1A0F]">
                <p className="text-[#8A7548] text-[10px] uppercase">Weight</p>
                <p className="text-[#C9A961] text-xs font-semibold">{analyst.weight}</p>
              </div>
            </div>
          </div>
          <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-5">
            <h2 className="text-[#C9A961] text-lg mb-3" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Methodology</h2>
            <p className="text-[#F5E6C8] text-sm leading-relaxed">{analyst.methodology}</p>
          </div>
        </section>

        {/* Current View */}
        <section className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-5 border-l-4 border-l-[#C9A961]">
          <h2 className="text-[#C9A961] text-lg mb-3" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Current Market View</h2>
          <p className="text-[#F5E6C8] text-sm leading-relaxed">{analyst.currentView}</p>
        </section>

        {/* Recommendations */}
        <section>
          <h2 className="text-[#C9A961] text-2xl mb-4 pb-3 border-b border-[#1F1A0F]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Active Recommendations
          </h2>
          <div className="space-y-6">
            {analyst.recommendations.map((rec) => (
              <div key={rec.ticker} className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg overflow-hidden">
                {/* Rec Header */}
                <div className="px-5 py-3 bg-[#0A0A0A] border-b border-[#1F1A0F] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-[#C9A961] text-lg font-bold cursor-pointer hover:underline" onClick={() => window.location.href = `/stock/${rec.ticker}`}>{rec.ticker}</span>
                    <span className="text-[#F5E6C8] text-sm">{rec.name}</span>
                    <span className="text-[#F5E6C8] text-sm font-medium" style={{ fontVariantNumeric: "tabular-nums" }}>{rec.price}</span>
                    <span className={`text-xs ${rec.change.startsWith("+") ? "text-[#4ADE80]" : "text-[#EF4444]"}`}>{rec.change}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded text-[10px] uppercase tracking-[0.5px] font-bold ${rec.conviction >= 8 ? "bg-[#C9A961]/20 text-[#C9A961]" : "bg-[#8A7548]/20 text-[#8A7548]"}`}>Conv: {rec.conviction}/10</span>
                    <span className={`px-2.5 py-1 rounded text-[10px] uppercase tracking-[0.5px] font-bold ${rec.action.includes("STRONG") ? "bg-[#4ADE80]/20 text-[#4ADE80]" : "bg-[#C9A961]/20 text-[#C9A961]"}`}>{rec.action}</span>
                  </div>
                </div>

                {/* Rec Body */}
                <div className="p-5 space-y-4">
                  {/* WHY */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-[#C9A961]" />
                      <h3 className="text-[#C9A961] text-sm font-semibold uppercase tracking-[1px]">Why This Stock</h3>
                    </div>
                    <p className="text-[#F5E6C8] text-sm leading-relaxed">{rec.why}</p>
                  </div>

                  {/* HOW */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-[#4ADE80]" />
                      <h3 className="text-[#4ADE80] text-sm font-semibold uppercase tracking-[1px]">How to Trade It</h3>
                    </div>
                    <p className="text-[#F5E6C8] text-sm leading-relaxed">{rec.how}</p>
                  </div>

                  {/* RISKS */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-[#EF4444]" />
                      <h3 className="text-[#EF4444] text-sm font-semibold uppercase tracking-[1px]">Key Risks</h3>
                    </div>
                    <p className="text-[#F5E6C8] text-sm leading-relaxed">{rec.risks}</p>
                  </div>

                  {/* Target & Horizon */}
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#1F1A0F]">
                    <div className="p-3 bg-[#0A0A0A] rounded border border-[#1F1A0F]">
                      <p className="text-[#8A7548] text-[10px] uppercase tracking-[1px]">Price Target</p>
                      <p className="text-[#4ADE80] text-lg font-semibold">{rec.target}</p>
                    </div>
                    <div className="p-3 bg-[#0A0A0A] rounded border border-[#1F1A0F]">
                      <p className="text-[#8A7548] text-[10px] uppercase tracking-[1px]">Time Horizon</p>
                      <p className="text-[#C9A961] text-lg font-semibold">{rec.timeHorizon}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-[#1F1A0F] pt-6 pb-8 text-center">
          <img src={LOGO_URL} alt="Armstrong Arikat" className="h-10 mx-auto mb-2 opacity-60" />
          <p className="text-[#8A7548] text-[10px]">This analysis is prepared by Armstrong Arikat Private Wealth Group for internal portfolio management purposes. Not investment advice for third parties.</p>
        </footer>
      </main>
    </div>
  );
}

export { analystDatabase, nameToSlug };
