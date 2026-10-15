import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError, streamUrl } from "./api";
import type { BotStatus, Cycle, Overview, Snapshot } from "./types";

export type Link = "connecting" | "live" | "reconnecting" | "unauthorized" | "unreachable";

export interface BotFeed {
  link: Link;
  data: Overview | null;
  /** Bumps whenever a cycle finishes, so dependents (journal) can refetch. */
  cycleEndedAt: number;
  retry: () => void;
  setStatus: (s: BotStatus) => void;
}

const KEEP_CYCLES = 30;
/** Backend pings every 15s; silence longer than this means the link is dead even if the socket looks open. */
const SILENCE_LIMIT_MS = 40_000;
const RETRY_MS = 5_000;

function upsertCycle(cycles: Cycle[], c: Cycle): Cycle[] {
  const i = cycles.findIndex((x) => x.n === c.n);
  const next = i >= 0 ? cycles.map((x, j) => (j === i ? c : x)) : [...cycles, c];
  return next.slice(-KEEP_CYCLES);
}

export function useBot(): BotFeed {
  const [link, setLink] = useState<Link>("connecting");
  const [data, setData] = useState<Overview | null>(null);
  const [cycleEndedAt, setCycleEndedAt] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const hasData = useRef(false);

  const retry = useCallback(() => {
    setLink(hasData.current ? "reconnecting" : "connecting");
    setAttempt((a) => a + 1);
  }, []);

  const setStatus = useCallback((status: BotStatus) => {
    setData((d) => (d ? { ...d, status } : d));
  }, []);

  useEffect(() => {
    let es: EventSource | null = null;
    let cancelled = false;
    let lastSeen = Date.now();
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const scheduleRetry = () => {
      if (cancelled) return;
      retryTimer = setTimeout(() => setAttempt((a) => a + 1), RETRY_MS);
    };

    // EventSource hides HTTP status codes, so probe once to tell a wrong token from a dead backend.
    const classify = async () => {
      try {
        await api.overview();
        return null;
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) return "unauthorized" as const;
        return "unreachable" as const;
      }
    };

    const fail = async () => {
      es?.close();
      es = null;
      const p = await classify();
      if (cancelled) return;
      if (p === "unauthorized") {
        setLink("unauthorized");
        return;
      }
      // A backend restart is routine: keep the last data on screen and keep trying.
      setLink(hasData.current ? "reconnecting" : (p ?? "unreachable"));
      scheduleRetry();
    };

    const watchdog = setInterval(() => {
      if (es && Date.now() - lastSeen > SILENCE_LIMIT_MS) void fail();
    }, 5_000);

    const seen = () => {
      lastSeen = Date.now();
    };

    (async () => {
      const problem = await classify();
      if (cancelled) return;
      if (problem) {
        setLink(problem === "unreachable" && hasData.current ? "reconnecting" : problem);
        if (problem === "unreachable") scheduleRetry();
        return;
      }
      lastSeen = Date.now();
      es = new EventSource(streamUrl());
      es.addEventListener("hello", (ev) => {
        seen();
        hasData.current = true;
        setData(JSON.parse((ev as MessageEvent).data) as Overview);
        setLink("live");
      });
      es.addEventListener("ping", seen);
      es.addEventListener("cycle", (ev) => {
        seen();
        const c = JSON.parse((ev as MessageEvent).data) as Cycle;
        setData((d) => (d ? { ...d, cycles: upsertCycle(d.cycles, c) } : d));
        if (c.status !== "running") setCycleEndedAt(Date.now());
      });
      es.addEventListener("status", (ev) => {
        seen();
        const s = JSON.parse((ev as MessageEvent).data) as BotStatus;
        setData((d) => (d ? { ...d, status: s } : d));
      });
      es.addEventListener("snapshot", (ev) => {
        seen();
        const snap = JSON.parse((ev as MessageEvent).data) as Snapshot;
        setData((d) => (d ? { ...d, snapshot: snap } : d));
      });
      es.onerror = () => void fail();
    })();

    return () => {
      cancelled = true;
      clearInterval(watchdog);
      clearTimeout(retryTimer);
      es?.close();
    };
  }, [attempt]);

  return { link, data, cycleEndedAt, retry, setStatus };
}
