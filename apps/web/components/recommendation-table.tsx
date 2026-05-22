import Link from "next/link";
import type { Recommendation } from "@/lib/api";
import { cn, formatPct, formatUsd, pctColor } from "@/lib/utils";

export function RecommendationTable({ rows }: { rows: Recommendation[] }) {
  if (rows.length === 0) {
    return (
      <p className="px-5 py-8 text-center text-sm text-gold-muted">
        No recommendations yet — run the agent pipeline to populate the Top 50.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-card-border text-left text-xs uppercase tracking-wider text-gold-muted">
            <th className="px-4 py-3 font-medium">#</th>
            <th className="px-4 py-3 font-medium">Ticker</th>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 text-right font-medium">Price</th>
            <th className="px-4 py-3 text-right font-medium">Day %</th>
            <th className="px-4 py-3 text-right font-medium">YTD %</th>
            <th className="px-4 py-3 font-medium">Lead Specialist</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.symbol}
              className="border-b border-card-border/60 transition-colors hover:bg-card-border/30"
            >
              <td className="px-4 py-3 text-gold-muted">{r.rank}</td>
              <td className="px-4 py-3">
                <Link
                  href={`/ticker/${r.symbol}`}
                  className="font-medium text-gold hover:text-gold-dark hover:underline"
                >
                  {r.symbol}
                </Link>
              </td>
              <td className="max-w-[220px] truncate px-4 py-3 text-cream">{r.name}</td>
              <td className="px-4 py-3 text-right tabular-nums text-cream">
                {formatUsd(r.price)}
              </td>
              <td className={cn("px-4 py-3 text-right tabular-nums", pctColor(r.dailyPct ?? 0))}>
                {formatPct(r.dailyPct)}
              </td>
              <td className={cn("px-4 py-3 text-right tabular-nums", pctColor(r.ytdPct ?? 0))}>
                {formatPct(r.ytdPct)}
              </td>
              <td className="px-4 py-3 text-gold-muted">{r.leadSpecialist}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
