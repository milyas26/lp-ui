import { useEffect, useState } from "react";
import { api } from "./api";
import type { PositionChart } from "./types";

const POLL_MS = 60_000;

export interface ChartFeed {
  chart: PositionChart | null;
  loading: boolean;
  error: string | null;
}

/** Price-vs-bin history and IL simulation for one open position; polls while visible. */
export function usePositionChart(pubkey: string | null): ChartFeed {
  const [chart, setChart] = useState<PositionChart | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pubkey) {
      setChart(null);
      setError(null);
      return;
    }
    setChart(null);
    setError(null);
    let alive = true;
    let timer: ReturnType<typeof setInterval> | undefined;

    const load = async () => {
      try {
        const r = await api.positionChart(pubkey);
        if (!alive) return;
        setChart(r);
        setError(null);
      } catch (e) {
        if (alive) setError((e as Error).message);
      }
    };
    const start = () => {
      if (!timer) timer = setInterval(load, POLL_MS);
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = undefined;
    };
    const onVisibility = () => {
      if (document.hidden) stop();
      else {
        void load();
        start();
      }
    };

    void load();
    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      alive = false;
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [pubkey]);

  return { chart, loading: chart === null && error === null, error };
}
