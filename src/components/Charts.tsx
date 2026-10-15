import { signed, tone } from "../format";

/**
 * Share of capital deployed as a thick single-color ring (DESIGN.md donut),
 * with a tick where the deployment cap sits.
 */
export function Donut({ pct, capPct }: { pct: number; capPct: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const shown = Math.min(100, Math.max(0, pct));
  const capAngle = (Math.min(100, capPct) / 100) * 2 * Math.PI - Math.PI / 2;
  const cx = 44 + Math.cos(capAngle) * r;
  const cy = 44 + Math.sin(capAngle) * r;
  return (
    <figure className="donut">
      <svg
        viewBox="0 0 88 88"
        role="img"
        aria-label={`Modal terpasang ${shown.toFixed(0)} persen, batas ${capPct} persen`}
      >
        <circle cx="44" cy="44" r={r} className="donut__track" />
        <circle
          cx="44"
          cy="44"
          r={r}
          className="donut__fill"
          strokeDasharray={`${(shown / 100) * c} ${c}`}
          transform="rotate(-90 44 44)"
        />
        <circle cx={cx} cy={cy} r="3" className="donut__cap" />
      </svg>
      <figcaption className="donut__center">
        <strong>{shown.toFixed(0)}%</strong>
        <span>dari {capPct}%</span>
      </figcaption>
    </figure>
  );
}

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
