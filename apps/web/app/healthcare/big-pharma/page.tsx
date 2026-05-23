import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import {
  GLP1SnapshotCard,
  PatentCliffTable,
  PipelineTable,
} from "@/components/healthcare/tables";

async function safeLoad() {
  try {
    const [glp1, pipeline, cliffs] = await Promise.all([
      api.glp1Latest(),
      api.pipeline({ specialist_owner: "big_pharma" }),
      api.patentCliffs(),
    ]);
    return { glp1, pipeline, cliffs, online: true };
  } catch {
    return { glp1: null, pipeline: [], cliffs: [], online: false };
  }
}

export default async function BigPharmaDashboardPage() {
  const { glp1, pipeline, cliffs, online } = await safeLoad();

  return (
    <div className="space-y-8">
      <section>
        <div className="text-[10px] uppercase tracking-wider text-gold-muted">
          Owner — Dr. Patricia Lansing
        </div>
        <h1 className="mt-1 font-serif text-4xl font-semibold text-gold">
          Big Pharma Dashboard
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-gold-muted">
          Large-cap commercial pharma — GLP-1 megacycle (brand side), patent-cliff/LOE
          modeling, capital allocation, M&amp;A from the acquirer&apos;s lens, pipeline NPV.
        </p>
        {!online && (
          <p className="mt-2 text-xs text-rose-400">Backend offline — empty state shown.</p>
        )}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>GLP-1 megacycle — latest snapshot</CardTitle>
        </CardHeader>
        <CardContent>
          <GLP1SnapshotCard snap={glp1} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Patent cliff timeline (sorted by nearest LOE)</CardTitle>
        </CardHeader>
        <CardContent>
          <PatentCliffTable rows={cliffs} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lansing&apos;s pipeline coverage (by rNPV / PoS)</CardTitle>
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
              <span className="text-gold-muted">Universe:</span> LLY, NVO, JNJ, MRK, PFE,
              ABBV, BMY, AZN, NVS, RHHBY, GSK, SNY, TAK + specialty $5-50B (REGN, VRTX,
              BIIB, GILD, INCY, ALNY, BMRN, JAZZ, EXEL, NBIX, HRMY, AMGN)
            </li>
            <li>
              <span className="text-gold-muted">Earnings calendar:</span> see the Calendar
              destination (pending)
            </li>
            <li>
              <span className="text-gold-muted">M&amp;A activity:</span> aggregated from
              Lansing + Sinclair&apos;s joint M&amp;A view in the latest report
            </li>
            <li>
              <span className="text-gold-muted">GLP-1 megacycle deep-dive:</span>{" "}
              <a href="/healthcare/glp1" className="text-gold hover:text-cream">
                /healthcare/glp1
              </a>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
