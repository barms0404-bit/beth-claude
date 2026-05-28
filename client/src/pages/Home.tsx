/* 
 * Armstrong Arikat Research Terminal — Sovereign Command Center
 * Full System: 39 Agents, All Sector Dashboards, Top 50 Engine
 * Design: Black bg, Gold (#C9A961) accents, Cream (#F5E6C8) text
 * Only red/green for market direction indicators
 */

import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
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
  Clock,
  Menu,
  X,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Bot,
  Users,
} from "lucide-react";

const LOGO_URL = "/manus-storage/aa-logo_4d0e4c30.png";

// Avatar URLs — All team members
const AVATARS: Record<string, string> = {
  "brian-armstrong": "https://d2xsxph8kpxj0f.cloudfront.net/310519663669730376/QkF2q886KBnon8A4LfPzKc/brian_armstrong-WZKAvR87vRhTcjm5rQeoTV.webp",
  "samira-arikat": "https://d2xsxph8kpxj0f.cloudfront.net/310519663669730376/QkF2q886KBnon8A4LfPzKc/samira_arikat-5Kcz8xgiKHSC7K9vxxf6sg.webp",
  beth: "https://d2xsxph8kpxj0f.cloudfront.net/310519663669730376/QkF2q886KBnon8A4LfPzKc/beth_harrington-eefyyv3PyfDNFpDqkJcWp2.webp",
  "omar-hamze": "https://d2xsxph8kpxj0f.cloudfront.net/310519663669730376/QkF2q886KBnon8A4LfPzKc/omar_hamze-ZnNNoRD5zmXQC6WwR4iSXH.webp",
  "david-park": "https://d2xsxph8kpxj0f.cloudfront.net/310519663669730376/QkF2q886KBnon8A4LfPzKc/david_park-GfyxzgF7nqqhnPR7Sm8pYo.webp",
  "marcus-chen": "https://d2xsxph8kpxj0f.cloudfront.net/310519663669730376/QkF2q886KBnon8A4LfPzKc/marcus_chen-NDW3kaKh5KFDSiPjAsZvmH.webp",
  "elena-vasquez": "https://d2xsxph8kpxj0f.cloudfront.net/310519663669730376/QkF2q886KBnon8A4LfPzKc/elena_vasquez-BAAeE33oXZNGHaho9jNX6A.webp",
  "sarah-nakamura": "https://d2xsxph8kpxj0f.cloudfront.net/310519663669730376/QkF2q886KBnon8A4LfPzKc/sarah_nakamura-buF8ExqbY6vkzhB6JBpRMA.webp",
  "james-okafor": "https://d2xsxph8kpxj0f.cloudfront.net/310519663669730376/QkF2q886KBnon8A4LfPzKc/james_okafor-mnE5KPPZWpuxwX5FkAH29J.webp",
  "priya-sharma": "https://d2xsxph8kpxj0f.cloudfront.net/310519663669730376/QkF2q886KBnon8A4LfPzKc/priya_sharma-5zp98eDDPpdFSWSt5scu97.webp",
  "colonel-derek-hayes": "https://d2xsxph8kpxj0f.cloudfront.net/310519663669730376/QkF2q886KBnon8A4LfPzKc/col_hayes-cT249rdbUHvJR4DXj7cbuV.webp",
  "michael-torres": "https://d2xsxph8kpxj0f.cloudfront.net/310519663669730376/QkF2q886KBnon8A4LfPzKc/michael_torres-CBRuqJAqmn9aML9VbCBkuX.webp",
  "rachel-kim": "https://d2xsxph8kpxj0f.cloudfront.net/310519663669730376/QkF2q886KBnon8A4LfPzKc/rachel_kim-atV4SxMm6vDvfrJh875rCU.webp",
  "andrew-walsh": "https://d2xsxph8kpxj0f.cloudfront.net/310519663669730376/QkF2q886KBnon8A4LfPzKc/andrew_walsh-5RiapTM35fwXn4X4kqTTVS.webp",
  "sophia-reyes": "https://d2xsxph8kpxj0f.cloudfront.net/310519663669730376/QkF2q886KBnon8A4LfPzKc/sophia_reyes-CtdrcVB6XPAptZ6k6DrkUd.webp",
  "dr-laura-mitchell": "https://d2xsxph8kpxj0f.cloudfront.net/310519663669730376/QkF2q886KBnon8A4LfPzKc/dr_laura_mitchell-kpRxAXFsm4zDg73Ssx8GFD.webp",
  "dr-nathan-cole": "https://d2xsxph8kpxj0f.cloudfront.net/310519663669730376/QkF2q886KBnon8A4LfPzKc/dr_nathan_cole-HVdSsMKt5iCBZiNvwJifVg.webp",
  "dr-kevin-zhao": "https://d2xsxph8kpxj0f.cloudfront.net/310519663669730376/QkF2q886KBnon8A4LfPzKc/dr_kevin_zhao-ChAbGmhrQAUt6yTbaPqhjJ.webp",
  "dr-robert-kessler": "https://d2xsxph8kpxj0f.cloudfront.net/310519663669730376/QkF2q886KBnon8A4LfPzKc/dr_kessler-bXaQGQagALzn8gKcFycmGN.webp",
  "victoria-sterling": "https://d2xsxph8kpxj0f.cloudfront.net/310519663669730376/QkF2q886KBnon8A4LfPzKc/victoria_sterling-QfB5ShHFNngYoRgjSrjWqh.webp",
  "wei-lin": "https://d2xsxph8kpxj0f.cloudfront.net/310519663669730376/QkF2q886KBnon8A4LfPzKc/wei_lin-cbGQTTejotS7VFmQC6Zw4P.webp",
  "thomas-brennan": "https://d2xsxph8kpxj0f.cloudfront.net/310519663669730376/QkF2q886KBnon8A4LfPzKc/thomas_brennan-5LbWq36vdGefhnnL7H6TCE.webp",
  "patricia-duval": "https://d2xsxph8kpxj0f.cloudfront.net/310519663669730376/QkF2q886KBnon8A4LfPzKc/patricia_duval-8C66zmeYcD5k4txcyCJiUw.webp",
  "alexander-petrov": "https://d2xsxph8kpxj0f.cloudfront.net/310519663669730376/QkF2q886KBnon8A4LfPzKc/alexander_petrov-Ljhr9D9XBA8vwVN6FQadjs.webp",
  "maria-santos": "https://d2xsxph8kpxj0f.cloudfront.net/310519663669730376/QkF2q886KBnon8A4LfPzKc/maria_santos-bSZTRzMy5hFRXtuPLWxKFR.webp",
  "catherine-brooks": "https://d2xsxph8kpxj0f.cloudfront.net/310519663669730376/QkF2q886KBnon8A4LfPzKc/catherine_brooks-RMX2UbwM3BkzK29PVkZamC.webp",
  "daniel-ortiz": "https://d2xsxph8kpxj0f.cloudfront.net/310519663669730376/QkF2q886KBnon8A4LfPzKc/daniel_ortiz-FcSQuSHfSdpwvEe3nWmmPH.webp",
  "jessica-huang": "https://d2xsxph8kpxj0f.cloudfront.net/310519663669730376/QkF2q886KBnon8A4LfPzKc/jessica_huang-BdfTQVwrxCEoWDc8Ryd926.webp",
  "richard-callahan": "https://d2xsxph8kpxj0f.cloudfront.net/310519663669730376/QkF2q886KBnon8A4LfPzKc/richard_callahan-Ausce6RtxThWLqxv8EmzKw.webp",
  "gregory-ashford": "https://d2xsxph8kpxj0f.cloudfront.net/310519663669730376/QkF2q886KBnon8A4LfPzKc/gregory_ashford-8hANcBhPmnpqunt2XknaNB.webp",
  "claire-donovan": "https://d2xsxph8kpxj0f.cloudfront.net/310519663669730376/QkF2q886KBnon8A4LfPzKc/claire_donovan-h4LMKYK8SvnzDgwowHPJx6.webp",
  "dr-marcus-webb": "https://d2xsxph8kpxj0f.cloudfront.net/310519663669730376/QkF2q886KBnon8A4LfPzKc/dr_marcus_webb-D5thLykYzUWaa4k4poz36o.webp",
  "ryan-tanaka": "https://d2xsxph8kpxj0f.cloudfront.net/310519663669730376/QkF2q886KBnon8A4LfPzKc/ryan_tanaka-3xY7cuWNbsRocHnpAyttys.webp",
  "victoria-chen": "https://d2xsxph8kpxj0f.cloudfront.net/310519663669730376/QkF2q886KBnon8A4LfPzKc/victoria_chen-69uLU3S3DvECeZMchn79SS.webp",
  "jonathan-reed": "https://d2xsxph8kpxj0f.cloudfront.net/310519663669730376/QkF2q886KBnon8A4LfPzKc/jonathan_reed-EFNTTCpxZvBLj4zVMPRuEp.webp",
  "samantha-liu": "https://d2xsxph8kpxj0f.cloudfront.net/310519663669730376/QkF2q886KBnon8A4LfPzKc/samantha_liu-eawQPjYn3J3PowuyDvAScf.webp",
  "christopher-vance": "https://d2xsxph8kpxj0f.cloudfront.net/310519663669730376/QkF2q886KBnon8A4LfPzKc/christopher_vance-LTTmKnBeJLbXtuoJv7ZrSG.webp",
  "dr-isaac-thornton": "https://d2xsxph8kpxj0f.cloudfront.net/310519663669730376/QkF2q886KBnon8A4LfPzKc/dr_isaac_thornton-XmL9bzWj4H4RWdM8gJbHBX.webp",
  "angela-moretti": "https://d2xsxph8kpxj0f.cloudfront.net/310519663669730376/QkF2q886KBnon8A4LfPzKc/angela_moretti-C5dJy5hyTH8NpsDkNNndsa.webp",
  "dr-fiona-blackwell": "https://d2xsxph8kpxj0f.cloudfront.net/310519663669730376/QkF2q886KBnon8A4LfPzKc/dr_fiona_blackwell-SAa6vGiqL4HHy4NNVF4UTs.webp",
  "raymond-okafor": "https://d2xsxph8kpxj0f.cloudfront.net/310519663669730376/QkF2q886KBnon8A4LfPzKc/raymond_okafor-UUHGnDAeeTDomYUqXe27FV.webp",
  "dr-alan-whitfield": "https://d2xsxph8kpxj0f.cloudfront.net/310519663669730376/QkF2q886KBnon8A4LfPzKc/dr_alan_whitfield-eYdmgkCkPuiFqRPYotdT6R.webp",
  "natasha-volkov": "https://d2xsxph8kpxj0f.cloudfront.net/310519663669730376/QkF2q886KBnon8A4LfPzKc/natasha_volkov-gTqKK7PLZMkyvQZrGv9g7q.webp",
};
const SPY_CHART = "/manus-storage/spy_chart_699a562f.png";
const DOW_CHART = "/manus-storage/dow_chart_889b99c5.png";
const NASDAQ_CHART = "/manus-storage/nasdaq_chart_b9493ce4.png";
const NVDA_CHART = "/manus-storage/nvda_chart_7bda8308.png";
const LLY_CHART = "/manus-storage/lly_chart_b1ec7ac4.png";

// All section IDs
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
  aiInfra: "ai-infrastructure",
  saas: "enterprise-saas",
  cyber: "cybersecurity",
  internet: "internet-platforms",
  fintech: "fintech-payments",
  biotech: "biotech",
  pharma: "big-pharma",
  healthTools: "health-tools",
  travel: "travel-leisure",
  ecommerce: "ecommerce",
  chinaEcon: "china-economist",
  inflation: "inflation",
  fiscal: "fiscal-policy",
  fxCommod: "fx-commodities",
  labor: "labor-economist",
  quantum: "quantum-computing",
  robotics: "robotics-ai",
  energy: "energy-infrastructure",
  value: "value-investor",
  agentStatus: "agent-status",
  reports: "reports-archive",
};

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Static fallback market data (used when API unavailable)
const staticIndexData = [
  { name: "S&P 500", ticker: "SPY", value: "7,473.47", change: "+0.37%", up: true },
  { name: "Nasdaq", ticker: "IXIC", value: "26,343.97", change: "+0.19%", up: true },
  { name: "QQQ", ticker: "QQQ", value: "537.82", change: "+0.24%", up: true },
  { name: "Dow Jones", ticker: "DIA", value: "50,579.70", change: "+0.58%", up: true },
  { name: "Russell 2000", ticker: "IWM", value: "2,387.12", change: "+0.42%", up: true },
  { name: "VIX", ticker: "VIX", value: "13.82", change: "-0.45", up: true },
  { name: "10Y Treasury", ticker: "TNX", value: "4.87%", change: "+0.03", up: false },
  { name: "DXY", ticker: "DXY", value: "104.23", change: "+0.12%", up: false },
  { name: "BTC", ticker: "BTC", value: "$71,245", change: "+2.1%", up: true },
];

const tickerNames: Record<string, string> = {
  SPY: "S&P 500", QQQ: "QQQ", DIA: "Dow Jones", IWM: "Russell 2000",
  NVDA: "NVIDIA", MSFT: "Microsoft", AAPL: "Apple", AVGO: "Broadcom",
  AMD: "AMD", LLY: "Eli Lilly", META: "Meta", GOOGL: "Alphabet",
  AMZN: "Amazon", TSLA: "Tesla", ARM: "ARM", DELL: "Dell",
  PANW: "Palo Alto", COST: "Costco", V: "Visa", JPM: "JPMorgan",
};

