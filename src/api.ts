import type {
  BotStatus,
  ClosedPosition,
  JournalEntry,
  OnchainPosition,
  Position,
  PositionChart,
  PositionIl,
  SettingsView,
  WalletBalance,
} from "./types";

/** Empty = same origin (Vite proxy in dev, nginx in production). */
export const API_BASE: string = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, "") ?? "";

const TOKEN_KEY = "lp-agent.token";

export function getToken(): string {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setToken(token: string): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Private mode: the token lives only for this tab.
  }
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    /** One message per invalid field (PUT /api/settings). */
    readonly problems: string[] = [],
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        ...(init?.body ? { "content-type": "application/json" } : {}),
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch {
    throw new ApiError(0, "Backend tidak bisa dihubungi.");
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string; problems?: string[] };
    throw new ApiError(res.status, body.error ?? `HTTP ${res.status}`, body.problems);
  }
  return (await res.json()) as T;
}

export function streamUrl(): string {
  const token = getToken();
  return `${API_BASE}/api/stream${token ? `?token=${encodeURIComponent(token)}` : ""}`;
}

export const api = {
  overview: () => request<{ status: BotStatus }>("/api/overview"),
  wallet: () => request<WalletBalance>("/api/wallet"),
  journal: (limit = 100, type?: JournalEntry["type"]) =>
    request<{ entries: JournalEntry[] }>(`/api/journal?limit=${limit}${type ? `&type=${type}` : ""}`),
  positions: (closedLimit = 30) =>
    request<{ open: Position[]; closed: ClosedPosition[] }>(`/api/positions?closedLimit=${closedLimit}`),
  onchainPositions: () => request<{ positions: OnchainPosition[] }>("/api/positions/onchain"),
  ilPositions: () => request<{ positions: PositionIl[]; at: number }>("/api/positions/il"),
  positionChart: (pubkey: string) =>
    request<PositionChart>(`/api/positions/${encodeURIComponent(pubkey)}/chart`),
  setOpeningPaused: (paused: boolean) =>
    request<{ status: BotStatus }>("/api/opening", { method: "POST", body: JSON.stringify({ paused }) }),
  closePosition: (pubkey: string) =>
    request<{ closed: true; realizedSol: number | null }>(`/api/positions/${encodeURIComponent(pubkey)}/close`, {
      method: "POST",
    }),
  settings: () => request<SettingsView>("/api/settings"),
  /** Display units; `null` resets a key to its backend/.env value. */
  updateSettings: (values: Record<string, unknown>) =>
    request<SettingsView>("/api/settings", { method: "PUT", body: JSON.stringify({ values }) }),
};
