// Mirrors backend/src/trace.ts, backend/src/state.ts and AgentSnapshot in backend/src/agent.ts.

export type StepStatus = "running" | "done" | "skipped" | "failed";

export interface Step {
  id: string;
  key: string;
  label: string;
  status: StepStatus;
  detail?: string;
  data?: unknown;
  startedAt: number;
  endedAt?: number;
  children: Step[];
}

export interface Cycle {
  n: number;
  startedAt: number;
  endedAt?: number;
  status: "running" | "done" | "failed";
  steps: Step[];
}

export interface BotStatus {
  state: "starting" | "running" | "sleeping" | "stopped";
  cycle: number;
  nextCycleAt?: number;
  lastCycleAt?: number;
  openingPaused: boolean;
}

export interface ExitRules {
  stopLossPct: number;
  takeProfitPct: number;
  maxHoldHours: number;
  outBelowMaxMin: number;
}

export interface Position {
  positionPubkey: string;
  poolAddress: string;
  poolName: string;
  tokenSymbol: string;
  strategy: string;
  phase: string;
  shape: "Spot" | "Curve" | "BidAsk";
  rangePct: number;
  binStep?: number;
  decidedBy?: "ai" | "rules";
  confidence?: number;
  minBinId: number;
  maxBinId: number;
  depositSol: number;
  claimedSol: number;
  exits: ExitRules;
  openedAt: number;
  reasoning: string;
  maxDepth: number;
  lastPnlPct?: number;
  lastValueSol?: number;
  lastFeesSol?: number;
  lastDepth?: number;
  lastCheckedAt?: number;
  paper?: unknown;
}

export interface Snapshot {
  dryRun: boolean;
  wallet: string;
  llm: string | null;
  storage?: string;
  decisionMode: "ai" | "rules";
  intervalMs: number;
  day: { date: string; realizedSol: number; opened: number; closed: number };
  bankroll: { freeSol: number; deployedSol: number; totalSol: number; at: number } | null;
  market: { known: boolean; solChange1h: number; solChange24h: number; solPriceUsd?: number; solDumping: boolean } | null;
  positions: Position[];
  limits: { maxPositions: number; dailyLossLimitSol: number; maxDeployedPct: number; maxBinsPerPosition: number };
}

export interface Overview {
  status: BotStatus;
  snapshot: Snapshot;
  cycles: Cycle[];
}

export interface JournalEntry {
  ts: string;
  type: "open" | "close" | "claim" | "skip" | "halt";
  pool?: string;
  strategy?: string;
  reason?: string;
  why?: string;
  realizedSol?: number;
  depositSol?: number;
  heldMin?: number;
  rangePct?: number;
  binStep?: number;
  decidedBy?: "ai" | "rules";
  confidence?: number;
  shape?: string;
  sol?: number;
  paper?: boolean;
  reasoning?: string;
}

// Payloads in Step.data, written by backend/src/decision/agent.ts.

export interface DecisionData {
  action: "open" | "skip";
  pool?: string;
  name?: string;
  binStep?: number;
  strategy?: string;
  shape?: string;
  rangePct?: number;
  bins?: number;
  sizeSol?: number;
  confidence?: number;
  stopLossPct?: number;
  takeProfitPct?: number;
  reasoning: string;
  iterations: number;
}

export interface BinStepRow {
  address: string;
  name: string;
  binStep: number;
  baseFeePct: number;
  tvlUsd: number;
  volume1hUsd: number;
  volume24hUsd: number;
  feeTvl1hPct: number;
  feeTvl24hPct: number;
  bins: number;
  rangePct: number;
  fits: boolean;
  shrunk?: boolean;
  tx: "single" | "extended";
  rentSol?: number;
}

export interface BinStepData {
  rangePct: number;
  shape: string;
  rows: BinStepRow[];
}

export interface SimulationData {
  pool?: string;
  shape: string;
  sizeSol: number;
  binStep: number;
  bins: number;
  rangePct: number;
  feePerDaySol: number;
  rows: { dropPct: number; valueSol: number; pnlPct: number; filledPct: number }[];
}

/** GET /api/wallet, mirrors backend/src/modules/bot/application/wallet-balance.ts. */
export interface WalletBalance {
  wallet: string;
  sol: number;
  at: number;
}

/** GET /api/positions/il, mirrors backend/src/modules/positions/application/position-il.use-case.ts. */
export interface PositionIl {
  positionPubkey: string;
  depositSol: number;
  liquiditySol: number;
  feesSol: number;
  ilSol: number;
  ilPct: number;
  at: number;
}

/** GET /api/positions/onchain, mirrors backend/src/modules/positions/application/onchain-positions.use-case.ts. */
export interface OnchainPosition {
  positionPubkey: string;
  poolAddress: string;
  poolName: string;
  tokenXSymbol: string;
  tokenYSymbol: string;
  binStep: number | null;
  lowerBinId: number;
  upperBinId: number;
  bins: number;
  activeBinId: number;
  priceSolPerToken: number;
  liquiditySol: number;
  feesSol: number;
  valueSol: number;
}

/** Row of GET /api/positions `closed`. */
export interface ClosedPosition {
  position: Position;
  closedAt: number;
  closeReason: string | null;
  realizedSol: number | null;
}

/** GET /api/settings, mirrors backend/src/modules/settings/application/settings.service.ts. */
export interface SettingView {
  key: string;
  env: string;
  label: string;
  help: string;
  type: "number" | "integer" | "boolean" | "list";
  unit?: string;
  min?: number;
  max?: number;
  value: number | boolean | string[];
  envValue: number | boolean | string[];
  overridden: boolean;
}

export interface SettingsView {
  groups: { id: string; label: string; help: string; settings: SettingView[] }[];
}
