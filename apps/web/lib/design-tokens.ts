/**
 * Single source of truth for the Armstrong Arikat brand palette.
 * Mirrors tailwind.config.ts — import here when a raw hex is needed
 * (e.g. Recharts/Plotly props that can't take Tailwind classes).
 */
export const AA = {
  ink: "#000000",
  gold: "#C9A961",
  goldDark: "#A88B4A",
  goldMuted: "#8A7548",
  cream: "#F5E6C8",
  card: "#0A0A0A",
  cardBorder: "#1F1A0F",
  success: "#4ADE80",
  danger: "#EF4444",
} as const;

/** Shared Recharts axis/grid styling for the dark gold theme. */
export const chartTheme = {
  grid: AA.cardBorder,
  axis: AA.goldMuted,
  line: AA.gold,
  tooltipBg: AA.card,
  tooltipBorder: AA.cardBorder,
} as const;
