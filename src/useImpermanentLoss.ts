import { useEffect, useState } from "react";
import { api } from "./api";
import type { PositionIl } from "./types";

const POLL_MS = 30_000;

export interface IlFeed {
  /** Keyed by position pubkey. */
  byPubkey: Record<string, PositionIl>;
  at: number | null;
  error: string | null;
}

/** Live impermanent loss for the bot's open positions; poll while the tab is visible. */
export function useImpermanentLoss(refreshKey: number): IlFeed {
  const [byPubkey, setByPubkey] = useState<Record<string, PositionIl>>({});
  const [at, setAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setInterval> | undefined;

    const load = async () => {
      try {
        const r = await api.ilPositions();
        if (!alive) return;
        const map: Record<string, PositionIl> = {};
        for (const p of r.positions) map[p.positionPubkey] = p;
        setByPubkey(map);
        setAt(r.at);
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
  }, [refreshKey]);

  return { byPubkey, at, error };
}
