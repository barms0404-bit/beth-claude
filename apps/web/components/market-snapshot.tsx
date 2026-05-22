"use client";

import { motion } from "framer-motion";
import { usePolling } from "@/lib/use-polling";
import type { IndexQuote } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { changeTone, cn, formatPct } from "@/lib/utils";

function formatLevel(v: number | null): string {
  if (v == null || Number.isNaN(v)) return "—";
  return v.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

/** Row 1 — 8 live market-snapshot tiles, polled every 15s. */
export function MarketSnapshot({ initial }: { initial: IndexQuote[] }) {
  const quotes = usePolling<IndexQuote[]>("/api/market/snapshot", 15_000, initial);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
      {quotes.map((q, i) => (
        <motion.div
          key={q.symbol}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.04 }}
        >
          <Card className="p-3 transition-shadow hover:shadow-[0_0_18px_-4px_rgba(201,169,97,0.35)]">
            <div className="truncate text-[0.62rem] uppercase tracking-wider text-gold-muted">
              {q.label}
            </div>
            <div className="font-serif text-base font-medium text-gold">{q.symbol}</div>
            <div className="tabular-nums text-sm text-cream">{formatLevel(q.price)}</div>
            <div className={cn("text-xs tabular-nums", changeTone(q.changePct))}>
              {formatPct(q.changePct)}
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
