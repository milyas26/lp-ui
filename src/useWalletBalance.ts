import { useEffect, useState } from "react";
import { api } from "./api";

const POLL_MS = 30_000;

export interface BalanceFeed {
  /** null until the first reading lands. */
  sol: number | null;
  error: string | null;
}

/** Live wallet balance: poll while the tab is visible, refresh the moment it returns. */
export function useWalletBalance(enabled: boolean): BalanceFeed {
  const [state, setState] = useState<BalanceFeed>({ sol: null, error: null });

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    let timer: ReturnType<typeof setInterval> | undefined;

    const load = async () => {
      try {
        const r = await api.wallet();
        if (alive) setState({ sol: r.sol, error: null });
      } catch (e) {
        if (alive) setState((s) => ({ ...s, error: (e as Error).message }));
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
  }, [enabled]);

  return state;
}
