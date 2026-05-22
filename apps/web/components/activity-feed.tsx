"use client";

import { motion } from "framer-motion";
import { usePolling } from "@/lib/use-polling";
import type { ActivityItem } from "@/lib/api";

const SLOT_LABEL: Record<ActivityItem["slot"], string> = {
  market_prep: "Market Prep",
  mid_day: "Mid-Day",
  market_close: "Close",
};

function timeAgo(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
}

/** Row 4 — live ticker of which specialist filed what. Polls every 30s. */
export function ActivityFeed({ initial }: { initial: ActivityItem[] }) {
  const items = usePolling<ActivityItem[]>("/api/activity", 30_000, initial);

  if (items.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-gold-muted">
        No specialist activity yet — the feed populates as reports run.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-card-border/60">
      {items.slice(0, 12).map((it, i) => (
        <motion.li
          key={`${it.agentKey}-${it.timestamp}`}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25, delay: i * 0.03 }}
          className="flex items-start gap-3 py-2.5"
        >
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
          <div className="min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="font-medium text-gold">{it.persona}</span>
              <span className="text-[0.62rem] uppercase tracking-wider text-gold-muted">
                {SLOT_LABEL[it.slot]}
              </span>
              <span className="text-[0.62rem] text-gold-muted">{timeAgo(it.timestamp)}</span>
            </div>
            <p className="truncate text-sm text-cream">{it.keyTakeaway}</p>
          </div>
        </motion.li>
      ))}
    </ul>
  );
}
