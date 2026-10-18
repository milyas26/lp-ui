import { useEffect, useState } from "react";
import { api } from "../api";
import type { Position } from "../types";
import { pct, signed, sol, tone } from "../format";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Props {
  position: Position | null;
  /** A cycle is running: the close waits for it, so say so. */
  cycleRunning: boolean;
  onClose: () => void;
}

/** Confirmation before closing a position by hand. Closing cannot be undone. */
export function ClosePositionDialog({ position: p, cycleRunning, onClose }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (p) {
      setError(null);
      setBusy(false);
    }
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
    <Dialog open={p !== null} onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent className="sm:max-w-md" showCloseButton={!busy}>
        {p && (
          <>
            <DialogHeader>
              <DialogTitle>Tutup {p.poolName}?</DialogTitle>
              <DialogDescription>
                {p.paper
                  ? "Posisi paper: nilainya dikembalikan ke saldo paper."
                  : "Bot menarik likuiditas, claim fee, lalu menjual token sisa ke SOL. Transaksi ini tidak bisa dibatalkan."}
              </DialogDescription>
            </DialogHeader>
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
            <p className="text-xs text-muted-foreground">Hasil akhir dihitung saat ditutup dan bisa berbeda dari perkiraan.</p>
            {busy && cycleRunning && (
              <p className="text-xs" role="status">
                Menunggu siklus yang sedang berjalan selesai, lalu menutup posisi...
              </p>
            )}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>
                Batal
              </Button>
              <Button type="button" variant="destructive" onClick={confirm} disabled={busy}>
                {busy ? "Menutup..." : "Tutup posisi"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
