import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import type { Position } from "../types";
import { pct, signed, sol, tone } from "../format";

interface Props {
  position: Position | null;
  /** A cycle is running: the close waits for it, so say so. */
  cycleRunning: boolean;
  onClose: () => void;
}

/** Confirmation before closing a position by hand. Closing cannot be undone. */
export function ClosePositionDialog({ position: p, cycleRunning, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (p && !d.open) {
      setError(null);
      setBusy(false);
      d.showModal();
    }
    if (!p && d.open) d.close();
  }, [p]);

  const confirm = async () => {
    if (!p) return;
    setBusy(true);
    setError(null);
    try {
      await api.closePosition(p.positionPubkey);
      onClose();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  const pnlSol = p ? (p.lastValueSol ?? p.depositSol) + p.claimedSol - p.depositSol : 0;

  return (
    <dialog
      ref={ref}
      className="sheet sheet--narrow"
      aria-labelledby="close-title"
      onClose={onClose}
      onCancel={(e) => busy && e.preventDefault()}
    >
      {p && (
        <>
          <h2 id="close-title" className="sheet__title">
            Tutup {p.poolName}?
          </h2>
          <p className="muted">
            {p.paper
              ? "Posisi paper: nilainya dikembalikan ke saldo paper."
              : "Bot menarik likuiditas, claim fee, lalu menjual token sisa ke SOL. Transaksi ini tidak bisa dibatalkan."}
          </p>
          <dl className="mini-facts">
            <div>
              <dt>Deposit</dt>
              <dd>{sol(p.depositSol)}</dd>
            </div>
            <div>
              <dt>Nilai terakhir dicek</dt>
              <dd>{p.lastValueSol !== undefined ? sol(p.lastValueSol, 4) : "Belum dicek"}</dd>
            </div>
            <div>
              <dt>Perkiraan hasil</dt>
              <dd className={`num--${tone(pnlSol)}`}>
                {signed(pnlSol, 4)} ({pct(p.lastPnlPct ?? 0, 2)})
              </dd>
            </div>
          </dl>
          <p className="muted small">Hasil akhir dihitung saat ditutup dan bisa berbeda dari perkiraan.</p>
          {busy && cycleRunning && (
            <p className="small" role="status">
              Menunggu siklus yang sedang berjalan selesai, lalu menutup posisi...
            </p>
          )}
          {error && (
            <p className="error-text" role="alert">
              {error}
            </p>
          )}
          <div className="sheet__actions">
            <button type="button" className="btn btn--secondary" onClick={onClose} disabled={busy}>
              Batal
            </button>
            <button type="button" className="btn btn--danger" onClick={confirm} disabled={busy}>
              {busy ? "Menutup..." : "Tutup posisi"}
            </button>
          </div>
        </>
      )}
    </dialog>
  );
}
