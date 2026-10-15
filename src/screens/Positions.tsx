import { useState } from "react";
import type { BotStatus, OnchainPosition, Position, PositionIl, Snapshot } from "../types";
import { BinStrip } from "../components/BinStrip";
import { ClosePositionDialog } from "../components/ClosePositionDialog";
import { PositionDetailDialog } from "../components/PositionDetailDialog";
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

function PositionCard({
  p,
  il,
  usdPrice,
  onCloseRequest,
  onDetailRequest,
}: {
  p: Position;
  il?: PositionIl;
  usdPrice: number;
  onCloseRequest: () => void;
  /** Absent when the card is already shown inside the detail dialog. */
  onDetailRequest?: () => void;
}) {
  const detail = !onDetailRequest;
  const now = useNow(15_000);
  const bins = p.maxBinId - p.minBinId + 1;
  const snapshotFees = p.lastFeesSol ?? 0;
  const feesSol = il ? il.feesSol : snapshotFees;
  const liquiditySol = il ? il.liquiditySol : (p.lastValueSol ?? p.depositSol) - snapshotFees;
  const valueSol = liquiditySol + feesSol;
  const totalFeesSol = feesSol + p.claimedSol;
  const ilSol = il ? il.ilSol : liquiditySol - p.depositSol;
  const ilPct = il ? il.ilPct : p.depositSol > 0 ? (ilSol / p.depositSol) * 100 : 0;
  const hasValue = il !== undefined || p.lastValueSol !== undefined;
  const pnlSol = valueSol + p.claimedSol - p.depositSol;
  const pnl = p.depositSol > 0 ? (pnlSol / p.depositSol) * 100 : (p.lastPnlPct ?? 0);
  const usd = (v: number | undefined) => (usdPrice > 0 && v !== undefined ? `≈ $${(v * usdPrice).toFixed(2)}` : null);

  const titleId = `${detail ? "detail" : "pos"}-${p.positionPubkey}`;

  return (
    <article className="card pos" aria-labelledby={titleId}>
      <header className="row row--flat">
        <span className="avatar avatar--brand" aria-hidden="true">
          {initials(p.tokenSymbol)}
        </span>
        <span className="row__main">
          <h2 id={titleId} className="row__title">
            {p.poolName}
          </h2>
          <span className="row__meta">
            {STRATEGY_LABEL[p.strategy] ?? p.strategy}
            {p.paper ? ", paper" : ""}
          </span>
        </span>
        <span className="pos__pnl">
          <span className={`pos__pct num--${tone(pnl, 2)}`}>{pct(pnl, 2)}</span>
          <span className={`pos__sol num--${tone(pnlSol)}`}>{signed(pnlSol, 4)}</span>
        </span>
      </header>

      <ul className="chips" aria-label="Ringkasan posisi">
        {p.binStep !== undefined && <li className="chip">Bin step {p.binStep}</li>}
        <li className="chip">
          {SHAPE_LABEL[p.shape]} -{p.rangePct.toFixed(0)}%
        </li>
        {p.decidedBy === "ai" && (
          <li className="chip chip--ai">
            Dipilih AI{p.confidence !== undefined ? `, yakin ${Math.round(p.confidence * 100)}%` : ""}
          </li>
        )}
        {p.decidedBy === "rules" && <li className="chip">Dipilih rule engine</li>}
      </ul>

      <div className="inset">
        <BinStrip bins={bins} depth={p.lastDepth ?? 0} maxDepth={p.maxDepth} rangePct={p.rangePct} />
      </div>

      <dl className="facts">
        <div>
          <dt>Deposit</dt>
          <dd>
            {sol(p.depositSol)}
            {usd(p.depositSol) && <span className="usd">{usd(p.depositSol)}</span>}
          </dd>
        </div>
        <div>
          <dt>Nilai sekarang</dt>
          <dd>
            {hasValue ? sol(valueSol, 4) : "Belum dicek"}
            {usd(valueSol) && <span className="usd">{usd(valueSol)}</span>}
          </dd>
        </div>
        <div>
          <dt>Fee terkumpul</dt>
          <dd>
            {sol(totalFeesSol, 4)}
            {usd(totalFeesSol) && <span className="usd">{usd(totalFeesSol)}</span>}
          </dd>
        </div>
        <div>
          <dt title="Nilai likuiditas tanpa fee, dibanding kalau cuma pegang SOL">Imperm. loss</dt>
          <dd className={`num--${tone(ilSol)}`}>
            {hasValue ? `${signed(ilSol, 4)} (${pct(ilPct, 2)})` : "…"}
            {hasValue && usd(ilSol) && <span className="usd">{usd(ilSol)}</span>}
          </dd>
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
        {detail && (
          <>
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
            <div>
              <dt>Alamat pool</dt>
              <dd title={p.poolAddress}>{shortAddr(p.poolAddress)}</dd>
            </div>
          </>
        )}
      </dl>

      <details className="disclosure" open={detail || undefined}>
        <summary>Alasan posisi ini dibuka</summary>
        <p>{p.reasoning}</p>
      </details>

      <footer className="pos__foot">
        <p className="card__meta">{p.lastCheckedAt ? `Dicek ${clock(p.lastCheckedAt)}` : "Belum dicek sejak dibuka"}</p>
        <span className="pos__actions">
          {onDetailRequest && (
            <button
              type="button"
              className="btn btn--small btn--secondary-on-surface"
              onClick={onDetailRequest}
              aria-label={`Detail ${p.poolName}`}
            >
              Detail
            </button>
          )}
          <button type="button" className="btn btn--small btn--outline-danger" onClick={onCloseRequest}>
            Tutup posisi
          </button>
        </span>
      </footer>
    </article>
  );
}

