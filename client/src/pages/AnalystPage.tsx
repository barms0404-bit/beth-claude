/*
 * Individual Analyst Page — Armstrong Arikat Research Terminal
 * Each analyst gets their own dedicated page with in-depth research
 */

import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Bot, TrendingUp, TrendingDown, Target, AlertTriangle, CheckCircle, RefreshCw, Zap } from "lucide-react";
import { Streamdown } from "streamdown";

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
  "elena-vasquez": {
    name: "Elena Vasquez",
    role: "Energy Infrastructure Specialist",
    pod: "AI / Thematic Pod",
    model: "claude-opus-4-7",
    temp: "0.2",
    trackRecord: "6 months active",
    hitRate: "68%",
    weight: "1.3x",
    bio: "Elena Vasquez covers the energy infrastructure buildout required to power AI data centers. Her universe includes independent power producers, nuclear operators, gas turbine manufacturers, grid equipment companies, and utility-scale renewables. She tracks power purchase agreements, grid interconnection queues, and regulatory approvals.",
    methodology: "Elena's framework: (1) Power demand modeling — mapping announced data center capacity against available grid power, (2) Generation economics — comparing nuclear, gas, and renewable LCOE for baseload DC power, (3) Grid bottleneck analysis — identifying transmission constraints and upgrade timelines, (4) Regulatory pathway tracking — monitoring permitting and interconnection approvals.",
    currentView: "Data center power demand is creating the largest investment cycle in US power generation since the 1970s. US DC power demand projected to triple by 2030. Nuclear is the premium solution (24/7 baseload, zero carbon) but limited by build timelines. Natural gas turbines filling the gap. Grid infrastructure severely underbuilt for the demand surge.",
    recommendations: [
      { ticker: "GEV", name: "GE Vernova", price: "$342.80", change: "+1.9%", conviction: 8, action: "BUY", why: "GE Vernova is the only pure-play power equipment company at scale. Their gas turbine business (HA turbines) is seeing unprecedented demand as data centers need reliable baseload power. Order backlog at all-time highs. Also positioned in grid equipment and offshore wind. The spin-off from GE created a focused entity that the market is still undervaluing.", how: "Position sizing: 3-4% of portfolio. Entry: current levels. This is a multi-year infrastructure story — don't trade it. Add on any pullback to $310 support. The power demand thesis has 5-10 year runway as AI compute scales.", risks: "Gas turbine supply chain constraints, regulatory delays on new power plants, competition from nuclear SMRs long-term, potential for AI efficiency gains reducing power demand growth.", target: "$420-450 (12-month)", timeHorizon: "12-18 months" },
      { ticker: "VST", name: "Vistra Corp", price: "$128.40", change: "+2.3%", conviction: 7, action: "BUY", why: "Vistra owns the largest competitive power generation fleet in the US including nuclear plants. Their nuclear assets are being revalued as hyperscalers sign long-term PPAs for carbon-free baseload power. The Comanche Peak nuclear plant alone could be worth $15-20B in a PPA scenario. Also benefits from Texas grid dynamics.", how: "Position sizing: 2-3% of portfolio. Entry: current levels with stop at $105. The nuclear premium thesis is still early — market hasn't fully priced the PPA optionality. Add if Microsoft or Google announce nuclear PPA with Vistra.", risks: "Nuclear regulatory risk, Texas grid volatility, natural gas price exposure on non-nuclear fleet, potential for new nuclear builds competing long-term.", target: "$165-180 (12-month)", timeHorizon: "12 months" }
    ]
  },
  "sarah-nakamura": {
    name: "Sarah Nakamura",
    role: "Inference & AI Software Stack Specialist",
    pod: "AI / Thematic Pod",
    model: "claude-opus-4-7",
    temp: "0.2",
    trackRecord: "6 months active",
    hitRate: "65%",
    weight: "1.2x",
    bio: "Sarah Nakamura covers the AI inference silicon and software stack — the deployment side of AI that generates revenue from trained models. Her coverage spans inference-optimized chips, model serving frameworks, token economics, and edge AI deployment.",
    methodology: "Sarah tracks: (1) Inference cost curves — cost-per-token trends across hardware generations, (2) Model deployment patterns — cloud vs edge vs on-device, (3) Software stack economics — vLLM, TensorRT, ONNX runtime performance, (4) Edge AI adoption — on-device model capabilities and chip requirements.",
    currentView: "Inference is where AI generates revenue. While training gets the headlines, inference compute will be 3-5x larger than training by 2027. ARM's architecture dominates edge/mobile inference. NVIDIA maintains cloud inference lead through TensorRT but faces more competition than in training. The key trend: inference costs declining 10x per year, enabling new applications.",
    recommendations: [
      { ticker: "ARM", name: "ARM Holdings", price: "$245.80", change: "+2.1%", conviction: 7, action: "BUY", why: "ARM's architecture powers 99% of mobile devices and is becoming the standard for edge AI inference. Their royalty model means they benefit from every AI-capable chip shipped without manufacturing risk. Apple Intelligence, Qualcomm's AI Engine, and MediaTek's AI processors all pay ARM royalties. As AI moves to the edge, ARM's TAM expands dramatically.", how: "Position sizing: 2-3% of portfolio. Entry: current levels. ARM is expensive on traditional metrics but the royalty model creates exceptional economics — near-100% gross margins on incremental revenue. Add on any pullback to $220. Long-term hold as edge AI scales.", risks: "RISC-V open-source architecture as competitive threat, customer concentration (Apple ~25% of revenue), China revenue exposure, valuation premium requires sustained growth.", target: "$300-320 (12-month)", timeHorizon: "12-18 months" }
    ]
  },
  "james-okafor": {
    name: "James Okafor",
    role: "Robotics & Physical AI Specialist",
    pod: "AI / Thematic Pod",
    model: "claude-opus-4-7",
    temp: "0.2",
    trackRecord: "6 months active",
    hitRate: "55%",
    weight: "1.0x",
    bio: "James Okafor covers the emerging robotics and physical AI sector including humanoid robots, industrial automation, autonomous vehicles, and surgical robotics. His coverage spans Tesla (Optimus), Figure AI, Boston Dynamics, Intuitive Surgical, Rockwell Automation, and ABB.",
    methodology: "James evaluates: (1) Simulation-to-reality transfer capabilities, (2) Unit economics of robotic labor vs human labor, (3) Regulatory pathway for autonomous systems, (4) NVIDIA Isaac platform adoption as enabling infrastructure.",
    currentView: "Physical AI is the next major theme after digital AI. Tesla's Optimus humanoid is 2-3 years from commercial deployment but represents a $10T+ TAM if successful. Industrial automation accelerating as labor costs rise. Surgical robotics (ISRG) is the proven model for AI-assisted physical systems. This sector requires patience — position sizing should reflect early-stage nature.",
    recommendations: [
      { ticker: "ISRG", name: "Intuitive Surgical", price: "$542.30", change: "+0.8%", conviction: 7, action: "BUY", why: "Intuitive Surgical is the proven model for AI-assisted robotics in healthcare. da Vinci system installed base growing 15%+ annually. New da Vinci 5 platform with enhanced AI capabilities launching. Razor/blade model (instruments + services) creates recurring revenue. 20+ year moat in surgeon training and hospital integration.", how: "Position sizing: 2-3% of portfolio. Entry: current levels or pullback to $500. This is a compounder — own it for 5+ years. The installed base growth drives predictable recurring revenue that compounds.", risks: "Competition from Medtronic Hugo and J&J Ottava systems, hospital capital budget constraints, regulatory risk on AI-assisted surgery claims, high valuation (60x+ forward).", target: "$620-650 (12-month)", timeHorizon: "12-24 months" }
    ]
  },
  "priya-sharma": {
    name: "Priya Sharma",
    role: "Quantum Computing Specialist",
    pod: "AI / Thematic Pod",
    model: "claude-opus-4-7",
    temp: "0.2",
    trackRecord: "6 months active",
    hitRate: "48%",
    weight: "0.7x",
    bio: "Priya Sharma covers the quantum computing sector including IonQ, Rigetti, D-Wave, and government quantum programs. She tracks qubit counts, error rates, quantum volume metrics, and the timeline to quantum advantage in commercially relevant problems.",
    methodology: "Priya evaluates: (1) Technical progress — qubit counts, coherence times, error correction milestones, (2) Commercial readiness — are any quantum computers solving real problems better than classical?, (3) Government funding flows, (4) Timeline to quantum advantage in finance, pharma, and materials science.",
    currentView: "Quantum computing is 5-10 years from commercial relevance but speculative interest is creating trading opportunities. Current quantum computers cannot outperform classical computers on any commercially relevant problem. However, government funding is accelerating and technical milestones are being hit faster than expected. Maximum 1-2% portfolio allocation — this is pure speculation.",
    recommendations: [
      { ticker: "IONQ", name: "IonQ Inc", price: "$42.80", change: "+5.2%", conviction: 4, action: "SPECULATIVE", why: "IonQ has the most advanced trapped-ion quantum computer with highest published quantum volume. Government contracts provide revenue visibility. Partnership with major cloud providers (AWS, Azure, GCP) for quantum-as-a-service. If quantum computing works, IonQ is best positioned. But that's a big 'if' on a 5-10 year timeline.", how: "Position sizing: MAX 1% of portfolio. This is a lottery ticket, not an investment. Entry: current levels with mental stop at $25 (accept total loss possibility). Only add if technical milestones hit (1000+ logical qubits with error correction).", risks: "Technology may never achieve commercial quantum advantage, cash burn rate unsustainable without continued funding, competition from Google/IBM/Microsoft internal quantum programs, stock is pure speculation.", target: "$80+ (if quantum works) or $0 (if it doesn't)", timeHorizon: "3-5 years (speculative)" }
    ]
  },
  "michael-torres": {
    name: "Michael Torres",
    role: "Enterprise Software & SaaS Specialist",
    pod: "Technology Pod",
    model: "claude-opus-4-7",
    temp: "0.2",
    trackRecord: "6 months active",
    hitRate: "64%",
    weight: "1.2x",
    bio: "Michael Torres covers enterprise software and SaaS companies including Microsoft, ServiceNow, Workday, Salesforce, Snowflake, Datadog, and vertical SaaS platforms. He tracks net revenue retention, Rule of 40 scores, AI feature adoption, and enterprise spending patterns.",
    methodology: "Michael's framework: (1) NRR as leading indicator of land-and-expand success, (2) Rule of 40 scoring (revenue growth + FCF margin), (3) AI revenue contribution as % of ARR, (4) Enterprise spending survey data from CIO interviews.",
    currentView: "Enterprise software seeing clear bifurcation: AI-enabled platforms accelerating while legacy SaaS compresses. Microsoft Copilot is the biggest enterprise AI story — 40%+ seat expansion in early adopters. ServiceNow's AI platform launch drove 8.8% stock move. The key question: which SaaS companies can monetize AI vs which get disrupted by it?",
    recommendations: [
      { ticker: "MSFT", name: "Microsoft Corporation", price: "$418.57", change: "-0.12%", conviction: 8, action: "BUY", why: "Microsoft's Copilot integration across Office 365 represents the largest enterprise AI monetization opportunity in software history. 400M+ Office users × $30/month Copilot = $144B TAM at full penetration. Early data shows 40%+ seat expansion in enterprise accounts. Azure AI services growing 60%+ YoY. Ascending Triangle breakout above $420 projects $445 target.", how: "Position sizing: 4-5% of portfolio. Entry: current levels. MSFT is a core holding — the Copilot monetization story has 3-5 years of runway. Add on any pullback to $400. Don't overthink this — own the enterprise AI platform winner.", risks: "Copilot adoption slower than expected, Google Workspace AI competition, antitrust scrutiny on bundling, Azure growth deceleration, high valuation at 35x forward.", target: "$480-500 (12-month)", timeHorizon: "12-18 months" }
    ]
  },
  "andrew-walsh": {
    name: "Andrew Walsh",
    role: "Internet Platforms & Digital Advertising Specialist",
    pod: "Technology Pod",
    model: "claude-opus-4-7",
    temp: "0.2",
    trackRecord: "6 months active",
    hitRate: "60%",
    weight: "1.1x",
    bio: "Andrew Walsh covers internet platforms and digital advertising including Meta, Alphabet, Amazon (ads), Apple (services), Snap, Pinterest, The Trade Desk, and emerging ad-tech. He tracks digital ad spend, user engagement metrics, and AI's impact on advertising efficiency.",
    methodology: "Andrew tracks: (1) Digital ad spend growth by channel and format, (2) AI-powered ad targeting improvements (ROAS trends), (3) Platform engagement metrics and monetization rates, (4) Regulatory impact on targeting capabilities.",
    currentView: "Digital advertising recovery continues with AI-driven targeting improving ROAS 15-20% across major platforms. Meta's Advantage+ campaigns now represent 50% of ad spend on the platform. Alphabet's AI search integration driving higher-value queries. The shift to AI-generated creative is reducing advertiser production costs while improving performance.",
    recommendations: [
      { ticker: "META", name: "Meta Platforms", price: "$642.00", change: "+0.8%", conviction: 7, action: "HOLD", why: "Meta's AI-powered ad platform is the most efficient in digital advertising. Advantage+ campaigns deliver 20%+ better ROAS than manual campaigns. Reels monetization closing the gap with Feed. Reality Labs losses narrowing. However, at $1.6T market cap and 25x forward earnings, much of the AI ad improvement is priced in. Hold existing positions but don't chase.", how: "Position sizing: 3-4% if already owned. Don't initiate new positions at current levels — wait for pullback to $580-600 range. If owned, hold and collect the AI advertising tailwind. Trim if approaches $700 without earnings acceleration.", risks: "EU Digital Markets Act enforcement, Apple privacy changes round 2, TikTok competition for younger demographics, Reality Labs continued cash burn, regulatory breakup risk.", target: "$700-720 (12-month)", timeHorizon: "12 months" }
    ]
  },
  "sophia-reyes": {
    name: "Sophia Reyes",
    role: "Fintech & Payments Specialist",
    pod: "Technology Pod",
    model: "claude-opus-4-7",
    temp: "0.2",
    trackRecord: "6 months active",
    hitRate: "61%",
    weight: "1.1x",
    bio: "Sophia Reyes covers fintech and payments including Visa, Mastercard, PayPal, Block (Square), Adyen, and emerging crypto/DeFi platforms. She tracks payment volumes, cross-border transactions, consumer credit health, and digital banking adoption.",
    methodology: "Sophia's framework: (1) Payment volume growth tracking (Visa/MA monthly data), (2) Cross-border volume as leading indicator of travel/trade, (3) Consumer credit delinquency monitoring (30/60/90-day rates), (4) Digital wallet penetration and merchant adoption.",
    currentView: "Payment volumes remain healthy despite consumer sentiment weakness — people are spending even if they're not happy about it. Visa and Mastercard cross-border volumes growing 12%+ on international travel recovery. Consumer credit delinquencies ticking up from historic lows but not yet alarming. The networks (V, MA) remain the best risk-adjusted plays in fintech.",
    recommendations: [
      { ticker: "V", name: "Visa Inc", price: "$318.90", change: "+0.4%", conviction: 7, action: "BUY", why: "Visa is a toll booth on global commerce — they take a small fee on every transaction without taking credit risk. Cross-border volumes (highest margin) growing 12%+ on travel recovery. New flows (B2B payments, government disbursements) expanding TAM. AI-powered fraud detection improving network economics. Dividend growing 15%+ annually.", how: "Position sizing: 3-4% of portfolio. Entry: current levels. Visa is a forever hold — the business model improves every year as cash-to-digital conversion continues globally. Add on any broad market pullback. Don't try to time this.", risks: "Regulatory fee caps (Durbin amendment expansion), real-time payment systems (FedNow, UPI) disintermediating cards, crypto/stablecoin payments long-term, antitrust scrutiny on network duopoly.", target: "$360-380 (12-month)", timeHorizon: "12-24 months" }
    ]
  },
  "dr-nathan-cole": {
    name: "Dr. Nathan Cole",
    role: "Biotech & Small Cap Biotech Specialist",
    pod: "Healthcare Pod",
    model: "claude-opus-4-7",
    temp: "0.2",
    trackRecord: "6 months active",
    hitRate: "56%",
    weight: "1.0x",
    bio: "Dr. Nathan Cole covers biotech and small-cap biotech companies focused on clinical-stage drug development. His coverage spans oncology, rare disease, gene therapy, and immunology. He tracks FDA regulatory pathways, clinical trial data, PDUFA dates, and M&A dynamics.",
    methodology: "Nathan evaluates: (1) Clinical data quality — statistical significance, effect sizes, safety signals, (2) Regulatory pathway — FDA precedent, advisory committee dynamics, (3) M&A probability — which big pharma companies need pipeline and which biotechs fit, (4) Cash runway and dilution risk.",
    currentView: "Small-cap biotech seeing resurgence as M&A accelerates. Big pharma facing $200B+ in patent cliffs 2025-2030 driving acquisition appetite. Oncology and immunology most active M&A areas. Key catalysts: 14 PDUFA dates in next 60 days, 8 Phase 3 readouts pending. Position in quality names with multiple shots on goal.",
    recommendations: [
      { ticker: "REGN", name: "Regeneron Pharmaceuticals", price: "$1,125.40", change: "+0.6%", conviction: 7, action: "BUY", why: "Regeneron has the deepest pipeline in large-cap biotech with 35+ clinical programs. Dupixent franchise growing 20%+ with new indications (COPD approval pending). Eylea HD defending ophthalmology franchise. Oncology pipeline (Libtayo + bispecifics) underappreciated. Not a traditional M&A target (too large) but pipeline depth justifies premium.", how: "Position sizing: 2-3% of portfolio. Entry: current levels. REGN is a compounder — pipeline depth means multiple catalysts per year. Add on any pullback below $1,050. Hold through individual trial readouts.", risks: "Dupixent biosimilar timeline (2031+), Eylea biosimilar competition already impacting, oncology pipeline clinical risk, high absolute stock price limits retail participation.", target: "$1,300-1,400 (12-month)", timeHorizon: "12 months" }
    ]
  },
  "dr-kevin-zhao": {
    name: "Dr. Kevin Zhao",
    role: "Healthcare Tools, CDMOs & Life Sciences Specialist",
    pod: "Healthcare Pod",
    model: "claude-opus-4-7",
    temp: "0.2",
    trackRecord: "6 months active",
    hitRate: "63%",
    weight: "1.1x",
    bio: "Dr. Kevin Zhao covers healthcare tools, CDMOs (contract development and manufacturing organizations), and life sciences companies. His universe includes Thermo Fisher, Danaher, Agilent, Waters, Catalent, and Samsung Biologics.",
    methodology: "Kevin tracks: (1) Bioprocessing demand cycles — destocking vs restocking, (2) CDMO capacity utilization and pricing, (3) AI drug discovery tool adoption, (4) GLP-1 manufacturing demand as specific catalyst.",
    currentView: "Life sciences tools recovering after 18-month destocking cycle. The recovery is being led by two forces: (1) AI drug discovery driving demand for high-throughput screening and genomics platforms, (2) GLP-1 manufacturing demand creating unprecedented CDMO backlogs. Thermo Fisher and Danaher are best positioned for the recovery.",
    recommendations: [
      { ticker: "TMO", name: "Thermo Fisher Scientific", price: "$582.40", change: "+1.1%", conviction: 7, action: "BUY", why: "Thermo Fisher is the largest life sciences tools company globally with exposure to every major biopharma trend. Destocking cycle ending — orders inflecting positive. AI drug discovery driving demand for mass spec, genomics, and cell analysis platforms. GLP-1 manufacturing expansion benefiting their bioprocessing division. M&A machine with proven integration track record.", how: "Position sizing: 2-3% of portfolio. Entry: current levels. TMO is a quality compounder — buy on the destocking recovery inflection. Add below $550. This is a 3-5 year hold as biopharma R&D spending accelerates.", risks: "Destocking recovery slower than expected, China biopharma funding weakness, competition from Danaher in bioprocessing, high valuation (30x forward) requires growth delivery.", target: "$680-720 (12-month)", timeHorizon: "12-18 months" }
    ]
  },
  "catherine-brooks": {
    name: "Catherine Brooks",
    role: "Consumer Discretionary & Brands Specialist",
    pod: "Consumer Pod",
    model: "claude-opus-4-7",
    temp: "0.2",
    trackRecord: "6 months active",
    hitRate: "57%",
    weight: "1.0x",
    bio: "Catherine Brooks covers consumer discretionary and brands including athletic wear, luxury, retail, autos, and consumer electronics. She tracks brand heat scores, foot traffic data, consumer sentiment, and the GLP-1 impact on consumer behavior.",
    methodology: "Catherine's framework: (1) Brand heat tracking via social media sentiment and search trends, (2) Foot traffic and web traffic data for real-time demand signals, (3) GLP-1 consumer behavior impact modeling, (4) Trade-down/trade-up dynamics in different income cohorts.",
    currentView: "Consumer spending bifurcating sharply. High-income consumers resilient, low/mid-income trading down aggressively. Costco and Walmart gaining share. GLP-1 adoption creating structural shift in consumer behavior — more spending on athletic/wellness, less on food/restaurants. Nike benefiting from the wellness trend.",
    recommendations: [
      { ticker: "COST", name: "Costco Wholesale", price: "$1,045.20", change: "+0.8%", conviction: 6, action: "BUY", why: "Costco is the ultimate defensive consumer play. Membership model creates recurring revenue with 93% renewal rate. Comps +6.8% driven by trade-down effect as consumers seek value. E-commerce growing 20%+. Special dividends provide additional shareholder returns. In a recession, Costco gains share. In expansion, Costco still gains share.", how: "Position sizing: 2-3% as defensive allocation. Entry: current levels. Costco is always 'expensive' on P/E but the membership model justifies premium. This is portfolio insurance — it outperforms in downturns. Add on any broad market selloff.", risks: "Membership fee increase timing (could slow growth temporarily), Walmart+ competition, Amazon Fresh expansion, high valuation (45x forward) limits upside in strong markets.", target: "$1,150-1,200 (12-month)", timeHorizon: "12-18 months" }
    ]
  },
  "daniel-ortiz": {
    name: "Daniel Ortiz",
    role: "Travel, Leisure & Restaurants Specialist",
    pod: "Consumer Pod",
    model: "claude-opus-4-7",
    temp: "0.2",
    trackRecord: "6 months active",
    hitRate: "59%",
    weight: "1.0x",
    bio: "Daniel Ortiz covers travel, leisure, and restaurants including cruise lines, hotels, airlines, gaming, and restaurant chains. He tracks TSA throughput, hotel RevPAR, cruise net yields, and restaurant same-store sales.",
    methodology: "Daniel tracks: (1) TSA throughput vs 2019 as demand indicator, (2) Hotel RevPAR trends by segment (luxury vs economy), (3) Cruise net yield growth and capacity additions, (4) GLP-1 impact on restaurant portion sizes and traffic.",
    currentView: "Travel demand remains above 2019 levels. Cruise net yields at all-time highs — pricing power exceptional. Hotels benefiting from business travel recovery. Restaurant industry facing GLP-1 headwinds on portion sizes. Favor experiences over consumption: cruises > restaurants.",
    recommendations: [
      { ticker: "RCL", name: "Royal Caribbean Group", price: "$218.40", change: "+1.2%", conviction: 7, action: "BUY", why: "Royal Caribbean has the strongest pricing power in travel. Net yields at all-time highs with demand exceeding capacity through 2027. New ships (Icon class) commanding 30%+ premium pricing. Younger demographic adoption growing — cruising no longer just for retirees. Balance sheet delevering rapidly from COVID peak.", how: "Position sizing: 2-3% of portfolio. Entry: current levels. RCL is a recovery-to-growth story — the cruise industry has structurally repriced higher. Add on any pullback to $195. Hold through seasonal weakness (Q1 typically soft).", risks: "Recession would impact discretionary travel spend, fuel cost volatility, geopolitical events disrupting itineraries, new ship delivery delays, health incident risk (COVID variant).", target: "$260-280 (12-month)", timeHorizon: "12 months" }
    ]
  },
  "jessica-huang": {
    name: "Jessica Huang",
    role: "E-Commerce & Marketplaces Specialist",
    pod: "Consumer Pod",
    model: "claude-opus-4-7",
    temp: "0.2",
    trackRecord: "6 months active",
    hitRate: "62%",
    weight: "1.1x",
    bio: "Jessica Huang covers e-commerce and marketplace platforms including Amazon (retail), Shopify, MercadoLibre, Sea Limited, and emerging platforms. She tracks GMV growth, take rates, geographic expansion, and the impact of AI on merchant tools.",
    methodology: "Jessica evaluates: (1) GMV growth and take rate trends, (2) Geographic expansion opportunities (LatAm, SEA), (3) AI-powered merchant tools driving platform stickiness, (4) Logistics and fulfillment economics.",
    currentView: "E-commerce penetration still only 22% of US retail — long runway ahead. MercadoLibre dominating LatAm with GMV +28% and fintech adding high-margin revenue. Shopify's AI tools driving higher merchant retention and take rates. Amazon retail seeing margin expansion from advertising. Temu/Shein disrupting mid-market but not premium platforms.",
    recommendations: [
      { ticker: "MELI", name: "MercadoLibre", price: "$2,180.00", change: "+2.1%", conviction: 7, action: "BUY", why: "MercadoLibre is the Amazon + PayPal of Latin America in one company. E-commerce GMV growing 28%+ in a region with only 12% e-commerce penetration (vs 22% US). Mercado Pago fintech division adding high-margin revenue from payments, lending, and insurance. Logistics network (Mercado Envios) creating moat. $100B+ TAM with dominant market position.", how: "Position sizing: 2-3% of portfolio. Entry: current levels. MELI is a long-term compounder in an underpenetrated market. Add on any LatAm macro weakness (creates buying opportunities). Hold for 3-5 years minimum.", risks: "LatAm macro/currency volatility, regulatory risk in Brazil and Argentina, competition from Amazon in Mexico, credit losses in fintech lending, political instability in key markets.", target: "$2,600-2,800 (12-month)", timeHorizon: "12-24 months" }
    ]
  },
  "dr-robert-kessler": {
    name: "Dr. Robert Kessler",
    role: "Chief Economist",
    pod: "Economic Advisory Pod",
    model: "claude-opus-4-7",
    temp: "0.2",
    trackRecord: "6 months active",
    hitRate: "66%",
    weight: "1.2x",
    bio: "Dr. Robert Kessler is the Chief Economist providing macro synthesis, Fed reaction function analysis, and growth equity implications. He integrates inputs from all economic advisory pod members into a unified macro view.",
    methodology: "Robert's framework: (1) Fed reaction function modeling — predicting policy based on dual mandate inputs, (2) Growth-inflation 2x2 matrix — classifying the macro regime, (3) Leading indicator composite — combining financial conditions, labor, and sentiment data, (4) Equity risk premium analysis.",
    currentView: "Dangerous divergence between stock market performance and consumer sentiment. Equities at all-time highs while Michigan sentiment at new lows. Fed boxed in at 3.50-3.75% — cutting reignites inflation, hiking crashes risk assets. 37% probability of hike by year-end if inflation remains sticky. Growth equity implication: favor quality growth with pricing power, avoid rate-sensitive sectors.",
    recommendations: [
      { ticker: "SPY", name: "S&P 500 ETF", price: "$747.34", change: "+0.37%", conviction: 6, action: "HOLD", why: "The S&P 500 at 7,473 is pricing a soft landing + AI productivity boom. This is achievable but not certain. The consumer sentiment divergence is a warning — historically, when sentiment leads equities lower, the lag is 6-12 months. However, the AI capex cycle provides a floor that previous cycles didn't have. Net: hold existing equity exposure but don't add aggressively at these levels.", how: "Maintain current equity allocation (don't reduce). Shift within equities toward quality (high ROE, low debt, pricing power). Add 10-15% to short-duration fixed income as yield hedge. Keep 5-10% cash for potential correction buying opportunity.", risks: "10Y yield breaking 5% could trigger 8-12% correction, consumer spending cliff if sentiment translates to behavior, Fed policy error (hiking into weakness), geopolitical shock disrupting supply chains.", target: "7,800-8,000 (bull) / 6,800-7,000 (bear)", timeHorizon: "6-12 months" }
    ]
  },
  "wei-lin": {
    name: "Wei Lin",
    role: "China Economist",
    pod: "Economic Advisory Pod",
    model: "claude-opus-4-7",
    temp: "0.2",
    trackRecord: "6 months active",
    hitRate: "58%",
    weight: "1.0x",
    bio: "Wei Lin covers Chinese macroeconomics, property sector dynamics, policy responses, and the implications for US-listed companies with China exposure. He tracks PBOC policy, property sales, consumer confidence, and semiconductor self-sufficiency progress.",
    methodology: "Wei evaluates: (1) Property sector stabilization metrics — sales volumes, developer defaults, policy support, (2) Consumer confidence and spending patterns, (3) Tech sector regulatory trajectory, (4) Semiconductor self-sufficiency timeline and implications for US chip companies.",
    currentView: "China recovery remains uneven. Property sector stabilizing but not recovering — policy support preventing collapse without sparking growth. Consumer confidence weak. The bright spot: tech regulation easing significantly, benefiting Alibaba and Tencent. Semiconductor self-sufficiency push accelerating with massive state investment — long-term threat to US chip companies' China revenue.",
    recommendations: [
      { ticker: "BABA", name: "Alibaba Group", price: "$128.40", change: "+1.8%", conviction: 6, action: "SPECULATIVE BUY", why: "Alibaba trading at 10x earnings — absurdly cheap for a company with dominant e-commerce, cloud (growing 40%+), and AI capabilities. Regulatory overhang lifting. Jack Ma rehabilitation signals government support. Cloud AI revenue accelerating. However, China macro weakness and geopolitical risk justify the discount. This is a value play with optionality.", how: "Position sizing: 1-2% MAX. This is a geopolitical risk position. Entry: current levels. Accept that this could go to $80 on US-China escalation or $200 on normalization. Size accordingly. Do NOT average down aggressively.", risks: "US-China decoupling escalation, ADR delisting risk (reduced but not zero), China property crisis deepening, government intervention in business operations, VIE structure legal risk.", target: "$160-180 (if China stabilizes) / $80 (if tensions escalate)", timeHorizon: "12-24 months" }
    ]
  },
  "thomas-brennan": {
    name: "Thomas Brennan",
    role: "Inflation Specialist",
    pod: "Economic Advisory Pod",
    model: "claude-opus-4-7",
    temp: "0.2",
    trackRecord: "6 months active",
    hitRate: "70%",
    weight: "1.3x",
    bio: "Thomas Brennan is the inflation specialist tracking CPI, PCE, supercore, leading indicators, and the shelter lag model. He provides inflation forecasts that feed into Fed policy expectations and sector allocation decisions.",
    methodology: "Thomas tracks: (1) CPI component decomposition — goods vs services vs shelter, (2) Supercore (services ex-housing) as Fed's preferred measure, (3) Leading indicators — PPI pipeline, wage growth, rent indices, (4) Shelter lag model — predicting when OER catches down to real-time rents.",
    currentView: "Inflation proving stickier than expected. CPI at 3.4%, Core PCE at 2.8%, Supercore at 4.1%. The shelter lag model suggests gradual easing H2 2026 but the path to 2% target extends well into 2027. Energy prices adding upward pressure. Wage growth at 4.2% keeping services inflation elevated. This is NOT a disinflationary environment — position accordingly.",
    recommendations: [
      { ticker: "TIP", name: "iShares TIPS ETF", price: "$108.20", change: "+0.1%", conviction: 7, action: "BUY", why: "TIPS (Treasury Inflation-Protected Securities) provide direct inflation protection with real yields at 2.2% — historically attractive. If inflation remains sticky at 3-4% (our base case), TIPS outperform nominal Treasuries. Even if inflation falls, the 2.2% real yield provides a floor. This is the cleanest inflation hedge available.", how: "Position sizing: 5-8% of fixed income allocation. Entry: current levels. TIPS are a strategic allocation, not a trade. Hold as permanent inflation insurance. Ladder maturities (2Y, 5Y, 10Y) for diversification.", risks: "If inflation falls rapidly to 2%, nominal Treasuries outperform. Liquidity lower than nominal Treasuries. Duration risk if real yields rise further.", target: "$112-115 (if inflation stays elevated)", timeHorizon: "12-24 months" }
    ]
  },
  "patricia-duval": {
    name: "Patricia Duval",
    role: "Fiscal Policy & Political Economy Specialist",
    pod: "Economic Advisory Pod",
    model: "claude-opus-4-7",
    temp: "0.2",
    trackRecord: "6 months active",
    hitRate: "55%",
    weight: "1.0x",
    bio: "Patricia Duval covers fiscal policy, government spending, regulatory developments, and political economy. She tracks budget deficits, Treasury issuance, industrial policy (CHIPS Act, IRA), and election/political risk.",
    methodology: "Patricia evaluates: (1) Fiscal deficit trajectory and bond supply implications, (2) Industrial policy beneficiaries (CHIPS Act, IRA), (3) Regulatory risk by sector, (4) Election cycle positioning.",
    currentView: "Fiscal deficit remains elevated at ~6% of GDP — unprecedented outside of recession. Bond supply concerns contributing to elevated long-end yields. The CHIPS Act and IRA are creating investment tailwinds for semiconductors and clean energy. Midterm elections approaching — watch for policy uncertainty premium.",
    recommendations: [
      { ticker: "INTC", name: "Intel Corporation", price: "$32.40", change: "+2.8%", conviction: 5, action: "SPECULATIVE", why: "Intel is the primary beneficiary of the CHIPS Act with $20B+ in government subsidies for US fab construction. If Intel's foundry strategy works (big if), the stock is worth $60+. Current price reflects deep skepticism. This is a policy bet — the US government needs Intel to succeed for national security reasons and will continue supporting it.", how: "Position sizing: 1-2% MAX. This is a turnaround/policy bet. Entry: current levels with mental stop at $22. Only add if 18A process node hits manufacturing milestones on time. Accept binary outcome possibility.", risks: "18A process node delays (Intel's track record is poor), TSMC competitive dominance, cash burn rate during transition, management credibility deficit, foundry customers may not trust Intel.", target: "$50-60 (if turnaround works) / $20 (if it doesn't)", timeHorizon: "18-24 months" }
    ]
  },
  "alexander-petrov": {
    name: "Alexander Petrov",
    role: "Global FX & Commodities Strategist",
    pod: "Economic Advisory Pod",
    model: "claude-opus-4-7",
    temp: "0.2",
    trackRecord: "6 months active",
    hitRate: "62%",
    weight: "1.1x",
    bio: "Alexander Petrov covers global FX, commodities, and cross-asset flows. His universe includes the US dollar, oil, gold, copper, uranium, and agricultural commodities. He tracks central bank policies, supply/demand dynamics, and geopolitical supply risks.",
    methodology: "Alexander evaluates: (1) DXY drivers — rate differentials, growth differentials, safe-haven flows, (2) Oil supply/demand balance — OPEC+, US shale, Iran, (3) Gold as monetary asset — central bank buying, real yields, (4) Industrial metals as economic indicators — copper/AI power thesis.",
    currentView: "DXY stable at 104 — supported by rate differentials but capped by twin deficits. Oil at $72 with downside risk from Iran negotiations. Gold at $2,415 — central bank buying providing structural floor. Copper at $4.82 — AI data center power demand creating new demand driver beyond traditional construction/manufacturing.",
    recommendations: [
      { ticker: "GLD", name: "SPDR Gold Trust", price: "$222.80", change: "+0.4%", conviction: 7, action: "BUY", why: "Gold is in a structural bull market driven by central bank de-dollarization (China, Russia, India buying 1000+ tons/year), elevated geopolitical risk, and fiscal deficit concerns. Real yields at 2.2% would historically cap gold, but central bank buying is overwhelming the yield headwind. Gold also provides portfolio insurance against tail risks (war, financial crisis, dollar crisis).", how: "Position sizing: 3-5% of portfolio as strategic allocation. Entry: current levels. Gold is a permanent portfolio position, not a trade. Add on any pullback to $2,300. Consider mix of GLD (paper) and physical for tail risk insurance.", risks: "Rising real yields if Fed hikes aggressively, crypto competing as alternative store of value, central bank buying pace slowing, strong dollar rally.", target: "$2,600-2,800 (12-month)", timeHorizon: "12-24 months" }
    ]
  },
  "maria-santos": {
    name: "Maria Santos",
    role: "Labor Economist",
    pod: "Economic Advisory Pod",
    model: "claude-opus-4-7",
    temp: "0.2",
    trackRecord: "6 months active",
    hitRate: "64%",
    weight: "1.1x",
    bio: "Maria Santos covers labor market dynamics including NFP, JOLTS, wages, unemployment claims, and the Fed's reaction function to labor data. She provides real-time assessment of labor market health and its implications for monetary policy.",
    methodology: "Maria tracks: (1) NFP trend and revisions pattern, (2) JOLTS openings-to-unemployed ratio, (3) Wage growth by sector (ECI, AHE), (4) Initial/continuing claims as leading indicators, (5) Fed's labor market framework for policy decisions.",
    currentView: "Labor market resilient but gradually cooling from overheated levels. Unemployment at 4.1% — still low historically. Wage growth at 4.2% YoY — above Fed's comfort zone of 3-3.5%. JOLTS ratio normalized to 1.2x from 2.0x peak. No recession signal from labor data, but the cooling trend supports eventual Fed easing. Key risk: if wages reaccelerate, Fed hikes back on table.",
    recommendations: [
      { ticker: "ADP", name: "ADP Inc", price: "$285.60", change: "+0.5%", conviction: 6, action: "HOLD", why: "ADP is a direct play on employment levels — they process payroll for 1M+ businesses. Revenue grows with employment and wage inflation (higher wages = higher payroll processing fees). Defensive business model with 90%+ retention. However, if unemployment rises significantly, ADP faces headwinds. At current valuation (28x forward), the stock prices in continued labor market health.", how: "Position sizing: 1-2% as labor market indicator position. Hold if already owned. Don't initiate new positions unless pullback to $260. This is a quality defensive name but not cheap enough to buy aggressively.", risks: "Rising unemployment would directly impact revenue, competition from Gusto/Rippling in SMB segment, wage growth deceleration reducing per-employee revenue, high valuation limits upside.", target: "$310-320 (12-month)", timeHorizon: "12 months" }
    ]
  },
  "richard-callahan": {
    name: "Richard Callahan",
    role: "Dividend Aristocrat & Income Specialist",
    pod: "Style / Factor Pod",
    model: "claude-opus-4-7",
    temp: "0.2",
    trackRecord: "6 months active",
    hitRate: "58%",
    weight: "1.0x",
    bio: "Richard Callahan covers dividend aristocrats, dividend kings, and income-generating strategies. He focuses on companies with 25+ year dividend growth streaks, evaluating dividend safety, growth potential, and total return.",
    methodology: "Richard evaluates: (1) Dividend safety — payout ratio, FCF coverage, balance sheet strength, (2) Dividend growth rate — 5/10/20 year CAGR, (3) Total return potential — dividend yield + dividend growth + valuation change, (4) Sector diversification within income portfolio.",
    currentView: "In the current environment of elevated yields and market uncertainty, dividend aristocrats provide a defensive anchor. With 10Y Treasury at 4.87%, dividend stocks face yield competition — but dividend GROWTH stocks still win long-term. Recommend 10-15% allocation to high-quality dividend growers as portfolio insurance against the consumer sentiment/equity divergence.",
    recommendations: [
      { ticker: "JNJ", name: "Johnson & Johnson", price: "$162.40", change: "+0.2%", conviction: 7, action: "BUY", why: "JNJ is the ultimate defensive dividend compounder — 62 consecutive years of dividend increases. 3.2% yield growing 5-6% annually. Pharmaceutical segment (Stelara, Darzalex, Tremfya) driving growth. MedTech recovering post-COVID. Kenvue spin-off created a cleaner pharma/medtech story. In any market downturn, JNJ outperforms.", how: "Position sizing: 2-3% as core defensive holding. Entry: current levels. JNJ is a permanent portfolio position — buy and never sell. Reinvest dividends for compounding. Add on any broad market selloff.", risks: "Talc litigation overhang (manageable but headline risk), Stelara biosimilar timeline (2025), pharmaceutical patent cliffs, below-market growth rate limits capital appreciation.", target: "$180-190 (12-month)", timeHorizon: "Permanent hold" }
    ]
  },
  "gregory-ashford": {
    name: "Gregory Ashford",
    role: "Value Investor Specialist",
    pod: "Style / Factor Pod",
    model: "claude-opus-4-7",
    temp: "0.2",
    trackRecord: "6 months active",
    hitRate: "41%",
    weight: "0.8x",
    bio: "Gregory Ashford is the contrarian value investor providing bear cases, margin-of-safety analysis, and deep value opportunities. He challenges consensus bullish views and identifies where the market is mispricing risk. His hit rate is lower in growth-led regimes but provides essential risk management.",
    methodology: "Gregory evaluates: (1) Normalized earnings power — what would this company earn in a normal environment?, (2) Asset value — what are the parts worth in liquidation?, (3) Margin of safety — how much downside protection exists at current price?, (4) Mean reversion catalysts — what will cause the market to reprice?",
    currentView: "The market is priced for perfection. NVDA at 45x forward, S&P at 22x — these multiples require sustained growth that historically doesn't persist. Value factor underperforming in current regime (my hit rate reflects this). However, select deep value opportunities exist in energy (10x earnings), financials (12x), and pharma. Berkshire's $400B cash pile is the ultimate value signal — Buffett sees limited opportunities.",
    recommendations: [
      { ticker: "BRK.B", name: "Berkshire Hathaway", price: "$478.20", change: "+0.3%", conviction: 7, action: "BUY", why: "Berkshire Hathaway with $400B in cash is the ultimate value investor's position. You're buying Buffett's optionality — he's waiting for a crisis to deploy capital at distressed prices. Meanwhile, operating businesses (GEICO, BNSF, energy) generate $30B+ in annual earnings. If a correction comes, Berkshire deploys cash at the bottom. If no correction, you still own great businesses at 18x earnings.", how: "Position sizing: 3-5% of portfolio. Entry: current levels. BRK.B is permanent portfolio infrastructure — it provides downside protection (cash + insurance float) with upside optionality (capital deployment in crisis). Never sell this.", risks: "Buffett succession risk (age 95), cash drag in continued bull market, insurance catastrophe losses, railroad/energy regulatory risk, market may never give Buffett a buying opportunity.", target: "$540-560 (12-month)", timeHorizon: "Permanent hold" }
    ]
  },
  "claire-donovan": {
    name: "Claire Donovan",
    role: "Fixed Income Specialist",
    pod: "Style / Factor Pod",
    model: "claude-opus-4-7",
    temp: "0.2",
    trackRecord: "6 months active",
    hitRate: "67%",
    weight: "1.2x",
    bio: "Claire Donovan covers fixed income including Treasuries, investment-grade credit, high-yield bonds, and the Fed policy path. She provides rates strategy, credit spread analysis, and duration positioning recommendations.",
    methodology: "Claire evaluates: (1) Yield curve shape and term premium, (2) Credit spread dynamics — IG and HY OAS trends, (3) Fed policy path — dot plot analysis, market pricing vs fundamentals, (4) Duration positioning based on rate volatility regime.",
    currentView: "Treasury yields near 2007 levels with 10Y at 4.87% and 30Y at 5.12%. The 2s10s spread normalized at +35bps after longest inversion in history. IG credit spreads tight at ~90bps — not signaling stress. HY at ~350bps, widening slightly. Recommendation: Barbell strategy — short-duration T-bills (5%+ risk-free yield) combined with high-quality IG corporate credit (lock in 5.5-6% yields). Avoid long duration until Fed signals clear pivot.",
    recommendations: [
      { ticker: "SHY", name: "iShares 1-3 Year Treasury ETF", price: "$82.40", change: "+0.02%", conviction: 8, action: "BUY", why: "Short-duration Treasuries yielding 5%+ with near-zero duration risk. This is the highest risk-free yield in 17 years. In any scenario — rates up, rates down, recession, no recession — you earn 5% with principal safety. This is the 'dry powder' position that lets you be aggressive elsewhere while earning 5% on your cash.", how: "Position sizing: 10-15% of total portfolio. Entry: immediately. This is not a trade — it's cash management. Park money here instead of money market. If rates fall (Fed cuts), you get capital appreciation bonus. If rates rise, you still earn 5% and can reinvest at higher yields.", risks: "Opportunity cost if equities rally significantly, inflation eroding real returns (5% nominal - 3.4% CPI = 1.6% real), Fed cutting rates would reduce forward yield (but give capital gain).", target: "5%+ yield (ongoing)", timeHorizon: "6-12 months (rolling)" }
    ]
  },
  "colonel-derek-hayes": {
    name: "Col. Derek Hayes (Ret.)",
    role: "Space & Aerospace Specialist",
    pod: "AI / Thematic Pod",
    model: "claude-opus-4-7",
    temp: "0.2",
    trackRecord: "New specialist — inaugural dispatch",
    hitRate: "N/A (new)",
    weight: "1.0x",
    bio: "Colonel Derek Hayes (USAF, Retired) served 22 years in military space operations including USAF Space Command, National Reconnaissance Office (NRO), and classified satellite programs at Peterson AFB and Schriever SFB. After military service, he spent 8 years at Lockheed Martin Skunk Works leading advanced satellite and launch vehicle programs. MBA from Wharton School of Business with concentration in Private Equity. He is the definitive authority on the commercial space economy and the SpaceX supply chain.",
    methodology: "Col. Hayes evaluates space investments through five lenses: (1) SpaceX Supply Chain Mapping — identifying direct suppliers, partners, and beneficiaries of SpaceX's 100+ annual launches and Starlink's 6,000+ satellite constellation, (2) Government Contract Pipeline — tracking NASA, DoD, NRO, and Space Force contract awards worth $50B+ annually, (3) Unit Economics of Space — launch cost per kg declining from $54,500 (Shuttle) to $2,720 (Falcon 9) to projected $200 (Starship), enabling entirely new business models, (4) TAM Expansion — space economy growing from $469B (2024) to $1.8T by 2035 per Morgan Stanley, (5) SpaceX IPO Halo Effect — the $350B+ IPO will drive massive capital flows into the entire space sector, re-rating every public space company.",
    currentView: "We are at an inflection point in the commercial space economy. SpaceX's expected June 2026 IPO at $350B+ valuation is the single biggest catalyst for the space sector in a decade. Every public space stock will re-rate as institutional capital discovers the sector. Rocket Lab (RKLB) is the only credible #2 launch provider with Neutron on track. Redwire (RDW) is the picks-and-shovels play with $300M+ backlog in space manufacturing. Momentus (MNTS) is speculative but positioned for the in-space transportation market. Position now — by the time SpaceX prices, these stocks will have already moved 30-50%.",
    recommendations: [
      { ticker: "RDW", name: "Redwire Corporation", price: "$14.80", change: "+3.2%", conviction: 8, action: "BUY", why: "Redwire is the premier space manufacturing and infrastructure company. They build solar arrays, 3D-print structures in orbit, and manufacture satellite components. $300M+ backlog growing 40%+ YoY. Direct SpaceX customer — their hardware flies on Falcon 9 and Dragon missions. Revenue inflecting with multiple NASA and DoD contracts. This is the picks-and-shovels play for the space economy — they make the tools everyone else needs.", how: "Position sizing: 3-4% of portfolio. Entry at current levels. This is a growth compounder, not a trade. Add on any pullback below $13. Stop-loss at $10.50 (30% below). The SpaceX IPO will be a major catalyst — institutional investors discovering space will find RDW as one of the few profitable, growing space companies.", risks: "Customer concentration (NASA/DoD ~60% of revenue), execution risk on scaling manufacturing, competition from larger defense primes entering space, dilution risk if they raise capital for acquisitions.", target: "$22-25 (12-month)", timeHorizon: "12-18 months" },
      { ticker: "MNTS", name: "Momentus Inc.", price: "$2.85", change: "+5.6%", conviction: 5, action: "SPECULATIVE BUY", why: "Momentus provides in-space transportation — the 'last mile delivery' for satellites. Think of them as the FedEx of orbit. They take satellites from the rocket's drop-off point to their precise orbital destination. As satellite constellations proliferate (Starlink has 6,000+, Amazon Kuiper launching 3,200+), the demand for orbital maneuvering and servicing will explode. The company is pre-revenue and burning cash, but the market they're targeting is real and growing.", how: "Position sizing: 1-2% MAX. This is a speculative position. Entry at current levels with strict stop-loss at $1.80 (37% below). This is a binary outcome — either they execute on contracts and the stock is a 5-10x, or they run out of cash and it goes to zero. Size accordingly. Never average down.", risks: "Pre-revenue company with cash burn, execution risk on Vigoride missions, competition from SpaceX's own rideshare program, potential dilution, regulatory risk (CFIUS previously flagged the company), management turnover history.", target: "$8-12 if execution succeeds (speculative)", timeHorizon: "18-24 months" },
      { ticker: "RKLB", name: "Rocket Lab USA", price: "$28.40", change: "+1.8%", conviction: 9, action: "STRONG BUY", why: "Rocket Lab is the only credible #2 launch provider to SpaceX. Electron rocket has 50+ successful launches. Neutron (medium-lift) on track for 2026 maiden flight — this is the catalyst that transforms them from small-sat launcher to full-spectrum competitor. $2.2B backlog. Vertically integrated — they build their own engines, avionics, and spacecraft. Government contracts accelerating with DoD and NRO. When SpaceX IPOs at $350B, RKLB re-rates as the public market proxy for launch.", how: "Position sizing: 5-6% — this is the core space holding. Entry at current levels. Add aggressively on any pullback to $24-25. This is a 3-5 year compounder. Neutron success = stock doubles. Even without Neutron, Electron + Space Systems division supports $35+ valuation.", risks: "Neutron development delays, SpaceX pricing pressure on launch costs, customer concentration, capital requirements for Neutron development, competition from Blue Origin and ULA.", target: "$45-55 (12-month), $80-100 (3-year)", timeHorizon: "12-36 months" },
      { ticker: "ASTS", name: "AST SpaceMobile", price: "$22.60", change: "+2.4%", conviction: 6, action: "BUY", why: "AST SpaceMobile is building a space-based cellular broadband network that connects directly to standard smartphones. FCC authorized for 248 BlueBird satellites. If it works, it addresses a $1T+ TAM — the 5 billion people without reliable cellular coverage. Partnership with AT&T, Vodafone, Rakuten. First commercial satellites launching on SpaceX. This is either a $100B company or a zero.", how: "Position sizing: 2-3%. High conviction on the vision, moderate conviction on execution. The April launch issue introduced uncertainty — wait for next successful deployment before adding. Stop-loss at $16.", risks: "Technology risk (space-to-phone has never been done at scale), launch failures, regulatory hurdles in international markets, capital requirements ($5B+ to build full constellation), competition from Starlink Direct to Cell.", target: "$35-45 (if next launch succeeds)", timeHorizon: "12-24 months" },
      { ticker: "LUNR", name: "Intuitive Machines", price: "$18.90", change: "+1.1%", conviction: 7, action: "BUY", why: "Intuitive Machines is NASA's preferred lunar lander partner with a $4.8B contract pipeline. They successfully landed on the Moon (Odysseus mission) — only the 5th entity in history to do so. Lunar economy is the next frontier with NASA Artemis, commercial mining, and DoD interest in cislunar space. Revenue growing rapidly with multiple missions contracted through 2028.", how: "Position sizing: 3-4%. Entry at current levels. This is a government contract compounder with lunar exploration as the secular theme. Add on pullbacks to $16.", risks: "Mission failure risk (space is hard), NASA budget uncertainty, long development timelines, competition from SpaceX Starship for lunar missions.", target: "$28-32 (12-month)", timeHorizon: "12-24 months" }
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
  "dr-marcus-webb": {
    name: "Dr. Marcus Webb",
    role: "Portfolio Risk Manager",
    pod: "Risk & Execution Pod",
    model: "claude-opus-4-7",
    temp: "0.1",
    trackRecord: "New specialist — inaugural dispatch",
    hitRate: "N/A (risk, not directional)",
    weight: "1.5x (risk override authority)",
    bio: "Dr. Marcus Webb holds a PhD in Financial Engineering from MIT and spent 15 years on Goldman Sachs' risk desk before becoming Head of Quantitative Risk at Citadel. CFA and FRM certified. He is the guardian of capital preservation — his job is to ensure the portfolio survives any scenario, including ones nobody is talking about.",
    methodology: "Dr. Webb's framework: (1) Value at Risk (VaR) — 1-day 95%, 5-day 99%, 30-day stress scenarios, (2) Correlation Analysis — identifying hidden correlations between positions, (3) Concentration Risk — flagging when any position >10% or sector >40%, (4) Drawdown Monitoring — alerts at -3%, -5%, -10% levels, (5) Tail Risk — Black Swan stress tests (COVID, rate shock, GFC), (6) Greeks Exposure — portfolio-level delta, gamma, vega.",
    currentView: "Portfolio VaR (1-day 95%) estimated at 1.8% given current positioning. Primary risk: 62% technology concentration creates correlation risk — if AI narrative breaks, 5+ positions move against you simultaneously. Secondary risk: 10Y at 4.87% approaching 5% threshold where growth multiples historically compress 10-15%. Recommended action: maintain SPY put spread hedge ($2.50 cost for $15 protection), keep 5% cash, and consider reducing NVDA by 20% pre-earnings to manage binary event risk.",
    recommendations: [
      { ticker: "SPY", name: "SPDR S&P 500 ETF (Put Spread Hedge)", price: "$749.02", change: "+0.37%", conviction: 9, action: "HEDGE", why: "With VIX at 13.82 (historically low), put protection is cheap. A 5% OTM put spread (buy $710 put, sell $680 put) costs ~$2.50 per share and protects $30 of downside. At current portfolio size, this is insurance that costs 0.3% of NAV annually but protects against a 5-10% drawdown. The risk/reward of NOT hedging at VIX 13 is asymmetric.", how: "Buy SPY Jun 710 Put, Sell SPY Jun 680 Put. Cost: ~$2.50/share. Max protection: $30/share (4% of SPY). Roll monthly. This is portfolio insurance, not a trade. Size: protect 50% of equity exposure.", risks: "Cost of carry (0.3% annually), missing upside if market rallies through strikes, roll risk if VIX spikes making replacement expensive.", target: "N/A (insurance)", timeHorizon: "Rolling monthly" },
      { ticker: "VIX", name: "CBOE Volatility Index (Monitor)", price: "13.82", change: "-0.45", conviction: 8, action: "MONITOR", why: "VIX at 13.82 is in the 15th percentile historically — meaning volatility is cheaper than 85% of all trading days. This is the time to BUY protection, not sell it. When VIX is below 14, the expected 30-day forward return of owning VIX calls is positive. Complacency = opportunity to hedge cheaply.", how: "Do not trade VIX directly. Use it as a signal: when VIX <14, buy portfolio hedges (SPY puts, UVXY calls). When VIX >25, sell hedges and deploy cash. Current signal: BUY PROTECTION.", risks: "VIX can stay low for extended periods (2017 stayed below 12 for months), carrying hedges has a cost.", target: "Alert at VIX >18 (reduce hedges), VIX >25 (sell hedges aggressively)", timeHorizon: "Ongoing" }
    ]
  },
  "ryan-tanaka": {
    name: "Ryan Tanaka",
    role: "Execution Strategist",
    pod: "Risk & Execution Pod",
    model: "gpt-4o",
    temp: "0.2",
    trackRecord: "New specialist — inaugural dispatch",
    hitRate: "N/A (execution, not directional)",
    weight: "1.0x",
    bio: "Ryan Tanaka was head of electronic trading at Morgan Stanley for 12 years, building algorithmic execution systems that handled $50B+ daily volume. BS Computer Science from Stanford, MS Financial Engineering from Berkeley. He optimizes HOW and WHEN to enter and exit positions — turning research recommendations into executable trade plans with minimal slippage.",
    methodology: "Ryan's framework: (1) Volume Profile Analysis — identifying high-volume nodes where institutional buyers/sellers cluster, (2) Optimal Execution Strategy — VWAP, TWAP, Implementation Shortfall based on urgency and liquidity, (3) Timing Analysis — intraday patterns, day-of-week effects, (4) Liquidity Assessment — bid-ask spread, ADV, market impact estimation, (5) Slippage Minimization — splitting large orders across time/venues, (6) Event-Aware Execution — adjusting around earnings, FOMC, OpEx.",
    currentView: "Current execution environment: liquidity is excellent with VIX at 13.82 and spreads tight. For NVDA (earnings Wednesday), recommend completing any position adjustments by Tuesday close — do NOT trade during the earnings window. For PANW add, use VWAP over 2 hours during mid-day (11 AM - 1 PM) when spreads are tightest. For AVGO accumulation, stage over 3 days at 25%/25%/50% to avoid moving the stock.",
    recommendations: [
      { ticker: "NVDA", name: "NVIDIA — Execution Plan", price: "$208.27", change: "+4.2%", conviction: 9, action: "EXECUTION PLAN", why: "NVDA trades $25B+ daily volume — zero liquidity concerns. However, with earnings Wednesday, execution timing is critical. The 20% trim (recommended by David Park for binary risk management) should be executed Tuesday between 2:00-3:30 PM when institutional volume peaks. Do NOT use market orders — use limit orders at the bid or VWAP. Post-earnings, if guidance is strong, re-enter the trimmed 20% using VWAP over Thursday morning.", how: "Tuesday 2:00-3:30 PM: Sell 20% of NVDA position via limit orders at bid. Target: fill within 2 cents of NBBO. Wednesday: NO TRADING (earnings after close). Thursday (if beat): Re-enter 20% via VWAP 9:45-11:00 AM. Thursday (if miss): Hold cash, reassess Friday.", risks: "Slippage on Tuesday sell if market is moving fast (estimate: 1-3 bps), gap risk overnight Wednesday if earnings surprise.", target: "Execution quality: <5 bps slippage", timeHorizon: "This week" },
      { ticker: "PANW", name: "Palo Alto Networks — Entry Plan", price: "$412.80", change: "+1.2%", conviction: 9, action: "STAGED ENTRY", why: "PANW trades $3.5B daily — good liquidity but not infinite. Rachel Kim's ADD recommendation (3% to 4.5%) means buying ~$15K-$25K depending on portfolio size. Execute via VWAP between 11:00 AM - 1:00 PM when spreads are tightest (typically 3-5 cents). Avoid the opening 30 minutes (wide spreads) and the close (momentum algos).", how: "Stage 1 (Today): Buy 50% of target position via VWAP 11:00 AM - 1:00 PM. Stage 2 (Tomorrow): Buy remaining 50% same window. Limit: do not pay more than $415. If stock gaps above $415, wait for pullback to $410 area.", risks: "Stock running away if sector momentum continues, opportunity cost of staging vs all-at-once.", target: "Average fill within 5 bps of VWAP", timeHorizon: "2 days" }
    ]
  },
  "victoria-chen": {
    name: "Victoria Chen",
    role: "Options Strategist",
    pod: "Risk & Execution Pod",
    model: "claude-opus-4-7",
    temp: "0.2",
    trackRecord: "New specialist — inaugural dispatch",
    hitRate: "N/A (options overlay)",
    weight: "1.0x",
    bio: "Victoria Chen was an options market maker at Susquehanna International Group (SIG) for 8 years, then head of derivatives strategy at Two Sigma. MS Quantitative Finance from Carnegie Mellon. She uses options to enhance returns via covered calls, protect against downside via puts, and hedge portfolio-level tail risk cheaply.",
    methodology: "Victoria's framework: (1) Covered Call Screen — sell OTM calls 30-45 DTE on high-conviction longs for 1-3% monthly income, (2) Protective Put Strategy — buy puts before binary events, (3) Bull Call Spreads — defined-risk directional plays, (4) Portfolio Hedges — cheap SPY put spreads when VIX <15, (5) Volatility Analysis — IV percentile to determine buy vs sell, (6) Greeks Management — portfolio delta, gamma, vega within bounds.",
    currentView: "VIX at 13.82 = 15th percentile. This is the cheapest volatility has been in 18 months. Implied vol is BELOW realized vol on most names — meaning options are underpriced. Strategy: (1) DO NOT sell covered calls this week (NVDA earnings will spike IV — wait to sell calls AFTER earnings when IV crushes), (2) BUY protective puts now while cheap, (3) SPY put spread hedge costs only $2.50 for $30 protection. Weekly income target: $3,000-5,000 from covered call overlay on non-earnings positions.",
    recommendations: [
      { ticker: "NVDA", name: "NVIDIA — Options Strategy", price: "$208.27", change: "+4.2%", conviction: 9, action: "POST-EARNINGS COVERED CALL", why: "NVDA IV is elevated at 55% (vs 35% realized) ahead of Wednesday earnings. After earnings, IV will crush 15-20 points regardless of direction. Strategy: WAIT until Thursday, then sell June 27 $230 calls (10% OTM) for ~$4.50-5.00 premium. This generates 2.2% income in 30 days (26% annualized) while giving 10% upside room. If called away at $230, you've made 10% + 2.2% = 12.2% in a month.", how: "Thursday after earnings (assuming stock stays above $195): Sell NVDA Jun 27 $230 Calls. Premium: ~$4.50-5.00. Breakeven: $212.77 (current price + premium received). Max profit: $26.23/share if called at $230. Probability of profit: ~72%.", risks: "Stock gaps above $230 and you miss upside beyond that level, stock drops below $195 and premium doesn't offset loss, early assignment risk near ex-dividend.", target: "$4.50-5.00 premium (2.2% monthly income)", timeHorizon: "30 days" },
      { ticker: "LLY", name: "Eli Lilly — Covered Call", price: "$891.40", change: "+0.8%", conviction: 8, action: "SELL COVERED CALL", why: "LLY has no earnings for 6 weeks. IV at 28% (50th percentile) — fair value, slightly rich. Sell the June 27 $950 calls (6.5% OTM) for ~$8.50 premium. This generates 0.95% income in 30 days (11.4% annualized) with 6.5% upside room before being called away. Dr. Mitchell's target is $950-1000, so being called at $950 is acceptable.", how: "Sell LLY Jun 27 $950 Calls. Premium: ~$8.50. Breakeven: $882.90. Max profit: $67.10/share if called at $950. Probability of profit: ~78%. Roll if stock approaches $940 before expiry.", risks: "GLP-1 news catalyst could gap stock above $950, missing the move to $1000+. Mitigate by rolling up and out if stock hits $930.", target: "$8.50 premium (0.95% monthly)", timeHorizon: "30 days" }
    ]
  },
  "beth": {
    name: "Beth",
    role: "Chief of Staff",
    pod: "Executive",
    model: "claude-opus-4-7",
    temp: "0.1",
    trackRecord: "Active since inception",
    hitRate: "N/A (orchestrator)",
    weight: "N/A (decision authority)",
    bio: "Beth is the Chief of Staff and central nervous system of the entire 76-agent research operation. She reports directly to Brian (Portfolio Manager) and is responsible for orchestrating all 36 specialists, managing the 5-layer accuracy pipeline, resolving conflicts between specialists, and synthesizing all inputs into actionable intelligence. She makes hundreds of calls per day about what to research, who to dispatch, what to trust, and how to present it. Her fundamental obligation: protect Brian's time and capital with intellectual honesty.",
    methodology: "Beth's decision framework: (1) Market Regime Detection at 6:00 AM, (2) Specialist Dispatch Sequencing based on day type, (3) Conflict Resolution when specialists disagree, (4) Quality Control via 5-layer accuracy pipeline, (5) Theme Coordination across 7 cross-pod intelligence channels, (6) Weight Management applying specialist track records to recommendations.",
    currentView: "Markets at all-time highs. AI supercycle accelerating into NVDA earnings. Key risk: 10Y approaching 5%. Portfolio positioned correctly at 62% tech/AI. Binary event risk Wednesday requires tactical trim. All 36 specialists operational. Theme Coordinator active. Learning loop accumulating data.",
    recommendations: [
      { ticker: "NVDA", name: "NVIDIA — Beth's Synthesis", price: "$208.27", change: "+4.2%", conviction: 9, action: "HOLD + TRIM 20%", why: "David Park (Conv 9) + Chart Specialist (Golden Cross) + Marcus Chen (supply chain confirms) all align bullish. Earnings Wednesday creates binary risk on 8% of portfolio. Trim 20% pre-earnings to cap downside at 1.6% of NAV.", how: "Per Ryan Tanaka: sell 20% Tuesday 2:00-3:30 PM via limit orders. Per Victoria Chen: sell covered calls Thursday post-IV-crush for 2.2% monthly income.", risks: "Missing full upside if NVDA gaps +15% on earnings. Mitigated by holding 80% and re-entry plan ready for Thursday.", target: "$250-270 (David Park)", timeHorizon: "Hold core indefinitely, tactical trim this week" },
      { ticker: "PANW", name: "Palo Alto — Beth's Synthesis", price: "$412.80", change: "+1.2%", conviction: 9, action: "ADD", why: "Rachel Kim Conv 9. Platformization confirmed. No earnings risk 6 weeks. Low correlation to AI cluster (diversification). Ryan Tanaka execution plan ready.", how: "Staged entry: 50% today, 50% tomorrow via VWAP 11AM-1PM. Target 4.5% position.", risks: "Valuation at 55x forward. Mitigated by 90% gross margins.", target: "$500-520", timeHorizon: "12-18 months" }
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

  // Fetch live AI-generated research
  const { data: liveResearch, isLoading: researchLoading, refetch } = trpc.research.specialist.useQuery(
    { slug },
    { enabled: !!analyst, staleTime: 4 * 60 * 60 * 1000 }
  );

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
            {AVATARS[slug] && <img src={AVATARS[slug]} alt={analyst.name} className="w-10 h-10 rounded-full border-2 border-[#C9A961]/50" />}
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

        {/* Live AI Research */}
        <section className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-5 border-l-4 border-l-[#4ADE80]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#4ADE80]" />
              <h2 className="text-[#4ADE80] text-lg" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Live AI Research — Today's Dispatch</h2>
            </div>
            <button onClick={() => refetch()} className="flex items-center gap-1 px-2 py-1 rounded bg-[#0A0A0A] border border-[#1F1A0F] hover:border-[#4ADE80]/50 transition-colors">
              <RefreshCw className={`w-3 h-3 text-[#4ADE80] ${researchLoading ? "animate-spin" : ""}`} />
              <span className="text-[#4ADE80] text-[9px] uppercase tracking-[1px]">Regenerate</span>
            </button>
          </div>
          {researchLoading ? (
            <div className="flex items-center gap-2 py-4">
              <RefreshCw className="w-4 h-4 text-[#C9A961] animate-spin" />
              <p className="text-[#8A7548] text-sm">Generating fresh research from {analyst.name}...</p>
            </div>
          ) : liveResearch?.research ? (
            <div className="prose prose-sm prose-invert max-w-none">
              <div className="text-[#F5E6C8] text-sm leading-relaxed whitespace-pre-wrap"><Streamdown>{liveResearch.research}</Streamdown></div>
              <p className="text-[#8A7548] text-[10px] mt-3">Generated: {new Date(liveResearch.timestamp).toLocaleString()} | Source: Claude + Polygon.io + FRED</p>
            </div>
          ) : (
            <p className="text-[#8A7548] text-sm">Live research will appear here when generated. Click Regenerate to fetch fresh analysis.</p>
          )}
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
