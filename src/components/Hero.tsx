import type { Snapshot } from "../types";
import type { BalanceFeed } from "../useWalletBalance";
import { useClosed } from "../useClosed";
import { ResultBars } from "./Charts";
import { pct, signed, sol, tone } from "../format";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

/**
 * Command center focal point: today's realized P&L is the one big number,
 * with the supporting numbers (capital, slots, SOL price, recent closes) a
 * step down in weight. Replaces the old equal-weight stat row.
 */
export function Hero({
  snapshot,
  balance,
  refreshKey,
}: {
  snapshot: Snapshot;
  balance: BalanceFeed;
  refreshKey: number;
}) {
  const today = snapshot.day.realizedSol;
  const cap = snapshot.limits.maxDeployedPct;
  // Only real positions hold SOL; paper ones carry none.
  const deployed = snapshot.positions
    .filter((p) => !p.paper)
    .reduce((a, p) => a + (p.lastValueSol ?? p.depositSol), 0);
  const total = balance.sol === null ? null : balance.sol + deployed;
  const used = total && total > 0 ? Math.min(100, (deployed / total) * 100) : 0;
  const slotsUsed = snapshot.positions.length;
  const slotsMax = snapshot.limits.maxPositions;
  const m = snapshot.market;

  const { rows } = useClosed(refreshKey, 12);
  const values = (rows ?? [])
    .map((r) => r.realizedSol)
    .filter((x): x is number => x !== null)
    .reverse();
  const closedTotal = values.reduce((a, x) => a + x, 0);

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__lead">
        <p id="hero-title" className="hero__eyebrow">
          Hasil hari ini
        </p>
        <p className={`hero__value num--${tone(today)}`}>
          {signed(today, 4, "")}
          <span className="hero__unit">SOL</span>
        </p>
        <p className="hero__meta">
          {snapshot.day.opened} dibuka, {snapshot.day.closed} ditutup, batas rugi {sol(snapshot.limits.dailyLossLimitSol, 2)}
        </p>
        {m?.solDumping && (
          <Alert variant="destructive" className="hero__alert">
            <AlertDescription className="text-xs">SOL turun tajam. Bot tidak membuka posisi baru.</AlertDescription>
          </Alert>
        )}
      </div>

      <dl className="hero__stats">
        <div className="hstat">
          <dt className="hstat__label">Modal</dt>
          <dd className="hstat__value">
            {total === null ? (
              "..."
            ) : (
              <>
                {total.toFixed(3)}
                <span className="hstat__unit">SOL</span>
              </>
            )}
          </dd>
          <div className="meter" role="img" aria-label={`Terpasang ${used.toFixed(0)} persen dari batas ${cap} persen`}>
            <Progress value={used} className="h-2 bg-muted [&>div]:bg-brand" />
            <span className="meter__cap" style={{ left: `${Math.min(100, cap)}%` }} />
          </div>
          <p className="hstat__meta">
            bebas {sol(balance.sol ?? 0)}, terpasang {used.toFixed(0)}% dari batas {cap}%
          </p>
        </div>

        <div className="hstat">
          <dt className="hstat__label">Slot posisi</dt>
          <dd className="hstat__value">
            {slotsUsed}
            <span className="hstat__unit">dari {slotsMax}</span>
          </dd>
          <div className="slots" aria-hidden="true">
            {Array.from({ length: slotsMax }, (_, i) => (
              <span key={i} className={i < slotsUsed ? "slot is-used" : "slot"} />
            ))}
          </div>
        </div>

        <div className="hstat">
          <dt className="hstat__label">Harga SOL</dt>
          <dd className="hstat__value">
            {m?.known ? (m.solPriceUsd ? `$${m.solPriceUsd.toFixed(2)}` : pct(m.solChange1h)) : "..."}
          </dd>
          <p className="hstat__meta">
            {m?.known ? (
              <>
                1 jam <span className={`num--${tone(m.solChange1h, 1)}`}>{pct(m.solChange1h)}</span>, 24 jam{" "}
                <span className={`num--${tone(m.solChange24h, 1)}`}>{pct(m.solChange24h)}</span>
              </>
            ) : (
              "diambil di awal siklus"
            )}
          </p>
        </div>

        <div className="hstat">
          <dt className="hstat__label">Posisi ditutup</dt>
          <dd className={`hstat__value num--${tone(closedTotal)}`}>
            {values.length > 0 ? signed(closedTotal, 4, "") : "..."}
          </dd>
          {values.length > 0 ? <ResultBars values={values} /> : <p className="hstat__meta">belum ada. hasilnya muncul di sini.</p>}
        </div>
      </dl>
    </section>
  );
}
