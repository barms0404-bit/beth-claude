import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RecommendationTable } from "@/components/recommendation-table";
import { api, type Recommendation, type ReportSummary } from "@/lib/api";

// The backend may be offline during local scaffold work — degrade gracefully.
async function safeLoad(): Promise<{
  recs: Recommendation[];
  reports: ReportSummary[];
  online: boolean;
}> {
  try {
    const [recs, reports] = await Promise.all([
      api.topRecommendations(),
      api.reports(),
    ]);
    return { recs, reports, online: true };
  } catch {
    return { recs: [], reports: [], online: false };
  }
}

const REPORT_LABELS: Record<ReportSummary["slot"], string> = {
  market_prep: "7:30 AM · Market Prep",
  mid_day: "11:00 AM · Mid-Day",
  market_close: "1:30 PM · Market Close",
};

export default async function DashboardPage() {
  const { recs, reports, online } = await safeLoad();

  return (
    <div className="space-y-8">
      <section>
        <h1 className="font-serif text-4xl font-semibold text-gold">
          Research Dashboard
        </h1>
        <p className="mt-1 text-sm text-gold-muted">
          BETH orchestrates 15 specialist analysts across three daily research
          windows — Arizona time (UTC&minus;7).
        </p>
        {!online && (
          <p className="mt-3 rounded-md border border-card-border bg-card px-4 py-2 text-xs text-gold-muted">
            Backend offline — showing empty state. Start the FastAPI service to load live data.
          </p>
        )}
      </section>

      <section id="reports" className="grid gap-4 md:grid-cols-3">
        {(["market_prep", "mid_day", "market_close"] as const).map((slot) => {
          const latest = reports.find((r) => r.slot === slot);
          return (
            <Card key={slot}>
              <CardHeader>
                <CardTitle className="text-base">{REPORT_LABELS[slot]}</CardTitle>
                <p className="text-xs text-gold-muted">
                  {latest
                    ? `Latest: ${new Date(latest.generatedAt).toLocaleString()}`
                    : "Not yet generated"}
                </p>
              </CardHeader>
            </Card>
          );
        })}
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Top 50 Recommendations</CardTitle>
            <p className="text-xs text-gold-muted">
              Ranked conviction list aggregated by BETH. Click a ticker for the full
              specialist dossier.
            </p>
          </CardHeader>
          <CardContent className="px-0">
            <RecommendationTable rows={recs} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
