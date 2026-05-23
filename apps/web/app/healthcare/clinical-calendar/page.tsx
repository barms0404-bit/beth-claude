import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { ClinicalCatalystTable } from "@/components/healthcare/tables";

async function safeLoad() {
  try {
    const [upcoming, occurred] = await Promise.all([
      api.clinicalCatalysts("upcoming"),
      api.clinicalCatalysts("occurred"),
    ]);
    return { upcoming, occurred, online: true };
  } catch {
    return { upcoming: [], occurred: [], online: false };
  }
}

export default async function ClinicalCalendarPage() {
  const { upcoming, occurred, online } = await safeLoad();

  return (
    <div className="space-y-8">
      <section>
        <div className="text-[10px] uppercase tracking-wider text-gold-muted">
          Owner — Sinclair (biotech) · Lansing (big pharma read-through)
        </div>
        <h1 className="mt-1 font-serif text-4xl font-semibold text-gold">
          Clinical Catalyst Calendar
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-gold-muted">
          All upcoming data releases across coverage with PoS estimates, expected stock
          move, and asymmetry scoring. Active recommendations linked to events.
        </p>
        {!online && (
          <p className="mt-2 text-xs text-rose-400">Backend offline — empty state shown.</p>
        )}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming</CardTitle>
        </CardHeader>
        <CardContent>
          <ClinicalCatalystTable rows={upcoming} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recently occurred</CardTitle>
        </CardHeader>
        <CardContent>
          <ClinicalCatalystTable rows={occurred} />
        </CardContent>
      </Card>
    </div>
  );
}
