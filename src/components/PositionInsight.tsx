import type { Position, PositionChart } from "../types";
import { usePositionChart } from "../usePositionChart";
import { duration, pct, sol } from "../format";
import { Disclosure } from "@/components/Disclosure";
import { Skeleton } from "@/components/ui/skeleton";

const W = 100;
const H = 56;
const PAD = 0.2; // depth shown above the range top and below the bottom

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
/** depth 0 (range top) to 1 (range bottom) mapped to the chart's height. */
const depthY = (d: number) => ((clamp(d, -PAD, 1 + PAD) + PAD) / (1 + 2 * PAD)) * H;

function depthText(d: number): string {
  if (d <= 0) return "harga di atas range";
  if (d > 1) return "harga di bawah range";
  return `harga ${(d * 100).toFixed(0)}% masuk range`;
}

/** Price line walking through the position's bins, with the range as a band. */
function BinChart({ chart }: { chart: PositionChart }) {
  const pts = chart.candles;
  const n = pts.length;
  const x = (i: number) => (n <= 1 ? W / 2 : (i / (n - 1)) * W);
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(2)},${depthY(p.depth).toFixed(2)}`).join(" ");
  const last = pts[n - 1];
  const span = n > 1 ? ` (${duration((last.t - pts[0].t) * 1000)})` : "";
  const yTop = depthY(0);
  const yBot = depthY(1);

  return (
    <figure className="binchart">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img"
        aria-label={`Pergerakan harga ${chart.poolName} terhadap ${chart.bins} bin. Sekarang ${depthText(last.depth)}.`}>
        <rect x="0" y={yTop} width={W} height={Math.max(0, yBot - yTop)} className="binchart__range" />
        {[0, 0.25, 0.5, 0.75, 1].map((d) => (
          <line key={d} x1="0" x2={W} y1={depthY(d)} y2={depthY(d)} className="binchart__grid" />
        ))}
        <line x1="0" x2={W} y1={depthY(chart.entryDepth)} y2={depthY(chart.entryDepth)} className="binchart__entry" />
        {n > 1 && <path d={line} className="binchart__line" />}
        <circle cx={x(n - 1)} cy={depthY(last.depth)} r="1.8" className="binchart__now" />
      </svg>
      <figcaption className="binchart__axis">
        <span>atas range</span>
        <span>-{chart.rangePct.toFixed(0)}% bawah</span>
      </figcaption>
      <p className="binchart__caption">
        {depthText(last.depth)} · {n} candle 15m{span}. Garis putus-putus = harga masuk.
      </p>
    </figure>
  );
}

function SimTable({ chart }: { chart: PositionChart }) {
  if (chart.rows.length === 0) return null;
  return (
    <table className="sim__table">
      <caption className="visually-hidden">Nilai posisi kalau harga turun, sebelum fee</caption>
      <thead>
        <tr>
          <th scope="col">Harga turun</th>
          <th scope="col">Bin terisi</th>
          <th scope="col">Nilai</th>
          <th scope="col">P&amp;L</th>
        </tr>
      </thead>
      <tbody>
        {chart.rows.map((r) => (
          <tr key={r.dropPct}>
            <td>-{r.dropPct}%</td>
            <td>{r.filledPct}%</td>
            <td>{r.valueSol.toFixed(3)}</td>
            <td className={`num--${r.pnlPct < 0 ? "down" : r.pnlPct > 0 ? "up" : "flat"}`}>{pct(r.pnlPct)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Bin-movement chart plus the Modul 4 IL simulation, shown inside the position detail. */
export function PositionInsight({ p }: { p: Position }) {
  const { chart, loading, error } = usePositionChart(p.positionPubkey);

  if (error && !chart) {
    return (
      <p className="muted insight__note" role="status">
        Chart harga tidak bisa dimuat: {error}
      </p>
    );
  }
  if (!chart) {
    return (
      <div className="insight" role="status" aria-live="polite">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-14 w-full" />
        <p className="muted insight__note">{loading ? "Memuat pergerakan harga dan simulasi..." : "Menyiapkan chart..."}</p>
      </div>
    );
  }

  const feeNote =
    chart.feeTvl24hPct !== null
      ? `fee/TVL 24 jam ${chart.feeTvl24hPct}% → estimasi ${sol(chart.feePerDaySol, 4)}/hari selama di range`
      : `estimasi dari fee terkumpul ${sol(chart.feePerDaySol, 4)}/hari`;

  return (
    <div className="insight">
      <div className="insight__head">
        <h4 className="insight__title">Pergerakan harga vs bin</h4>
        <span className="insight__sub">
          {chart.bins} bin, bin step {chart.binStep}, harga masuk {chart.entryPriceSol.toPrecision(3)} SOL
        </span>
      </div>
      <BinChart chart={chart} />

      <Disclosure className="disclosure sim" defaultOpen title={<>Simulasi nilai posisi (metode DLMM), deposit {sol(chart.depositSol, 2)}</>}>
        <SimTable chart={chart} />
        <p className="muted">Sebelum fee. {feeNote}.</p>
      </Disclosure>
    </div>
  );
}
