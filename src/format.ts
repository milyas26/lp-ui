import { useEffect, useState } from "react";

export const sol = (x: number, digits = 3) => `${x.toFixed(digits)} SOL`;

/** Sign follows the rounded value, so -0.00001 shows as "0.00", not "-0.00". */
export function signed(x: number, digits = 3, unit = " SOL"): string {
  const shown = Math.abs(x).toFixed(digits);
  const zero = Number(shown) === 0;
  return `${zero ? "" : x > 0 ? "+" : "-"}${shown}${unit}`;
}

export const pct = (x: number, digits = 1) => signed(x, digits, "%");

export function tone(x: number | undefined, digits = 4): "up" | "down" | "flat" {
  if (x === undefined || Number(Math.abs(x).toFixed(digits)) === 0) return "flat";
  return x > 0 ? "up" : "down";
}

/** `coarse` drops seconds past the first minute, for values refreshed slowly. */
export function duration(ms: number, coarse = false): string {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return coarse ? "kurang dari 1 mnt" : `${s} dtk`;
  const m = Math.floor(s / 60);
  if (m < 60) return coarse ? `${m} mnt` : `${m} mnt ${s % 60} dtk`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h} jam ${m % 60} mnt`;
  return `${Math.floor(h / 24)} hari ${h % 24} jam`;
}

export function clock(ts: number | string): string {
  return new Date(ts).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function dateTime(ts: number | string): string {
  return new Date(ts).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function greeting(d = new Date()): string {
  const h = d.getHours();
  if (h >= 4 && h < 11) return "Selamat pagi.";
  if (h >= 11 && h < 15) return "Selamat siang.";
  if (h >= 15 && h < 19) return "Selamat sore.";
  return "Selamat malam.";
}

export function longDate(d = new Date()): string {
  return d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });
}

/** "Hari ini", "Kemarin", or a short date: the journal's day headers. */
export function dayLabel(ts: number | string, now = new Date()): string {
  const d = new Date(ts);
  const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((start(now) - start(d)) / 86_400_000);
  if (diff === 0) return "Hari ini";
  if (diff === 1) return "Kemarin";
  return d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "short" });
}

/** Two letters of the token symbol, stand-in for a token logo we do not have. */
export function initials(symbol: string): string {
  const clean = symbol.replace(/[^A-Za-z0-9]/g, "");
  return (clean.slice(0, 2) || "?").toUpperCase();
}

export function usd(x: number): string {
  if (x >= 1e6) return `$${(x / 1e6).toFixed(1)}M`;
  if (x >= 1e3) return `$${(x / 1e3).toFixed(0)}k`;
  return `$${x.toFixed(0)}`;
}

export function shortAddr(a: string): string {
  return a.length > 12 ? `${a.slice(0, 4)}...${a.slice(-4)}` : a;
}

/** Re-render every `ms` so elapsed timers and countdowns stay current. */
export function useNow(ms = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

/** Keyed by the code at the start of the backend reason, e.g. "stop-loss(-8.1%≤-8%)". */
const CLOSE_REASON: Record<string, string> = {
  "rug-candle": "candle anjlok",
  "stop-loss": "stop loss",
  "out-below": "lama di bawah range",
  "take-profit": "take profit",
  "bounce-exit": "harga memantul",
  "pumped-out-top": "harga naik keluar range",
  "idle-above": "lama di atas range",
  "volume-decay": "volume menurun",
  "max-hold": "batas umur posisi",
  "sol-regime-dump": "SOL turun tajam",
  external: "ditutup di luar bot",
  manual: "ditutup manual dari dashboard",
};

export function closeReasonLabel(reason: string | null | undefined): string {
  if (!reason) return "alasan tidak tercatat";
  const code = reason.match(/^[a-z-]+/)?.[0] ?? "";
  return CLOSE_REASON[code] ?? reason;
}

export const SHAPE_LABEL: Record<string, string> = { Spot: "Spot", Curve: "Curve", BidAsk: "Bid-ask" };

export const STRATEGY_LABEL: Record<string, string> = {
  S2_WIDE_BIDASK: "S2 Wide bid-ask",
  S1_PLAY_THE_DROP: "S1 Play the drop",
  S10_POST_DUMP_SPOT: "S10 Post-dump spot",
  S8_SLOW_COOK: "S8 Slow cook",
  S4_HEART_ATTACK: "S4 Heart attack",
};
