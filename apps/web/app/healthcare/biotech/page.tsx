import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import {
  ClinicalCatalystTable,
  PipelineTable,
} from "@/components/healthcare/tables";

async function safeLoad() {
  try {
    const [catalysts, pipeline] = await Promise.all([
      api.clinicalCatalysts("upcoming"),
      api.pipeline({ specialist_owner: "biotech_smid" }),
    ]);
    return { catalysts, pipeline, online: true };
  } catch {
    return { catalysts: [], pipeline: [], online: false };
  }
}

export default async function BiotechDashboardPage() {
  const { catalysts, pipeline, online } = await safeLoad();

  return (
    <div className="space-y-8">
      <section>
        <div className="text-[10px] uppercase tracking-wider text-gold-muted">
          Owner — Dr. Rachel Sinclair
        </div>
        <h1 className="mt-1 font-serif text-4xl font-semibold text-gold">
          Biotech Dashboard
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-gold-muted">
          SMID clinical-stage — PoS modeling, rNPV per asset, conference deep-dives,
          M&amp;A targets. Asymmetric, binary-event-driven; position-sizing discipline matters.
        </p>
        {!online && (
          <p className="mt-2 text-xs text-rose-400">Backend offline — empty state shown.</p>
        )}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Active clinical catalyst calendar (next 90 days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ClinicalCatalystTable rows={catalysts} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sinclair&apos;s pipeline coverage</CardTitle>
        </CardHeader>
        <CardContent>
          <PipelineTable rows={pipeline} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Coverage rails</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-cream">
            <li>
              <span className="text-gold-muted">PDUFA tracker:</span> see the{" "}
              <a href="/healthcare/fda-calendar" className="text-gold hover:text-cream">
                FDA Regulatory Calendar
              </a>
            </li>
            <li>
              <span className="text-gold-muted">Conference watch:</span> JPM (Jan),
              AACR (Apr), ASCO (Jun), EHA (Jun), ESMO (Sep), ASH (Dec)
            </li>
            <li>
              <span className="text-gold-muted">Top biotech movers today:</span> see the
              Dashboard&apos;s Top 50 — filter by biotech sub-category tag
            </li>
            <li>
              <span className="text-gold-muted">Active recommendations with risk/reward setups:</span>{" "}
              sourced from Sinclair&apos;s latest filing — see the Latest Report on the Dashboard
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
