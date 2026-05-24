/**
 * Market Data Service — Polygon.io + FRED Integration
 * Fetches live stock quotes, index data, and economic indicators
 */

const POLYGON_BASE = "https://api.polygon.io";
const FRED_BASE = "https://api.stlouisfed.org/fred";

// Cache to avoid hitting rate limits
let cache: { data: any; timestamp: number } | null = null;
const CACHE_TTL = 60_000; // 60 seconds during market hours

export interface MarketQuote {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  up: boolean;
}

export interface EconomicData {
  series: string;
  value: string;
  date: string;
}

export async function getMarketSnapshot(): Promise<{
  quotes: MarketQuote[];
  economic: EconomicData[];
  timestamp: string;
  source: string;
}> {
  // Return cache if fresh
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return cache.data;
  }

  const polygonKey = process.env.POLYGON_API_KEY;
  const fredKey = process.env.FRED_API_KEY;

  if (!polygonKey) {
    throw new Error("POLYGON_API_KEY not configured");
  }

  // Fetch stock snapshots from Polygon
  const tickers = ["SPY", "QQQ", "DIA", "IWM", "AAPL", "MSFT", "NVDA", "AVGO", "AMD", "LLY", "META", "GOOGL", "AMZN", "TSLA", "ARM", "DELL", "PANW", "COST", "V", "JPM"];
  
  const quotes: MarketQuote[] = [];
  
  try {
    // Use snapshot endpoint for all tickers at once
    const snapshotUrl = `${POLYGON_BASE}/v2/snapshot/locale/us/markets/stocks/tickers?apiKey=${polygonKey}`;
    const snapshotResp = await fetch(snapshotUrl);
    
    if (snapshotResp.ok) {
      const snapshotData = await snapshotResp.json();
      if (snapshotData.tickers) {
        for (const snap of snapshotData.tickers) {
          if (tickers.includes(snap.ticker)) {
            const prevClose = snap.prevDay?.c || 0;
            const currentPrice = snap.day?.c || snap.prevDay?.c || 0;
            const change = currentPrice - prevClose;
            const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;
            
            quotes.push({
              ticker: snap.ticker,
              name: snap.ticker,
              price: currentPrice,
              change: Math.round(change * 100) / 100,
              changePercent: Math.round(changePercent * 100) / 100,
              up: change >= 0,
            });
          }
        }
      }
    } else {
      // Fallback: fetch individual previous close data
      for (const ticker of tickers.slice(0, 10)) {
        try {
          const url = `${POLYGON_BASE}/v2/aggs/ticker/${ticker}/prev?apiKey=${polygonKey}`;
          const resp = await fetch(url);
          if (resp.ok) {
            const data = await resp.json();
            if (data.results && data.results.length > 0) {
              const bar = data.results[0];
              const change = bar.c - bar.o;
              const changePercent = (change / bar.o) * 100;
              quotes.push({
                ticker,
                name: ticker,
                price: bar.c,
                change: Math.round(change * 100) / 100,
                changePercent: Math.round(changePercent * 100) / 100,
                up: change >= 0,
              });
            }
          }
        } catch (e) {
          console.warn(`Failed to fetch ${ticker}:`, e);
        }
      }
    }
  } catch (e) {
    console.error("Polygon snapshot failed:", e);
  }

  // Fetch economic data from FRED
  const economic: EconomicData[] = [];
  
  if (fredKey) {
    const fredSeries = ["DGS10", "DGS2", "DGS30", "T10Y2Y"];
    
    for (const series of fredSeries) {
      try {
        const url = `${FRED_BASE}/series/observations?series_id=${series}&api_key=${fredKey}&file_type=json&limit=1&sort_order=desc`;
        const resp = await fetch(url);
        if (resp.ok) {
          const data = await resp.json();
          if (data.observations && data.observations.length > 0) {
            const obs = data.observations[0];
            economic.push({
              series,
              value: obs.value,
              date: obs.date,
            });
          }
        }
      } catch (e) {
        console.warn(`Failed to fetch FRED ${series}:`, e);
      }
    }
  }

  const result = {
    quotes,
    economic,
    timestamp: new Date().toISOString(),
    source: quotes.length > 0 ? "polygon.io" : "unavailable",
  };

  // Cache the result
  cache = { data: result, timestamp: Date.now() };

  return result;
}

export async function getStockQuote(ticker: string): Promise<MarketQuote | null> {
  const polygonKey = process.env.POLYGON_API_KEY;
  if (!polygonKey) return null;

  try {
    const url = `${POLYGON_BASE}/v2/aggs/ticker/${ticker}/prev?apiKey=${polygonKey}`;
    const resp = await fetch(url);
    if (resp.ok) {
      const data = await resp.json();
      if (data.results && data.results.length > 0) {
        const bar = data.results[0];
        const change = bar.c - bar.o;
        const changePercent = (change / bar.o) * 100;
        return {
          ticker,
          name: ticker,
          price: bar.c,
          change: Math.round(change * 100) / 100,
          changePercent: Math.round(changePercent * 100) / 100,
          up: change >= 0,
        };
      }
    }
  } catch (e) {
    console.warn(`Failed to fetch quote for ${ticker}:`, e);
  }
  return null;
}
