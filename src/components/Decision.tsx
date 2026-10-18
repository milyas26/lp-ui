import type {
  BinStepData,
  Cycle,
  DecisionData,
  SimulationData,
  Snapshot,
  Step,
} from "../types";
import { STRATEGY_LABEL, SHAPE_LABEL, clock, duration, pct, sol, usd, useNow } from "../format";
import { Disclosure } from "@/components/Disclosure";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

/** Latest cycle that reached the AI decision step, newest first. `finished` skips one still running. */
export function latestAiStep(cycles: Cycle[], finished = false): { cycle: Cycle; step: Step } | undefined {
  for (let i = cycles.length - 1; i >= 0; i--) {
    const step = cycles[i].steps.find((s) => s.key === "ai");
    if (step && !(finished && step.status === "running")) return { cycle: cycles[i], step };
  }
  return undefined;
}

/** Newest child with this key, preferring one whose payload is about `pool`. */
function lastData<T>(step: Step, key: string, about?: (d: T) => boolean): T | undefined {
  const hits = step.children.filter((c) => c.key === key && c.data).map((c) => c.data as T);
  const matching = about ? hits.filter(about) : [];
  return matching[matching.length - 1] ?? hits[hits.length - 1];
}

const roundsOf = (step: Step) => step.children.filter((c) => c.key === "think").length;

/**
 * The AI loop running right now. Shown as a strip above the last finished
 * decision, so a new cycle never wipes what the user is reading.
 */
function Running({ cycle, step, alone }: { cycle: Cycle; step: Step; alone: boolean }) {
  const now = useNow();
  return (
    <div className={`running${alone ? " running--alone" : ""}`} role="status">
      <p className="running__line">
        <span className="running__marker" aria-hidden="true" />
        <span>
          <strong>Siklus #{cycle.n}: AI sedang menimbang</strong>, putaran {Math.max(1, roundsOf(step))},{" "}
          {duration(now - step.startedAt)}.
        </span>
      </p>
      {step.children.length > 0 && (
        <Disclosure className="disclosure decision__trace" defaultOpen={alone} title={<>Lihat langkah yang sedang berjalan ({step.children.length})</>}>
          <Trace steps={step.children} />
        </Disclosure>
      )}
    </div>
  );
}

function Verdict({ step, decision }: { step: Step; decision?: DecisionData }) {
  if (decision?.action === "open") {
    return (
      <div className="verdict verdict--open">
        <p className="verdict__eyebrow">Keputusan: buka posisi</p>
        <p className="verdict__title">{decision.name}</p>
        <ul className="specs" aria-label="Rincian posisi">
          <li>
            <span>Bin step</span>
            <strong>{decision.binStep}</strong>
          </li>
          <li>
            <span>Bentuk</span>
            <strong>
              {SHAPE_LABEL[decision.shape ?? ""] ?? decision.shape} -{decision.rangePct}%
            </strong>
          </li>
          <li>
            <span>Jumlah bin</span>
            <strong>{decision.bins}</strong>
          </li>
          <li>
            <span>Size</span>
            <strong>{sol(decision.sizeSol ?? 0, 2)}</strong>
          </li>
          <li>
            <span>Yakin</span>
            <strong>{Math.round((decision.confidence ?? 0) * 100)}%</strong>
          </li>
          <li>
            <span>SL / TP</span>
            <strong>
              -{decision.stopLossPct}% / +{decision.takeProfitPct}%
            </strong>
          </li>
        </ul>
        <p className="verdict__strategy">{STRATEGY_LABEL[decision.strategy ?? ""] ?? decision.strategy}</p>
        <p className="verdict__why">{decision.reasoning}</p>
      </div>
    );
  }
  if (decision?.action === "skip") {
    return (
      <div className="verdict verdict--skip">
        <p className="verdict__eyebrow">Keputusan</p>
        <p className="verdict__title">Tidak buka posisi</p>
        <p className="verdict__why">{decision.reasoning}</p>
      </div>
    );
  }
  return (
    <div className={`verdict verdict--${step.status === "failed" ? "failed" : "skip"}`}>
      <p className="verdict__eyebrow">{step.status === "failed" ? "AI gagal" : "Keputusan"}</p>
      <p className="verdict__title">Tidak buka posisi</p>
      {step.detail && <p className="verdict__why">{step.detail}</p>}
    </div>
  );
}

