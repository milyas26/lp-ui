import { useState } from "react";
import type { BotStatus, OnchainPosition, Position, PositionIl, Snapshot } from "../types";
import { BinStrip } from "./BinStrip";
import { ClosePositionDialog } from "./ClosePositionDialog";
import { PositionDetailDialog } from "./PositionDetailDialog";
import { PositionInsight } from "./PositionInsight";
import { useClosed } from "../useClosed";
import { useOnchainPositions } from "../useOnchainPositions";
import { useImpermanentLoss } from "../useImpermanentLoss";
import {
  SHAPE_LABEL,
  STRATEGY_LABEL,
  clock,
  closeReasonLabel,
  dateTime,
  duration,
  initials,
  pct,
  shortAddr,
  signed,
  sol,
  tone,
  useNow,
} from "../format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Disclosure } from "@/components/Disclosure";

/** Value, fees and IL from the IL feed when it has the position, else from the last snapshot. */
function figures(p: Position, il?: PositionIl) {
  const snapshotFees = p.lastFeesSol ?? 0;
  const feesSol = il ? il.feesSol : snapshotFees;
  const liquiditySol = il ? il.liquiditySol : (p.lastValueSol ?? p.depositSol) - snapshotFees;
  const valueSol = liquiditySol + feesSol;
  const ilSol = il ? il.ilSol : liquiditySol - p.depositSol;
  const pnlSol = valueSol + p.claimedSol - p.depositSol;
  return {
    feesSol: feesSol + p.claimedSol,
    valueSol,
    ilSol,
    ilPct: il ? il.ilPct : p.depositSol > 0 ? (ilSol / p.depositSol) * 100 : 0,
    pnlSol,
    pnlPct: p.depositSol > 0 ? (pnlSol / p.depositSol) * 100 : (p.lastPnlPct ?? 0),
    hasValue: il !== undefined || p.lastValueSol !== undefined,
  };
}

const chosenBy = (p: Position) =>
  p.decidedBy === "ai"
    ? `AI${p.confidence !== undefined ? ` ${Math.round(p.confidence * 100)}%` : ""}`
    : p.decidedBy === "rules"
      ? "rule engine"
      : null;

