/*
 * Team Page — Armstrong Arikat Private Wealth Group
 * Full org chart with all 39 avatars, credentials, and hierarchy
 */

import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const LOGO_URL = "/manus-storage/aa-logo_4d0e4c30.png";

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

interface TeamMember { name: string; slug: string; role: string; credentials: string; }

const divisions: { name: string; color: string; members: TeamMember[] }[] = [
  { name: "Managing Partners", color: "#C9A961", members: [
    { name: "Brian Armstrong", slug: "brian-armstrong", role: "Managing Partner, Portfolio Management", credentials: "Arizona State University (W.P. Carey)" },
    { name: "Samira Arikat", slug: "samira-arikat", role: "Managing Partner, Financial Planning", credentials: "San Francisco State University | CFP, ChFC, CLU" },
  ]},
  { name: "Executive Office", color: "#C9A961", members: [
    { name: "Beth", slug: "beth", role: "Chief of Staff", credentials: "MBA Columbia | BA Georgetown | 18yr JPMorgan → Bridgewater" },
    { name: "Omar Hamze", slug: "omar-hamze", role: "Advisor in Training — Assistant to Beth", credentials: "Grand Canyon University | Series 65, Series 7" },
  ]},
  { name: "Investment Research Division", color: "#4ADE80", members: [
    { name: "David Park", slug: "david-park", role: "Training Chip Specialist", credentials: "MS EE Stanford | BS Physics Caltech | 10yr AMD/NVIDIA" },
    { name: "Marcus Chen", slug: "marcus-chen", role: "AI Data Center Buildout", credentials: "MBA Wharton | BS Engineering Cornell | 12yr Tiger Global" },
    { name: "Elena Vasquez", slug: "elena-vasquez", role: "Energy Infrastructure", credentials: "MS Energy Systems MIT | 8yr Duke Energy → Goldman Sachs" },
    { name: "Sarah Nakamura", slug: "sarah-nakamura", role: "Inference & AI Software", credentials: "PhD CS UC Berkeley | 6yr Google Brain → Anthropic" },
    { name: "James Okafor", slug: "james-okafor", role: "Robotics & Physical AI", credentials: "PhD Robotics Carnegie Mellon | 9yr Boston Dynamics → Tesla" },
    { name: "Priya Sharma", slug: "priya-sharma", role: "Quantum Computing", credentials: "PhD Quantum Physics Oxford | 5yr IBM Quantum → D-Wave" },
    { name: "Col. Derek Hayes (Ret.)", slug: "colonel-derek-hayes", role: "Space & Aerospace", credentials: "MBA Wharton | 22yr USAF Space Command | 8yr Lockheed Skunk Works" },
  ]},
  { name: "Technology Desk", color: "#60A5FA", members: [
    { name: "Michael Torres", slug: "michael-torres", role: "Enterprise SaaS", credentials: "MBA Harvard | 14yr Salesforce → Bessemer Venture Partners" },
    { name: "Rachel Kim", slug: "rachel-kim", role: "Cybersecurity", credentials: "MS CS MIT | CISSP | 10yr CrowdStrike → Palo Alto Networks" },
    { name: "Andrew Walsh", slug: "andrew-walsh", role: "Internet Platforms", credentials: "MBA Stanford GSB | 11yr Facebook/Meta → Sequoia Capital" },
    { name: "Sophia Reyes", slug: "sophia-reyes", role: "Fintech & Payments", credentials: "MS Financial Engineering Columbia | 9yr Visa → Square" },
  ]},
  { name: "Healthcare Desk", color: "#F472B6", members: [
    { name: "Dr. Laura Mitchell", slug: "dr-laura-mitchell", role: "Big Pharma & GLP-1", credentials: "MD/PhD Johns Hopkins | 15yr Pfizer → Eli Lilly" },
    { name: "Dr. Nathan Cole", slug: "dr-nathan-cole", role: "Biotech & Small Cap", credentials: "PhD Molecular Biology Harvard | 12yr Genentech → Flagship" },
    { name: "Dr. Kevin Zhao", slug: "dr-kevin-zhao", role: "Healthcare Tools & CDMOs", credentials: "PhD Bioengineering Stanford | 8yr Thermo Fisher → Danaher" },
  ]},
  { name: "Economic Strategy Division", color: "#C9A961", members: [
    { name: "Dr. Robert Kessler", slug: "dr-robert-kessler", role: "Chief Economist", credentials: "PhD Economics U of Chicago | 20yr Federal Reserve → Goldman Sachs" },
    { name: "Victoria Sterling", slug: "victoria-sterling", role: "Geopolitical Strategist", credentials: "MA International Relations Oxford | 15yr CIA → Eurasia Group" },
    { name: "Wei Lin", slug: "wei-lin", role: "China Economist", credentials: "PhD Economics Peking U | MA Harvard Kennedy | 12yr PBOC → Bridgewater" },
    { name: "Thomas Brennan", slug: "thomas-brennan", role: "Inflation Specialist", credentials: "MS Economics LSE | 10yr Bureau of Labor Statistics → PIMCO" },
    { name: "Patricia Duval", slug: "patricia-duval", role: "Fiscal Policy", credentials: "JD/MBA Yale | 12yr Congressional Budget Office → Treasury" },
    { name: "Alexander Petrov", slug: "alexander-petrov", role: "FX & Commodities", credentials: "MS Finance London Business School | 14yr Deutsche Bank FX" },
    { name: "Maria Santos", slug: "maria-santos", role: "Labor Economist", credentials: "PhD Labor Economics MIT | 8yr BLS → Federal Reserve Board" },
  ]},
  { name: "Client Wealth Division", color: "#F59E0B", members: [
    { name: "Catherine Brooks", slug: "catherine-brooks", role: "Consumer & Brands", credentials: "MBA Kellogg | 11yr Procter & Gamble → L Catterton" },
    { name: "Daniel Ortiz", slug: "daniel-ortiz", role: "Travel & Leisure", credentials: "MBA Cornell Hotel School | 10yr Marriott Revenue Management" },
    { name: "Jessica Huang", slug: "jessica-huang", role: "E-Commerce & Marketplaces", credentials: "MS Data Science Stanford | 8yr Amazon → MercadoLibre" },
    { name: "Richard Callahan", slug: "richard-callahan", role: "Dividend & Income", credentials: "CFA, CFP | MBA UVA Darden | 25yr T. Rowe Price" },
    { name: "Gregory Ashford", slug: "gregory-ashford", role: "Value & Contrarian", credentials: "CFA | MBA Columbia (Value Investing) | 18yr Tweedy Browne" },
    { name: "Claire Donovan", slug: "claire-donovan", role: "Fixed Income", credentials: "CFA, FRM | MS Finance NYU Stern | 14yr PIMCO → DoubleLine" },
  ]},
  { name: "Risk & Trading Division", color: "#EF4444", members: [
    { name: "Dr. Marcus Webb", slug: "dr-marcus-webb", role: "Portfolio Risk Manager", credentials: "PhD Financial Engineering MIT | CFA, FRM | 15yr Goldman → Citadel" },
    { name: "Ryan Tanaka", slug: "ryan-tanaka", role: "Execution Strategist", credentials: "BS CS Stanford | MS FinEng Berkeley | 12yr Morgan Stanley" },
    { name: "Victoria Chen", slug: "victoria-chen", role: "Options Strategist", credentials: "MS Quant Finance Carnegie Mellon | 8yr Susquehanna → Two Sigma" },
  ]},
  { name: "Daily Operations", color: "#8A7548", members: [
    { name: "Jonathan Reed", slug: "jonathan-reed", role: "Morning Report", credentials: "BA Journalism Northwestern | 6yr Bloomberg" },
    { name: "Samantha Liu", slug: "samantha-liu", role: "Mid-Day Tactical", credentials: "MS Finance NYU | 5yr CNBC Research" },
    { name: "Christopher Vance", slug: "christopher-vance", role: "Market Close", credentials: "MBA Emory | 7yr Fidelity Research" },
  ]},
  { name: "Compliance & Quality Division", color: "#EF4444", members: [
    { name: "Dr. Isaac Thornton", slug: "dr-isaac-thornton", role: "SENTINEL — Data Validation", credentials: "PhD Statistics Stanford | 10yr Google Data Quality" },
    { name: "Angela Moretti", slug: "angela-moretti", role: "CITATION — Source Enforcement", credentials: "MLIS Columbia | 12yr Bloomberg Data Integrity" },
    { name: "Dr. Fiona Blackwell", slug: "dr-fiona-blackwell", role: "RED TEAM — Adversarial Analysis", credentials: "PhD Behavioral Econ Princeton | 8yr DARPA" },
    { name: "Raymond Okafor", slug: "raymond-okafor", role: "PRIMARY SOURCE — Verification", credentials: "JD Georgetown | 10yr SEC Enforcement Division" },
    { name: "Dr. Alan Whitfield", slug: "dr-alan-whitfield", role: "COMPASS — Market Regime", credentials: "PhD Quant Finance NYU | 15yr AQR Capital" },
    { name: "Natasha Volkov", slug: "natasha-volkov", role: "MOSAIC — Alternative Data", credentials: "MS Data Science Columbia | 7yr Palantir → Two Sigma" },
  ]},
];

