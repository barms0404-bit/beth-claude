import type { ReportFull } from "@/lib/api";

const SLOT_LABEL: Record<ReportFull["slot"], string> = {
  market_prep: "7:30 AM · Market Prep",
  mid_day: "11:00 AM · Mid-Day",
  market_close: "1:30 PM · Close",
};

/** Row 3 — preview of the most recent of the three daily reports. */
export function LatestReport({ report }: { report: ReportFull | null }) {
  if (!report) {
    return (
      <p className="py-6 text-center text-sm text-gold-muted">
        No report generated yet — trigger a report window to populate this preview.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-serif text-xl text-gold">{report.title}</h3>
        <span className="text-xs text-gold-muted">
          {SLOT_LABEL[report.slot]} · {new Date(report.generated_at).toLocaleString()}
        </span>
      </div>

      <p className="whitespace-pre-line text-sm leading-relaxed text-cream">
        {report.summary}
      </p>

      {report.recommendations.length > 0 && (
        <div>
          <div className="mb-2 text-xs uppercase tracking-wider text-gold-muted">
            Top picks
          </div>
          <div className="flex flex-wrap gap-2">
            {report.recommendations.slice(0, 8).map((r) => (
              <span
                key={r.symbol}
                className="rounded border border-card-border px-2 py-1 text-xs text-gold"
              >
                {r.symbol} · {r.conviction}/10
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
