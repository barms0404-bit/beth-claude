import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeIn } from "@/components/fade-in";
import { MarketSnapshot } from "@/components/market-snapshot";
import { Top50Table } from "@/components/top50-table";
import { LatestReport } from "@/components/latest-report";
import { ActivityFeed } from "@/components/activity-feed";
import { ChartOfTheDay } from "@/components/chart-of-the-day";
import {
  api,
  type ActivityItem,
  type IndexQuote,
  type ReportFull,
  type Top50Snapshot,
} from "@/lib/api";

const EMPTY_TOP50: Top50Snapshot = { snapshot_time: "", entries: [] };

interface DashboardData {
  top50: Top50Snapshot;
  latest: ReportFull | null;
  snapshot: IndexQuote[];
  activity: ActivityItem[];
  online: boolean;
}

// The backend may be offline during local work — degrade gracefully.
async function safeLoad(): Promise<DashboardData> {
  try {
    const [top50, latest, snapshot, activity] = await Promise.all([
      api.top50(),
      api.latestReport(),
      api.marketSnapshot(),
      api.activity(),
    ]);
    return { top50, latest, snapshot, activity, online: true };
  } catch {
    return { top50: EMPTY_TOP50, latest: null, snapshot: [], activity: [], online: false };
  }
}

export default async function DashboardPage() {
  const { top50, latest, snapshot, activity, online } = await safeLoad();
  const chart = latest?.charts?.[0] ?? null;

  return (
    <div className="space-y-8">
      <section>
        <h1 className="font-serif text-4xl font-semibold text-gold">
          Research Dashboard
        </h1>
        <p className="mt-1 text-sm text-gold-muted">
          Beth orchestrates 15 specialist analysts across three daily research
          windows — Arizona time (UTC&minus;7).
        </p>
        {!online && (
          <p className="mt-3 rounded-md border border-card-border bg-card px-4 py-2 text-xs text-gold-muted">
            Backend offline — showing empty state. Start the FastAPI service for live data.
          </p>
        )}
      </section>

      {/* Row 1 — market snapshot */}
      <FadeIn>
        <MarketSnapshot initial={snapshot} />
      </FadeIn>

      {/* Row 2 — Top 50 */}
      <FadeIn delay={0.05}>
        <Card id="top50" className="scroll-mt-20">
          <CardHeader>
            <CardTitle>Top 50 Recommendations</CardTitle>
            <p className="text-xs text-gold-muted">
              Conviction-ranked, aggregated by Beth. Click a ticker for the full dossier.
            </p>
          </CardHeader>
          <CardContent className="px-0">
            <Top50Table initial={top50} />
          </CardContent>
        </Card>
      </FadeIn>

      {/* Rows 3 + 4 — latest report & activity feed */}
      <div className="grid gap-6 lg:grid-cols-3">
        <FadeIn className="lg:col-span-2">
          <Card id="latest-report" className="h-full scroll-mt-20">
            <CardHeader>
              <CardTitle>Latest Report</CardTitle>
            </CardHeader>
            <CardContent>
              <LatestReport report={latest} />
            </CardContent>
          </Card>
        </FadeIn>
        <FadeIn delay={0.05}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Specialist Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityFeed initial={activity} />
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      {/* Row 5 — chart of the day */}
      <FadeIn>
        <Card>
          <CardHeader>
            <CardTitle>Chart of the Day</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartOfTheDay chart={chart} />
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
