import { SHAPE_LABEL } from "../format";

type Shape = "Spot" | "Curve" | "BidAsk";

interface Props {
  bins: number;
  /** 0 = price at/above the top of the range, 1 = at the bottom, >1 below it. */
  depth: number;
  /** Deepest point reached so far, same scale. */
  maxDepth: number;
  rangePct: number;
  /** Liquidity distribution across the bins; mirrors paper-sim weights(). */
  shape?: Shape;
  /** Bars only, for one-line rows; the label stays on the svg. */
  compact?: boolean;
}

export function describeDepth(depth: number): string {
  if (depth <= 0) return "Harga di atas range, posisi belum terisi.";
  if (depth > 1) return "Harga sudah keluar di bawah range.";
  return `Harga ${(depth * 100).toFixed(0)}% masuk ke dalam range.`;
}

/** Relative bar height per bin, peak = 1. Same curves as backend paper-sim. */
function shapeHeights(n: number, shape: Shape): number[] {
  const w = Array.from({ length: n }, (_, i) =>
    shape === "BidAsk" ? i + 1 : shape === "Curve" ? Math.max(1, n / 2 - Math.abs(i - (n - 1) / 2)) : 1,
  );
  const peak = Math.max(...w);
  return w.map((x) => x / peak);
}

/**
 * One-sided SOL position, bins left (top of range, just under entry price) to
 * right (bottom of range). Bar height is the liquidity shape; bins price has
 * crossed hold the token, the rest still hold SOL.
 */
export function BinStrip({ bins, depth, maxDepth, rangePct, shape = "Spot", compact }: Props) {
  const n = Math.max(1, Math.min(bins, 200));
  const crossed = Math.round(Math.min(Math.max(depth, 0), 1) * n);
  const deepest = Math.round(Math.min(Math.max(maxDepth, 0), 1) * n);
  const markerX = Math.min(Math.max(depth, 0), 1) * n;
  const heights = shapeHeights(n, shape);
  const H = 10;
  const minH = 1.5;
  const label =
    `${SHAPE_LABEL[shape]} satu sisi SOL. ${describeDepth(depth)} Range ${n} bin sampai -${rangePct.toFixed(0)}%.` +
    (deepest > crossed ? ` Paling dalam pernah ${(maxDepth * 100).toFixed(0)}%.` : "");

  return (
    <figure className={`binstrip${compact ? " binstrip--compact" : ""}`}>
      <svg viewBox={`0 0 ${n} ${H}`} preserveAspectRatio="none" role="img" aria-label={label}>
        {heights.map((h, i) => {
          const bh = minH + h * (H - minH);
          return (
            <rect
              key={i}
              x={i + 0.12}
              y={H - bh}
              width={0.76}
              height={bh}
              className={i < crossed ? "bin bin--token" : "bin bin--sol"}
            />
          );
        })}
        {deepest > crossed && (
          <rect x={deepest - 0.15} y={0} width={0.3} height={H} className="bin-deepest" />
        )}
        {depth > 0 && depth <= 1 && <rect x={markerX - 0.25} y={0} width={0.5} height={H} className="bin-marker" />}
      </svg>
      {!compact && (
        <>
          <figcaption className="binstrip__scale">
            <span>harga masuk</span>
            <span>-{rangePct.toFixed(0)}%</span>
          </figcaption>
          <div className="binstrip__legend">
            <span><i className="swatch swatch--sol" />SOL (belum terpakai)</span>
            <span><i className="swatch swatch--token" />Token (sudah dibeli)</span>
            {deepest > crossed && <span><i className="swatch swatch--deepest" />terdalam</span>}
          </div>
          <p className="binstrip__caption">{describeDepth(depth)}</p>
        </>
      )}
    </figure>
  );
}
