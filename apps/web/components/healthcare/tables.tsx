import type {
  ClinicalCatalyst,
  GLP1Snapshot,
  PDUFAEntry,
  PatentCliffEntry,
  PipelineAsset,
} from "@/lib/api";

// ---- Formatting helpers --------------------------------------------------
function fmtDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso.slice(0, 10);
  }
}

function fmtPct(v?: number | null, digits = 0): string {
  if (v === null || v === undefined) return "—";
  // probability fields come in as 0..1; revenue %s come in already scaled.
  return `${(v * 100).toFixed(digits)}%`;
}

function fmtSignedPct(v?: number | null): string {
  if (v === null || v === undefined) return "—";
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(1)}%`;
}

function fmtCurrency(v?: number | null): string {
  if (v === null || v === undefined) return "—";
  if (Math.abs(v) >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (Math.abs(v) >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
  if (Math.abs(v) >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

function asymBadge(tone?: string | null) {
  if (!tone) return null;
  const cls =
    tone === "favorable"
      ? "bg-emerald-900/40 text-emerald-300 border-emerald-700/40"
      : tone === "unfavorable"
        ? "bg-rose-900/40 text-rose-300 border-rose-700/40"
        : "bg-card-border/60 text-gold-muted border-gold/30";
  return (
    <span
      className={`inline-block rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wider ${cls}`}
    >
      {tone}
    </span>
  );
}

// ---- Empty-state -------------------------------------------------------
function EmptyRow({ cols, label }: { cols: number; label: string }) {
  return (
    <tr>
      <td
        colSpan={cols}
        className="px-3 py-8 text-center text-sm italic text-gold-muted"
      >
        {label}
      </td>
    </tr>
  );
}

// =========================================================================
// Clinical Catalyst table
// =========================================================================
export function ClinicalCatalystTable({ rows }: { rows: ClinicalCatalyst[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-card-border/60 bg-card/60">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-card-border/60 bg-ink/60 text-left text-[11px] uppercase tracking-wider text-gold-muted">
            <th className="px-3 py-2">Date</th>
            <th className="px-3 py-2">Ticker</th>
            <th className="px-3 py-2">Drug</th>
            <th className="px-3 py-2">Indication</th>
            <th className="px-3 py-2">Type</th>
            <th className="px-3 py-2 text-right">PoS</th>
            <th className="px-3 py-2 text-right">Exp. Move</th>
            <th className="px-3 py-2">Asym.</th>
            <th className="px-3 py-2">Our view</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-card-border/40 text-cream">
          {rows.length === 0 ? (
            <EmptyRow cols={9} label="No upcoming catalysts on file." />
          ) : (
            rows.map((r) => (
              <tr key={r.id ?? `${r.ticker}-${r.drug_name}-${r.catalyst_date}`}>
                <td className="px-3 py-2 font-mono text-xs">{fmtDate(r.catalyst_date)}</td>
                <td className="px-3 py-2 font-semibold text-gold">{r.ticker}</td>
                <td className="px-3 py-2">{r.drug_name}</td>
                <td className="px-3 py-2 text-xs text-gold-muted">{r.indication ?? "—"}</td>
                <td className="px-3 py-2 text-xs uppercase tracking-wide">
                  {r.catalyst_type.replace(/_/g, " ")}
                </td>
                <td className="px-3 py-2 text-right font-mono text-xs">
                  {fmtPct(r.probability_of_success)}
                </td>
                <td className="px-3 py-2 text-right font-mono text-xs">
                  {fmtSignedPct(r.expected_stock_move_pct)}
                </td>
                <td className="px-3 py-2">{asymBadge(r.asymmetry_score)}</td>
                <td className="max-w-[20rem] px-3 py-2 text-xs text-gold-muted">
                  {r.our_view ?? "—"}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// =========================================================================
// PDUFA table
// =========================================================================
export function PDUFATable({ rows }: { rows: PDUFAEntry[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-card-border/60 bg-card/60">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-card-border/60 bg-ink/60 text-left text-[11px] uppercase tracking-wider text-gold-muted">
            <th className="px-3 py-2">PDUFA</th>
            <th className="px-3 py-2">Ticker</th>
            <th className="px-3 py-2">Drug</th>
            <th className="px-3 py-2">Indication</th>
            <th className="px-3 py-2">Review</th>
            <th className="px-3 py-2">AdComm</th>
            <th className="px-3 py-2 text-right">Approval P</th>
            <th className="px-3 py-2 text-right">Peak sales</th>
            <th className="px-3 py-2">Our view</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-card-border/40 text-cream">
          {rows.length === 0 ? (
            <EmptyRow cols={9} label="No upcoming PDUFA dates on file." />
          ) : (
            rows.map((r) => (
              <tr key={r.id ?? `${r.ticker}-${r.drug_name}-${r.pdufa_date}`}>
                <td className="px-3 py-2 font-mono text-xs">{fmtDate(r.pdufa_date)}</td>
                <td className="px-3 py-2 font-semibold text-gold">{r.ticker}</td>
                <td className="px-3 py-2">{r.drug_name}</td>
                <td className="px-3 py-2 text-xs text-gold-muted">{r.indication ?? "—"}</td>
                <td className="px-3 py-2 text-xs uppercase tracking-wide">
                  {r.review_type ?? "—"}
                </td>
                <td className="px-3 py-2 text-xs">
                  {r.advisory_committee_meeting ? fmtDate(r.adcomm_date) || "scheduled" : "—"}
                </td>
                <td className="px-3 py-2 text-right font-mono text-xs">
                  {fmtPct(r.approval_probability)}
                </td>
                <td className="px-3 py-2 text-right font-mono text-xs">
                  {fmtCurrency(r.commercial_potential_peak_sales_estimate)}
                </td>
                <td className="max-w-[20rem] px-3 py-2 text-xs text-gold-muted">
                  {r.our_view ?? "—"}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// =========================================================================
// Pipeline assets table
// =========================================================================
export function PipelineTable({ rows }: { rows: PipelineAsset[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-card-border/60 bg-card/60">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-card-border/60 bg-ink/60 text-left text-[11px] uppercase tracking-wider text-gold-muted">
            <th className="px-3 py-2">Ticker</th>
            <th className="px-3 py-2">Asset</th>
            <th className="px-3 py-2">Mechanism</th>
            <th className="px-3 py-2">Indication</th>
            <th className="px-3 py-2">Phase</th>
            <th className="px-3 py-2 text-right">PoS</th>
            <th className="px-3 py-2 text-right">Peak $</th>
            <th className="px-3 py-2 text-right">rNPV</th>
            <th className="px-3 py-2">Next catalyst</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-card-border/40 text-cream">
          {rows.length === 0 ? (
            <EmptyRow cols={9} label="No pipeline assets on file." />
          ) : (
            rows.map((r) => (
              <tr key={r.id ?? `${r.ticker}-${r.asset_name}`}>
                <td className="px-3 py-2 font-semibold text-gold">{r.ticker}</td>
                <td className="px-3 py-2">{r.asset_name}</td>
                <td className="px-3 py-2 text-xs text-gold-muted">{r.mechanism ?? "—"}</td>
                <td className="px-3 py-2 text-xs text-gold-muted">{r.indication ?? "—"}</td>
                <td className="px-3 py-2 text-xs uppercase tracking-wide">
                  {r.current_phase.replace(/_/g, " ")}
                </td>
                <td className="px-3 py-2 text-right font-mono text-xs">
                  {fmtPct(r.probability_of_success)}
                </td>
                <td className="px-3 py-2 text-right font-mono text-xs">
                  {fmtCurrency(r.peak_sales_estimate)}
                </td>
                <td className="px-3 py-2 text-right font-mono text-xs">
                  {fmtCurrency(r.rnpv_estimate)}
                </td>
                <td className="px-3 py-2 text-xs">
                  {r.next_catalyst ?? "—"}
                  {r.next_catalyst_date && (
                    <span className="ml-1 text-gold-muted">({fmtDate(r.next_catalyst_date)})</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// =========================================================================
// Patent cliff table
// =========================================================================
export function PatentCliffTable({ rows }: { rows: PatentCliffEntry[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-card-border/60 bg-card/60">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-card-border/60 bg-ink/60 text-left text-[11px] uppercase tracking-wider text-gold-muted">
            <th className="px-3 py-2">Ticker</th>
            <th className="px-3 py-2">Drug</th>
            <th className="px-3 py-2 text-right">Current rev.</th>
            <th className="px-3 py-2">LOE date</th>
            <th className="px-3 py-2">Erosion</th>
            <th className="px-3 py-2 text-right">Yr1</th>
            <th className="px-3 py-2 text-right">Yr2</th>
            <th className="px-3 py-2 text-right">Yr3</th>
            <th className="px-3 py-2">Mitigation</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-card-border/40 text-cream">
          {rows.length === 0 ? (
            <EmptyRow cols={9} label="No LOE entries on file." />
          ) : (
            rows.map((r) => (
              <tr key={r.id ?? `${r.ticker}-${r.drug_name}`}>
                <td className="px-3 py-2 font-semibold text-gold">{r.ticker}</td>
                <td className="px-3 py-2">{r.drug_name}</td>
                <td className="px-3 py-2 text-right font-mono text-xs">
                  {fmtCurrency(r.current_annual_revenue)}
                </td>
                <td className="px-3 py-2 font-mono text-xs">{fmtDate(r.estimated_loe_date)}</td>
                <td className="px-3 py-2 text-xs">{r.biosimilar_or_generic ?? "—"}</td>
                <td className="px-3 py-2 text-right font-mono text-xs">
                  {fmtCurrency(r.modeled_revenue_year_1)}
                </td>
                <td className="px-3 py-2 text-right font-mono text-xs">
                  {fmtCurrency(r.modeled_revenue_year_2)}
                </td>
                <td className="px-3 py-2 text-right font-mono text-xs">
                  {fmtCurrency(r.modeled_revenue_year_3)}
                </td>
                <td className="max-w-[18rem] px-3 py-2 text-xs text-gold-muted">
                  {r.mitigation_strategy ?? "—"}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// =========================================================================
// GLP-1 snapshot card
// =========================================================================
export function GLP1SnapshotCard({ snap }: { snap: GLP1Snapshot | null }) {
  if (!snap) {
    return (
      <div className="rounded-lg border border-card-border/60 bg-card/60 p-6 text-sm italic text-gold-muted">
        No GLP-1 snapshot on file. Faulkner / Lansing will populate on the next megacycle drop.
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-card-border/60 bg-card/60 p-6">
      <div className="mb-4 flex items-baseline justify-between">
        <div className="text-xs uppercase tracking-wider text-gold-muted">
          GLP-1 megacycle snapshot
        </div>
        <div className="font-mono text-xs text-gold">{fmtDate(snap.snapshot_date)}</div>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
        <Stat label="LLY rev QoQ" value={fmtSignedPct(snap.lly_revenue_qoq)} />
        <Stat label="NVO rev QoQ" value={fmtSignedPct(snap.nvo_revenue_qoq)} />
        <Stat label="LLY share" value={fmtPct(snap.lly_market_share, 1)} />
        <Stat label="NVO share" value={fmtPct(snap.nvo_market_share, 1)} />
        <Stat
          label="US scripts/wk"
          value={snap.weekly_prescriptions_us?.toLocaleString() ?? "—"}
        />
        <Stat label="New starts/wk" value={snap.weekly_new_starts?.toLocaleString() ?? "—"} />
        <Stat label="Coverage" value={fmtPct(snap.insurance_coverage_pct, 0)} />
        <Stat
          label="Capacity"
          value={
            snap.manufacturing_capacity_estimate
              ? snap.manufacturing_capacity_estimate.slice(0, 24)
              : "—"
          }
        />
      </div>
      {snap.pricing_trend_commentary && (
        <Section title="Pricing trend">{snap.pricing_trend_commentary}</Section>
      )}
      {snap.competitive_pipeline_updates && (
        <Section title="Competitive pipeline">{snap.competitive_pipeline_updates}</Section>
      )}
      {snap.cross_sector_impact_observations && (
        <Section title="Cross-sector impact">{snap.cross_sector_impact_observations}</Section>
      )}
      {snap.recent_indication_expansions && snap.recent_indication_expansions.length > 0 && (
        <Section title="Recent indication expansions">
          <ul className="list-disc pl-5">
            {snap.recent_indication_expansions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-gold-muted">{label}</div>
      <div className="mt-1 font-mono text-base text-cream">{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 border-t border-card-border/40 pt-3">
      <div className="text-[10px] uppercase tracking-wider text-gold-muted">{title}</div>
      <div className="mt-1 text-sm leading-relaxed text-cream">{children}</div>
    </div>
  );
}
