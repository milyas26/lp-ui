import { useEffect, useState } from "react";
import { api } from "./api";
import type { ClosedPosition } from "./types";

export interface ClosedFeed {
  /** null while the first load is in flight. */
  rows: ClosedPosition[] | null;
  error: string | null;
  reload: () => void;
}

/** Recently closed positions, refetched whenever a cycle finishes (`refreshKey`). */
export function useClosed(refreshKey: number, limit = 30): ClosedFeed {
  const [rows, setRows] = useState<ClosedPosition[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    api
      .positions(limit)
      .then((r) => {
        if (!alive) return;
        setRows(r.closed);
        setError(null);
      })
      .catch((e: Error) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [refreshKey, limit, attempt]);

  return { rows, error, reload: () => setAttempt((a) => a + 1) };
}
