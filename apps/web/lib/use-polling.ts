"use client";

import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";

/**
 * Polls a backend path on an interval and returns the latest payload.
 * On a failed fetch the previous value is kept, so a transient backend blip
 * never blanks the dashboard. This is the stand-in for the Polygon WebSocket
 * relay until that relay is built (see docs/ROADMAP.md).
 */
export function usePolling<T>(path: string, intervalMs: number, initial: T): T {
  const [data, setData] = useState<T>(initial);

  useEffect(() => {
    let alive = true;

    const tick = async () => {
      try {
        const res = await fetch(apiUrl(path));
        if (res.ok && alive) setData((await res.json()) as T);
      } catch {
        /* keep the last good value */
      }
    };

    tick();
    const id = setInterval(tick, intervalMs);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [path, intervalMs]);

  return data;
}
