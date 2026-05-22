"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useTop50 } from "@/lib/use-top50-socket";
import { useLivePrices } from "@/lib/use-live-prices";
import type { Top50Entry, Top50Snapshot } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { changeTone, cn, formatPct, formatUsd } from "@/lib/utils";

type SortKey =
  | "rank"
  | "ticker"
  | "company_name"
  | "price"
  | "day_change_pct"
  | "ytd_change_pct"
  | "conviction_avg"
  | "lead_specialist";

const COLUMNS: { key: SortKey; label: string; align?: "right" }[] = [
  { key: "rank", label: "Rank" },
  { key: "ticker", label: "Ticker" },
  { key: "company_name", label: "Company" },
  { key: "price", label: "Price", align: "right" },
  { key: "day_change_pct", label: "Day %", align: "right" },
  { key: "ytd_change_pct", label: "YTD %", align: "right" },
  { key: "conviction_avg", label: "Conviction", align: "right" },
  { key: "lead_specialist", label: "Lead Specialist" },
];

/** Up arrow (gold) / down arrow (muted) / NEW badge based on previous_rank. */
function RankDelta({ entry }: { entry: Top50Entry }) {
  if (entry.previous_rank == null) {
    return (
      <span className="rounded bg-gold/15 px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider text-gold">
        New
      </span>
    );
  }
  const delta = entry.previous_rank - entry.rank;
  if (delta === 0) return <span className="text-gold-muted">·</span>;
  return delta > 0 ? (
    <span className="inline-flex items-center text-gold">
      <ArrowUp className="h-3 w-3" />
      {delta}
    </span>
  ) : (
    <span className="inline-flex items-center text-gold-muted">
      <ArrowDown className="h-3 w-3" />
      {Math.abs(delta)}
    </span>
  );
}

/** Row 2 — live, sortable Top 50 from the recommendation engine. */
export function Top50Table({ initial }: { initial: Top50Snapshot }) {
  const snapshot = useTop50(initial);
  const livePrices = useLivePrices();
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [asc, setAsc] = useState(true);

  const sorted = useMemo(() => {
    const copy = [...snapshot.entries];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") return asc ? av - bv : bv - av;
      return asc
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
    return copy;
  }, [snapshot, sortKey, asc]);

  const toggle = (key: SortKey) => {
    if (key === sortKey) setAsc((v) => !v);
    else {
      setSortKey(key);
      setAsc(true);
    }
  };

  if (snapshot.entries.length === 0) {
    return (
      <p className="px-5 py-10 text-center text-sm text-gold-muted">
        Top 50 is empty — trigger a refresh (POST /api/top-50/refresh) or wait for
        the 15-minute engine poll.
      </p>
    );
  }

  const updated = new Date(snapshot.snapshot_time).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          {COLUMNS.map((col) => (
            <TableHead
              key={col.key}
              onClick={() => toggle(col.key)}
              className={cn(
                "cursor-pointer select-none whitespace-nowrap hover:text-gold",
                col.align === "right" && "text-right",
              )}
            >
              <span
                className={cn(
                  "inline-flex items-center gap-1",
                  col.align === "right" && "flex-row-reverse",
                )}
              >
                {col.label}
                <ArrowUpDown
                  className={cn("h-3 w-3", sortKey === col.key ? "text-gold" : "opacity-30")}
                />
              </span>
            </TableHead>
          ))}
          <TableHead className="whitespace-nowrap">Last Updated</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((e) => (
          <TableRow
            key={e.ticker}
            className={cn(e.previous_rank == null && "animate-flash-gold")}
          >
            <TableCell>
              <span className="flex items-center gap-2 tabular-nums">
                <span className="text-gold-muted">{e.rank}</span>
                <RankDelta entry={e} />
              </span>
            </TableCell>
            <TableCell>
              <Link
                href={`/stock/${e.ticker}`}
                className="font-medium text-gold hover:text-gold-dark hover:underline"
              >
                {e.ticker}
              </Link>
            </TableCell>
            <TableCell className="max-w-[200px] truncate">{e.company_name}</TableCell>
            <TableCell className="text-right tabular-nums">
              {livePrices[e.ticker] !== undefined && (
                <span
                  className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-success align-middle"
                  title="Live tick"
                />
              )}
              {formatUsd(livePrices[e.ticker] ?? e.price)}
            </TableCell>
            <TableCell className={cn("text-right tabular-nums", changeTone(e.day_change_pct))}>
              {formatPct(e.day_change_pct)}
            </TableCell>
            <TableCell className={cn("text-right tabular-nums", changeTone(e.ytd_change_pct))}>
              {formatPct(e.ytd_change_pct)}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {e.conviction_avg.toFixed(1)}/10
            </TableCell>
            <TableCell
              className="whitespace-nowrap text-gold-muted"
              title={`Contributing: ${e.contributing_specialists.join(", ")}`}
            >
              {e.lead_specialist}
            </TableCell>
            <TableCell className="whitespace-nowrap text-gold-muted">{updated}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