function PersonCard({ member, color }: { member: TeamMember; color: string }) {
  return (
    <a href={`/analyst/${member.slug}`} className="flex items-center gap-3 p-3 bg-[#0A0A0A] rounded-lg border border-[#1F1A0F] hover:border-[#C9A961]/50 transition-colors cursor-pointer">
      <img src={AVATARS[member.slug] || AVATARS.beth} alt={member.name} className="w-12 h-12 rounded-full border-2 object-cover" style={{ borderColor: color }} />
      <div className="flex-1 min-w-0">
        <p className="text-[#F5E6C8] text-sm font-semibold truncate">{member.name}</p>
        <p className="text-xs truncate" style={{ color }}>{member.role}</p>
        <p className="text-[#8A7548] text-[10px] truncate">{member.credentials}</p>
      </div>
    </a>
  );
}

export default function Team() {
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
              <h1 className="text-[#C9A961] text-xl font-semibold" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Our Team</h1>
              <p className="text-[#8A7548] text-xs">Armstrong Arikat Private Wealth Group — 39 Professionals across 9 Divisions</p>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 px-4 py-6 max-w-[1200px] mx-auto space-y-8">
        {divisions.map((div) => (
          <section key={div.name}>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[#1F1A0F]">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: div.color }}></div>
              <h2 className="text-lg font-semibold" style={{ color: div.color, fontFamily: "'Cormorant Garamond', serif" }}>{div.name}</h2>
              <span className="text-[#8A7548] text-xs ml-2">({div.members.length})</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {div.members.map((m) => <PersonCard key={m.slug} member={m} color={div.color} />)}
            </div>
          </section>
        ))}

        <footer className="border-t border-[#1F1A0F] pt-6 pb-8 text-center">
          <img src={LOGO_URL} alt="Armstrong Arikat" className="h-10 mx-auto mb-2 opacity-60" />
          <p className="text-[#8A7548] text-[10px]">Armstrong Arikat Private Wealth Group | 39 Professionals | 9 Divisions | 7 Strategic Committees</p>
        </footer>
      </main>
    </div>
  );
}
