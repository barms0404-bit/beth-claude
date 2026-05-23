import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api, type HealthcareLanding } from "@/lib/api";
import {
  ClinicalCatalystTable,
  GLP1SnapshotCard,
  PDUFATable,
  PatentCliffTable,
  PipelineTable,
} from "@/components/healthcare/tables";

const EMPTY: HealthcareLanding = {
  next_catalysts: [],
  next_pdufas: [],
  latest_glp1: null,
  high_pos_pipeline: [],
  near_loe_drugs: [],
};

async function safeLoad(): Promise<HealthcareLanding> {
  try {
    return await api.healthcareLanding();
  } catch {
    return EMPTY;
  }
}

const SUB_DASHBOARDS = [
  {
    label: "Biotech",
    href: "/healthcare/biotech",
    blurb: "SMID clinical-stage — PoS, rNPV per asset, catalyst proximity.",
    owner: "Dr. Rachel Sinclair",
  },
  {
    label: "Big Pharma",
    href: "/healthcare/big-pharma",
    blurb: "Large-cap commercial pharma — GLP-1, LOE math, capital allocation.",
    owner: "Dr. Patricia Lansing",
  },
  {
    label: "Tools & Life Sciences",
    href: "/healthcare/tools",
    blurb: "Picks-and-shovels — bioprocessing, AI drug discovery, diagnostics.",
    owner: "Dr. Ian Faulkner",
  },
];

const CROSS_CUTTING = [
  { label: "GLP-1 Megacycle Tracker", href: "/healthcare/glp1" },
  { label: "AI Drug Discovery Tracker", href: "/healthcare/ai-drug-discovery" },
  { label: "Clinical Catalyst Calendar", href: "/healthcare/clinical-calendar" },
  { label: "FDA Regulatory Calendar", href: "/healthcare/fda-calendar" },
];

export default async function HealthcareLandingPage() {
  const data = await safeLoad();

  return (
    <div className="space-y-8">
      <section>
        <h1 className="font-serif text-4xl font-semibold text-gold">
          Healthcare Command Center
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-gold-muted">
          Three specialized seats — Sinclair / Lansing / Faulkner — with the cross-cutting
          GLP-1, AI drug discovery, and regulatory calendar overlays.
        </p>
      </section>

      {/* Sub-dashboard cards */}
      <section className="grid gap-4 md:grid-cols-3">
        {SUB_DASHBOARDS.map((d) => (
          <Link
            key={d.href}
            href={d.href}
            className="group rounded-lg border border-card-border bg-card/70 p-5 transition-colors hover:border-gold/60"
          >
            <div className="text-lg font-semibold text-gold group-hover:text-cream">
              {d.label}
            </div>
            <div className="mt-1 text-[10px] uppercase tracking-wider text-gold-muted">
              {d.owner}
            </div>
            <p className="mt-3 text-sm leading-relaxed text-cream">{d.blurb}</p>
          </Link>
        ))}
      </section>

      {/* Cross-cutting nav strip */}
      <section className="flex flex-wrap gap-2">
        {CROSS_CUTTING.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="rounded border border-gold/40 px-3 py-1.5 text-xs uppercase tracking-wider text-gold transition-colors hover:border-gold hover:text-cream"
          >
            {c.label}
          </Link>
        ))}
      </section>

      <GLP1SnapshotCard snap={data.latest_glp1} />

      <Card>
        <CardHeader>
          <CardTitle>Next 10 clinical catalysts</CardTitle>
        </CardHeader>
        <CardContent>
          <ClinicalCatalystTable rows={data.next_catalysts} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Next 10 PDUFAs</CardTitle>
        </CardHeader>
        <CardContent>
          <PDUFATable rows={data.next_pdufas} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>High-PoS pipeline (≥ 50%)</CardTitle>
        </CardHeader>
        <CardContent>
          <PipelineTable rows={data.high_pos_pipeline} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Patent cliff — nearest LOE</CardTitle>
        </CardHeader>
        <CardContent>
          <PatentCliffTable rows={data.near_loe_drugs} />
        </CardContent>
      </Card>
    </div>
  );
}