const top50Data = [
  { rank: 1, ticker: "NVDA", company: "NVIDIA Corp", sector: "AI/Chips", conviction: "High", price: "$208.27", change: "+4.2%", ytd: "+48.2%", specialist: "Training Chip", updated: "2 min ago" },
  { rank: 2, ticker: "AVGO", company: "Broadcom Inc", sector: "AI/Networking", conviction: "High", price: "$289.45", change: "+2.8%", ytd: "+52.1%", specialist: "AI Data Center", updated: "5 min ago" },
  { rank: 3, ticker: "MSFT", company: "Microsoft", sector: "Enterprise SW", conviction: "High", price: "$418.57", change: "-0.12%", ytd: "+18.4%", specialist: "SaaS", updated: "3 min ago" },
  { rank: 4, ticker: "LLY", company: "Eli Lilly", sector: "Pharma", conviction: "High", price: "$892.30", change: "+1.4%", ytd: "+22.7%", specialist: "Big Pharma", updated: "8 min ago" },
  { rank: 5, ticker: "AMD", company: "AMD", sector: "AI/Chips", conviction: "High", price: "$467.51", change: "+3.9%", ytd: "+38.9%", specialist: "Training Chip", updated: "2 min ago" },
  { rank: 6, ticker: "ARM", company: "ARM Holdings", sector: "AI/Chips", conviction: "High", price: "$245.80", change: "+2.1%", ytd: "+61.3%", specialist: "Inference", updated: "4 min ago" },
  { rank: 7, ticker: "DELL", company: "Dell Technologies", sector: "AI Infra", conviction: "High", price: "$178.90", change: "+12.4%", ytd: "+44.8%", specialist: "AI Data Center", updated: "1 min ago" },
  { rank: 8, ticker: "QCOM", company: "Qualcomm", sector: "AI/Mobile", conviction: "Med-High", price: "$241.15", change: "+13.0%", ytd: "+35.2%", specialist: "Inference", updated: "6 min ago" },
  { rank: 9, ticker: "COST", company: "Costco", sector: "Consumer", conviction: "Medium", price: "$1,045.20", change: "+0.8%", ytd: "+12.1%", specialist: "Consumer", updated: "10 min ago" },
  { rank: 10, ticker: "JPM", company: "JPMorgan Chase", sector: "Financials", conviction: "Medium", price: "$287.40", change: "+0.6%", ytd: "+15.8%", specialist: "Fintech", updated: "7 min ago" },
  { rank: 11, ticker: "MRVL", company: "Marvell Tech", sector: "AI/Chips", conviction: "High", price: "$128.45", change: "+3.2%", ytd: "+42.6%", specialist: "AI Data Center", updated: "3 min ago" },
  { rank: 12, ticker: "PANW", company: "Palo Alto Networks", sector: "Cyber", conviction: "High", price: "$412.80", change: "+1.8%", ytd: "+28.4%", specialist: "Cybersecurity", updated: "5 min ago" },
  { rank: 13, ticker: "NVO", company: "Novo Nordisk", sector: "Pharma", conviction: "High", price: "$142.60", change: "+0.9%", ytd: "+19.3%", specialist: "Big Pharma", updated: "9 min ago" },
  { rank: 14, ticker: "V", company: "Visa Inc", sector: "Fintech", conviction: "Med-High", price: "$318.90", change: "+0.4%", ytd: "+14.7%", specialist: "Fintech", updated: "6 min ago" },
  { rank: 15, ticker: "SMCI", company: "Super Micro", sector: "AI Infra", conviction: "High", price: "$52.30", change: "+5.6%", ytd: "+67.2%", specialist: "AI Data Center", updated: "2 min ago" },
];

const specialistAgents = [
  { name: "Beth", role: "Chief of Staff Orchestrator", status: "active", lastDispatch: "2 min ago", model: "claude-opus-4-7" },
  { name: "Marcus Chen", role: "AI Data Center Buildout", status: "active", lastDispatch: "5 min ago", model: "claude-opus-4-7" },
  { name: "Elena Vasquez", role: "Energy Infrastructure", status: "active", lastDispatch: "12 min ago", model: "claude-opus-4-7" },
  { name: "David Park", role: "Training Chip Specialist", status: "active", lastDispatch: "3 min ago", model: "claude-opus-4-7" },
  { name: "Sarah Nakamura", role: "Inference & AI Software", status: "active", lastDispatch: "8 min ago", model: "claude-opus-4-7" },
  { name: "James Okafor", role: "Robotics & Physical AI", status: "active", lastDispatch: "15 min ago", model: "claude-opus-4-7" },
  { name: "Priya Sharma", role: "Quantum Computing", status: "active", lastDispatch: "20 min ago", model: "claude-opus-4-7" },
  { name: "Michael Torres", role: "Enterprise SaaS", status: "active", lastDispatch: "6 min ago", model: "claude-opus-4-7" },
  { name: "Rachel Kim", role: "Cybersecurity", status: "active", lastDispatch: "9 min ago", model: "claude-opus-4-7" },
  { name: "Andrew Walsh", role: "Internet Platforms & Digital Ad", status: "active", lastDispatch: "7 min ago", model: "claude-opus-4-7" },
  { name: "Sophia Reyes", role: "Fintech & Payments", status: "active", lastDispatch: "11 min ago", model: "claude-opus-4-7" },
  { name: "Dr. Nathan Cole", role: "Biotech & Small Cap", status: "active", lastDispatch: "14 min ago", model: "claude-opus-4-7" },
  { name: "Dr. Laura Mitchell", role: "Big Pharma & GLP-1", status: "active", lastDispatch: "10 min ago", model: "claude-opus-4-7" },
  { name: "Dr. Kevin Zhao", role: "Healthcare Tools & CDMOs", status: "active", lastDispatch: "18 min ago", model: "claude-opus-4-7" },
  { name: "Catherine Brooks", role: "Consumer Discretionary & Brands", status: "active", lastDispatch: "13 min ago", model: "claude-opus-4-7" },
  { name: "Daniel Ortiz", role: "Travel, Leisure & Restaurants", status: "active", lastDispatch: "16 min ago", model: "claude-opus-4-7" },
  { name: "Jessica Huang", role: "E-Commerce & Marketplaces", status: "active", lastDispatch: "19 min ago", model: "claude-opus-4-7" },
  { name: "Dr. Robert Kessler", role: "Chief Economist", status: "active", lastDispatch: "4 min ago", model: "claude-opus-4-7" },
  { name: "Victoria Sterling", role: "Geopolitical Strategist", status: "active", lastDispatch: "22 min ago", model: "claude-opus-4-7" },
  { name: "Wei Lin", role: "China Economist", status: "active", lastDispatch: "25 min ago", model: "claude-opus-4-7" },
  { name: "Thomas Brennan", role: "Inflation Specialist", status: "active", lastDispatch: "8 min ago", model: "claude-opus-4-7" },
  { name: "Patricia Duval", role: "Fiscal Policy & Political Economy", status: "active", lastDispatch: "35 min ago", model: "claude-opus-4-7" },
  { name: "Alexander Petrov", role: "Global FX & Commodities", status: "active", lastDispatch: "12 min ago", model: "claude-opus-4-7" },
  { name: "Maria Santos", role: "Labor Economist", status: "active", lastDispatch: "20 min ago", model: "claude-opus-4-7" },
  { name: "Richard Callahan", role: "Dividend & Income", status: "active", lastDispatch: "30 min ago", model: "claude-opus-4-7" },
  { name: "Gregory Ashford", role: "Value Investor", status: "active", lastDispatch: "28 min ago", model: "claude-opus-4-7" },
  { name: "Claire Donovan", role: "Fixed Income", status: "active", lastDispatch: "6 min ago", model: "claude-opus-4-7" },
  { name: "Jonathan Reed", role: "Morning Packet Analyst", status: "active", lastDispatch: "45 min ago", model: "claude-opus-4-7" },
  { name: "Samantha Liu", role: "Mid-Day Tactical Analyst", status: "active", lastDispatch: "3 hr ago", model: "claude-opus-4-7" },
  { name: "Christopher Vance", role: "Market Close Analyst", status: "active", lastDispatch: "Yesterday", model: "claude-opus-4-7" },
  { name: "Dr. Alan Whitfield", role: "Quantitative Analyst", status: "active", lastDispatch: "15 min ago", model: "claude-opus-4-7" },
  { name: "Natasha Volkov", role: "Alt Data Specialist", status: "active", lastDispatch: "22 min ago", model: "claude-opus-4-7" },
];

const accuracyAgents = [
  { name: "SENTINEL", fullName: "Dr. Isaac Thornton", role: "Data Validation Agent", status: "active", checks: 1247, lastRun: "< 1 min", temp: "0.0" },
  { name: "VERITAS", fullName: "Angela Moretti", role: "Citation Enforcement Agent", status: "active", checks: 892, lastRun: "< 1 min", temp: "0.0" },
  { name: "ADVERSARY", fullName: "Dominic Hale", role: "Red Team Agent", status: "active", checks: 34, lastRun: "5 min ago", temp: "0.5" },
  { name: "ORACLE", fullName: "Dr. Fiona Blackwell", role: "Primary Source Verification", status: "active", checks: 12, lastRun: "8 min ago", temp: "0.0" },
  { name: "SCOREKEEPER", fullName: "Martin Hsu", role: "Track Record & Performance", status: "active", checks: 1, lastRun: "Yesterday close", temp: "0.2" },
  { name: "COMPASS", fullName: "Dr. Yuki Tanaka", role: "Market Regime Detection", status: "active", checks: 1, lastRun: "6:00 AM AZ", temp: "0.2" },
  { name: "CROWDWATCH", fullName: "Stefan Novak", role: "Consensus & Crowding Tracker", status: "active", checks: 1, lastRun: "6:30 AM AZ", temp: "0.2" },
];

