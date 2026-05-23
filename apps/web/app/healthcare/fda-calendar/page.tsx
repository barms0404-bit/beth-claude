import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { PDUFATable } from "@/components/healthcare/tables";

async function safeLoad() {
  try {
    const [upcoming, approved, crl, delayed] = await Promise.all([
      api.pdufas("upcoming"),
      api.pdufas("approved"),
      api.pdufas("crl"),
      api.pdufas("delayed"),
    ]);
    return { upcoming, approved, crl, delayed, online: true };
  } catch {
    return { upcoming: [], approved: [], crl: [], delayed: [], online: false };
  }
}

export default async function FDACalendarPage() {
  const { upcoming, approved, crl, delayed, online } = await safeLoad();

  return (
    <div className="space-y-8">
      <section>
        <div className="text-[10px] uppercase tracking-wider text-gold-muted">
          Owner — Sinclair (small/mid cap) · Lansing (large cap) · joint on AdComms
        </div>
        <h1 className="mt-1 font-serif text-4xl font-semibold text-gold">
          FDA Regulatory Calendar
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-gold-muted">
          PDUFA dates, AdComm meetings, approvals expected, label changes pending —
          every entry carries our PoS estimate and the equity implication.
        </p>
        {!online && (
          <p className="mt-2 text-xs text-rose-400">Backend offline — empty state shown.</p>
        )}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming PDUFAs</CardTitle>
        </CardHeader>
        <CardContent>
          <PDUFATable rows={upcoming} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recently approved</CardTitle>
        </CardHeader>
        <CardContent>
          <PDUFATable rows={approved} />
        </CardContent>
      </Card>

      {(crl.length > 0 || delayed.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>CRLs &amp; delays</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {crl.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gold">
                  CRLs
                </h3>
                <PDUFATable rows={crl} />
              </div>
            )}
            {delayed.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gold">
                  Delayed
                </h3>
                <PDUFATable rows={delayed} />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
