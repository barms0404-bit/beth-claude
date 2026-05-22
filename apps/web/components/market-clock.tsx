"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// Report drop times, Arizona time (UTC-7, no DST), as minutes-from-midnight.
const REPORTS = [
  { label: "Market Prep", azMin: 7 * 60 + 30 },
  { label: "Mid-Day", azMin: 11 * 60 },
  { label: "Close", azMin: 13 * 60 + 30 },
];

interface TzParts {
  weekday: string;
  hour: number;
  minute: number;
  second: number;
}

function tzParts(d: Date, timeZone: string): TzParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "0";
  return {
    weekday: get("weekday"),
    hour: Number(get("hour")) % 24,
    minute: Number(get("minute")),
    second: Number(get("second")),
  };
}

/** NYSE regular hours: 9:30-16:00 ET, weekdays. Holidays not accounted for. */
function nyseOpen(d: Date): boolean {
  const { weekday, hour, minute } = tzParts(d, "America/New_York");
  const isWeekday = !["Sat", "Sun"].includes(weekday);
  const mins = hour * 60 + minute;
  return isWeekday && mins >= 570 && mins < 960;
}

function nextReport(d: Date): { label: string; secs: number } {
  const az = tzParts(d, "America/Phoenix");
  const nowSec = az.hour * 3600 + az.minute * 60 + az.second;
  for (const r of REPORTS) {
    if (r.azMin * 60 > nowSec) return { label: r.label, secs: r.azMin * 60 - nowSec };
  }
  const first = REPORTS[0];
  return { label: first.label, secs: 86400 - nowSec + first.azMin * 60 };
}

function fmtCountdown(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return [h, m, sec].map((n) => String(n).padStart(2, "0")).join(":");
}

export function MarketClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Render a placeholder until mounted — server/client time differs.
  if (!now) return <div className="h-9 w-44" aria-hidden />;

  const open = nyseOpen(now);
  const az = tzParts(now, "America/Phoenix");
  const hour12 = az.hour % 12 || 12;
  const azTime =
    `${hour12}:${String(az.minute).padStart(2, "0")}:` +
    `${String(az.second).padStart(2, "0")} ${az.hour < 12 ? "AM" : "PM"}`;
  const next = nextReport(now);

  return (
    <div className="flex items-center gap-4 text-xs">
      <span className="flex items-center gap-1.5">
        <span className={cn("h-2 w-2 rounded-full", open ? "bg-success" : "bg-danger")} />
        <span className="text-gold-muted">NYSE {open ? "Open" : "Closed"}</span>
      </span>
      <span className="hidden tabular-nums text-cream sm:inline">{azTime} AZ</span>
      <span className="hidden text-gold-muted md:inline">
        {next.label} in{" "}
        <span className="tabular-nums text-gold">{fmtCountdown(next.secs)}</span>
      </span>
    </div>
  );
}
