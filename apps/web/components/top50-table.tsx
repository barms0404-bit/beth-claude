"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpDown } from "lucide-react";
import { usePolling } from "@/lib/use-polling";
import type { Recommendation } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { changeTone, cn, formatPct, formatUsd } from "@/lib/utils";

type SortKey = keyof Pick<
  Recommendation,
  | "rank"
  | "symbol"
  | "name"
  | "price"
  | "dailyPct"
  | "ytdPct"
  | "conviction"
  | "leadSpecialist"
  | "lastUpdated"
>;

const COLUMNS: { key: SortKey; label: string; align?: "right" }[] = [
  { key: "rank", label: "Rank" },
  { key: "symbol", label: "Ticker" },
  { key: "name", label: "Company" },
  { key: "price", label: "Price", align: "right" },
  { key: "dailyPct", label: "Day %", align: "right" },
  { key: "ytdPct", label: "YTD %", align: "right" },
  { key: "conviction", label: "Conviction", align: "right" },
  { key: "leadSpecialist", label: "Lead Specialist" },
  { key: "lastUpdated", label: "Last Updated" },
];

function ConvictionBar({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center justify-end gap-2">
      <span className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-card-border sm:block">
        <span className="block h-full bg-gold" style={{ width: `${value * 10}%` }} />
      </span>
      <span className="tabular-nums text-cream">{value}/10</span>
    </span>
  );
}

/** Row 2 — interactive, sortable Top 50. Prices poll every 15s. */
export function Top50Table({ initial }: { initial: Recommendation[] }) {
  const rows = usePolling<Recommendation[]>("/api/recommendations/top", 15_000, initial);
  const [sortKey, setSortKey] = useState<SortKey>("rank");
  const [asc, setAsc] = useState(true);

  const sorted = useMemo(() => {
    const copy = [...rows];
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
  }, [rows, sortKey, asc]);

  const toggle = (key: SortKey) => {
    if (key === sortKey) setAsc((v) => !v);
    else {
      setSortKey(key);
      setAsc(true);
    }
  };

  if (rows.length === 0) {
    return (
      <p className="px-5 py-10 text-center text-sm text-gold-muted">
        No recommendations yet — run the agent pipeline to populate the Top 50.
      </p>
    );
  }

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
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((r) => (
          <TableRow key={r.symbol}>
            <TableCell className="text-gold-muted">{r.rank}</TableCell>
            <TableCell>
              <Link
                href={`/stock/${r.symbol}`}
                className="font-medium text-gold hover:text-gold-dark hover:underline"
              >
                {r.symbol}
              </Link>
            </TableCell>
            <TableCell className="max-w-[220px] truncate">{r.name}</TableCell>
            <TableCell className="text-right tabular-nums">{formatUsd(r.price)}</TableCell>
            <TableCell className={cn("text-right tabular-nums", changeTone(r.dailyPct))}>
              {formatPct(r.dailyPct)}
            </TableCell>
            <TableCell className={cn("text-right tabular-nums", changeTone(r.ytdPct))}>
              {formatPct(r.ytdPct)}
            </TableCell>
            <TableCell className="text-right">
              <ConvictionBar value={r.conviction} />
            </TableCell>
            <TableCell className="whitespace-nowrap text-gold-muted">
              {r.leadSpecialist}
            </TableCell>
            <TableCell className="whitespace-nowrap text-gold-muted">
              {new Date(r.lastUpdated).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
