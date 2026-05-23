"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { apiUrl, type ChartSpec } from "@/lib/api";
import { AA } from "@/lib/design-tokens";

interface Series {
  data: Record<string, unknown>[];
  xKey: string;
  yKey: string;
}

/**
 * The Chart Specialist returns a free-form recharts_spec. We defensively pull a
 * plottable series out of it; if none is found we show a placeholder rather
 * than risk a render crash. Faithful spec rendering lands with the chart pipeline.
 */
function extractSeries(spec: Record<string, unknown>): Series | null {
  const data = (spec?.data ?? spec?.dataset) as unknown;
  if (!Array.isArray(data) || data.length === 0) return null;
  const first = data[0];
  if (typeof first !== "object" || first === null) return null;
  const keys = Object.keys(first as object);
  const yKey = keys.find((k) => typeof (first as Record<string, unknown>)[k] === "number");
  const xKey = keys.find((k) => typeof (first as Record<string, unknown>)[k] !== "number");
  if (!yKey) return null;
  return { data: data as Record<string, unknown>[], xKey: xKey ?? keys[0], yKey };
}

function ExplanationBlock({
  label,
  body,
  accent = false,
}: {
  label: string;
  body: string;
  accent?: boolean;
}) {
  if (!body) return null;
  return (
    <div>
      <div
        className={
          "mb-1 text-[0.62rem] uppercase tracking-[0.18em] " +
          (accent ? "text-gold" : "text-gold-muted")
        }
      >
        {label}
      </div>
      <div>{body}</div>
    </div>
  );
}

/** Row 5 — the chart Beth promoted from the latest report. */
export function ChartOfTheDay({ chart }: { chart: ChartSpec | null }) {
  if (!chart) {
    return (
      <p className="py-6 text-center text-sm text-gold-muted">
        No chart promoted yet — Beth surfaces one once a report runs.
      </p>
    );
  }

  const series = extractSeries(chart.recharts_spec);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h3 className="font-serif text-xl text-gold">{chart.title}</h3>
          <p className="text-xs text-gold-muted">
            Promoted from {chart.requested_by} · {chart.chart_type}
          </p>
        </div>
        <span className="text-[0.62rem] uppercase tracking-wider text-gold-muted">
          {chart.source}
        </span>
      </div>

      {series ? (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={series.data}>
            <defs>
              <linearGradient id="cotd-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={AA.gold} stopOpacity={0.5} />
                <stop offset="100%" stopColor={AA.gold} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={AA.cardBorder} strokeDasharray="3 3" />
            <XAxis dataKey={series.xKey} stroke={AA.goldMuted} fontSize={11} />
            <YAxis stroke={AA.goldMuted} fontSize={11} />
            <Tooltip
              contentStyle={{
                background: AA.card,
                border: `1px solid ${AA.cardBorder}`,
                color: AA.cream,
              }}
            />
            <Area
              type="monotone"
              dataKey={series.yKey}
              stroke={AA.gold}
              strokeWidth={2}
              fill="url(#cotd-fill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-[200px] items-center justify-center rounded-md border border-dashed border-card-border px-4 text-center text-sm text-gold-muted">
          No plottable series in this chart spec — the HD PNG render is at the link below.
        </div>
      )}

      <div className="space-y-3 text-sm leading-relaxed text-cream">
        <ExplanationBlock label="Why this chart" body={chart.explanation.why_this_chart} />
        <ExplanationBlock label="How to read it" body={chart.explanation.how_to_read} />
        <ExplanationBlock label="Key takeaway" body={chart.explanation.key_takeaway} accent />
      </div>

      {chart.png_url && (
        <a
          href={apiUrl(chart.png_url)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gold-muted hover:text-gold hover:underline"
        >
          Open HD PNG &rarr;
        </a>
      )}
    </div>
  );
}
