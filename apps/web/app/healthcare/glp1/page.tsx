import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { GLP1SnapshotCard } from "@/components/healthcare/tables";

async function safeLoad() {
  try {
    const [latest, history] = await Promise.all([api.glp1Latest(), api.glp1History(12)]);
    return { latest, history, online: true };
  } catch {
    return { latest: null, history: [], online: false };
  }
}

const CROSS_SECTOR = [
  { theme: "Sleep apnea winners", names: "ResMed (RMD), Inspire (INSP) — derived OSA TAM" },
  { theme: "Snack & confectionery", names: "MDLZ, HSY, GIS, KHC — calorie-cut headwind" },
  { theme: "Alcohol", names: "STZ, DEO, TAP, BUD — consumption headwind" },
  { theme: "Quick-service restaurants", names: "MCD, YUM, CMG, SBUX — volume sensitivity" },
  { theme: "Apparel", names: "LULU, NKE, RL — sizing-mix tailwind for athleisure" },
  { theme: "Insulin & T2D incumbents", names: "Insulet (PODD), Tandem (TNDM), Dexcom (DXCM)" },
];

export default async function GLP1TrackerPage() {
  const { latest, history, online } = await safeLoad();

  return (
    <div className="space-y-8">
      <section>
        <div className="text-[10px] uppercase tracking-wider text-gold-muted">
          Joint coverage — Lansing (brand) · Faulkner (supply) · Chen (cross-sector)
        </div>
        <h1 className="mt-1 font-serif text-4xl font-semibold text-gold">
          GLP-1 Megacycle Tracker
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-gold-muted">
          The single most important pharma story of the decade. Brand-side P&amp;L from
          Lansing, supply-side capacity from Faulkner, cross-sector impact from Chen.
        </p>
        {!online && (
          <p className="mt-2 text-xs text-rose-400">Backend offline — empty state shown.</p>
        )}
      </section>

      <GLP1SnapshotCard snap={latest} />

      <Card>
        <CardHeader>
          <CardTitle>Recent snapshots ({history.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="px-1 py-6 text-sm italic text-gold-muted">
              No history on file. Snapshots populate weekly or per data drop.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-card-border/60 text-left text-[11px] uppercase tracking-wider text-gold-muted">
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2 text-right">LLY rev QoQ</th>
                    <th className="px-3 py-2 text-right">NVO rev QoQ</th>
                    <th className="px-3 py-2 text-right">LLY share</th>
                    <th className="px-3 py-2 text-right">NVO share</th>
                    <th className="px-3 py-2 text-right">US scripts/wk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-card-border/40 text-cream">
                  {history.map((h) => (
                    <tr key={h.id ?? h.snapshot_date}>
                      <td className="px-3 py-2 font-mono text-xs">{h.snapshot_date.slice(0, 10)}</td>
                      <td className="px-3 py-2 text-right font-mono text-xs">
                        {h.lly_revenue_qoq != null ? `${h.lly_revenue_qoq.toFixed(1)}%` : "—"}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-xs">
                        {h.nvo_revenue_qoq != null ? `${h.nvo_revenue_qoq.toFixed(1)}%` : "—"}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-xs">
                        {h.lly_market_share != null ? `${(h.lly_market_share * 100).toFixed(1)}%` : "—"}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-xs">
                        {h.nvo_market_share != null ? `${(h.nvo_market_share * 100).toFixed(1)}%` : "—"}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-xs">
                        {h.weekly_prescriptions_us?.toLocaleString() ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cross-sector impact tracker</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-card-border/60 text-left text-[11px] uppercase tracking-wider text-gold-muted">
                  <th className="px-3 py-2">Theme</th>
                  <th className="px-3 py-2">Names</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border/40 text-cream">
                {CROSS_SECTOR.map((row) => (
                  <tr key={row.theme}>
                    <td className="px-3 py-2 text-gold">{row.theme}</td>
                    <td className="px-3 py-2 text-xs">{row.names}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
