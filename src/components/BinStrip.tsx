interface Props {
  bins: number;
  /** 0 = price at/above the top of the range, 1 = at the bottom, >1 below it. */
  depth: number;
  /** Deepest point reached so far, same scale. */
  maxDepth: number;
  rangePct: number;
}

export function describeDepth(depth: number): string {
  if (depth <= 0) return "Harga di atas range, posisi belum terisi.";
  if (depth > 1) return "Harga sudah keluar di bawah range.";
  return `Harga ${(depth * 100).toFixed(0)}% masuk ke dalam range.`;
}

/**
 * The position's bins left (top of range, just under entry price) to right
 * (bottom of range). Filled bins are the ones price has walked through.
 */
export function BinStrip({ bins, depth, maxDepth, rangePct }: Props) {
  const n = Math.max(1, Math.min(bins, 200));
  const filled = Math.round(Math.min(Math.max(depth, 0), 1) * n);
  const deepest = Math.round(Math.min(Math.max(maxDepth, 0), 1) * n);
  const markerX = Math.min(Math.max(depth, 0), 1) * n;
  const label =
    `${describeDepth(depth)} Range ${n} bin sampai -${rangePct.toFixed(0)}%.` +
    (deepest > filled ? ` Paling dalam pernah ${((maxDepth) * 100).toFixed(0)}%.` : "");

  return (
    <figure className="binstrip">
      <svg viewBox={`0 0 ${n} 10`} preserveAspectRatio="none" role="img" aria-label={label}>
        {Array.from({ length: n }, (_, i) => (
          <rect
            key={i}
            x={i + 0.15}
            y={i < filled ? 1 : i < deepest ? 4 : 6}
            width={0.7}
            height={i < filled ? 9 : i < deepest ? 6 : 4}
            className={i < filled ? "bin bin--crossed" : i < deepest ? "bin bin--visited" : "bin"}
          />
        ))}
        {depth > 0 && depth <= 1 && <rect x={markerX - 0.25} y={0} width={0.5} height={10} className="bin-marker" />}
      </svg>
      <figcaption className="binstrip__scale">
        <span>atas range</span>
        <span>-{rangePct.toFixed(0)}%</span>
      </figcaption>
      <p className="binstrip__caption">{describeDepth(depth)}</p>
    </figure>
  );
}
