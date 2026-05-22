"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PriceBar } from "@/lib/api";
import { AA } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

function sma(closes: number[], period: number): (number | null)[] {
  return closes.map((_, i) => {
    if (i < period - 1) return null;
    const slice = closes.slice(i - period + 1, i + 1);
    return slice.reduce((a, b) => a + b, 0) / period;
  });
}

function rsi(closes: number[], period = 14): (number | null)[] {
  const out: (number | null)[] = closes.map(() => null);
  if (closes.length <= period) return out;
  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    if (d >= 0) gain += d;
    else loss -= d;
  }
  gain /= period;
  loss /= period;
  out[period] = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    gain = (gain * (period - 1) + Math.max(d, 0)) / period;
    loss = (loss * (period - 1) + Math.max(-d, 0)) / period;
    out[i] = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
  }
  return out;
}

const TOOLTIP_STYLE = {
  background: AA.card,
  border: `1px solid ${AA.cardBorder}`,
  color: AA.cream,
  fontSize: 12,
};

/** Interactive price chart with toggleable volume / 20-day MA / RSI(14). */
export function PriceChart({ bars }: { bars: PriceBar[] }) {
  const [showVolume, setShowVolume] = useState(true);
  const [showMa, setShowMa] = useState(true);
  const [showRsi, setShowRsi] = useState(false);

  const data = useMemo(() => {
    const closes = bars.map((b) => b.close);
    const ma20 = sma(closes, 20);
    const rsi14 = rsi(closes, 14);
    return bars.map((b, i) => ({
      date: b.date.slice(5), // MM-DD
      close: b.close,
      volume: b.volume,
      ma: ma20[i],
      rsi: rsi14[i],
    }));
  }, [bars]);

  if (bars.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-md border border-dashed border-card-border text-sm text-gold-muted">
        No price history available — check the Polygon key and tier.
      </div>
    );
  }

  const toggles: { label: string; on: boolean; set: (v: boolean) => void }[] = [
    { label: "Volume", on: showVolume, set: setShowVolume },
    { label: "MA 20", on: showMa, set: setShowMa },
    { label: "RSI 14", on: showRsi, set: setShowRsi },
  ];

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {toggles.map((t) => (
          <button
            key={t.label}
            type="button"
            onClick={() => t.set(!t.on)}
            className={cn(
              "rounded border px-2.5 py-1 text-xs transition-colors",
              t.on
                ? "border-gold bg-gold/10 text-gold"
                : "border-card-border text-gold-muted hover:text-cream",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data}>
          <CartesianGrid stroke={AA.cardBorder} strokeDasharray="3 3" />
          <XAxis dataKey="date" stroke={AA.goldMuted} fontSize={11} minTickGap={28} />
          <YAxis
            yAxisId="price"
            stroke={AA.goldMuted}
            fontSize={11}
            domain={["auto", "auto"]}
            tickFormatter={(v) => `$${v}`}
          />
          <YAxis yAxisId="vol" orientation="right" hide />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          {showVolume && (
            <Bar yAxisId="vol" dataKey="volume" fill={AA.cardBorder} barSize={3} />
          )}
          <Line
            yAxisId="price"
            type="monotone"
            dataKey="close"
            stroke={AA.gold}
            strokeWidth={2}
            dot={false}
          />
          {showMa && (
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="ma"
              stroke={AA.goldMuted}
              strokeWidth={1.5}
              strokeDasharray="4 2"
              dot={false}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>

      {showRsi && (
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={data}>
            <CartesianGrid stroke={AA.cardBorder} strokeDasharray="3 3" />
            <XAxis dataKey="date" stroke={AA.goldMuted} fontSize={11} minTickGap={28} />
            <YAxis stroke={AA.goldMuted} fontSize={11} domain={[0, 100]} ticks={[30, 50, 70]} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <ReferenceLine y={70} stroke={AA.danger} strokeDasharray="3 3" />
            <ReferenceLine y={30} stroke={AA.success} strokeDasharray="3 3" />
            <Line type="monotone" dataKey="rsi" stroke={AA.gold} strokeWidth={1.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