/** Each pool drawn as the bins it needs for the same range, against the max-bins line (the bin motif). */
function BinStepCompare({ data, chosen, maxBins }: { data: BinStepData; chosen?: string; maxBins: number }) {
  const scale = Math.max(maxBins, ...data.rows.map((r) => r.bins));
  return (
    <Disclosure className="disclosure compare" title={<>Bin step dibandingkan untuk range -{Math.round(data.rangePct)}% ({data.rows.length} pool)</>}>
      <ul className="compare__list">
        {data.rows.map((r) => {
          const picked = r.address === chosen;
          return (
            <li key={r.address} className={`compare__row${picked ? " is-picked" : ""}${r.fits ? "" : " is-over"}`}>
              <div className="compare__head">
                <span className="compare__step">Bin step {r.binStep}</span>
                <span className="compare__tag">
                  {picked ? "Dipilih" : r.fits ? `${r.bins} bin` : "Tidak muat"}
                </span>
              </div>
              <svg
                className="compare__bins"
                viewBox={`0 0 ${scale} 6`}
                preserveAspectRatio="none"
                role="img"
                aria-label={`${r.bins} bin dibutuhkan, batas ${maxBins} bin`}
              >
                {Array.from({ length: Math.min(r.bins, scale) }, (_, i) => (
                  <rect key={i} x={i + 0.18} y={0} width={0.64} height={6} className="cbin" />
                ))}
                <rect x={maxBins - 0.2} y={0} width={0.4} height={6} className="cbin-limit" />
              </svg>
              <p className="compare__meta">
                {r.shrunk ? `Range dikecilkan ke -${Math.round(r.rangePct)}% supaya muat. ` : ""}
                {r.bins} bin, {r.tx === "extended" ? "extended position" : "1 transaksi"}. TVL {usd(r.tvlUsd)}, volume 1
                jam {usd(r.volume1hUsd)}, fee/TVL 24 jam {r.feeTvl24hPct}%, base fee {r.baseFeePct}%
                {r.rentSol !== undefined ? `, rent bin array ${r.rentSol} SOL` : ""}.
              </p>
            </li>
          );
        })}
      </ul>
      <p className="compare__legend muted">Garis tegak = batas {maxBins} bin per posisi.</p>
    </Disclosure>
  );
}