/** Full card, shown inside the detail dialog beside the Meteora page. */
function PositionCard({ p, il, usdPrice, onCloseRequest }: { p: Position; il?: PositionIl; usdPrice: number; onCloseRequest: () => void }) {
  const now = useNow(15_000);
  const f = figures(p, il);
  const bins = p.maxBinId - p.minBinId + 1;
  const usd = (v: number) => (usdPrice > 0 ? <span className="usd">≈ ${(v * usdPrice).toFixed(2)}</span> : null);
  const by = chosenBy(p);

  return (
    <Card className="pos gap-3 border-0 p-3 shadow-none" aria-labelledby={`detail-${p.positionPubkey}`}>
      <header className="row row--flat">
        <span className="avatar avatar--brand" aria-hidden="true">
          {initials(p.tokenSymbol)}
        </span>
        <span className="row__main">
          <h3 id={`detail-${p.positionPubkey}`} className="row__title">
            {p.poolName}
          </h3>
          <span className="row__meta">
            {STRATEGY_LABEL[p.strategy] ?? p.strategy}
            {p.paper ? ", paper" : ""}
          </span>
        </span>
        <span className="pos__pnl">
          <span className={`pos__pct num--${tone(f.pnlPct, 2)}`}>{pct(f.pnlPct, 2)}</span>
          <span className={`pos__sol num--${tone(f.pnlSol)}`}>{signed(f.pnlSol, 4)}</span>
        </span>
      </header>

      <ul className="chips" aria-label="Ringkasan posisi">
        {p.binStep !== undefined && (
          <li>
            <Badge variant="outline">Bin step {p.binStep}</Badge>
          </li>
        )}
        <li>
          <Badge variant="outline">
            {SHAPE_LABEL[p.shape]} -{p.rangePct.toFixed(0)}%
          </Badge>
        </li>
        {by && <li>
            <Badge variant={p.decidedBy === "ai" ? "default" : "outline"} className={p.decidedBy === "ai" ? "bg-[var(--ai-tint)] text-[var(--ai-text)]" : ""}>
              Dipilih {by}
            </Badge>
          </li>}
      </ul>

      <div className="inset">
        <BinStrip bins={bins} depth={p.lastDepth ?? 0} maxDepth={p.maxDepth} rangePct={p.rangePct} shape={p.shape} />
      </div>

      <PositionInsight p={p} />

      <dl className="facts">
        <div>
          <dt>Deposit</dt>
          <dd>
            {sol(p.depositSol)}
            {usd(p.depositSol)}
          </dd>
        </div>
        <div>
          <dt>Nilai sekarang</dt>
          <dd>
            {f.hasValue ? sol(f.valueSol, 4) : "Belum dicek"}
            {usd(f.valueSol)}
          </dd>
        </div>
        <div>
          <dt>Fee terkumpul</dt>
          <dd>
            {sol(f.feesSol, 4)}
            {usd(f.feesSol)}
          </dd>
        </div>
        <div>
          <dt title="Nilai likuiditas tanpa fee, dibanding kalau cuma pegang SOL">Imperm. loss</dt>
          <dd className={`num--${tone(f.ilSol)}`}>{f.hasValue ? `${signed(f.ilSol, 4)} (${pct(f.ilPct, 2)})` : "…"}</dd>
        </div>
        <div>
          <dt>Jumlah bin</dt>
          <dd>{bins}</dd>
        </div>
        <div>
          <dt>Stop loss / take profit</dt>
          <dd>
            -{p.exits.stopLossPct}% / +{p.exits.takeProfitPct}%
          </dd>
        </div>
        <div>
          <dt>Umur posisi</dt>
          <dd>
            {duration(now - p.openedAt, true)} dari maks {p.exits.maxHoldHours} jam
          </dd>
        </div>
        <div>
          <dt>Dibuka</dt>
          <dd>{dateTime(p.openedAt)}</dd>
        </div>
        <div>
          <dt>Rentang bin</dt>
          <dd>
            {p.minBinId}..{p.maxBinId}
          </dd>
        </div>
        <div>
          <dt>Alamat posisi</dt>
          <dd title={p.positionPubkey}>{shortAddr(p.positionPubkey)}</dd>
        </div>
      </dl>

      <Disclosure className="disclosure" defaultOpen title={<>Alasan posisi ini dibuka</>}>
        <p className="pb-2 pl-6 text-[13px]">{p.reasoning}</p>
      </Disclosure>

      <footer className="pos__foot">
        <p className="card__meta">{p.lastCheckedAt ? `Dicek ${clock(p.lastCheckedAt)}` : "Belum dicek sejak dibuka"}</p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={onCloseRequest}
        >
          Tutup posisi
        </Button>
      </footer>
    </Card>
  );
}

