import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Terminal change coloring per Brian's spec: gold for positive moves,
 * muted red for negative, muted gold for flat/unknown.
 */
export function changeTone(value: number | null | undefined): string {
  if (value == null || value === 0 || Number.isNaN(value)) return "text-gold-muted";
  return value > 0 ? "text-gold" : "text-danger";
}

export function formatPct(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function formatUsd(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}
