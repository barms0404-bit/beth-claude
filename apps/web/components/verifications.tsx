import { CheckCircle2, AlertTriangle, HelpCircle, XOctagon, MinusCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  ClaimVerification,
  OverallVerification,
  RecommendationVerification,
  VerificationStatus,
} from "@/lib/api";
import { cn } from "@/lib/utils";

const STATUS_META: Record<
  VerificationStatus,
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  verified: { label: "Verified", icon: CheckCircle2, className: "text-success" },
  discrepancy: { label: "Discrepancy", icon: XOctagon, className: "text-danger" },
  unverified: { label: "Unverified", icon: HelpCircle, className: "text-gold-muted" },
  source_unavailable: {
    label: "Source Unavailable",
    icon: MinusCircle,
    className: "text-gold-muted",
  },
  skipped: { label: "Skipped", icon: MinusCircle, className: "text-gold-muted" },
};

const OVERALL_META: Record<
  OverallVerification,
  { label: string; className: string }
> = {
  verified: { label: "VERIFIED", className: "border-success text-success" },
  caveat_required: {
    label: "[UNVERIFIED] CAVEAT REQUIRED",
    className: "border-danger text-danger",
  },
  skipped: {
    label: "PSV SKIPPED",
    className: "border-card-border text-gold-muted",
  },
};

const CLAIM_TYPE_LABEL: Record<string, string> = {
  earnings: "Earnings",
  guidance: "Guidance",
  analyst_rating: "Analyst Rating",
  patent: "Patent",
  regulatory: "Regulatory",
  ma: "M&A",
  insider: "Insider",
  institutional: "13F",
  industry: "Industry",
  other: "Other",
};

function ClaimRow({ c }: { c: ClaimVerification }) {
  const meta = STATUS_META[c.status];
  const Icon = meta.icon;
  return (
    <li className="border-t border-card-border/60 py-3">
      <div className="flex items-start gap-3">
        <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", meta.className)} />
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className={cn("text-xs font-semibold uppercase tracking-wider", meta.className)}>
              {meta.label}
            </span>
            <span className="text-[0.65rem] uppercase tracking-wider text-gold-muted">
              {CLAIM_TYPE_LABEL[c.claim_type] ?? c.claim_type}
            </span>
          </div>
          <p className="text-sm text-cream">{c.claim_text}</p>
          {c.exact_quote && (
            <blockquote className="border-l-2 border-gold/60 pl-3 text-xs italic text-cream">
              &ldquo;{c.exact_quote}&rdquo;
            </blockquote>
          )}
          {c.discrepancies_found && (
            <p className="text-xs text-danger">
              <span className="font-semibold uppercase tracking-wider">Discrepancy:</span>{" "}
              {c.discrepancies_found}
            </p>
          )}
          {c.notes && <p className="text-xs text-gold-muted">{c.notes}</p>}
          {c.primary_source_url && (
            <a
              href={c.primary_source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-xs text-gold hover:text-gold-dark hover:underline"
            >
              Primary source &rarr;
            </a>
          )}
        </div>
      </div>
    </li>
  );
}

export function Verifications({ items }: { items: RecommendationVerification[] }) {
  if (items.length === 0) {
    return (
      <p className="py-4 text-sm text-gold-muted">
        No PSV records for this ticker. The verifier only runs on recommendations with
        conviction &ge; 8/10.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((v, i) => {
        const meta = OVERALL_META[v.overall];
        return (
          <Card key={`${v.agent_key}-${v.verified_at}-${i}`}>
            <CardHeader>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <CardTitle className="text-base">
                  {v.persona} · conviction {v.conviction_1_10}/10
                </CardTitle>
                <span
                  className={cn(
                    "rounded border px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wider",
                    meta.className,
                  )}
                >
                  {meta.label}
                </span>
              </div>
              <p className="text-sm text-cream">{v.thesis}</p>
            </CardHeader>
            <CardContent>
              {v.claims.length === 0 ? (
                <p className="text-xs text-gold-muted">
                  No verifiable factual claims extracted from the thesis — caveat applied.
                </p>
              ) : (
                <ul>
                  {v.claims.map((c, j) => (
                    <ClaimRow key={`${j}-${c.claim_text.slice(0, 24)}`} c={c} />
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
