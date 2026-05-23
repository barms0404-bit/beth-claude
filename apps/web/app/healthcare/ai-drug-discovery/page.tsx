import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Curated platform list — drives the static scorecard until specialist filings populate.
const PLATFORMS = [
  { ticker: "SDGR", name: "Schrödinger",   stance: "believer", note: "Software ARR + real margins; pipeline optionality." },
  { ticker: "RXRX", name: "Recursion",     stance: "neutral",  note: "Hybrid AI + experimental — partnerships material but pipeline still proving." },
  { ticker: "ABCL", name: "AbCellera",     stance: "neutral",  note: "Antibody discovery platform; partner-driven revenue lumpy." },
  { ticker: "RLAY", name: "Relay Tx",      stance: "neutral",  note: "Protein-motion drug design; one Ph2 readout could change the score." },
  { ticker: "EXAI", name: "Exscientia",    stance: "skeptic",  note: "Platform underperforming; cash + governance overhangs." },
  { ticker: "GOOGL", name: "Isomorphic (Alphabet)", stance: "believer", note: "AlphaFold pedigree; deals with NVS/LLY. Public exposure only via GOOGL." },
];

const BIG_PHARMA_ADOPTION = [
  { acquirer: "Novartis", target: "Isomorphic (deal)",  type: "license-in" },
  { acquirer: "Eli Lilly", target: "Isomorphic + multi-partner", type: "license-in" },
  { acquirer: "Sanofi",   target: "Recursion (deal)",    type: "license-in" },
  { acquirer: "BMS",      target: "Schrödinger (collab)", type: "collab" },
];

function stanceBadge(s: string) {
  const cls =
    s === "believer"
      ? "bg-emerald-900/40 text-emerald-300 border-emerald-700/40"
      : s === "skeptic"
        ? "bg-rose-900/40 text-rose-300 border-rose-700/40"
        : "bg-card-border/60 text-gold-muted border-gold/30";
  return (
    <span className={`inline-block rounded border px-2 py-0.5 text-[10px] uppercase tracking-wider ${cls}`}>
      {s}
    </span>
  );
}

export default function AIDrugDiscoveryPage() {
  return (
    <div className="space-y-8">
      <section>
        <div className="text-[10px] uppercase tracking-wider text-gold-muted">
          Joint coverage — Faulkner (biology) · Krishnan (inference) · Patel (compute infra)
        </div>
        <h1 className="mt-1 font-serif text-4xl font-semibold text-gold">
          AI Drug Discovery Tracker
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-gold-muted">
          The single biggest applied-AI domain outside of code generation. Genuinely
          emerging, unevenly distributed. The distinction between &quot;AI-enabled&quot;
          (most pharma) and &quot;AI-driven&quot; (the platforms) matters.
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Platform scorecard (skeptic vs believer)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-card-border/60 text-left text-[11px] uppercase tracking-wider text-gold-muted">
                  <th className="px-3 py-2">Ticker</th>
                  <th className="px-3 py-2">Platform</th>
                  <th className="px-3 py-2">Stance</th>
                  <th className="px-3 py-2">Take</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border/40 text-cream">
                {PLATFORMS.map((p) => (
                  <tr key={p.ticker}>
                    <td className="px-3 py-2 font-semibold text-gold">{p.ticker}</td>
                    <td className="px-3 py-2">{p.name}</td>
                    <td className="px-3 py-2">{stanceBadge(p.stance)}</td>
                    <td className="px-3 py-2 text-xs text-gold-muted">{p.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Big Pharma adoption signals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-card-border/60 text-left text-[11px] uppercase tracking-wider text-gold-muted">
                  <th className="px-3 py-2">Acquirer / Partner</th>
                  <th className="px-3 py-2">Target / Platform</th>
                  <th className="px-3 py-2">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border/40 text-cream">
                {BIG_PHARMA_ADOPTION.map((row, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 text-gold">{row.acquirer}</td>
                    <td className="px-3 py-2">{row.target}</td>
                    <td className="px-3 py-2 text-xs uppercase tracking-wide">{row.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Public vs private landscape</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-cream">
            <li>
              <span className="text-gold">Public:</span> SDGR, RXRX, ABCL, EXAI, RLAY (+
              public exposure via GOOGL for Isomorphic)
            </li>
            <li>
              <span className="text-gold">Private (watch for IPO):</span> Insitro,
              Generate Biomedicines, Genesis Therapeutics, Atomwise, Owkin
            </li>
            <li>
              <span className="text-gold">Skeptic&apos;s view:</span> most pure-play AI
              biotech is still pre-revenue from drug pipeline; platform-license revenue
              is lumpy; the gap between &quot;AI-enabled&quot; press release and ARR
              follow-through is large.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
