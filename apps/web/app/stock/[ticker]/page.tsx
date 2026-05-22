import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { PriceChart } from "@/components/price-chart";
import {
  api,
  type NewsItem,
  type PriceBar,
  type TickerDetail,
} from "@/lib/api";
import { changeTone, cn, formatPct, formatUsd } from "@/lib/utils";

interface StockData {
  detail: TickerDetail | null;
  news: NewsItem[];
  history: PriceBar[];
}

async function safeLoad(symbol: string): Promise<StockData> {
  try {
    const [detail, news, history] = await Promise.all([
      api.ticker(symbol),
      api.tickerNews(symbol).catch(() => [] as NewsItem[]),
      api.tickerHistory(symbol).catch(() => [] as PriceBar[]),
    ]);
    return { detail, news, history };
  } catch {
    return { detail: null, news: [], history: [] };
  }
}

function formatBig(v: number | null): string {
  if (v == null) return "—";
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  return formatUsd(v);
}

export default async function StockPage({
  params,
}: {
  params: { ticker: string };
}) {
  const symbol = params.ticker.toUpperCase();
  const { detail, news, history } = await safeLoad(symbol);

  return (
    <div className="space-y-6">
      <Link href="/dashboard" className="text-sm text-gold-muted hover:text-gold">
        &larr; Back to dashboard
      </Link>

      {/* Hero */}
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-5xl font-semibold text-gold">{symbol}</h1>
          <p className="text-sm text-gold-muted">{detail?.name ?? "Unknown security"}</p>
        </div>
        {detail && (
          <div className="text-right">
            <div className="font-serif text-3xl text-cream">{formatUsd(detail.price)}</div>
            <div className="flex justify-end gap-4 text-sm">
              <span className={cn(changeTone(detail.dailyPct))}>
                Day {formatPct(detail.dailyPct)}
              </span>
              <span className={cn(changeTone(detail.ytdPct))}>
                YTD {formatPct(detail.ytdPct)}
              </span>
            </div>
          </div>
        )}
      </section>

      {!detail ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-gold-muted">
            No data for {symbol}. Start the FastAPI backend, or check the Polygon key.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Section 1 — company description */}
          <Card>
            <CardHeader>
              <CardTitle>Company Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-cream">{detail.description}</p>
            </CardContent>
          </Card>

          {/* Section 2 — specialist commentary */}
          <section className="space-y-4">
            <h2 className="font-serif text-2xl text-gold">Specialist Commentary</h2>
            {detail.notes.length === 0 ? (
              <p className="text-sm text-gold-muted">
                No specialist has covered this name yet.
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {detail.notes.map((n, i) => (
                  <Card key={`${n.agentKey}-${i}`}>
                    <CardHeader>
                      <CardTitle className="text-base">{n.agentName}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-relaxed text-cream">{n.commentary}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Section 3 — interactive price chart */}
          <Card>
            <CardHeader>
              <CardTitle>Price Chart</CardTitle>
              <p className="text-xs text-gold-muted">
                Daily close. Toggle volume, the 20-day moving average, and RSI(14).
              </p>
            </CardHeader>
            <CardContent>
              <PriceChart bars={history} />
            </CardContent>
          </Card>

          {/* Section 4 — news feed */}
          <Card>
            <CardHeader>
              <CardTitle>News</CardTitle>
            </CardHeader>
            <CardContent>
              {news.length === 0 ? (
                <p className="text-sm text-gold-muted">No recent news from Polygon.</p>
              ) : (
                <ul className="divide-y divide-card-border/60">
                  {news.map((item) => (
                    <li key={item.url} className="py-3">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-gold hover:text-gold-dark hover:underline"
                      >
                        {item.title}
                      </a>
                      <div className="mt-0.5 text-xs text-gold-muted">
                        {item.publisher}
                        {item.publishedAt
                          ? ` · ${new Date(item.publishedAt).toLocaleDateString()}`
                          : ""}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Section 5 — key metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Key Metrics</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <Table>
                <TableBody>
                  {[
                    ["Last Price", formatUsd(detail.price)],
                    ["Day Change", formatPct(detail.dailyPct)],
                    ["YTD Change", formatPct(detail.ytdPct)],
                    ["Market Cap", formatBig(detail.marketCap)],
                    [
                      "Employees",
                      detail.employees ? detail.employees.toLocaleString() : "—",
                    ],
                    ["Sector", detail.sector ?? "—"],
                    ["Listed", detail.listDate ?? "—"],
                  ].map(([label, value]) => (
                    <TableRow key={label}>
                      <TableCell className="text-gold-muted">{label}</TableCell>
                      <TableCell className="text-right tabular-nums">{value}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {detail.homepage && (
                <div className="px-4 pt-3">
                  <a
                    href={detail.homepage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gold hover:underline"
                  >
                    {detail.homepage}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 6 — chart specialist analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Chart Specialist Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-gold-muted">
                The Chart Specialist&apos;s plain-English read appears here when a
                covering specialist requests a chart for {symbol}. Chart requests
                are matched to tickers once the chart pipeline is wired
                (see docs/ROADMAP.md).
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