function OpenList({
  list,
  il,
  usdPrice,
  onCloseRequest,
  onDetailRequest,
}: {
  list: Position[];
  il: Record<string, PositionIl>;
  usdPrice: number;
  onCloseRequest: (p: Position) => void;
  onDetailRequest: (p: Position) => void;
}) {
  if (list.length === 0) {
    return (
      <div className="empty">
        <p className="empty__title">Belum ada posisi terbuka.</p>
        <p className="muted">
          Bot membuka posisi saat ada pool yang lolos screening dan keputusan entry. Alasan kandidat dilewati tercatat
          di jurnal.
        </p>
        <a className="btn btn--secondary" href="#jurnal">
          Lihat kandidat yang dilewati
        </a>
      </div>
    );
  }
  return (
    <div className="pos-grid">
      {list.map((p) => (
        <PositionCard
          key={p.positionPubkey}
          p={p}
          il={il[p.positionPubkey]}
          usdPrice={usdPrice}
          onCloseRequest={() => onCloseRequest(p)}
          onDetailRequest={() => onDetailRequest(p)}
        />
      ))}
    </div>
  );
}

function ClosedList({ refreshKey }: { refreshKey: number }) {
  const { rows, error, reload } = useClosed(refreshKey, 50);

  if (error && !rows) {
    return (
      <div className="empty" role="alert">
        <p className="empty__title">Riwayat gagal dimuat.</p>
        <p className="muted">{error}</p>
        <button type="button" className="btn btn--secondary" onClick={reload}>
          Muat ulang riwayat
        </button>
      </div>
    );
  }
  if (!rows) {
    return (
      <p className="muted" role="status">
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
    <ul className="rows">
      {rows.map(({ position: p, closedAt, closeReason, realizedSol }) => (
        <li key={p.positionPubkey} className="row">
          <span className="avatar avatar--neutral" aria-hidden="true">
            {initials(p.tokenSymbol)}
          </span>
          <span className="row__main">
            <span className="row__title">{p.poolName}</span>
            <span className="row__meta">
              {STRATEGY_LABEL[p.strategy] ?? p.strategy}, {closeReasonLabel(closeReason)}, {dateTime(closedAt)}
            </span>
          </span>
          <span className="row__end">
            {realizedSol === null ? (
              <span className="row__amount">Tidak diketahui</span>
            ) : (
              <span className={`row__amount num--${tone(realizedSol)}`}>{signed(realizedSol, 4)}</span>
            )}
            <span className="row__meta">
              {sol(p.depositSol, 2)}, {duration(closedAt - p.openedAt, true)}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function OnchainCard({ p }: { p: OnchainPosition }) {
  const token = p.tokenXSymbol === "SOL" ? p.tokenYSymbol : p.tokenXSymbol;
  return (
    <article className="card pos" aria-labelledby={`oc-${p.positionPubkey}`}>
      <header className="row row--flat">
        <span className="avatar avatar--neutral" aria-hidden="true">
          {initials(token)}
        </span>
        <span className="row__main">
          <h2 id={`oc-${p.positionPubkey}`} className="row__title">
            {p.poolName}
          </h2>
          <span className="row__meta">{shortAddr(p.positionPubkey)}</span>
        </span>
        <span className="pos__pnl">
          <span className="pos__pct num--flat">{sol(p.valueSol, 4)}</span>
          <span className="pos__sol">nilai</span>
        </span>
      </header>

      <ul className="chips" aria-label="Ringkasan posisi on-chain">
        <li className="chip">Di luar bot</li>
        {p.binStep !== null && <li className="chip">Bin step {p.binStep}</li>}
        <li className="chip">{p.bins} bin</li>
      </ul>

      <dl className="facts">
        <div>
          <dt>Rentang bin</dt>
          <dd>
            {p.lowerBinId}..{p.upperBinId}
          </dd>
        </div>
        <div>
          <dt>Bin aktif</dt>
          <dd>{p.activeBinId}</dd>
        </div>
        <div>
          <dt>Likuiditas</dt>
          <dd>{sol(p.liquiditySol, 4)}</dd>
        </div>
        <div>
          <dt>Fee belum di-claim</dt>
          <dd>{sol(p.feesSol, 4)}</dd>
        </div>
      </dl>
    </article>
  );
}

function OnchainList({ refreshKey, tracked }: { refreshKey: number; tracked: Set<string> }) {
  const { rows, error, reload } = useOnchainPositions(refreshKey);
  const manual = rows?.filter((p) => !tracked.has(p.positionPubkey)) ?? null;

  return (
    <section className="onchain" aria-labelledby="onchain-title">
      <div className="section-head">
        <h2 id="onchain-title" className="card__title">
          Posisi on-chain
        </h2>
        <span className="card__meta">Tidak dikelola bot</span>
      </div>
      <p className="muted small">Posisi DLMM asli di wallet yang dibuka di luar bot. Hanya dilihat.</p>
      {error && !rows ? (
        <div className="empty" role="alert">
          <p className="empty__title">Posisi on-chain gagal dimuat.</p>
          <p className="muted">{error}</p>
          <button type="button" className="btn btn--secondary" onClick={reload}>
            Muat ulang
          </button>
        </div>
      ) : !manual ? (
        <p className="muted" role="status">
          Memuat posisi on-chain...
        </p>
      ) : manual.length === 0 ? (
        <p className="muted">Tidak ada posisi DLMM manual (di luar bot) di wallet.</p>
      ) : (
        <div className="pos-grid">
          {manual.map((p) => (
            <OnchainCard key={p.positionPubkey} p={p} />
          ))}
        </div>
      )}
    </section>
  );
}

type View = "open" | "closed";

interface Props {
  status: BotStatus;
  snapshot: Snapshot;
  refreshKey: number;
}

export function PositionsScreen({ status, snapshot, refreshKey }: Props) {
  const [view, setView] = useState<View>("open");
  const [closing, setClosing] = useState<Position | null>(null);
  const [detailKey, setDetailKey] = useState<string | null>(null);
  const list = snapshot.positions;
  // Looked up from the live snapshot so the dialog keeps refreshing, and closes once the position is gone.
  const detail = list.find((p) => p.positionPubkey === detailKey) ?? null;
  const usdPrice = snapshot.market?.solPriceUsd ?? 0;
  const il = useImpermanentLoss(refreshKey);
  const deposit = list.reduce((a, p) => a + p.depositSol, 0);
  const value = list.reduce((a, p) => {
    const ilp = il.byPubkey[p.positionPubkey];
    const fees = ilp ? ilp.feesSol : (p.lastFeesSol ?? 0);
    const liquidity = ilp ? ilp.liquiditySol : (p.lastValueSol ?? p.depositSol) - fees;
    return a + liquidity + fees + p.claimedSol;
  }, 0);
  const totalIl = list.reduce((a, p) => a + (il.byPubkey[p.positionPubkey]?.ilSol ?? 0), 0);
  const tracked = new Set(list.map((p) => p.positionPubkey));

  return (
    <div className="screen">
      <header className="page-head">
        <div>
          <h1 className="page-title">Posisi</h1>
          <p className="page-sub">
            {list.length} dari {snapshot.limits.maxPositions} slot terpakai
            {list.length > 0 && (
              <>
                . Total <span className={`num--${tone(value - deposit)}`}>{signed(value - deposit, 4)}</span> dari
                deposit {sol(deposit, 2)}
                {Object.keys(il.byPubkey).length > 0 && (
                  <>
                    {" "}
                    · IL <span className={`num--${tone(totalIl)}`}>{signed(totalIl, 4)}</span>
                  </>
                )}
              </>
            )}
            .
          </p>
        </div>
        <div className="segmented" role="group" aria-label="Tampilkan posisi">
          <button type="button" aria-pressed={view === "open"} onClick={() => setView("open")}>
            Terbuka ({list.length})
          </button>
          <button type="button" aria-pressed={view === "closed"} onClick={() => setView("closed")}>
            Riwayat
          </button>
        </div>
      </header>

      {view === "open" ? (
        <OpenList
          list={list}
          il={il.byPubkey}
          usdPrice={usdPrice}
          onCloseRequest={setClosing}
          onDetailRequest={(p) => setDetailKey(p.positionPubkey)}
        />
      ) : (
        <ClosedList refreshKey={refreshKey} />
      )}
      <OnchainList refreshKey={refreshKey} tracked={tracked} />
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
      <ClosePositionDialog
        position={closing}
        cycleRunning={status.state === "running"}
        onClose={() => setClosing(null)}
      />
    </div>
  );
}
