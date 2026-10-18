import { signed, tone } from "../format";

/** Realized result per closed position, oldest left: green above the line, rose below. */
export function ResultBars({ values }: { values: number[] }) {
  const max = Math.max(...values.map(Math.abs), 1e-9);
  const w = 10;
  const gap = 4;
  const width = values.length * (w + gap) - gap;
  const half = 22;
  const wins = values.filter((v) => v > 0).length;
  return (
    <svg
      className="bars"
      viewBox={`0 0 ${width} ${half * 2}`}
      preserveAspectRatio="xMinYMid meet"
      role="img"
      aria-label={`${values.length} posisi terakhir: ${wins} untung, ${values.length - wins} rugi atau impas`}
    >
      <line x1="0" x2={width} y1={half} y2={half} className="bars__base" />
      {values.map((v, i) => {
        const h = Math.max(2, (Math.abs(v) / max) * (half - 2));
        return (
          <rect
            key={i}
            x={i * (w + gap)}
            y={v >= 0 ? half - h : half}
            width={w}
            height={h}
            rx="3"
            className={`bars__${tone(v)}`}
          >
            <title>{signed(v, 4)}</title>
          </rect>
        );
      })}
    </svg>
  );
}