function Simulation({ data }: { data: SimulationData }) {
  return (
    <Disclosure className="disclosure sim" title={<>Simulasi {SHAPE_LABEL[data.shape] ?? data.shape} -{data.rangePct}%, {sol(data.sizeSol, 2)} di bin step{" "}
        {data.binStep}</>}>
      <table className="sim__table">
        <caption className="visually-hidden">Nilai posisi kalau harga turun, sebelum fee</caption>
        <thead>
          <tr>
            <th scope="col">Harga turun</th>
            <th scope="col">Range terisi</th>
            <th scope="col">Nilai</th>
            <th scope="col">P&amp;L</th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((r) => (
            <tr key={r.dropPct}>
              <td>-{r.dropPct}%</td>
              <td>{r.filledPct}%</td>
              <td>{r.valueSol.toFixed(3)}</td>
              <td className={`num--${r.pnlPct < 0 ? "down" : r.pnlPct > 0 ? "up" : "flat"}`}>{pct(r.pnlPct)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="muted">
        Sebelum fee. Estimasi fee {data.feePerDaySol} SOL per hari selama harga di dalam range.
      </p>
    </Disclosure>
  );
}

const TRACE_KIND: Record<string, string> = {
  think: "Pertimbangan",
  tool: "Data",
  binsteps: "Data",
  simulate: "Data",
  guard: "Pagar",
  decision: "Keputusan",
};

function Trace({ steps }: { steps: Step[] }) {
  return (
    <ol className="trace">
      {steps.map((s) => (
        <li key={s.id} className={`trace__item trace--${s.key} trace--${s.status}`}>
          <span className="trace__mark" aria-hidden="true" />
          <div className="trace__body">
            <p className="trace__head">
              <span className="trace__kind">{TRACE_KIND[s.key] ?? "Langkah"}</span>
              <span className="trace__label">{s.label}</span>
            </p>
            {s.detail && <p className="trace__detail">{s.detail}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}

interface Props {
  snapshot: Snapshot;
  cycles: Cycle[];
}

export function DecisionCard({ snapshot, cycles }: Props) {
  const found = latestAiStep(cycles, true);
  const live = latestAiStep(cycles);
  const running = live && live.step.status === "running" ? live : undefined;

  if (snapshot.decisionMode !== "ai") {
    return (
      <Card role="region" className="panel decision" aria-labelledby="decision-title">
        <div className="card__head">
          <h2 id="decision-title" className="card__title">Keputusan entry</h2>
          <Badge variant="outline">Rule engine</Badge>
        </div>
        <p>
          AI tidak aktif, jadi pool, bin step, range, dan size dipilih oleh rule engine playbook. Rinciannya ada di
          langkah "Analisa kandidat".
        </p>
        <p className="muted">Isi DEEPSEEK_API_KEY di backend/.env lalu jalankan ulang backend untuk menyalakan AI.</p>
      </Card>
    );
  }

  if (!found) {
    return (
      <Card role="region" className="panel decision" aria-labelledby="decision-title">
        <div className="card__head">
          <h2 id="decision-title" className="card__title">Keputusan AI</h2>
          <Badge variant="outline">{snapshot.llm}</Badge>
        </div>
        {running && <Running cycle={running.cycle} step={running.step} alone />}
        <p>Belum ada keputusan selesai sejak backend dinyalakan.</p>
        <p className="muted">
          AI dipanggil setelah screening menemukan kandidat dan ada slot serta budget. Kalau izin buka posisi tertutup,
          alasannya ada di langkah "Cek izin buka posisi baru".
        </p>
      </Card>
    );
  }

  const { cycle, step } = found;
  const decision = lastData<DecisionData>(step, "decision");
  const picked = decision?.pool;
  const binsteps = lastData<BinStepData>(step, "binsteps", (d) => d.rows.some((r) => r.address === picked));
  const sim = lastData<SimulationData>(step, "simulate", (d) => d.pool === picked);
  const rounds = roundsOf(step);

  return (
    <Card role="region" className="panel decision" aria-labelledby="decision-title">
      <div className="card__head">
        <h2 id="decision-title" className="card__title">Keputusan AI</h2>
        <Badge variant="outline">{snapshot.llm}</Badge>
      </div>
      {running && <Running cycle={running.cycle} step={running.step} alone={false} />}
      <p className="decision__when muted">
        Keputusan terakhir: siklus #{cycle.n}, {clock(step.startedAt)}, {rounds} putaran.
      </p>

      <Verdict step={step} decision={decision} />

      {binsteps && binsteps.rows.length > 0 && (
        <BinStepCompare data={binsteps} chosen={decision?.pool} maxBins={snapshot.limits.maxBinsPerPosition} />
      )}
      {sim && <Simulation data={sim} />}

      {step.children.length > 0 && (
        <Disclosure className="disclosure decision__trace" title={<>Jejak keputusan: {rounds} putaran, {step.children.filter((c) => c.key !== "think").length} langkah data</>}>
          <Trace steps={step.children} />
        </Disclosure>
      )}
    </Card>
  );
}
