import { useEffect, useState } from "react";
import { api } from "./api";
import type { OnchainPosition } from "./types";

const POLL_MS = 30_000;

export interface OnchainFeed {
  /** null while the first load is in flight. */
  rows: OnchainPosition[] | null;
  error: string | null;
  reload: () => void;
}

/** Real wallet positions, refreshed on demand and on a slow poll while the tab is visible. */
export function useOnchainPositions(refreshKey: number): OnchainFeed {
  const [rows, setRows] = useState<OnchainPosition[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setInterval> | undefined;

    const load = async () => {
      try {
        const r = await api.onchainPositions();
        if (alive) {
          setRows(r.positions);
          setError(null);
        }
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
  }, [refreshKey, attempt]);

  return { rows, error, reload: () => setAttempt((a) => a + 1) };
}