/** One line per open position: name, P&L, value, fee, age, depth in range, actions. */
function OpenRow({
  p,
  il,
  onDetail,
  onClose,
}: {
  p: Position;
  il?: PositionIl;
  onDetail: () => void;
  onClose: () => void;
}) {
  const now = useNow(15_000);
  const f = figures(p, il);
  const bins = p.maxBinId - p.minBinId + 1;
  const by = chosenBy(p);
  return (
    <li className="prow">
      <span className="avatar avatar--sm avatar--brand" aria-hidden="true">
        {initials(p.tokenSymbol)}
      </span>
      <span className="prow__main">
        <span className="prow__title">{p.poolName}</span>
        <span className="prow__meta">
          {SHAPE_LABEL[p.shape]} -{p.rangePct.toFixed(0)}%
          {p.binStep !== undefined ? `, bin ${p.binStep}` : ""}
          {by ? `, ${by}` : ""}
          {p.paper ? ", paper" : ""}
        </span>
      </span>
      <span className="prow__strip prow__wide">
        <BinStrip bins={bins} depth={p.lastDepth ?? 0} maxDepth={p.maxDepth} rangePct={p.rangePct} shape={p.shape} compact />
      </span>
      <span className="prow__num">
        <span className={`prow__big num--${tone(f.pnlPct, 2)}`}>{pct(f.pnlPct, 2)}</span>
        <span className={`prow__small num--${tone(f.pnlSol)}`}>{signed(f.pnlSol, 4, "")}</span>
      </span>
      <span className="prow__num prow__wide">
        <span className="prow__big">{f.hasValue ? f.valueSol.toFixed(3) : "…"}</span>
        <span className="prow__small">fee {f.feesSol.toFixed(4)}</span>
      </span>
      <span className="prow__num prow__wide">
        <span className="prow__big">{duration(now - p.openedAt, true)}</span>
        <span className="prow__small">maks {p.exits.maxHoldHours}j</span>
      </span>
      <span className="prow__actions">
        <Button type="button" size="xs" variant="outline" onClick={onDetail} aria-label={`Detail ${p.poolName}`}>
          Detail
        </Button>
        <Button
          type="button"
          size="xs"
          variant="outline"
          className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={onClose}
          aria-label={`Tutup posisi ${p.poolName}`}
        >
          Tutup
        </Button>
      </span>
    </li>
  );
}

