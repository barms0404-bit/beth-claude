import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api, type TickerDetail } from "@/lib/api";
import { cn, formatPct, formatUsd, pctColor } from "@/lib/utils";

async function safeLoad(symbol: string): Promise<TickerDetail | null> {
  try {
    return await api.ticker(symbol);
  } catch {
    return null;
  }
}

export default async function TickerPage({
  params,
}: {
  params: { symbol: string };
}) {
  const symbol = params.symbol.toUpperCase();
  const detail = await safeLoad(symbol);

  return (
    <div className="space-y-6">
      <Link href="/" className="text-sm text-gold-muted hover:text-gold">
        &larr; Back to dashboard
      </Link>

      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl font-semibold text-gold">{symbol}</h1>
          <p className="text-sm text-gold-muted">{detail?.name ?? "Unknown security"}</p>
        </div>
        {detail && (
          <div className="text-right">
            <div className="font-serif text-3xl text-cream">{formatUsd(detail.price)}</div>
            <div className="flex gap-4 text-sm">
              <span className={cn(pctColor(detail.dailyPct ?? 0))}>
                Day {formatPct(detail.dailyPct)}
              </span>
              <span className={cn(pctColor(detail.ytdPct ?? 0))}>
                YTD {formatPct(detail.ytdPct)}
              </span>
            </div>
          </div>
        )}
      </section>

      {!detail ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-gold-muted">
            No data for {symbol}. Start the FastAPI backend or run the agent pipeline.
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Company Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-cream">{detail.description}</p>
            </CardContent>
          </Card>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl text-gold">Specialist Commentary</h2>
            {detail.notes.length === 0 ? (
              <p className="text-sm text-gold-muted">No specialist has covered this name yet.</p>
            ) : (
              detail.notes.map((n) => (
                <Card key={n.agentKey}>
                  <CardHeader>
                    <CardTitle className="text-base">{n.agentName}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-cream">{n.commentary}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </section>
        </>
      )}
    </div>
  );
}
