"use client";

import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";

interface Tick {
  ticker: string;
  price: number;
  ts?: number;
}

type PriceMap = Record<string, number>;

/**
 * Subscribes to /ws/prices and returns a ticker -> latest-price map.
 * Reconnects with exponential backoff (max 30s). Silent on errors —
 * if the backend or Polygon WS isn't available, the map stays empty
 * and the UI falls back to the snapshot price.
 */
export function useLivePrices(): PriceMap {
  const [prices, setPrices] = useState<PriceMap>({});

  useEffect(() => {
    let alive = true;
    let ws: WebSocket | null = null;
    let pingId: ReturnType<typeof setInterval> | null = null;
    let retryId: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;

    const url = apiUrl("/ws/prices").replace(/^http/, "ws");

    const connect = () => {
      if (!alive) return;
      ws = new WebSocket(url);

      ws.onopen = () => {
        attempt = 0;
        pingId = setInterval(() => {
          if (ws?.readyState === WebSocket.OPEN) ws.send("ping");
        }, 30_000);
      };

      ws.onmessage = (event) => {
        try {
          const tick = JSON.parse(event.data) as Tick;
          if (!tick?.ticker || typeof tick.price !== "number") return;
          setPrices((prev) =>
            prev[tick.ticker] === tick.price ? prev : { ...prev, [tick.ticker]: tick.price },
          );
        } catch {
          /* ignore malformed frames */
        }
      };

      ws.onerror = () => ws?.close();

      ws.onclose = () => {
        if (pingId) {
          clearInterval(pingId);
          pingId = null;
        }
        if (!alive) return;
        attempt += 1;
        const backoff = Math.min(1000 * 2 ** Math.min(attempt, 5), 30_000);
        retryId = setTimeout(connect, backoff);
      };
    };

    connect();

    return () => {
      alive = false;
      if (pingId) clearInterval(pingId);
      if (retryId) clearTimeout(retryId);
      ws?.close();
    };
  }, []);

  return prices;
}
