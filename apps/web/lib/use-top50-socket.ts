"use client";

import { useEffect, useState } from "react";
import { apiUrl, type Top50Snapshot } from "@/lib/api";

/**
 * Live Top 50 — subscribes to the /ws/top-50 WebSocket for push updates, and
 * falls back to 15s REST polling if the socket cannot connect or drops.
 */
export function useTop50(initial: Top50Snapshot): Top50Snapshot {
  const [snapshot, setSnapshot] = useState<Top50Snapshot>(initial);

  useEffect(() => {
    let alive = true;
    let ws: WebSocket | null = null;
    let pollId: ReturnType<typeof setInterval> | null = null;
    let pingId: ReturnType<typeof setInterval> | null = null;

    const apply = (data: unknown) => {
      const s = data as Top50Snapshot;
      if (alive && s && Array.isArray(s.entries)) setSnapshot(s);
    };

    const startPolling = () => {
      if (pollId) return;
      const tick = async () => {
        try {
          const res = await fetch(apiUrl("/api/top-50"));
          if (res.ok) apply(await res.json());
        } catch {
          /* keep last good snapshot */
        }
      };
      tick();
      pollId = setInterval(tick, 15_000);
    };

    try {
      ws = new WebSocket(apiUrl("/ws/top-50").replace(/^http/, "ws"));
      ws.onmessage = (e) => {
        try {
          apply(JSON.parse(e.data));
        } catch {
          /* ignore malformed frames */
        }
      };
      ws.onopen = () => {
        pingId = setInterval(() => {
          if (ws?.readyState === WebSocket.OPEN) ws.send("ping");
        }, 30_000);
      };
      ws.onerror = () => startPolling();
      ws.onclose = () => startPolling();
    } catch {
      startPolling();
    }

    return () => {
      alive = false;
      ws?.close();
      if (pollId) clearInterval(pollId);
      if (pingId) clearInterval(pingId);
    };
  }, []);

  return snapshot;
}
