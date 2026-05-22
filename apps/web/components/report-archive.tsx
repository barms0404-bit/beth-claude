import { apiUrl, type ArchivedReport } from "@/lib/api";

const SLOT_LABEL: Record<string, string> = {
  market_prep: "Morning Prep",
  mid_day: "Mid-Day Tactical",
  market_close: "Close",
};

/**
 * Archive widget — links to the static-served HTML reports under
 * <api>/reports/YYYY-MM-DD/<slot>.html.
 */
export function ReportArchive({ items }: { items: ArchivedReport[] }) {
  if (items.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-gold-muted">
        No archived reports yet — the first runs at 7:30 AM AZ.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-card-border/60">
      {items.slice(0, 12).map((it) => (
        <li
          key={it.url}
          className="flex flex-wrap items-baseline justify-between gap-2 py-2"
        >
          <a
            href={apiUrl(it.url)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-gold hover:text-gold-dark hover:underline"
          >
            {SLOT_LABEL[it.slot] ?? it.slot}
          </a>
          <span className="text-xs text-gold-muted">
            {it.date} ·{" "}
            {new Date(it.generated_at).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </li>
      ))}
    </ul>
  );
}