export default function Home() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch live market data from Polygon.io via backend
  const { data: liveMarket } = trpc.market.snapshot.useQuery(undefined, {
    refetchInterval: 60_000, // Refresh every 60 seconds
    staleTime: 30_000,
  });

  // Merge live data with static fallback
  const indexData = useMemo(() => {
    if (!liveMarket || liveMarket.quotes.length === 0) return staticIndexData;
    
    const liveQuotes = liveMarket.quotes.filter(q => 
      ["SPY", "QQQ", "DIA", "IWM"].includes(q.ticker)
    ).map(q => ({
      name: tickerNames[q.ticker] || q.ticker,
      ticker: q.ticker,
      value: q.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      change: `${q.changePercent >= 0 ? "+" : ""}${q.changePercent.toFixed(2)}%`,
      up: q.up,
    }));

    // Add economic data if available
    const econCards = [];
    if (liveMarket.economic.length > 0) {
      const tenY = liveMarket.economic.find(e => e.series === "DGS10");
      if (tenY && tenY.value !== ".") {
        econCards.push({ name: "10Y Treasury", ticker: "TNX", value: `${tenY.value}%`, change: "", up: false });
      }
    }

    // If we got live index data, use it; otherwise fall back to static
    if (liveQuotes.length >= 2) {
      return [...liveQuotes, ...econCards, ...staticIndexData.filter(s => 
        !["SPY", "QQQ", "DIA", "IWM", "10Y Treasury"].includes(s.name) && !liveQuotes.find(l => l.ticker === s.ticker)
      )];
    }
    return staticIndexData;
  }, [liveMarket]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Calculate next report time
  const getNextReport = () => {
    const now = new Date();
    const azHour = (now.getUTCHours() - 7 + 24) % 24;
    if (azHour < 7 || (azHour === 7 && now.getUTCMinutes() < 30)) return "7:30 AM AZ — Morning Prep";
    if (azHour < 11) return "11:00 AM AZ — Mid-Day Tactical";
    if (azHour < 13 || (azHour === 13 && now.getUTCMinutes() < 30)) return "1:30 PM AZ — Market Close";
    return "7:30 AM AZ — Morning Prep (Tomorrow)";
  };

  return (
    <div className="min-h-screen bg-[#000000] relative">
      {/* Logo Watermark */}
      <div className="fixed inset-0 z-0 pointer-events-none flex items-center justify-center" style={{ opacity: 0.04 }}>
        <img src={LOGO_URL} alt="" className="w-[60vw] max-w-[800px]" />
      </div>

      {/* Top Command Bar */}
      <header className="sticky top-0 z-50 border-b-4 border-[#C9A961] bg-[#000000]/97 backdrop-blur-sm">
        {/* Logo Row */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-[#1F1A0F]">
          <div className="flex items-center gap-3">
            <img src={LOGO_URL} alt="Armstrong Arikat" className="h-9 w-auto" />
            <div>
              <h1 className="text-[#C9A961] text-sm font-semibold tracking-[3px] uppercase" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                Armstrong Arikat
              </h1>
              <p className="text-[#8A7548] text-[10px] tracking-[2px] uppercase">Private Wealth Group</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-[#0A0A0A] rounded border border-[#1F1A0F]">
              <div className="w-2 h-2 rounded-full bg-[#4ADE80] animate-pulse"></div>
              <span className="text-[#4ADE80] text-[10px] uppercase tracking-[1px]">NYSE Open</span>
            </div>
            <div className="text-right">
              <p className="text-[#C9A961] text-xs font-medium">
                {currentTime.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
              </p>
              <p className="text-[#8A7548] text-[10px]">
                Next Report: {getNextReport()}
              </p>
            </div>
          </div>
          {/* Mobile menu toggle */}
          <button className="md:hidden text-[#C9A961]" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation Row - Desktop */}
        <nav className="hidden md:flex items-center gap-1 px-4 py-1.5 overflow-x-auto">
          <NavButton icon={<Activity className="w-3 h-3" />} label="Dashboard" onClick={() => scrollToSection(SECTIONS.snapshot)} />
          <NavButton icon={<BarChart3 className="w-3 h-3" />} label="Top 50" onClick={() => scrollToSection(SECTIONS.top50)} />

          {/* Analysts Dropdown — moved next to Top 50 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm"
                className="bg-transparent border-[#C9A961]/30 text-[#C9A961] hover:bg-[#C9A961]/10 hover:border-[#C9A961] text-[10px] font-semibold tracking-[1px] uppercase whitespace-nowrap transition-all duration-100 active:scale-[0.97] h-7 px-2.5">
                <Users className="w-3 h-3" />
                <span className="ml-1">Analysts</span>
                <ChevronDown className="w-2.5 h-2.5 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#0A0A0A] border-[#C9A961]/30 min-w-[320px] max-h-[480px] overflow-y-auto">
              <DropdownMenuLabel className="text-[#C9A961] text-[10px] uppercase tracking-[1px]">Executive</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => window.location.href = '/analyst/beth'} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961]"><img src={AVATARS.beth} className="w-5 h-5 rounded-full mr-2 object-cover" /><span className="font-medium">Beth</span><span className="text-[#8A7548] ml-2 text-[10px]">— Chief of Staff</span></DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.location.href = '/analyst/omar-hamze'} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961]"><img src={AVATARS["omar-hamze"]} className="w-5 h-5 rounded-full mr-2 object-cover" /><span className="font-medium">Omar Hamze</span><span className="text-[#8A7548] ml-2 text-[10px]">— Advisor in Training</span></DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#1F1A0F]" />
              <DropdownMenuLabel className="text-[#C9A961] text-[10px] uppercase tracking-[1px]">Investment Research Division</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => window.location.href = '/analyst/david-park'} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961]"><img src={AVATARS["david-park"]} className="w-5 h-5 rounded-full mr-2 object-cover" /><span className="font-medium">David Park</span><span className="text-[#8A7548] ml-2 text-[10px]">— Training Chips</span></DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.location.href = '/analyst/marcus-chen'} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961]"><img src={AVATARS["marcus-chen"]} className="w-5 h-5 rounded-full mr-2 object-cover" /><span className="font-medium">Marcus Chen</span><span className="text-[#8A7548] ml-2 text-[10px]">— AI Data Center</span></DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.location.href = '/analyst/elena-vasquez'} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961]"><img src={AVATARS["elena-vasquez"]} className="w-5 h-5 rounded-full mr-2 object-cover" /><span className="font-medium">Elena Vasquez</span><span className="text-[#8A7548] ml-2 text-[10px]">— Energy Infrastructure</span></DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.location.href = '/analyst/sarah-nakamura'} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961]"><img src={AVATARS["sarah-nakamura"]} className="w-5 h-5 rounded-full mr-2 object-cover" /><span className="font-medium">Sarah Nakamura</span><span className="text-[#8A7548] ml-2 text-[10px]">— Inference & AI</span></DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.location.href = '/analyst/colonel-derek-hayes'} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961]"><img src={AVATARS["colonel-derek-hayes"]} className="w-5 h-5 rounded-full mr-2 object-cover" /><span className="font-medium">Col. Derek Hayes</span><span className="text-[#8A7548] ml-2 text-[10px]">— Space & Aerospace</span></DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#1F1A0F]" />
              <DropdownMenuLabel className="text-[#C9A961] text-[10px] uppercase tracking-[1px]">Technology Desk</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => window.location.href = '/analyst/michael-torres'} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961]"><img src={AVATARS["michael-torres"]} className="w-5 h-5 rounded-full mr-2 object-cover" /><span className="font-medium">Michael Torres</span><span className="text-[#8A7548] ml-2 text-[10px]">— Enterprise SaaS</span></DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.location.href = '/analyst/rachel-kim'} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961]"><img src={AVATARS["rachel-kim"]} className="w-5 h-5 rounded-full mr-2 object-cover" /><span className="font-medium">Rachel Kim</span><span className="text-[#8A7548] ml-2 text-[10px]">— Cybersecurity</span></DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#1F1A0F]" />
              <DropdownMenuLabel className="text-[#C9A961] text-[10px] uppercase tracking-[1px]">Healthcare Desk</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => window.location.href = '/analyst/dr-laura-mitchell'} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961]"><img src={AVATARS["dr-laura-mitchell"]} className="w-5 h-5 rounded-full mr-2 object-cover" /><span className="font-medium">Dr. Laura Mitchell</span><span className="text-[#8A7548] ml-2 text-[10px]">— Big Pharma & GLP-1</span></DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#1F1A0F]" />
              <DropdownMenuLabel className="text-[#C9A961] text-[10px] uppercase tracking-[1px]">Risk & Trading Division</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => window.location.href = '/analyst/dr-marcus-webb'} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961]"><img src={AVATARS["dr-marcus-webb"]} className="w-5 h-5 rounded-full mr-2 object-cover" /><span className="font-medium">Dr. Marcus Webb</span><span className="text-[#8A7548] ml-2 text-[10px]">— Risk Manager</span></DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.location.href = '/analyst/ryan-tanaka'} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961]"><img src={AVATARS["ryan-tanaka"]} className="w-5 h-5 rounded-full mr-2 object-cover" /><span className="font-medium">Ryan Tanaka</span><span className="text-[#8A7548] ml-2 text-[10px]">— Execution</span></DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.location.href = '/analyst/victoria-chen'} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961]"><img src={AVATARS["victoria-chen"]} className="w-5 h-5 rounded-full mr-2 object-cover" /><span className="font-medium">Victoria Chen</span><span className="text-[#8A7548] ml-2 text-[10px]">— Options</span></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <NavButton icon={<Shield className="w-3 h-3" />} label="Tactical" onClick={() => scrollToSection(SECTIONS.tactical)} />
          <NavButton icon={<Globe className="w-3 h-3" />} label="Economics" onClick={() => scrollToSection(SECTIONS.macro)} />
          <NavButton icon={<Bot className="w-3 h-3" />} label="Agents" onClick={() => scrollToSection(SECTIONS.agentStatus)} />
          <NavButton icon={<Activity className="w-3 h-3" />} label="CNBC" onClick={() => window.location.href = '/cnbc'} />
          <NavButton icon={<BarChart3 className="w-3 h-3" />} label="Performance" onClick={() => window.location.href = '/performance'} />
          <NavButton icon={<Globe className="w-3 h-3" />} label="Compare" onClick={() => window.location.href = '/compare'} />
          <NavButton icon={<Shield className="w-3 h-3" />} label="Intelligence" onClick={() => window.location.href = '/intelligence'} />
          <RunAllAgentsButton />

          {/* Economists Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm"
                className="bg-transparent border-[#C9A961]/30 text-[#C9A961] hover:bg-[#C9A961]/10 hover:border-[#C9A961] text-[10px] font-semibold tracking-[1px] uppercase whitespace-nowrap transition-all duration-100 active:scale-[0.97] h-7 px-2.5">
                <Globe className="w-3 h-3" />
                <span className="ml-1">Economists</span>
                <ChevronDown className="w-2.5 h-2.5 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#0A0A0A] border-[#C9A961]/30 min-w-[300px]">
              <DropdownMenuLabel className="text-[#C9A961] text-[10px] uppercase tracking-[1px]">Economic Advisory Pod</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => scrollToSection(SECTIONS.macro)} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961]"><span className="font-medium">Dr. Robert Kessler</span><span className="text-[#8A7548] ml-2 text-[10px]">— Chief Economist</span></DropdownMenuItem>
              <DropdownMenuItem onClick={() => scrollToSection(SECTIONS.geopolitical)} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961]"><span className="font-medium">Victoria Sterling</span><span className="text-[#8A7548] ml-2 text-[10px]">— Geopolitical Strategist</span></DropdownMenuItem>
              <DropdownMenuItem onClick={() => scrollToSection(SECTIONS.chinaEcon)} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961]"><span className="font-medium">Wei Lin</span><span className="text-[#8A7548] ml-2 text-[10px]">— China Economist</span></DropdownMenuItem>
              <DropdownMenuItem onClick={() => scrollToSection(SECTIONS.inflation)} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961]"><span className="font-medium">Thomas Brennan</span><span className="text-[#8A7548] ml-2 text-[10px]">— Inflation Specialist</span></DropdownMenuItem>
              <DropdownMenuItem onClick={() => scrollToSection(SECTIONS.fiscal)} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961]"><span className="font-medium">Patricia Duval</span><span className="text-[#8A7548] ml-2 text-[10px]">— Fiscal Policy & Political Economy</span></DropdownMenuItem>
              <DropdownMenuItem onClick={() => scrollToSection(SECTIONS.fxCommod)} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961]"><span className="font-medium">Alexander Petrov</span><span className="text-[#8A7548] ml-2 text-[10px]">— Global FX & Commodities</span></DropdownMenuItem>
              <DropdownMenuItem onClick={() => scrollToSection(SECTIONS.labor)} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961]"><span className="font-medium">Maria Santos</span><span className="text-[#8A7548] ml-2 text-[10px]">— Labor Economist</span></DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#1F1A0F]" />
              <DropdownMenuLabel className="text-[#C9A961] text-[10px] uppercase tracking-[1px]">Fixed Income</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => scrollToSection(SECTIONS.fixedIncome)} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961]"><span className="font-medium">Claire Donovan</span><span className="text-[#8A7548] ml-2 text-[10px]">— Fixed Income Specialist</span></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* OLD Analysts Dropdown - REMOVED, moved to after Top 50 */}
          {false && <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm"
                className="bg-transparent border-[#C9A961]/30 text-[#C9A961] hover:bg-[#C9A961]/10 hover:border-[#C9A961] text-[10px] font-semibold tracking-[1px] uppercase whitespace-nowrap transition-all duration-100 active:scale-[0.97] h-7 px-2.5">
                <Users className="w-3 h-3" />
                <span className="ml-1">Analysts</span>
                <ChevronDown className="w-2.5 h-2.5 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#0A0A0A] border-[#C9A961]/30 min-w-[320px] max-h-[480px] overflow-y-auto">
              <DropdownMenuLabel className="text-[#C9A961] text-[10px] uppercase tracking-[1px]">Chief of Staff</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => window.location.href = '/analyst/beth'} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961]"><img src={AVATARS.beth} className="w-5 h-5 rounded-full mr-2" /><span className="font-medium">Beth</span><span className="text-[#8A7548] ml-2 text-[10px]">— Chief of Staff</span></DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#1F1A0F]" />
              <DropdownMenuLabel className="text-[#C9A961] text-[10px] uppercase tracking-[1px]">AI / Thematic Pod</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => window.location.href = "/analyst/marcus-chen"} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961]"><span className="font-medium">Marcus Chen</span><span className="text-[#8A7548] ml-2 text-[10px]">— AI Data Center</span></DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.location.href = "/analyst/elena-vasquez"} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961]"><span className="font-medium">Elena Vasquez</span><span className="text-[#8A7548] ml-2 text-[10px]">— Energy Infrastructure</span></DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.location.href = "/analyst/david-park"} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961]"><span className="font-medium">David Park</span><span className="text-[#8A7548] ml-2 text-[10px]">— Training Chips</span></DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.location.href = "/analyst/david-park"} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961]"><span className="font-medium">Sarah Nakamura</span><span className="text-[#8A7548] ml-2 text-[10px]">— Inference & AI Software</span></DropdownMenuItem>
              <DropdownMenuItem onClick={() => scrollToSection(SECTIONS.robotics)} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961]"><span className="font-medium">James Okafor</span><span className="text-[#8A7548] ml-2 text-[10px]">— Robotics & Physical AI</span></DropdownMenuItem>
              <DropdownMenuItem onClick={() => scrollToSection(SECTIONS.quantum)} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961]"><span className="font-medium">Priya Sharma</span><span className="text-[#8A7548] ml-2 text-[10px]">— Quantum Computing</span></DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#1F1A0F]" />
              <DropdownMenuLabel className="text-[#C9A961] text-[10px] uppercase tracking-[1px]">Technology Pod</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => scrollToSection(SECTIONS.saas)} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961]"><span className="font-medium">Michael Torres</span><span className="text-[#8A7548] ml-2 text-[10px]">— Enterprise SaaS</span></DropdownMenuItem>
              <DropdownMenuItem onClick={() => scrollToSection(SECTIONS.cyber)} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961]"><span className="font-medium">Rachel Kim</span><span className="text-[#8A7548] ml-2 text-[10px]">— Cybersecurity</span></DropdownMenuItem>
              <DropdownMenuItem onClick={() => scrollToSection(SECTIONS.internet)} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961]"><span className="font-medium">Andrew Walsh</span><span className="text-[#8A7548] ml-2 text-[10px]">— Internet Platforms</span></DropdownMenuItem>
              <DropdownMenuItem onClick={() => scrollToSection(SECTIONS.fintech)} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961]"><span className="font-medium">Sophia Reyes</span><span className="text-[#8A7548] ml-2 text-[10px]">— Fintech & Payments</span></DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#1F1A0F]" />
              <DropdownMenuLabel className="text-[#C9A961] text-[10px] uppercase tracking-[1px]">Healthcare Pod</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => scrollToSection(SECTIONS.biotech)} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961]"><span className="font-medium">Dr. Nathan Cole</span><span className="text-[#8A7548] ml-2 text-[10px]">— Biotech & Small Cap</span></DropdownMenuItem>
              <DropdownMenuItem onClick={() => scrollToSection(SECTIONS.pharma)} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961]"><span className="font-medium">Dr. Laura Mitchell</span><span className="text-[#8A7548] ml-2 text-[10px]">— Big Pharma & GLP-1</span></DropdownMenuItem>
              <DropdownMenuItem onClick={() => scrollToSection(SECTIONS.healthTools)} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961]"><span className="font-medium">Dr. Kevin Zhao</span><span className="text-[#8A7548] ml-2 text-[10px]">— Healthcare Tools & CDMOs</span></DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#1F1A0F]" />
              <DropdownMenuLabel className="text-[#C9A961] text-[10px] uppercase tracking-[1px]">Consumer Pod</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => scrollToSection(SECTIONS.consumer)} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961]"><span className="font-medium">Catherine Brooks</span><span className="text-[#8A7548] ml-2 text-[10px]">— Consumer & Brands</span></DropdownMenuItem>
              <DropdownMenuItem onClick={() => scrollToSection(SECTIONS.travel)} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961]"><span className="font-medium">Daniel Ortiz</span><span className="text-[#8A7548] ml-2 text-[10px]">— Travel & Leisure</span></DropdownMenuItem>
              <DropdownMenuItem onClick={() => scrollToSection(SECTIONS.ecommerce)} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961]"><span className="font-medium">Jessica Huang</span><span className="text-[#8A7548] ml-2 text-[10px]">— E-Commerce</span></DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#1F1A0F]" />
              <DropdownMenuLabel className="text-[#C9A961] text-[10px] uppercase tracking-[1px]">Economic Advisory Pod</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => scrollToSection(SECTIONS.macro)} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961]"><span className="font-medium">Dr. Robert Kessler</span><span className="text-[#8A7548] ml-2 text-[10px]">— Chief Economist</span></DropdownMenuItem>
              <DropdownMenuItem onClick={() => scrollToSection(SECTIONS.geopolitical)} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961]"><span className="font-medium">Victoria Sterling</span><span className="text-[#8A7548] ml-2 text-[10px]">— Geopolitical</span></DropdownMenuItem>
              <DropdownMenuItem onClick={() => scrollToSection(SECTIONS.chinaEcon)} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961]"><span className="font-medium">Wei Lin</span><span className="text-[#8A7548] ml-2 text-[10px]">— China Economist</span></DropdownMenuItem>
              <DropdownMenuItem onClick={() => scrollToSection(SECTIONS.inflation)} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961]"><span className="font-medium">Thomas Brennan</span><span className="text-[#8A7548] ml-2 text-[10px]">— Inflation</span></DropdownMenuItem>
              <DropdownMenuItem onClick={() => scrollToSection(SECTIONS.fiscal)} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961]"><span className="font-medium">Patricia Duval</span><span className="text-[#8A7548] ml-2 text-[10px]">— Fiscal Policy</span></DropdownMenuItem>
              <DropdownMenuItem onClick={() => scrollToSection(SECTIONS.fxCommod)} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961]"><span className="font-medium">Alexander Petrov</span><span className="text-[#8A7548] ml-2 text-[10px]">— FX & Commodities</span></DropdownMenuItem>
              <DropdownMenuItem onClick={() => scrollToSection(SECTIONS.labor)} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961]"><span className="font-medium">Maria Santos</span><span className="text-[#8A7548] ml-2 text-[10px]">— Labor Economist</span></DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#1F1A0F]" />
              <DropdownMenuLabel className="text-[#C9A961] text-[10px] uppercase tracking-[1px]">Style / Factor Pod</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => scrollToSection(SECTIONS.dividend)} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961]"><span className="font-medium">Richard Callahan</span><span className="text-[#8A7548] ml-2 text-[10px]">— Dividend & Income</span></DropdownMenuItem>
              <DropdownMenuItem onClick={() => scrollToSection(SECTIONS.value)} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961]"><span className="font-medium">Gregory Ashford</span><span className="text-[#8A7548] ml-2 text-[10px]">— Value Investor</span></DropdownMenuItem>
              <DropdownMenuItem onClick={() => scrollToSection(SECTIONS.fixedIncome)} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961]"><span className="font-medium">Claire Donovan</span><span className="text-[#8A7548] ml-2 text-[10px]">— Fixed Income</span></DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#1F1A0F]" />
              <DropdownMenuLabel className="text-[#C9A961] text-[10px] uppercase tracking-[1px]">Daily Reporting</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => scrollToSection(SECTIONS.reports)} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961]"><span className="font-medium">Jonathan Reed</span><span className="text-[#8A7548] ml-2 text-[10px]">— Morning Packet</span></DropdownMenuItem>
              <DropdownMenuItem onClick={() => scrollToSection(SECTIONS.reports)} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961]"><span className="font-medium">Samantha Liu</span><span className="text-[#8A7548] ml-2 text-[10px]">— Mid-Day Tactical</span></DropdownMenuItem>
              <DropdownMenuItem onClick={() => scrollToSection(SECTIONS.reports)} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961]"><span className="font-medium">Christopher Vance</span><span className="text-[#8A7548] ml-2 text-[10px]">— Market Close</span></DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#1F1A0F]" />
              <DropdownMenuLabel className="text-[#C9A961] text-[10px] uppercase tracking-[1px]">Functional Pod</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => scrollToSection(SECTIONS.agentStatus)} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961]"><span className="font-medium">Dr. Alan Whitfield</span><span className="text-[#8A7548] ml-2 text-[10px]">— Quantitative Analyst</span></DropdownMenuItem>
              <DropdownMenuItem onClick={() => scrollToSection(SECTIONS.agentStatus)} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961]"><span className="font-medium">Natasha Volkov</span><span className="text-[#8A7548] ml-2 text-[10px]">— Alt Data</span></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Agents Dropdown REMOVED */}

          {/* Healthcare Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="bg-transparent border-[#C9A961]/30 text-[#C9A961] hover:bg-[#C9A961]/10 hover:border-[#C9A961] text-[10px] font-semibold tracking-[1px] uppercase whitespace-nowrap transition-all duration-100 active:scale-[0.97] h-7 px-2.5">
                <Heart className="w-3 h-3" /><span className="ml-1">Healthcare</span><ChevronDown className="w-2.5 h-2.5 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#0A0A0A] border-[#C9A961]/30 min-w-[340px]">
              <DropdownMenuLabel className="text-[#C9A961] text-[10px] uppercase tracking-[1px]">Healthcare Pod — 3 Specialists</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => window.location.href = '/analyst/dr-nathan-cole'} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961] flex-col items-start py-2">
                <div><span className="font-medium">Dr. Nathan Cole</span><span className="text-[#8A7548] ml-2 text-[10px]">— Biotech & Small Cap</span></div>
                <span className="text-[#8A7548] text-[10px] mt-0.5">Rec: BUY REGN, VRTX | M&A activity accelerating in oncology</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.location.href = '/analyst/dr-laura-mitchell'} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961] flex-col items-start py-2">
                <div><span className="font-medium">Dr. Laura Mitchell</span><span className="text-[#8A7548] ml-2 text-[10px]">— Big Pharma & GLP-1</span></div>
                <span className="text-[#8A7548] text-[10px] mt-0.5">Rec: BUY LLY (Conv 8) | GLP-1 prescriptions +15% QoQ</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.location.href = '/analyst/dr-kevin-zhao'} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961] flex-col items-start py-2">
                <div><span className="font-medium">Dr. Kevin Zhao</span><span className="text-[#8A7548] ml-2 text-[10px]">— Healthcare Tools & CDMOs</span></div>
                <span className="text-[#8A7548] text-[10px] mt-0.5">Rec: BUY TMO, DHR | AI drug discovery demand surging</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#1F1A0F]" />
              <DropdownMenuItem onClick={() => scrollToSection(SECTIONS.healthcare)} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961]">
                <span className="font-medium">GLP-1 Megacycle Tracker</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Technology Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="bg-transparent border-[#C9A961]/30 text-[#C9A961] hover:bg-[#C9A961]/10 hover:border-[#C9A961] text-[10px] font-semibold tracking-[1px] uppercase whitespace-nowrap transition-all duration-100 active:scale-[0.97] h-7 px-2.5">
                <Cpu className="w-3 h-3" /><span className="ml-1">Technology</span><ChevronDown className="w-2.5 h-2.5 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#0A0A0A] border-[#C9A961]/30 min-w-[340px]">
              <DropdownMenuLabel className="text-[#C9A961] text-[10px] uppercase tracking-[1px]">Technology Pod — 4 Specialists</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => window.location.href = '/analyst/michael-torres'} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961] flex-col items-start py-2">
                <div><span className="font-medium">Michael Torres</span><span className="text-[#8A7548] ml-2 text-[10px]">— Enterprise SaaS</span></div>
                <span className="text-[#8A7548] text-[10px] mt-0.5">Rec: BUY MSFT (Conv 8), NOW | Copilot adoption 40%+ seat expansion</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.location.href = '/analyst/rachel-kim'} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961] flex-col items-start py-2">
                <div><span className="font-medium">Rachel Kim</span><span className="text-[#8A7548] ml-2 text-[10px]">— Cybersecurity</span></div>
                <span className="text-[#8A7548] text-[10px] mt-0.5">Rec: BUY PANW (Conv 9), CRWD | Platformization trend accelerating</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.location.href = '/analyst/andrew-walsh'} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961] flex-col items-start py-2">
                <div><span className="font-medium">Andrew Walsh</span><span className="text-[#8A7548] ml-2 text-[10px]">— Internet Platforms</span></div>
                <span className="text-[#8A7548] text-[10px] mt-0.5">Rec: HOLD META, GOOGL | AI ad targeting improving ROAS</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.location.href = '/analyst/sophia-reyes'} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961] flex-col items-start py-2">
                <div><span className="font-medium">Sophia Reyes</span><span className="text-[#8A7548] ml-2 text-[10px]">— Fintech & Payments</span></div>
                <span className="text-[#8A7548] text-[10px] mt-0.5">Rec: BUY V, MA | Cross-border volumes strong, watch delinquencies</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* AI Infrastructure Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="bg-transparent border-[#C9A961]/30 text-[#C9A961] hover:bg-[#C9A961]/10 hover:border-[#C9A961] text-[10px] font-semibold tracking-[1px] uppercase whitespace-nowrap transition-all duration-100 active:scale-[0.97] h-7 px-2.5">
                <Zap className="w-3 h-3" /><span className="ml-1">AI Infra</span><ChevronDown className="w-2.5 h-2.5 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#0A0A0A] border-[#C9A961]/30 min-w-[360px]">
              <DropdownMenuLabel className="text-[#C9A961] text-[10px] uppercase tracking-[1px]">AI / Thematic Pod — 6 Specialists</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => window.location.href = '/analyst/marcus-chen'} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961] flex-col items-start py-2">
                <div><span className="font-medium">Marcus Chen</span><span className="text-[#8A7548] ml-2 text-[10px]">— AI Data Center Buildout</span></div>
                <span className="text-[#8A7548] text-[10px] mt-0.5">Rec: BUY AVGO (Conv 8), DELL | $1T+ infra cycle, Cup & Handle breakout</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.location.href = '/analyst/elena-vasquez'} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961] flex-col items-start py-2">
                <div><span className="font-medium">Elena Vasquez</span><span className="text-[#8A7548] ml-2 text-[10px]">— Energy Infrastructure</span></div>
                <span className="text-[#8A7548] text-[10px] mt-0.5">Rec: BUY GEV, VST, CEG | DC power demand tripling by 2030</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.location.href = '/analyst/david-park'} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961] flex-col items-start py-2">
                <div><span className="font-medium">David Park</span><span className="text-[#8A7548] ml-2 text-[10px]">— Training Chips</span></div>
                <span className="text-[#8A7548] text-[10px] mt-0.5">Rec: STRONG BUY NVDA (Conv 9), AMD | Golden Cross confirmed, Blackwell ramp</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.location.href = '/analyst/sarah-nakamura'} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961] flex-col items-start py-2">
                <div><span className="font-medium">Sarah Nakamura</span><span className="text-[#8A7548] ml-2 text-[10px]">— Inference & AI Software</span></div>
                <span className="text-[#8A7548] text-[10px] mt-0.5">Rec: BUY ARM (Conv 7) | Edge AI architecture, royalty model benefits</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.location.href = '/analyst/james-okafor'} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961] flex-col items-start py-2">
                <div><span className="font-medium">James Okafor</span><span className="text-[#8A7548] ml-2 text-[10px]">— Robotics & Physical AI</span></div>
                <span className="text-[#8A7548] text-[10px] mt-0.5">Rec: WATCH TSLA (Optimus), ISRG | Physical AI early but accelerating</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.location.href = '/analyst/priya-sharma'} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961] flex-col items-start py-2">
                <div><span className="font-medium">Priya Sharma</span><span className="text-[#8A7548] ml-2 text-[10px]">— Quantum Computing</span></div>
                <span className="text-[#8A7548] text-[10px] mt-0.5">Rec: SPECULATIVE RGTI, QBTS | Max 1-2% allocation, pre-revenue</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Consumer Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="bg-transparent border-[#C9A961]/30 text-[#C9A961] hover:bg-[#C9A961]/10 hover:border-[#C9A961] text-[10px] font-semibold tracking-[1px] uppercase whitespace-nowrap transition-all duration-100 active:scale-[0.97] h-7 px-2.5">
                <ShoppingBag className="w-3 h-3" /><span className="ml-1">Consumer</span><ChevronDown className="w-2.5 h-2.5 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#0A0A0A] border-[#C9A961]/30 min-w-[340px]">
              <DropdownMenuLabel className="text-[#C9A961] text-[10px] uppercase tracking-[1px]">Consumer Pod — 3 Specialists</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => window.location.href = '/analyst/catherine-brooks'} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961] flex-col items-start py-2">
                <div><span className="font-medium">Catherine Brooks</span><span className="text-[#8A7548] ml-2 text-[10px]">— Consumer & Brands</span></div>
                <span className="text-[#8A7548] text-[10px] mt-0.5">Rec: BUY COST, NKE | Trade-down effect favoring value retailers</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.location.href = '/analyst/daniel-ortiz'} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961] flex-col items-start py-2">
                <div><span className="font-medium">Daniel Ortiz</span><span className="text-[#8A7548] ml-2 text-[10px]">— Travel & Leisure</span></div>
                <span className="text-[#8A7548] text-[10px] mt-0.5">Rec: BUY RCL, MAR | Cruise yields ATH, business travel recovery</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.location.href = '/analyst/jessica-huang'} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961] flex-col items-start py-2">
                <div><span className="font-medium">Jessica Huang</span><span className="text-[#8A7548] ml-2 text-[10px]">— E-Commerce</span></div>
                <span className="text-[#8A7548] text-[10px] mt-0.5">Rec: BUY MELI, SHOP | LatAm GMV growth +28%, Shopify AI tools</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* More Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="bg-transparent border-[#C9A961]/30 text-[#C9A961] hover:bg-[#C9A961]/10 hover:border-[#C9A961] text-[10px] font-semibold tracking-[1px] uppercase whitespace-nowrap transition-all duration-100 active:scale-[0.97] h-7 px-2.5">
                <Briefcase className="w-3 h-3" /><span className="ml-1">More</span><ChevronDown className="w-2.5 h-2.5 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#0A0A0A] border-[#C9A961]/30 min-w-[340px] max-h-[400px] overflow-y-auto">
              <DropdownMenuLabel className="text-[#C9A961] text-[10px] uppercase tracking-[1px]">Style & Factor Pod</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => scrollToSection(SECTIONS.dividend)} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961] flex-col items-start py-2">
                <div><span className="font-medium">Richard Callahan</span><span className="text-[#8A7548] ml-2 text-[10px]">— Dividend & Income</span></div>
                <span className="text-[#8A7548] text-[10px] mt-0.5">Rec: BUY JNJ, PG, KO | 10-15% defensive allocation recommended</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => scrollToSection(SECTIONS.value)} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961] flex-col items-start py-2">
                <div><span className="font-medium">Gregory Ashford</span><span className="text-[#8A7548] ml-2 text-[10px]">— Value Investor</span></div>
                <span className="text-[#8A7548] text-[10px] mt-0.5">Rec: CAUTION on growth valuations | NVDA prices perfection at 45x fwd</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => scrollToSection(SECTIONS.fixedIncome)} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961] flex-col items-start py-2">
                <div><span className="font-medium">Claire Donovan</span><span className="text-[#8A7548] ml-2 text-[10px]">— Fixed Income</span></div>
                <span className="text-[#8A7548] text-[10px] mt-0.5">Rec: Barbell strategy | Short T-bills + HQ corporate credit</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#1F1A0F]" />
              <DropdownMenuLabel className="text-[#C9A961] text-[10px] uppercase tracking-[1px]">Functional Pod</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => scrollToSection(SECTIONS.agentStatus)} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961] flex-col items-start py-2">
                <div><span className="font-medium">Dr. Alan Whitfield</span><span className="text-[#8A7548] ml-2 text-[10px]">— Quantitative Analyst</span></div>
                <span className="text-[#8A7548] text-[10px] mt-0.5">Factor screen: Momentum + Quality outperforming, Value lagging</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => scrollToSection(SECTIONS.agentStatus)} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961] flex-col items-start py-2">
                <div><span className="font-medium">Natasha Volkov</span><span className="text-[#8A7548] ml-2 text-[10px]">— Alt Data</span></div>
                <span className="text-[#8A7548] text-[10px] mt-0.5">Signal: COST foot traffic +6.8%, WMT web traffic surging</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#1F1A0F]" />
              <DropdownMenuItem onClick={() => scrollToSection(SECTIONS.reports)} className="text-[#F5E6C8] focus:bg-[#C9A961]/10 focus:text-[#C9A961]">
                <span className="font-medium">Reports Archive</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden px-4 py-3 border-t border-[#1F1A0F] space-y-2 max-h-[70vh] overflow-y-auto">
            {Object.entries({
              "Dashboard": SECTIONS.snapshot,
              "Top 50": SECTIONS.top50,
              "Tactical Playbook": SECTIONS.tactical,
              "Macro Advisory": SECTIONS.macro,
              "Technology & AI": SECTIONS.tech,
              "AI Infrastructure": SECTIONS.aiInfra,
              "Healthcare": SECTIONS.healthcare,
              "Consumer": SECTIONS.consumer,
              "Fixed Income": SECTIONS.fixedIncome,
              "Dividends": SECTIONS.dividend,
              "Geopolitical": SECTIONS.geopolitical,
              "Agent Status": SECTIONS.agentStatus,
              "Reports": SECTIONS.reports,
            }).map(([label, id]) => (
              <button key={id} onClick={() => { scrollToSection(id); setMobileMenuOpen(false); }} className="block w-full text-left text-[#F5E6C8] text-sm py-2 px-3 rounded hover:bg-[#C9A961]/10 transition-colors">
                {label}
              </button>
            ))}
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-4 py-6 max-w-[1440px] mx-auto space-y-10">

        {/* MARKET SNAPSHOT */}
        <section id={SECTIONS.snapshot}>
          <SectionHeader title="Market Snapshot" subtitle="Live Index Performance — Real-Time Data" />
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
            {indexData.map((idx) => (
              <div key={idx.name} className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-3 hover:border-[#3A2F1F] transition-colors duration-100">
                <p className="text-[#8A7548] text-[10px] uppercase tracking-[1px] mb-0.5">{idx.name}</p>
                <p className="text-[#F5E6C8] text-lg font-semibold" style={{ fontVariantNumeric: "tabular-nums" }}>{idx.value}</p>
                <p className={`text-xs font-medium ${idx.up ? "text-[#4ADE80]" : "text-[#EF4444]"}`}>
                  {idx.up ? "▲" : "▼"} {idx.change}
                </p>
              </div>
            ))}
          </div>
          <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-4">
            <p className="text-[#C9A961] text-sm font-medium mb-3 uppercase tracking-[1px]">S&P 500 — 1 Month Trend</p>
            <img src={SPY_CHART} alt="S&P 500 Chart" className="w-full rounded" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-4">
              <p className="text-[#C9A961] text-sm font-medium mb-3 uppercase tracking-[1px]">Dow Jones — 1 Month Trend</p>
              <img src={DOW_CHART} alt="Dow Jones Chart" className="w-full rounded" />
            </div>
            <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-4">
              <p className="text-[#C9A961] text-sm font-medium mb-3 uppercase tracking-[1px]">Nasdaq Composite — 1 Month Trend</p>
              <img src={NASDAQ_CHART} alt="Nasdaq Chart" className="w-full rounded" />
            </div>
          </div>
          <div className="mt-4 bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-5">
            <p className="text-[#F5E6C8] text-sm leading-relaxed">
              The S&P 500 continues its record-breaking run, finishing its <strong className="text-[#C9A961]">eighth consecutive week</strong> in the green at 7,473.47. 
              The Dow Jones surged past 50,500 setting fresh record highs. The rally is broad-based with technology, financials, and industrials all contributing. 
              U.S. markets closed Monday for Memorial Day. Key watchpoints: U.S.-Iran peace negotiations and potential Strait of Hormuz reopening.
            </p>
          </div>
        </section>

        {/* TOP 50 RECOMMENDATION ENGINE */}
        <section id={SECTIONS.top50}>
          <SectionHeader title="Top 50 Recommendation Engine" subtitle="Composite Scoring — Refreshes Every 15 Min During Market Hours" />
          <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg overflow-hidden">
            <div className="p-4 border-b border-[#1F1A0F] flex items-center justify-between">
              <p className="text-[#8A7548] text-xs">Scoring: conviction × specialist_track_record × thematic_relevance | Cross-specialist bonus: +1.5x</p>
              <span className="text-[#4ADE80] text-[10px] uppercase tracking-[1px] flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] animate-pulse"></div> Live
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#C9A961]/20 bg-[#0A0A0A]">
                    <th className="text-left py-2.5 px-3 text-[#C9A961] text-[10px] uppercase tracking-[1px]">#</th>
                    <th className="text-left py-2.5 px-3 text-[#C9A961] text-[10px] uppercase tracking-[1px]">Ticker</th>
                    <th className="text-left py-2.5 px-3 text-[#C9A961] text-[10px] uppercase tracking-[1px]">Company</th>
                    <th className="text-left py-2.5 px-3 text-[#C9A961] text-[10px] uppercase tracking-[1px]">Sector</th>
                    <th className="text-center py-2.5 px-3 text-[#C9A961] text-[10px] uppercase tracking-[1px]">Conviction</th>
                    <th className="text-right py-2.5 px-3 text-[#C9A961] text-[10px] uppercase tracking-[1px]">Price</th>
                    <th className="text-right py-2.5 px-3 text-[#C9A961] text-[10px] uppercase tracking-[1px]">Day %</th>
                    <th className="text-right py-2.5 px-3 text-[#C9A961] text-[10px] uppercase tracking-[1px]">YTD %</th>
                    <th className="text-left py-2.5 px-3 text-[#C9A961] text-[10px] uppercase tracking-[1px]">Lead Specialist</th>
                    <th className="text-right py-2.5 px-3 text-[#C9A961] text-[10px] uppercase tracking-[1px]">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {top50Data.map((s) => (
                    <tr key={s.ticker} className="border-b border-[#1F1A0F]/50 hover:bg-[#C9A961]/5 transition-colors cursor-pointer" onClick={() => window.location.href = `/stock/${s.ticker}`}>
                      <td className="py-2.5 px-3 text-[#8A7548] text-xs">{s.rank}</td>
                      <td className="py-2.5 px-3 text-[#C9A961] font-semibold text-xs underline decoration-[#C9A961]/30 hover:decoration-[#C9A961]">{s.ticker}</td>
                      <td className="py-2.5 px-3 text-[#F5E6C8] text-xs">{s.company}</td>
                      <td className="py-2.5 px-3 text-[#8A7548] text-xs">{s.sector}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-[0.5px] font-semibold ${s.conviction === "High" ? "bg-[#C9A961]/20 text-[#C9A961]" : "bg-[#8A7548]/20 text-[#8A7548]"}`}>
                          {s.conviction}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-[#F5E6C8] text-xs" style={{ fontVariantNumeric: "tabular-nums" }}>{s.price}</td>
                      <td className={`py-2.5 px-3 text-right text-xs ${s.change.startsWith("+") ? "text-[#4ADE80]" : "text-[#EF4444]"}`} style={{ fontVariantNumeric: "tabular-nums" }}>{s.change}</td>
                      <td className={`py-2.5 px-3 text-right text-xs ${s.ytd.startsWith("+") ? "text-[#4ADE80]" : "text-[#EF4444]"}`} style={{ fontVariantNumeric: "tabular-nums" }}>{s.ytd}</td>
                      <td className="py-2.5 px-3 text-[#8A7548] text-xs">{s.specialist}</td>
                      <td className="py-2.5 px-3 text-right text-[#8A7548] text-[10px]">{s.updated}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* MACROECONOMIC ADVISORY */}
        <section id={SECTIONS.macro}>
          <SectionHeader title="Macroeconomic Advisory" subtitle="Economic Advisory Pod — 7 Specialists" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AgentCard title="Chief Economist" agent="Dr. Robert Kessler" content="Divergence between stock market performance and consumer sentiment. University of Michigan May Survey hit new lows. Fed funds rate steady at 3.50-3.75% with 37% probability of hikes in late 2026." highlight="Growth equity implication: Cautious on rate-sensitive sectors. Favor quality growth with pricing power." />
            <AgentCard title="Fixed Income Strategy" agent="Claire Donovan" content="Treasury yields elevated near 2007 levels. 10Y at 4.87%, 2s10s spread normalized at +35bps. IG spreads tight at ~90bps OAS. HY widened to ~350bps." highlight="Recommendation: Barbell strategy — short-duration T-bills + high-quality corporate credit." />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-4">
            <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#4ADE80]"></div>
                <span className="text-[#C9A961] text-xs font-semibold">Thomas Brennan</span>
                <span className="text-[#8A7548] text-[10px]">— Inflation</span>
              </div>
              <p className="text-[#F5E6C8] text-xs leading-relaxed">CPI sticky at 3.4%. Supercore at 4.1%. Shelter lag model suggests gradual easing H2 but path to 2% extends into 2027.</p>
            </div>
            <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#4ADE80]"></div>
                <span className="text-[#C9A961] text-xs font-semibold">Victoria Sterling</span>
                <span className="text-[#8A7548] text-[10px]">— Geopolitical</span>
              </div>
              <p className="text-[#F5E6C8] text-xs leading-relaxed">U.S.-Iran negotiations progressing. Strait of Hormuz reopening could ease oil. China semiconductor restrictions tightening.</p>
            </div>
            <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#4ADE80]"></div>
                <span className="text-[#C9A961] text-xs font-semibold">Wei Lin</span>
                <span className="text-[#8A7548] text-[10px]">— China Economist</span>
              </div>
              <p className="text-[#F5E6C8] text-xs leading-relaxed">China recovery uneven. Property stabilization ongoing. Tech regulation easing. Semiconductor self-sufficiency push accelerating.</p>
            </div>
            <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#4ADE80]"></div>
                <span className="text-[#C9A961] text-xs font-semibold">Maria Santos</span>
                <span className="text-[#8A7548] text-[10px]">— Labor Economist</span>
              </div>
              <p className="text-[#F5E6C8] text-xs leading-relaxed">Labor market resilient but cooling. Wage growth 4.2% YoY above Fed comfort. JOLTS ratio normalized to 1.2x from 2.0x peak.</p>
            </div>
            <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#4ADE80]"></div>
                <span className="text-[#C9A961] text-xs font-semibold">Alexander Petrov</span>
                <span className="text-[#8A7548] text-[10px]">— FX & Commodities</span>
              </div>
              <p className="text-[#F5E6C8] text-xs leading-relaxed">DXY at 104.23, stable. WTI $72.40 on Iran talks. Gold $2,415 on safe-haven demand. Copper $4.82 on AI power thesis.</p>
            </div>
            <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#4ADE80]"></div>
                <span className="text-[#C9A961] text-xs font-semibold">Patricia Duval</span>
                <span className="text-[#8A7548] text-[10px]">— Fiscal Policy</span>
              </div>
              <p className="text-[#F5E6C8] text-xs leading-relaxed">Fiscal deficit elevated. Bond supply concerns contributing to long-end yield pressure. Midterm elections adding policy uncertainty.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <MetricCard label="Fed Funds Rate" value="3.50-3.75%" status="neutral" />
            <MetricCard label="Hike Probability" value="37%" status="danger" />
            <MetricCard label="Consumer Sentiment" value="New Low" status="danger" />
            <MetricCard label="2s10s Spread" value="+35bps" status="success" />
          </div>
        </section>

        {/* TACTICAL PLAYBOOK */}
        <section id={SECTIONS.tactical}>
          <SectionHeader title="Tactical Playbook" subtitle="Actionable Recommendations — Today's Priorities" />
          <div className="space-y-3">
            <TacticalItem priority="1" title="Maintain AI Exposure" action="HOLD / ADD ON DIPS" color="#4ADE80" description="Do not trim winners in AI infrastructure (NVDA, AVGO, ARM). Dell's $43B backlog indicates cycle still in early innings. Multi-year secular trend." />
            <TacticalItem priority="2" title="Hedge with Defensive Staples" action="ACCUMULATE" color="#C9A961" description="Given consumer sentiment/market divergence, allocate 10-15% to dividend aristocrats (JNJ, PG, KO, COST). Provides downside protection." />
            <TacticalItem priority="3" title="Monitor Treasury Yields" action="WATCH / SET ALERTS" color="#F59E0B" description="If 10Y breaks 5.0%, growth stocks may pullback 5-8%. Set alerts at 4.95% and 5.05%. This would be a buying opportunity." />
            <TacticalItem priority="4" title="Geopolitical Watch" action="MONITOR" color="#8A7548" description="U.S.-Iran negotiations could ease oil supply. China semiconductor restrictions tightening. Both impact sector allocation." />
          </div>
        </section>

        {/* TECHNOLOGY & AI */}
        <section id={SECTIONS.tech}>
          <SectionHeader title="Technology & AI" subtitle="Training Chips • Inference • AI Data Center • Software" />
          <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-5 mb-4">
            <img src={NVDA_CHART} alt="NVIDIA Chart" className="w-full rounded mb-4" />
            <p className="text-[#F5E6C8] text-sm leading-relaxed">
              The <strong className="text-[#C9A961]">"AI 11"</strong> has replaced the Magnificent 7 as the core performance driver. Semiconductor and AI infrastructure buildout continues at unprecedented pace.
            </p>
          </div>
          {/* Specialist Research Cards */}
          <div className="space-y-4 mb-4">
            <AnalystResearchCard name="David Park" role="Training Chip Specialist" conviction={9} action="STRONG BUY" tickers="NVDA, AMD" thesis="NVIDIA remains undisputed leader in AI training silicon. Blackwell ramp executing ahead of schedule. $5.5T valuation reflects 80%+ capture of AI training compute spend. Golden Cross pattern confirmed — historically leads to 18-30% additional upside over 6 months. AMD MI300X gaining as credible #2 alternative." />
            <AnalystResearchCard name="Sarah Nakamura" role="Inference & AI Software" conviction={7} action="BUY" tickers="ARM, NVDA" thesis="Inference market more competitive than training. AMD MI300X and custom ASICs challenging NVIDIA's inference moat. ARM's royalty model benefits from AI-everywhere trend. Edge AI deployment accelerating with on-device models. Watch inference cost curves — declining faster than expected." />
            <AnalystResearchCard name="Marcus Chen" role="AI Data Center Buildout" conviction={8} action="BUY" tickers="AVGO, DELL, SMCI" thesis="$1T+ infrastructure cycle over 5 years. Dell's record $43B AI backlog confirms enterprise demand. Broadcom up 106% YoY on custom ASIC + networking. Cup & Handle breakout pattern on AVGO projects target $330-340. Key bottlenecks: power, cooling, chip supply." />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <StockCard ticker="NVDA" name="NVIDIA" price="$208.27" change="+4.2%" note="$5.5T market cap. Golden Cross confirmed. AI chip demand unprecedented." />
            <StockCard ticker="AVGO" name="Broadcom" price="$289.45" change="+2.8%" note="Cup & Handle breakout. Network infrastructure for AI data centers." />
            <StockCard ticker="AMD" name="AMD" price="$467.51" change="+3.9%" note="Double Bottom breakout. MI300X gaining enterprise traction." />
            <StockCard ticker="ARM" name="ARM Holdings" price="$245.80" change="+2.1%" note="Mobile AI chip architecture. Royalty model benefits from AI everywhere." />
            <StockCard ticker="DELL" name="Dell Technologies" price="$178.90" change="+12.4%" note="Record $43B AI backlog. AI revenues to double to $50B in FY2027." />
            <StockCard ticker="SMCI" name="Super Micro" price="$52.30" change="+5.6%" note="AI server leader. Liquid cooling advantage. High growth, volatile." />
          </div>
        </section>

        {/* AI INFRASTRUCTURE */}
        <section id={SECTIONS.aiInfra}>
          <SectionHeader title="AI Infrastructure Buildout" subtitle="Data Centers • Energy • Networking • Cooling" />
          <AnalystResearchCard name="Marcus Chen" role="AI Data Center Buildout Specialist" conviction={8} action="BUY" tickers="AVGO, DELL, SMCI, MRVL, ANET" thesis="The AI data center buildout represents a $1T+ infrastructure cycle over 5 years. Key bottlenecks: power availability (tripling by 2030), cooling technology (liquid cooling mandatory for next-gen GPUs), and chip supply. Dell's $43B AI backlog is unprecedented. Broadcom's Cup & Handle breakout projects $330-340. Marvell and Arista dominating 800G/1.6T optical networking. Position across the full stack: compute, networking, cooling, power." />
        </section>

        {/* ENERGY INFRASTRUCTURE */}
        <section id={SECTIONS.energy}>
          <SectionHeader title="Energy Infrastructure" subtitle="Power Generation for AI • Grid Modernization" />
          <AnalystResearchCard name="Elena Vasquez" role="Energy Infrastructure Specialist" conviction={8} action="BUY" tickers="GEV, VST, CEG, NRG, PWR, ETN" thesis="Data center power demand creating a renaissance in power generation. US DC power demand projected to triple by 2030. Nuclear (CEG, SMRs), natural gas (GEV turbines), and renewables all benefiting. GE Vernova is the top pick — only pure-play power equipment company at scale. Vistra and Constellation benefiting from nuclear premium. Grid infrastructure (Quanta, EATON) seeing record backlogs for transmission upgrades." />
        </section>

        {/* ENTERPRISE SAAS */}
        <section id={SECTIONS.saas}>
          <SectionHeader title="Enterprise SaaS" subtitle="Net Revenue Retention • Rule of 40 • AI Exposure" />
          <AnalystResearchCard name="Michael Torres" role="Enterprise SaaS Specialist" conviction={8} action="BUY" tickers="MSFT, NOW, WDAY" thesis="Microsoft Copilot integration represents largest enterprise AI monetization opportunity. 40%+ seat expansion in enterprise accounts. ServiceNow jumped 8.8% on AI platform launch. Ascending Triangle breakout on MSFT above $420 resistance projects $445 target. Key metric: AI revenue as % of ARR separating winners from losers." />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <StockMini ticker="NOW" price="$1,045" change="+8.8%" />
            <StockMini ticker="WDAY" price="$312" change="+4.2%" />
            <StockMini ticker="CRM" price="$348" change="+1.1%" />
            <StockMini ticker="MSFT" price="$419" change="-0.1%" />
          </div>
        </section>

        {/* CYBERSECURITY */}
        <section id={SECTIONS.cyber}>
          <SectionHeader title="Cybersecurity" subtitle="Platformization • Zero Trust • AI-Powered Defense" />
          <AnalystResearchCard name="Rachel Kim" role="Cybersecurity Specialist" conviction={9} action="BUY" tickers="PANW, CRWD, ZS" thesis="Cybersecurity spending resilient as AI-powered threats escalate. Platformization trend strongly favoring Palo Alto Networks (Conv 9) and CrowdStrike as enterprises consolidate from 40+ vendors to 3-5 platforms. PANW's NRR at 25% with 4-quarter visibility. Zscaler benefiting from zero-trust adoption. AI-native defense tools creating new category." />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <StockMini ticker="PANW" price="$413" change="+1.8%" />
            <StockMini ticker="CRWD" price="$398" change="+2.1%" />
            <StockMini ticker="ZS" price="$181" change="+5.9%" />
            <StockMini ticker="FTNT" price="$134" change="+3.5%" />
          </div>
        </section>

        {/* INTERNET PLATFORMS */}
        <section id={SECTIONS.internet}>
          <SectionHeader title="Internet Platforms & Digital Advertising" subtitle="Ad Revenue • AI Integration • Engagement" />
          <AnalystResearchCard name="Andrew Walsh" role="Internet Platforms Specialist" conviction={7} action="HOLD" tickers="META, GOOGL, TTD" thesis="Digital advertising recovery continues with AI-driven ad targeting improving ROAS 15-20%. Meta leading with AI-powered creative tools — Advantage+ campaigns now 50% of ad spend. Alphabet's AI search integration driving higher-value queries. Bing gaining share for first time in decade. TTD benefiting from CTV shift. Watch for regulatory headwinds in EU." />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <StockMini ticker="META" price="$642" change="+0.8%" />
            <StockMini ticker="GOOGL" price="$192" change="+0.5%" />
            <StockMini ticker="SNAP" price="$18.40" change="+3.2%" />
            <StockMini ticker="TTD" price="$128" change="+1.9%" />
          </div>
        </section>

        {/* FINTECH */}
        <section id={SECTIONS.fintech}>
          <SectionHeader title="Fintech & Payments" subtitle="Payment Volume • Credit Quality • Digital Banking" />
          <AnalystResearchCard name="Sophia Reyes" role="Fintech & Payments Specialist" conviction={7} action="BUY" tickers="V, MA" thesis="Payment volumes healthy despite consumer sentiment weakness. Visa and Mastercard cross-border volumes growing 12%+ on international travel recovery. Consumer credit delinquencies ticking up but from historic lows — not yet alarming. Square benefiting from SMB AI tools. Watch 30-day delinquency rates for early warning. Fintech valuations reasonable at 25-30x forward earnings." />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <StockMini ticker="V" price="$319" change="+0.4%" />
            <StockMini ticker="MA" price="$542" change="+0.6%" />
            <StockMini ticker="SQ" price="$89" change="+2.3%" />
            <StockMini ticker="PYPL" price="$78" change="+1.1%" />
          </div>
        </section>

        {/* HEALTHCARE */}
        <section id={SECTIONS.healthcare}>
          <SectionHeader title="Healthcare — GLP-1 Tracker" subtitle="Eli Lilly vs Novo Nordisk • Prescriptions • Manufacturing" />
          <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-5 mb-4">
            <img src={LLY_CHART} alt="Eli Lilly Chart" className="w-full rounded mb-4" />
            <p className="text-[#F5E6C8] text-sm leading-relaxed">
              The <strong className="text-[#C9A961]">GLP-1 megacycle</strong> continues. Weekly US prescriptions growing 15%+ QoQ. Manufacturing capacity remains primary constraint.
              Oral GLP-1 pipeline advancing — could expand TAM 3-5x.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard label="LLY Market Share" value="58%" status="success" />
            <MetricCard label="NVO Market Share" value="39%" status="neutral" />
            <MetricCard label="Weekly Rx Growth" value="+15% QoQ" status="success" />
            <MetricCard label="Supply Constraint" value="Moderate" status="warning" />
          </div>
        </section>

        {/* BIOTECH */}
        <section id={SECTIONS.biotech}>
          <SectionHeader title="Biotech & Small Cap Biotech" subtitle="Clinical Catalysts • M&A • Pipeline" />
          <AnalystResearchCard name="Dr. Nathan Cole" role="Biotech & Small Cap Specialist" conviction={7} action="BUY" tickers="REGN, VRTX, IONS" thesis="Small-cap biotech seeing resurgence as M&A activity accelerates in oncology. Big pharma patent cliffs ($200B+ revenue at risk 2025-2030) driving acquisition appetite. Regeneron's pipeline depth underappreciated. Vertex expanding beyond CF into pain and kidney. Key catalysts: 14 PDUFA dates in next 60 days, 8 Phase 3 readouts pending. Position in quality names ahead of M&A wave." />
        </section>

        {/* BIG PHARMA */}
        <section id={SECTIONS.pharma}>
          <SectionHeader title="Big Pharma & Specialty Pharma" subtitle="Patent Cliffs • Pipeline Value • M&A" />
          <AnalystResearchCard name="Dr. Laura Mitchell" role="Big Pharma & GLP-1 Specialist" conviction={8} action="BUY" tickers="LLY, NVO, ABBV" thesis="Eli Lilly's GLP-1 franchise is the most important drug launch in pharma history. Weekly US prescriptions growing 15%+ QoQ with manufacturing as only constraint. Bull Flag pattern on LLY projects $950+ target. Oral GLP-1 (orforglipron) could expand TAM 3-5x. Novo Nordisk supply improving. AbbVie's Humira biosimilar headwinds priced in — pipeline undervalued." />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
            <StockMini ticker="LLY" price="$892" change="+1.4%" />
            <StockMini ticker="NVO" price="$143" change="+0.9%" />
            <StockMini ticker="MRK" price="$128" change="+0.3%" />
            <StockMini ticker="ABBV" price="$198" change="+0.7%" />
            <StockMini ticker="PFE" price="$28" change="-0.4%" />
            <StockMini ticker="JNJ" price="$162" change="+0.2%" />
          </div>
        </section>

        {/* HEALTH TOOLS */}
        <section id={SECTIONS.healthTools}>
          <SectionHeader title="Healthcare Tools & Life Sciences" subtitle="CDMOs • Diagnostics • Lab Equipment" />
          <AnalystResearchCard name="Dr. Kevin Zhao" role="Healthcare Tools & CDMOs Specialist" conviction={7} action="BUY" tickers="TMO, DHR, A" thesis="Life sciences tools recovering after 18-month destocking cycle. AI drug discovery driving demand for high-throughput screening and genomics platforms. CDMOs (Catalent, Samsung Biologics) benefiting massively from GLP-1 manufacturing demand — Lilly's $20B+ capacity expansion creating multi-year tailwind. Thermo Fisher and Danaher well-positioned for recovery. Agilent gaining in biopharma analytics." />
        </section>

        {/* CONSUMER */}
        <section id={SECTIONS.consumer}>
          <SectionHeader title="Consumer Discretionary & Brands" subtitle="Brand Heat • Athletic Share • Trade-Down Effect" />
          <AnalystResearchCard name="Catherine Brooks" role="Consumer Discretionary & Brands Specialist" conviction={6} action="BUY" tickers="COST, NKE, WMT" thesis="Mixed signals in consumer spending. High-end retail resilient but trade-down effect accelerating as consumer sentiment hits new lows. Costco comps +6.8% and Walmart foot traffic +4.2% confirm value-seeking behavior. Nike benefiting from athletic/wellness trend amplified by GLP-1 adoption. Avoid food-heavy names facing portion headwinds. Position in value retailers and athletic brands." />
          <div className="grid grid-cols-3 gap-3 mt-4">
            <MetricCard label="Consumer Sentiment" value="New Low" status="danger" />
            <MetricCard label="WMT Traffic" value="+4.2%" status="success" />
            <MetricCard label="COST Comps" value="+6.8%" status="success" />
          </div>
        </section>

        {/* TRAVEL & LEISURE */}
        <section id={SECTIONS.travel}>
          <SectionHeader title="Travel, Leisure & Restaurants" subtitle="TSA Throughput • RevPAR • Cruise Yields" />
          <AnalystResearchCard name="Daniel Ortiz" role="Travel, Leisure & Restaurants Specialist" conviction={7} action="BUY" tickers="RCL, MAR, HLT" thesis="Travel demand remains above 2019 levels with TSA throughput +8% vs pre-pandemic. Cruise net yields at all-time highs — Royal Caribbean (RCL) pricing power exceptional. Hotels benefiting from business travel recovery with RevPAR +5% YoY. Restaurant industry facing GLP-1 headwinds on portion sizes — avoid casual dining. Favor experiences over consumption: cruises, luxury hotels, live entertainment." />
        </section>

        {/* E-COMMERCE */}
        <section id={SECTIONS.ecommerce}>
          <SectionHeader title="E-Commerce & Marketplaces" subtitle="GMV Growth • Take Rates • Geographic Expansion" />
          <AnalystResearchCard name="Jessica Huang" role="E-Commerce & Marketplaces Specialist" conviction={7} action="BUY" tickers="MELI, SHOP, AMZN" thesis="MercadoLibre (MELI) is the top pick — LatAm GMV growth +28% with fintech (Mercado Pago) adding high-margin revenue. Shopify benefiting from AI-powered merchant tools driving higher take rates. Amazon retail seeing margin expansion from advertising and logistics optimization. Temu/Shein disruption a headwind for mid-market but not premium platforms. Geographic diversification key." />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <StockMini ticker="AMZN" price="$266" change="-0.8%" />
            <StockMini ticker="SHOP" price="$112" change="+1.4%" />
            <StockMini ticker="MELI" price="$2,180" change="+2.1%" />
            <StockMini ticker="SE" price="$142" change="+3.8%" />
          </div>
        </section>

        {/* FIXED INCOME */}
        <section id={SECTIONS.fixedIncome}>
          <SectionHeader title="Fixed Income Analysis" subtitle="Yield Curve • Credit Spreads • Fed Path" />
          <AnalystResearchCard name="Claire Donovan" role="Fixed Income Specialist" conviction={7} action="BARBELL" tickers="TLT, SHY, LQD, HYG" thesis="Treasury yields near 2007 levels with 10Y at 4.87% and 30Y at 5.12%. The 2s10s spread normalized at +35bps after longest inversion in history. IG credit spreads tight at ~90bps OAS — not yet signaling stress. HY widened to ~350bps, worth monitoring. Recommendation: Barbell strategy — short-duration T-bills (5%+ yield with no duration risk) combined with high-quality IG corporate credit (lock in 5.5-6% yields). Avoid long duration until Fed signals clear pivot." />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <MetricCard label="2Y Yield" value="4.52%" status="neutral" />
            <MetricCard label="10Y Yield" value="4.87%" status="danger" />
            <MetricCard label="30Y Yield" value="5.12%" status="danger" />
            <MetricCard label="IG OAS" value="~90bps" status="success" />
          </div>
        </section>

        {/* DIVIDEND & INCOME */}
        <section id={SECTIONS.dividend}>
          <SectionHeader title="Dividend Aristocrat & Income" subtitle="25+ Year Streak • Defensive Allocation" />
          <AnalystResearchCard name="Richard Callahan" role="Dividend Aristocrat & Income Specialist" conviction={7} action="ACCUMULATE" tickers="JNJ, PG, KO, PEP, MMM" thesis="In the current environment of elevated yields and market uncertainty, dividend aristocrats provide a defensive anchor. Recommend allocating 10-15% of portfolio to high-quality dividend growers with 25+ year track records. JNJ (3.2% yield, 62-year streak) and PG (2.4%, 68-year streak) are core holdings. These names provide downside protection if the consumer sentiment/equity divergence resolves negatively. Reinvested dividends compound significantly in volatile markets." />
          <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-5">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1F1A0F]">
                    <th className="text-left py-2 text-[#C9A961] text-[10px] uppercase tracking-[1px]">Ticker</th>
                    <th className="text-left py-2 text-[#C9A961] text-[10px] uppercase tracking-[1px]">Company</th>
                    <th className="text-right py-2 text-[#C9A961] text-[10px] uppercase tracking-[1px]">Yield</th>
                    <th className="text-right py-2 text-[#C9A961] text-[10px] uppercase tracking-[1px]">Streak</th>
                    <th className="text-right py-2 text-[#C9A961] text-[10px] uppercase tracking-[1px]">Safety</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { ticker: "JNJ", name: "Johnson & Johnson", yield: "3.2%", streak: "62 yrs", safety: "A+" },
                    { ticker: "PG", name: "Procter & Gamble", yield: "2.4%", streak: "68 yrs", safety: "A+" },
                    { ticker: "KO", name: "Coca-Cola", yield: "2.9%", streak: "62 yrs", safety: "A" },
                    { ticker: "PEP", name: "PepsiCo", yield: "2.7%", streak: "52 yrs", safety: "A" },
                    { ticker: "MMM", name: "3M Company", yield: "5.8%", streak: "66 yrs", safety: "B+" },
                  ].map((d) => (
                    <tr key={d.ticker} className="border-b border-[#1F1A0F]/50 hover:bg-[#C9A961]/5">
                      <td className="py-2 text-[#C9A961] font-medium text-xs">{d.ticker}</td>
                      <td className="py-2 text-[#F5E6C8] text-xs">{d.name}</td>
                      <td className="py-2 text-right text-[#4ADE80] text-xs">{d.yield}</td>
                      <td className="py-2 text-right text-[#F5E6C8] text-xs">{d.streak}</td>
                      <td className="py-2 text-right text-[#C9A961] text-xs">{d.safety}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* VALUE INVESTOR */}
        <section id={SECTIONS.value}>
          <SectionHeader title="Value Investor" subtitle="Deep Value • Margin of Safety • Mean Reversion" />
          <AnalystResearchCard name="Gregory Ashford" role="Value Investor Specialist" conviction={6} action="CAUTION" tickers="BRK.B, JPM, XOM, CVX" thesis="Value factor underperforming in current growth-led regime (hit rate 41% last 6 months, weight reduced to 0.8x). However, select deep value opportunities emerging in energy (XOM, CVX at 10x earnings), financials (JPM at 12x), and healthcare where earnings growth is mispriced. NVDA at 45x forward prices perfection — any miss triggers 20-30% correction. Regime Detection suggests maintaining reduced value allocation until factor rotation signals appear. Berkshire Hathaway's $400B cash pile is the ultimate value signal." />
        </section>

        {/* GEOPOLITICAL */}
        <section id={SECTIONS.geopolitical}>
          <SectionHeader title="Geopolitical Strategy" subtitle="Global Risk Assessment • Event-Driven Analysis" />
          <AnalystResearchCard name="Victoria Sterling" role="Geopolitical Strategist" conviction={7} action="MONITOR" tickers="XOM, LMT, RTX, CEG" thesis="Four key geopolitical developments impacting markets: (1) U.S.-Iran peace negotiations progressing — Strait of Hormuz reopening could ease oil supply 1-2M bbl/day, bearish for oil names. (2) China semiconductor export restrictions tightening further — benefiting domestic AI chip makers, creating supply uncertainty for US companies with China exposure. (3) Russia-Ukraine frozen conflict — European defense spending elevated, positive for LMT, RTX. (4) SpaceX IPO at $1.75T creating potential index fund liquidity squeeze." />
          <div className="space-y-3 mt-4">
            {[
              { event: "U.S.-Iran Peace Negotiations", impact: "Potential Strait of Hormuz reopening could ease oil supply 1-2M bbl/day", risk: "Medium" },
              { event: "China Semiconductor Restrictions", impact: "Export controls tightening; domestic AI chip makers benefiting", risk: "High" },
              { event: "EU Energy Transition", impact: "Accelerating renewable policy; positive for clean energy equities", risk: "Low" },
              { event: "Russia-Ukraine Conflict", impact: "Frozen conflict scenario; European defense spending elevated", risk: "Medium" },
            ].map((geo) => (
              <div key={geo.event} className="p-3 bg-[#0A0A0A] rounded border border-[#1F1A0F]">
                <div className="flex justify-between items-start">
                  <p className="text-[#C9A961] text-sm font-medium">{geo.event}</p>
                  <RiskBadge risk={geo.risk} />
                </div>
                <p className="text-[#F5E6C8]/70 text-xs mt-1">{geo.impact}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CHINA ECONOMIST */}
        <section id={SECTIONS.chinaEcon}>
          <SectionHeader title="China Economist" subtitle="Asian Session • Policy • Trade Impact" />
          <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-5">
            <p className="text-[#F5E6C8] text-sm leading-relaxed">
              China's economic recovery remains uneven. <strong className="text-[#C9A961]">Property sector stabilization</strong> efforts ongoing but consumer confidence weak. 
              Tech sector regulation easing. Semiconductor self-sufficiency push accelerating with massive state investment.
            </p>
          </div>
        </section>

        {/* INFLATION */}
        <section id={SECTIONS.inflation}>
          <SectionHeader title="Inflation Specialist" subtitle="CPI • PCE • Leading Indicators • 12-Month Forecast" />
          <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <MetricCard label="CPI YoY" value="3.4%" status="warning" />
              <MetricCard label="Core PCE" value="2.8%" status="warning" />
              <MetricCard label="Supercore" value="4.1%" status="danger" />
              <MetricCard label="12M Forecast" value="3.0-3.5%" status="warning" />
            </div>
            <p className="text-[#F5E6C8] text-sm leading-relaxed">
              Inflation proving stickier than expected. <strong className="text-[#C9A961]">Supercore (services ex-housing)</strong> remains elevated at 4.1%, 
              driven by wage growth and insurance costs. Energy prices adding upward pressure. Path to 2% target extended into 2027.
            </p>
          </div>
        </section>

        {/* FISCAL POLICY */}
        <section id={SECTIONS.fiscal}>
          <SectionHeader title="Fiscal Policy & Political Economy" subtitle="Government Spending • Tax Policy • Regulation" />
          <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-5">
            <p className="text-[#F5E6C8] text-sm leading-relaxed">
              Fiscal deficit remains elevated. <strong className="text-[#C9A961]">Bond supply concerns</strong> contributing to elevated long-end yields. 
              Midterm elections approaching — watch for policy uncertainty premium in markets.
            </p>
          </div>
        </section>

        {/* FX & COMMODITIES */}
        <section id={SECTIONS.fxCommod}>
          <SectionHeader title="Global FX & Commodities" subtitle="Dollar • Oil • Gold • Cross-Asset Flows" />
          <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MetricCard label="DXY" value="104.23" status="neutral" />
              <MetricCard label="WTI Crude" value="$72.40" status="neutral" />
              <MetricCard label="Gold" value="$2,415" status="success" />
              <MetricCard label="Copper" value="$4.82" status="success" />
            </div>
          </div>
        </section>

        {/* LABOR ECONOMIST */}
        <section id={SECTIONS.labor}>
          <SectionHeader title="Labor Economist" subtitle="NFP • Claims • JOLTS • Wage Tracker" />
          <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <MetricCard label="Unemployment" value="4.1%" status="neutral" />
              <MetricCard label="Initial Claims" value="218K" status="success" />
              <MetricCard label="Wage Growth" value="+4.2% YoY" status="warning" />
              <MetricCard label="JOLTS Ratio" value="1.2x" status="neutral" />
            </div>
            <p className="text-[#F5E6C8] text-sm leading-relaxed">
              Labor market remains resilient but gradually cooling. Wage growth still above Fed comfort zone at 4.2% YoY. 
              JOLTS openings-to-unemployed ratio normalized to 1.2x from pandemic peak of 2.0x.
            </p>
          </div>
        </section>

        {/* QUANTUM COMPUTING */}
        <section id={SECTIONS.quantum}>
          <SectionHeader title="Quantum Computing" subtitle="Speculative • Early Stage • High Volatility" />
          <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-5">
            <p className="text-[#F5E6C8] text-sm leading-relaxed mb-3">
              Quantum computing names extending multi-day gains on speculative interest. <strong className="text-[#C9A961]">Rigetti (RGTI)</strong> and 
              <strong className="text-[#C9A961]"> D-Wave (QBTS)</strong> leading. Still pre-revenue for most — position sizing should reflect speculative nature.
            </p>
            <div className="p-3 bg-[#0A0A0A] rounded border border-[#EF4444]/30">
              <p className="text-[#EF4444] text-xs font-semibold">⚠ HIGH SPECULATION WARNING</p>
              <p className="text-[#F5E6C8]/70 text-xs mt-1">Quantum names are highly speculative. Maximum 1-2% portfolio allocation recommended.</p>
            </div>
          </div>
        </section>

        {/* ROBOTICS */}
        <section id={SECTIONS.robotics}>
          <SectionHeader title="Robotics & Physical AI" subtitle="Humanoids • Industrial Automation • Autonomous" />
          <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-5">
            <p className="text-[#F5E6C8] text-sm leading-relaxed">
              Physical AI emerging as next major theme. <strong className="text-[#C9A961]">Tesla's Optimus</strong>, Figure AI, and industrial robotics 
              seeing accelerating investment. NVIDIA's Isaac platform enabling simulation-to-reality transfer. Watch: ISRG, ROK, ABB.
            </p>
          </div>
        </section>

        {/* AGENT STATUS */}
        <section id={SECTIONS.agentStatus}>
          <SectionHeader title="Agent System Status" subtitle="71 Total Agents — 39 Primary + 32 Embedded Chart Specialists" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Specialist Agents */}
            <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-4">
              <h4 className="text-[#C9A961] text-sm font-semibold uppercase tracking-[1px] mb-3">32 Specialist Analysts + Beth</h4>
              <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
                {specialistAgents.map((agent) => (
                  <div key={agent.name} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-[#C9A961]/5">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#4ADE80]"></div>
                      <span className="text-[#C9A961] text-xs font-medium">{agent.name}</span>
                      <span className="text-[#8A7548] text-[10px]">— {agent.role}</span>
                    </div>
                    <span className="text-[#8A7548] text-[10px]">{agent.lastDispatch}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Accuracy Agents */}
            <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-4">
              <h4 className="text-[#C9A961] text-sm font-semibold uppercase tracking-[1px] mb-3">7 Accuracy Infrastructure Agents</h4>
              <div className="space-y-2">
                {accuracyAgents.map((agent) => (
                  <div key={agent.name} className="p-2.5 bg-[#0A0A0A] rounded border border-[#1F1A0F]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#4ADE80]"></div>
                        <span className="text-[#C9A961] text-xs font-semibold">{agent.name}</span>
                        <span className="text-[#F5E6C8] text-xs">{agent.fullName}</span>
                      </div>
                      <span className="text-[#4ADE80] text-[10px] uppercase">Active</span>
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-[#8A7548] text-[10px]">{agent.role}</span>
                      <span className="text-[#8A7548] text-[10px]">Checks: {agent.checks}</span>
                      <span className="text-[#8A7548] text-[10px]">Last: {agent.lastRun}</span>
                      <span className="text-[#8A7548] text-[10px]">Temp: {agent.temp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chart Specialist Sub-Agents */}
          <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-4 mt-4">
            <h4 className="text-[#C9A961] text-sm font-semibold uppercase tracking-[1px] mb-3">32 Embedded Chart Specialists</h4>
            <p className="text-[#8A7548] text-xs mb-3">Each specialist analyst has a dedicated Chart Specialist sub-agent for data visualization.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 max-h-[300px] overflow-y-auto">
              {[
                { name: "Liam Crawford", parent: "Beth" },
                { name: "Aisha Patel", parent: "Marcus Chen" },
                { name: "Carlos Mendez", parent: "Elena Vasquez" },
                { name: "Yuna Choi", parent: "David Park" },
                { name: "Oliver Grant", parent: "Sarah Nakamura" },
                { name: "Fatima Al-Rashid", parent: "James Okafor" },
                { name: "Henrik Larsson", parent: "Priya Sharma" },
                { name: "Maya Thompson", parent: "Michael Torres" },
                { name: "Ravi Krishnan", parent: "Rachel Kim" },
                { name: "Isabelle Fontaine", parent: "Andrew Walsh" },
                { name: "Tomas Herrera", parent: "Sophia Reyes" },
                { name: "Zoe Blackburn", parent: "Dr. Nathan Cole" },
                { name: "Kenji Watanabe", parent: "Dr. Laura Mitchell" },
                { name: "Amara Osei", parent: "Dr. Kevin Zhao" },
                { name: "Ethan Gallagher", parent: "Catherine Brooks" },
                { name: "Lucia Ferreira", parent: "Daniel Ortiz" },
                { name: "Nikolai Volkov", parent: "Jessica Huang" },
                { name: "Sienna Hartley", parent: "Dr. Robert Kessler" },
                { name: "Dmitri Kozlov", parent: "Victoria Sterling" },
                { name: "Mei-Ling Wu", parent: "Wei Lin" },
                { name: "Oscar Johansson", parent: "Thomas Brennan" },
                { name: "Adele Moreau", parent: "Patricia Duval" },
                { name: "Ivan Petrov", parent: "Alexander Petrov" },
                { name: "Rosa Delgado", parent: "Maria Santos" },
                { name: "Callum Fraser", parent: "Richard Callahan" },
                { name: "Nadia Kuznetsova", parent: "Gregory Ashford" },
                { name: "Finn O'Brien", parent: "Claire Donovan" },
                { name: "Leila Ahmadi", parent: "Jonathan Reed" },
                { name: "Sebastian Wolfe", parent: "Samantha Liu" },
                { name: "Ingrid Bergman", parent: "Christopher Vance" },
                { name: "Tariq Hassan", parent: "Dr. Alan Whitfield" },
                { name: "Valentina Rossi", parent: "Natasha Volkov" },
              ].map((chart) => (
                <div key={chart.name} className="flex items-center gap-2 py-1 px-2 rounded hover:bg-[#C9A961]/5">
                  <div className="w-1 h-1 rounded-full bg-[#C9A961]"></div>
                  <span className="text-[#F5E6C8] text-[11px]">{chart.name}</span>
                  <span className="text-[#8A7548] text-[9px]">→ {chart.parent}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* REPORTS ARCHIVE */}
        <section id={SECTIONS.reports}>
          <SectionHeader title="Reports Archive" subtitle="Daily Reports — Morning • Mid-Day • Close" />
          <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-5">
            <div className="space-y-2">
              {[
                { type: "Morning Prep", date: "May 23, 2026", time: "7:30 AM AZ", status: "Delivered" },
                { type: "Mid-Day Tactical", date: "May 22, 2026", time: "11:00 AM AZ", status: "Delivered" },
                { type: "Market Close", date: "May 22, 2026", time: "1:30 PM AZ", status: "Delivered" },
                { type: "Morning Prep", date: "May 22, 2026", time: "7:30 AM AZ", status: "Delivered" },
                { type: "Mid-Day Tactical", date: "May 21, 2026", time: "11:00 AM AZ", status: "Delivered" },
              ].map((report, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 px-3 rounded hover:bg-[#C9A961]/5 border-b border-[#1F1A0F]/50">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-3.5 h-3.5 text-[#4ADE80]" />
                    <div>
                      <p className="text-[#F5E6C8] text-xs font-medium">{report.type}</p>
                      <p className="text-[#8A7548] text-[10px]">{report.date} • {report.time}</p>
                    </div>
                  </div>
                  <span className="text-[#4ADE80] text-[10px] uppercase tracking-[1px]">{report.status}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* BETH'S OPERATIONAL STATUS */}
        <section id="beth-status">
          <SectionHeader title="Beth — Chief of Staff" subtitle="Orchestration Status • Decision Framework • Pipeline Health" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-4 border-l-4 border-l-[#4ADE80]">
              <h4 className="text-[#C9A961] text-sm font-semibold mb-2">Daily Decision Loops</h4>
              <div className="space-y-1.5">
                <div className="flex justify-between"><span className="text-[#F5E6C8] text-xs">5:30 AM — System Wake</span><span className="text-[#4ADE80] text-[10px]">✓</span></div>
                <div className="flex justify-between"><span className="text-[#F5E6C8] text-xs">6:00 AM — Regime Detection</span><span className="text-[#4ADE80] text-[10px]">✓</span></div>
                <div className="flex justify-between"><span className="text-[#F5E6C8] text-xs">6:15 AM — Economic Leads</span><span className="text-[#4ADE80] text-[10px]">✓</span></div>
                <div className="flex justify-between"><span className="text-[#F5E6C8] text-xs">7:00 AM — Sector Dispatch</span><span className="text-[#4ADE80] text-[10px]">✓</span></div>
                <div className="flex justify-between"><span className="text-[#F5E6C8] text-xs">7:15 AM — Synthesis</span><span className="text-[#4ADE80] text-[10px]">✓</span></div>
                <div className="flex justify-between"><span className="text-[#F5E6C8] text-xs">7:30 AM — Morning Deploy</span><span className="text-[#4ADE80] text-[10px]">✓</span></div>
              </div>
            </div>
            <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-4 border-l-4 border-l-[#C9A961]">
              <h4 className="text-[#C9A961] text-sm font-semibold mb-2">Conflict Resolution</h4>
              <p className="text-[#F5E6C8] text-xs leading-relaxed mb-2">Active protocol: Surface disagreements, identify crux (factual vs interpretive), apply specialist weights, take position with caveats.</p>
              <div className="p-2 bg-[#0A0A0A] rounded border border-[#1F1A0F]">
                <p className="text-[#8A7548] text-[10px]">Last conflict resolved: Training Chip vs Value Investor on NVDA — resolved in favor of bull case (73% vs 41% hit rate)</p>
              </div>
            </div>
            <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-4 border-l-4 border-l-[#C9A961]">
              <h4 className="text-[#C9A961] text-sm font-semibold mb-2">Event-Driven Dispatch</h4>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#4ADE80]"></div><span className="text-[#F5E6C8] text-xs">Geopolitical Flash: Armed</span></div>
                <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#4ADE80]"></div><span className="text-[#F5E6C8] text-xs">Cyber Incident Flash: Armed</span></div>
                <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#4ADE80]"></div><span className="text-[#F5E6C8] text-xs">Biotech Catalyst Flash: Armed</span></div>
                <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#4ADE80]"></div><span className="text-[#F5E6C8] text-xs">Economic Data Flash: Armed</span></div>
                <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#4ADE80]"></div><span className="text-[#F5E6C8] text-xs">Mega-Cap Earnings Flash: Armed</span></div>
              </div>
            </div>
          </div>
        </section>

        {/* FACT-CHECKING PIPELINE */}
        <section id="fact-check">
          <SectionHeader title="Fact-Checking Pipeline" subtitle="5-Layer Verification • Zero Fabrication Tolerance" />
          <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-5">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
              {[
                { layer: "1", name: "Data Validation", agent: "Dr. Isaac Thornton", status: "1,247 checks", desc: "Multi-source verification" },
                { layer: "2", name: "Citation Enforcement", agent: "Angela Moretti", status: "892 scans", desc: "No uncited claims" },
                { layer: "3", name: "Cross-Specialist", agent: "Beth", status: "18 reconciled", desc: "Consistency check" },
                { layer: "4", name: "Primary Source", agent: "Dr. Fiona Blackwell", status: "12 verified", desc: "SEC, FDA, USPTO" },
                { layer: "5", name: "Reality Check", agent: "Beth", status: "Active", desc: "Breaking news scan" },
              ].map((l) => (
                <div key={l.layer} className="p-3 bg-[#0A0A0A] rounded border border-[#1F1A0F] text-center">
                  <p className="text-[#C9A961] text-lg font-bold">L{l.layer}</p>
                  <p className="text-[#F5E6C8] text-[10px] font-semibold uppercase tracking-[0.5px]">{l.name}</p>
                  <p className="text-[#8A7548] text-[9px] mt-1">{l.agent}</p>
                  <p className="text-[#4ADE80] text-[10px] mt-1">{l.status}</p>
                </div>
              ))}
            </div>
            <div className="p-3 bg-[#0A0A0A] rounded border border-[#4ADE80]/30">
              <p className="text-[#4ADE80] text-xs font-medium">Pipeline Status: All 5 layers operational • 0 hallucinations detected today • 47 claims verified, 0 blocked</p>
            </div>
          </div>
        </section>

        {/* CONTINUOUS LEARNING */}
        <section id="learning">
          <SectionHeader title="Continuous Learning System" subtitle="Track Record • Calibration • Weight Adjustment • Knowledge Update" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-4">
              <h4 className="text-[#C9A961] text-sm font-semibold mb-3">Specialist Weight Adjustments</h4>
              <div className="space-y-2">
                {[
                  { name: "David Park", spec: "Training Chips", weight: "1.6", hit: "73%" },
                  { name: "Dr. Laura Mitchell", spec: "Big Pharma", weight: "1.4", hit: "78%" },
                  { name: "Rachel Kim", spec: "Cybersecurity", weight: "1.2", hit: "62%" },
                  { name: "Marcus Chen", spec: "AI Data Center", weight: "1.5", hit: "71%" },
                  { name: "Gregory Ashford", spec: "Value Investor", weight: "0.8", hit: "41%" },
                ].map((s) => (
                  <div key={s.name} className="flex items-center justify-between py-1.5 px-2 rounded bg-[#0A0A0A]">
                    <div>
                      <span className="text-[#C9A961] text-xs font-medium">{s.name}</span>
                      <span className="text-[#8A7548] text-[10px] ml-2">{s.spec}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[#F5E6C8] text-xs">Hit: {s.hit}</span>
                      <span className={`text-xs font-semibold ${parseFloat(s.weight) >= 1.0 ? "text-[#4ADE80]" : "text-[#EF4444]"}`}>{s.weight}x</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-4">
              <h4 className="text-[#C9A961] text-sm font-semibold mb-3">Learning Loops Active</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-[#0A0A0A] rounded">
                  <span className="text-[#F5E6C8] text-xs">Daily: Track Record Updates</span>
                  <span className="text-[#4ADE80] text-[10px]">✓ Running</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-[#0A0A0A] rounded">
                  <span className="text-[#F5E6C8] text-xs">Weekly: Performance Review</span>
                  <span className="text-[#4ADE80] text-[10px]">✓ Scheduled Fri</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-[#0A0A0A] rounded">
                  <span className="text-[#F5E6C8] text-xs">Monthly: Calibration Curves</span>
                  <span className="text-[#4ADE80] text-[10px]">✓ Next: Jun 1</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-[#0A0A0A] rounded">
                  <span className="text-[#F5E6C8] text-xs">Quarterly: Deep Attribution</span>
                  <span className="text-[#4ADE80] text-[10px]">✓ Next: Jul 1</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-[#0A0A0A] rounded">
                  <span className="text-[#F5E6C8] text-xs">Brier Score Target</span>
                  <span className="text-[#C9A961] text-[10px]">&lt;0.15</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-[#0A0A0A] rounded">
                  <span className="text-[#F5E6C8] text-xs">Hallucination Rate (System)</span>
                  <span className="text-[#4ADE80] text-[10px]">0.0% (90-day)</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-[#1F1A0F] pt-6 pb-8">
          <div className="text-center">
            <img src={LOGO_URL} alt="Armstrong Arikat" className="h-12 mx-auto mb-3 opacity-60" />
            <p className="text-[#8A7548] text-[11px] max-w-2xl mx-auto leading-relaxed">
              This report is prepared by Armstrong Arikat Private Wealth Group for internal portfolio management purposes. 
              Not investment advice for third parties. All recommendations subject to verification. 
              Past performance does not indicate future results. Holdings and views subject to change without notice.
            </p>
            <p className="text-[#8A7548] text-[10px] mt-3">
              Generated: {new Date().toISOString()} | 72 Agents Operational | 5-Layer Fact-Check | Continuous Learning Active | Pipeline: &lt;180s
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}

// ─── Reusable Components ────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-4 pb-3 border-b border-[#1F1A0F]">
      <h2 className="text-[#C9A961] text-2xl tracking-[2px]" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>{title}</h2>
      <p className="text-[#8A7548] text-xs uppercase tracking-[2px] mt-1">{subtitle}</p>
    </div>
  );
}

function NavButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <Button variant="outline" size="sm" onClick={onClick}
      className="bg-transparent border-[#C9A961]/30 text-[#C9A961] hover:bg-[#C9A961]/10 hover:border-[#C9A961] text-[10px] font-semibold tracking-[1px] uppercase whitespace-nowrap transition-all duration-100 active:scale-[0.97] h-7 px-2.5">
      {icon}
      <span className="ml-1">{label}</span>
    </Button>
  );
}

function NavDropdown({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm"
          className="bg-transparent border-[#C9A961]/30 text-[#C9A961] hover:bg-[#C9A961]/10 hover:border-[#C9A961] text-[10px] font-semibold tracking-[1px] uppercase whitespace-nowrap transition-all duration-100 active:scale-[0.97] h-7 px-2.5">
          {icon}
          <span className="ml-1">{label}</span>
          <ChevronDown className="w-2.5 h-2.5 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-[#0A0A0A] border-[#C9A961]/30 min-w-[200px]">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AgentCard({ title, agent, content, highlight }: { title: string; agent: string; content: string; highlight: string }) {
  return (
    <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-5 border-l-4 border-l-[#C9A961]">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-[#C9A961] text-lg" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{title}</h4>
        <span className="text-[#8A7548] text-[10px] uppercase tracking-[1px] flex items-center gap-1">
          <Bot className="w-3 h-3" /> {agent}
        </span>
      </div>
      <p className="text-[#F5E6C8] text-sm leading-relaxed mb-3">{content}</p>
      <div className="p-3 bg-[#0A0A0A] rounded border border-[#C9A961]/20">
        <p className="text-[#C9A961] text-xs">{highlight}</p>
      </div>
    </div>
  );
}

function MetricCard({ label, value, status }: { label: string; value: string; status: "success" | "danger" | "warning" | "neutral" }) {
  const colors = { success: "text-[#4ADE80]", danger: "text-[#EF4444]", warning: "text-[#F59E0B]", neutral: "text-[#C9A961]" };
  return (
    <div className="p-3 bg-[#0A0A0A] rounded border border-[#1F1A0F] text-center">
      <p className="text-[#8A7548] text-[10px] uppercase tracking-[1px]">{label}</p>
      <p className={`text-lg font-semibold ${colors[status]}`}>{value}</p>
    </div>
  );
}

function TacticalItem({ priority, title, action, color, description }: { priority: string; title: string; action: string; color: string; description: string }) {
  return (
    <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg p-4 border-l-4" style={{ borderLeftColor: color }}>
      <div className="flex items-start justify-between mb-1.5">
        <div className="flex items-center gap-2.5">
          <span className="text-[#C9A961] text-xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{priority}</span>
          <h4 className="text-[#F5E6C8] text-sm font-medium">{title}</h4>
        </div>
        <span className="px-2.5 py-0.5 rounded text-[9px] uppercase tracking-[1px] font-bold" style={{ backgroundColor: `${color}20`, color }}>{action}</span>
      </div>
      <p className="text-[#F5E6C8]/80 text-xs leading-relaxed ml-8">{description}</p>
    </div>
  );
}

function StockCard({ ticker, name, price, change, note }: { ticker: string; name: string; price: string; change: string; note: string }) {
  return (
    <div className="bg-[#0A0A0A] border border-[#1F1A0F] rounded-lg p-3.5 hover:border-[#3A2F1F] transition-colors cursor-pointer" onClick={() => window.location.href = `/stock/${ticker}`}>
      <div className="flex justify-between items-start mb-1.5">
        <div>
          <span className="text-[#C9A961] font-semibold text-sm underline decoration-[#C9A961]/30">{ticker}</span>
          <span className="text-[#8A7548] text-[10px] ml-1.5">{name}</span>
        </div>
        <div className="text-right">
          <p className="text-[#F5E6C8] text-xs font-medium" style={{ fontVariantNumeric: "tabular-nums" }}>{price}</p>
          <p className={`text-[10px] ${change.startsWith("+") ? "text-[#4ADE80]" : "text-[#EF4444]"}`}>{change}</p>
        </div>
      </div>
      <p className="text-[#F5E6C8]/70 text-[11px] leading-relaxed">{note}</p>
    </div>
  );
}

function StockMini({ ticker, price, change }: { ticker: string; price: string; change: string }) {
  return (
    <div className="p-2.5 bg-[#0A0A0A] rounded border border-[#1F1A0F] text-center cursor-pointer hover:border-[#3A2F1F] transition-colors" onClick={() => window.location.href = `/stock/${ticker}`}>
      <p className="text-[#C9A961] text-xs font-semibold">{ticker}</p>
      <p className="text-[#F5E6C8] text-xs" style={{ fontVariantNumeric: "tabular-nums" }}>{price}</p>
      <p className={`text-[10px] ${change.startsWith("+") ? "text-[#4ADE80]" : "text-[#EF4444]"}`}>{change}</p>
    </div>
  );
}

function RiskBadge({ risk }: { risk: string }) {
  const styles: Record<string, string> = {
    High: "bg-[#EF4444]/20 text-[#EF4444]",
    Medium: "bg-[#F59E0B]/20 text-[#F59E0B]",
    Low: "bg-[#4ADE80]/20 text-[#4ADE80]",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-[0.5px] font-semibold ${styles[risk] || styles.Medium}`}>
      {risk} Risk
    </span>
  );
}

function AnalystResearchCard({ name, role, conviction, action, tickers, thesis }: { name: string; role: string; conviction: number; action: string; tickers: string; thesis: string }) {
  return (
    <div className="bg-[#0F0F0F] border border-[#1F1A0F] rounded-lg overflow-hidden">
      <div className="px-4 py-2.5 border-b border-[#1F1A0F] bg-[#0A0A0A] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-3.5 h-3.5 text-[#C9A961]" />
          <span className="text-[#C9A961] text-sm font-semibold">{name}</span>
          <span className="text-[#8A7548] text-[10px]">— {role}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-[0.5px] font-bold ${
            conviction >= 8 ? "bg-[#C9A961]/20 text-[#C9A961]" : conviction >= 6 ? "bg-[#8A7548]/20 text-[#8A7548]" : "bg-[#EF4444]/20 text-[#EF4444]"
          }`}>Conv: {conviction}/10</span>
          <span className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-[0.5px] font-bold ${
            action.includes("STRONG") ? "bg-[#4ADE80]/20 text-[#4ADE80]" : action.includes("BUY") ? "bg-[#C9A961]/20 text-[#C9A961]" : action.includes("HOLD") ? "bg-[#8A7548]/20 text-[#8A7548]" : "bg-[#F59E0B]/20 text-[#F59E0B]"
          }`}>{action}</span>
        </div>
      </div>
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[#8A7548] text-[10px] uppercase tracking-[1px]">Tickers:</span>
          <span className="text-[#C9A961] text-xs font-semibold">{tickers}</span>
        </div>
        <p className="text-[#F5E6C8] text-sm leading-relaxed">{thesis}</p>
      </div>
    </div>
  );
}

function RunAllAgentsButton() {
  const runAll = trpc.research.runAll.useMutation({
    onSuccess: (data) => {
      toast.success(`All agents dispatched: ${data.successful}/${data.totalAgents} successful (${Math.round(data.durationMs / 1000)}s)`);
    },
    onError: (error) => {
      toast.error(`Agent dispatch failed: ${error.message}`);
    },
  });

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => runAll.mutate()}
      disabled={runAll.isPending}
      className="bg-[#4ADE80]/10 border-[#4ADE80]/40 text-[#4ADE80] hover:bg-[#4ADE80]/20 hover:border-[#4ADE80] text-[10px] font-semibold tracking-[1px] uppercase whitespace-nowrap transition-all duration-100 active:scale-[0.97] h-7 px-2.5"
    >
      {runAll.isPending ? (
        <>
          <Activity className="w-3 h-3 animate-spin" />
          <span className="ml-1">Running...</span>
        </>
      ) : (
        <>
          <Zap className="w-3 h-3" />
          <span className="ml-1">Run All Agents</span>
        </>
      )}
    </Button>
  );
}