function ClosedList({ refreshKey }: { refreshKey: number }) {
  const { rows, error, reload } = useClosed(refreshKey, 50);
  if (error && !rows) {
    return (
      <div className="empty" role="alert">
        <p className="empty__title">Riwayat gagal dimuat.</p>
        <p className="muted">{error}</p>
        <Button type="button" size="sm" variant="outline" onClick={reload}>
          Muat ulang riwayat
        </Button>
      </div>
    );
  }
  if (!rows) {
    return (
      <p className="muted panel__pad" role="status">
        Memuat riwayat...
      </p>
    );
  }
  if (rows.length === 0) {
    return (
      <div className="empty">
        <p className="empty__title">Belum ada posisi yang ditutup.</p>
        <p className="muted">Setiap posisi yang ditutup muncul di sini beserta alasan dan hasilnya.</p>
      </div>
    );
  }
  return (
    <ul className="plist">
      {rows.map(({ position: p, closedAt, closeReason, realizedSol }) => (
        <li key={p.positionPubkey} className="prow prow--simple">
          <span className="avatar avatar--neutral" aria-hidden="true">
            {initials(p.tokenSymbol)}
          </span>
          <span className="prow__main">
            <span className="prow__title">{p.poolName}</span>
            <span className="prow__meta">
              {closeReasonLabel(closeReason)}, {dateTime(closedAt)}
            </span>
          </span>
          <span className="prow__num">
            {realizedSol === null ? (
              <span className="prow__big">?</span>
            ) : (
              <span className={`prow__big num--${tone(realizedSol)}`}>{signed(realizedSol, 4, "")}</span>
            )}
            <span className="prow__small">
              {sol(p.depositSol, 2)}, {duration(closedAt - p.openedAt, true)}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function OnchainList({ refreshKey, tracked }: { refreshKey: number; tracked: Set<string> }) {
  const { rows, error, reload } = useOnchainPositions(refreshKey);
  const manual = rows?.filter((p) => !tracked.has(p.positionPubkey)) ?? null;
  if (error && !rows) {
    return (
      <div className="empty" role="alert">
        <p className="empty__title">Posisi on-chain gagal dimuat.</p>
        <p className="muted">{error}</p>
        <Button type="button" size="sm" variant="outline" onClick={reload}>
          Muat ulang
        </Button>
      </div>
    );
  }
  if (!manual) {
    return (
      <p className="muted panel__pad" role="status">
        Memuat posisi on-chain...
      </p>
    );
  }
  if (manual.length === 0) {
    return (
      <div className="empty">
        <p className="empty__title">Tidak ada posisi di luar bot.</p>
        <p className="muted">Posisi DLMM yang kamu buka sendiri dari wallet ini akan muncul di sini, hanya untuk dilihat.</p>
      </div>
    );
  }
  return (
    <ul className="plist">
      {manual.map((p: OnchainPosition) => {
        const token = p.tokenXSymbol === "SOL" ? p.tokenYSymbol : p.tokenXSymbol;
        return (
          <li key={p.positionPubkey} className="prow prow--simple">
            <span className="avatar avatar--neutral" aria-hidden="true">
              {initials(token)}
            </span>
            <span className="prow__main">
              <span className="prow__title">{p.poolName}</span>
              <span className="prow__meta">
                {p.bins} bin{p.binStep !== null ? `, bin step ${p.binStep}` : ""}, {shortAddr(p.positionPubkey)}
              </span>
            </span>
            <span className="prow__num">
              <span className="prow__big">{p.valueSol.toFixed(4)}</span>
              <span className="prow__small">fee {p.feesSol.toFixed(4)}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

type View = "open" | "closed" | "onchain";

export function PositionsPanel({ status, snapshot, refreshKey }: { status: BotStatus; snapshot: Snapshot; refreshKey: number }) {
  const [view, setView] = useState<View>("open");
  const [closing, setClosing] = useState<Position | null>(null);
  const [detailKey, setDetailKey] = useState<string | null>(null);
  const list = snapshot.positions;
  // Looked up from the live snapshot so the dialog keeps refreshing, and closes once the position is gone.
  const detail = list.find((p) => p.positionPubkey === detailKey) ?? null;
  const usdPrice = snapshot.market?.solPriceUsd ?? 0;
  const il = useImpermanentLoss(refreshKey);
  const deposit = list.reduce((a, p) => a + p.depositSol, 0);
  const pnl = list.reduce((a, p) => a + figures(p, il.byPubkey[p.positionPubkey]).pnlSol, 0);
  const tracked = new Set(list.map((p) => p.positionPubkey));

  return (
    <Card role="region" id="posisi" className="panel" aria-labelledby="positions-title">
      <header className="panel__head">
        <div>
          <h2 id="positions-title" className="panel__title">
            Posisi
          </h2>
          <p className="panel__sub">
            {list.length} dari {snapshot.limits.maxPositions} slot
            {list.length > 0 && (
              <>
                , total <span className={`num--${tone(pnl)}`}>{signed(pnl, 4)}</span> dari deposit {sol(deposit, 2)}
              </>
            )}
          </p>
        </div>
        <Tabs value={view} onValueChange={(v) => setView(v as View)}>
          <TabsList aria-label="Tampilkan posisi">
            <TabsTrigger value="open">Terbuka {list.length > 0 ? list.length : ""}</TabsTrigger>
            <TabsTrigger value="closed">Riwayat</TabsTrigger>
            <TabsTrigger value="onchain">Di luar bot</TabsTrigger>
          </TabsList>
        </Tabs>
      </header>

      {view === "open" &&
        (list.length === 0 ? (
          <div className="empty">
            <p className="empty__title">Belum ada posisi terbuka.</p>
            <p className="muted">
              Bot membuka posisi saat ada pool yang lolos screening dan keputusan entry. Kandidat yang dilewati tercatat
              di aktivitas.
            </p>
          </div>
        ) : (
          <ul className="plist">
            {list.map((p) => (
              <OpenRow
                key={p.positionPubkey}
                p={p}
                il={il.byPubkey[p.positionPubkey]}
                onDetail={() => setDetailKey(p.positionPubkey)}
                onClose={() => setClosing(p)}
              />
            ))}
          </ul>
        ))}
      {view === "closed" && <ClosedList refreshKey={refreshKey} />}
      {view === "onchain" && <OnchainList refreshKey={refreshKey} tracked={tracked} />}

      <PositionDetailDialog position={detail} onClose={() => setDetailKey(null)}>
        {detail && (
          <PositionCard
            p={detail}
            il={il.byPubkey[detail.positionPubkey]}
            usdPrice={usdPrice}
            onCloseRequest={() => setClosing(detail)}
          />
        )}
      </PositionDetailDialog>
      <ClosePositionDialog position={closing} cycleRunning={status.state === "running"} onClose={() => setClosing(null)} />
    </Card>
  );
}
