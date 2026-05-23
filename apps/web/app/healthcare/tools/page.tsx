import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { PipelineTable } from "@/components/healthcare/tables";

async function safeLoad() {
  try {
    const pipeline = await api.pipeline({ specialist_owner: "healthcare_tools" });
    return { pipeline, online: true };
  } catch {
    return { pipeline: [], online: false };
  }
}

export default async function ToolsDashboardPage() {
  const { pipeline, online } = await safeLoad();

  return (
    <div className="space-y-8">
      <section>
        <div className="text-[10px] uppercase tracking-wider text-gold-muted">
          Owner — Dr. Ian Faulkner
        </div>
        <h1 className="mt-1 font-serif text-4xl font-semibold text-gold">
          Tools &amp; Life Sciences Dashboard
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-gold-muted">
          Picks-and-shovels — life science tools, CDMOs, AI drug discovery, diagnostics.
          The bridge between the AI thesis and healthcare via the GLP-1 manufacturing
          buildout and AI-DD platforms.
        </p>
        {!online && (
          <p className="mt-2 text-xs text-rose-400">Backend offline — empty state shown.</p>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <ToolsModuleCard
          label="Quality compounder tracker"
          body="TMO, DHR, A, WAT, MTD, Sartorius, BIO, BRKR, TECH, RGEN, AVTR, MRVI, RVTY, WST — sorted by recurring-revenue % and organic growth."
        />
        <ToolsModuleCard
          label="Bioprocessing cycle status"
          body="Destock vs restock state from the latest filing. Cross-checked against Cytiva (DHR) and Sartorius commentary."
        />
        <ToolsModuleCard
          label="GLP-1 manufacturing beneficiaries"
          body="WST autoinjectors · Sartorius/RGEN bioprocessing · CTLT/Lonza/Samsung Bio fill-finish · WAT/A QC release testing."
        />
        <ToolsModuleCard
          label="AI drug discovery platforms"
          body="SDGR (software ARR) · RXRX/ABCL/RLAY (hybrid platforms) · EXAI · Isomorphic via GOOGL. Skeptical lens on AI-enabled vs AI-driven."
        />
        <ToolsModuleCard
          label="Biotech funding cycle (leading indicator)"
          body="XBI / IBB performance · biotech IPO activity · venture funding levels. Tools revenue follows with a 6-12 month lag."
        />
        <ToolsModuleCard
          label="End-market mix"
          body="Per-name decomposition: pharma/biotech vs academic/govt vs industrial vs diagnostics vs clinical."
        />
        <ToolsModuleCard
          label="China tools risk"
          body="WuXi names under Section 1260H · spillover to non-China tools · repatriation beneficiaries (CRL, MEDP, ICLR, CTLT)."
        />
        <ToolsModuleCard
          label="M&A watch"
          body="DHR is the master template — serial acquisition. PE activity tracked. Active deal flow surfaced in the latest filing."
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Faulkner&apos;s tracked platforms &amp; pipeline assets</CardTitle>
        </CardHeader>
        <CardContent>
          <PipelineTable rows={pipeline} />
        </CardContent>
      </Card>
    </div>
  );
}

function ToolsModuleCard({ label, body }: { label: string; body: string }) {
  return (
    <div className="rounded-lg border border-card-border/60 bg-card/60 p-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-gold">{label}</div>
      <p className="mt-2 text-sm leading-relaxed text-cream">{body}</p>
    </div>
  );
}
