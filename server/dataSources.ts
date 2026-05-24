/**
 * Enhanced Data Sources — Multi-Provider Market Intelligence
 * Integrates: CoinGecko (free), Alpha Vantage, Unusual Whales, Perplexity, Similarweb
 * Each source enriches specialist research with additional data
 */

// ─── CoinGecko (FREE — no key needed) ───────────────────────────────────────

export async function getCryptoData(): Promise<{
  btc: { price: number; change24h: number; marketCap: number };
  eth: { price: number; change24h: number; marketCap: number };
  top10: Array<{ name: string; symbol: string; price: number; change24h: number }>;
} | null> {
  try {
    const resp = await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&sparkline=false");
    if (!resp.ok) return null;
    const data = await resp.json();
    
    const btcData = data.find((c: any) => c.id === "bitcoin");
    const ethData = data.find((c: any) => c.id === "ethereum");
    
    return {
      btc: { price: btcData?.current_price || 0, change24h: btcData?.price_change_percentage_24h || 0, marketCap: btcData?.market_cap || 0 },
      eth: { price: ethData?.current_price || 0, change24h: ethData?.price_change_percentage_24h || 0, marketCap: ethData?.market_cap || 0 },
      top10: data.map((c: any) => ({ name: c.name, symbol: c.symbol.toUpperCase(), price: c.current_price, change24h: c.price_change_percentage_24h })),
    };
  } catch (e) {
    console.warn("[CoinGecko] Failed:", e);
    return null;
  }
}

export async function getCryptoFearGreed(): Promise<{ value: number; classification: string } | null> {
  try {
    const resp = await fetch("https://api.alternative.me/fng/?limit=1");
    if (!resp.ok) return null;
    const data = await resp.json();
    return { value: parseInt(data.data[0].value), classification: data.data[0].value_classification };
  } catch {
    return null;
  }
}

// ─── Alpha Vantage (requires API key) ────────────────────────────────────────

export async function getCompanyOverview(ticker: string): Promise<any | null> {
  const key = process.env.ALPHA_VANTAGE_KEY;
  if (!key) return null;
  
  try {
    const resp = await fetch(`https://www.alphavantage.co/query?function=OVERVIEW&symbol=${ticker}&apikey=${key}`);
    if (!resp.ok) return null;
    const data = await resp.json();
    if (data.Note || data.Information) return null; // Rate limited
    return {
      pe: parseFloat(data.PERatio) || null,
      forwardPE: parseFloat(data.ForwardPE) || null,
      eps: parseFloat(data.EPS) || null,
      revenueGrowth: data.QuarterlyRevenueGrowthYOY,
      profitMargin: data.ProfitMargin,
      marketCap: data.MarketCapitalization,
      dividendYield: data.DividendYield,
      beta: parseFloat(data.Beta) || null,
      fiftyTwoWeekHigh: parseFloat(data["52WeekHigh"]) || null,
      fiftyTwoWeekLow: parseFloat(data["52WeekLow"]) || null,
      analystTarget: parseFloat(data.AnalystTargetPrice) || null,
    };
  } catch {
    return null;
  }
}

export async function getEarningsData(ticker: string): Promise<any | null> {
  const key = process.env.ALPHA_VANTAGE_KEY;
  if (!key) return null;
  
  try {
    const resp = await fetch(`https://www.alphavantage.co/query?function=EARNINGS&symbol=${ticker}&apikey=${key}`);
    if (!resp.ok) return null;
    const data = await resp.json();
    if (data.Note) return null;
    return data.quarterlyEarnings?.slice(0, 4) || null;
  } catch {
    return null;
  }
}

// ─── Unusual Whales (requires API key) ───────────────────────────────────────

export async function getOptionsFlow(ticker: string): Promise<any | null> {
  const key = process.env.UNUSUAL_WHALES_KEY;
  if (!key) return null;
  
  try {
    const resp = await fetch(`https://api.unusualwhales.com/api/stock/${ticker}/options-flow`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!resp.ok) return null;
    return await resp.json();
  } catch {
    return null;
  }
}

export async function getDarkPoolActivity(ticker: string): Promise<any | null> {
  const key = process.env.UNUSUAL_WHALES_KEY;
  if (!key) return null;
  
  try {
    const resp = await fetch(`https://api.unusualwhales.com/api/stock/${ticker}/dark-pool`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!resp.ok) return null;
    return await resp.json();
  } catch {
    return null;
  }
}

// ─── Perplexity (requires API key) ───────────────────────────────────────────

export async function searchWithPerplexity(query: string): Promise<string | null> {
  const key = process.env.PERPLEXITY_API_KEY;
  if (!key) return null;
  
  try {
    const resp = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-sonar-small-128k-online",
        messages: [{ role: "user", content: query }],
        max_tokens: 500,
      }),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    return data.choices?.[0]?.message?.content || null;
  } catch {
    return null;
  }
}

// ─── Similarweb (requires API key) ──────────────────────────────────────────

export async function getWebTraffic(domain: string): Promise<any | null> {
  const key = process.env.SIMILARWEB_KEY;
  if (!key) return null;
  
  try {
    const resp = await fetch(`https://api.similarweb.com/v1/website/${domain}/total-traffic-and-engagement/visits?api_key=${key}&start_date=2026-04&end_date=2026-05&country=us&granularity=monthly`);
    if (!resp.ok) return null;
    return await resp.json();
  } catch {
    return null;
  }
}

// ─── Aggregated enrichment for specialists ──────────────────────────────────

export async function enrichResearchContext(tickers: string[]): Promise<string> {
  const enrichments: string[] = [];

  // Always get crypto data (free)
  const crypto = await getCryptoData();
  if (crypto) {
    enrichments.push(`CRYPTO: BTC $${crypto.btc.price.toLocaleString()} (${crypto.btc.change24h > 0 ? "+" : ""}${crypto.btc.change24h.toFixed(1)}%), ETH $${crypto.eth.price.toLocaleString()} (${crypto.eth.change24h > 0 ? "+" : ""}${crypto.eth.change24h.toFixed(1)}%)`);
  }

  const fearGreed = await getCryptoFearGreed();
  if (fearGreed) {
    enrichments.push(`CRYPTO FEAR/GREED: ${fearGreed.value}/100 (${fearGreed.classification})`);
  }

  // Alpha Vantage fundamentals (if key available)
  for (const ticker of tickers.slice(0, 2)) {
    const overview = await getCompanyOverview(ticker);
    if (overview) {
      enrichments.push(`${ticker} FUNDAMENTALS: P/E ${overview.pe}, Fwd P/E ${overview.forwardPE}, EPS $${overview.eps}, Beta ${overview.beta}, 52W Range $${overview.fiftyTwoWeekLow}-$${overview.fiftyTwoWeekHigh}, Analyst Target $${overview.analystTarget}`);
    }
  }

  // Unusual Whales options flow (if key available)
  for (const ticker of tickers.slice(0, 1)) {
    const flow = await getOptionsFlow(ticker);
    if (flow && flow.data) {
      enrichments.push(`${ticker} OPTIONS FLOW: Institutional activity detected — check for unusual call/put volume`);
    }
  }

  // Perplexity real-time search (if key available)
  if (process.env.PERPLEXITY_API_KEY && tickers.length > 0) {
    const news = await searchWithPerplexity(`Latest news and analyst opinions on ${tickers[0]} stock in the last 24 hours`);
    if (news) {
      enrichments.push(`REAL-TIME NEWS (${tickers[0]}): ${news.slice(0, 300)}`);
    }
  }

  return enrichments.length > 0 ? "\n\nENRICHED DATA:\n" + enrichments.join("\n") : "";
}
