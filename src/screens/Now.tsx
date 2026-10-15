import type { BotStatus, Cycle, Snapshot, Step } from "../types";
import { StepLadder } from "../components/StepLadder";
import { DecisionCard, latestAiStep } from "../components/Decision";
import { Donut, ResultBars } from "../components/Charts";
import { useClosed } from "../useClosed";
import type { BalanceFeed } from "../useWalletBalance";
import { clock, duration, greeting, longDate, pct, signed, sol, tone, useNow } from "../format";

/** "Parent: child" for the deepest running step, so a bare pool name still says what is happening. */
function runningLabel(steps: Step[]): string | undefined {
  for (const s of steps) {
    if (s.status !== "running") continue;
    const child = s.children.find((c) => c.status === "running");
    return child ? `${s.label}: ${child.label}` : s.label;
  }
  return undefined;
}

function headline(status: BotStatus, current: Cycle | undefined, now: number): { title: string; sub: string } {
  switch (status.state) {
    case "running": {
      const label = current ? runningLabel(current.steps) : undefined;
      return {
        title: label ?? "Menjalankan siklus",
        sub: `Siklus #${status.cycle} berjalan ${current ? duration(now - current.startedAt) : ""}`,
      };
    }
    case "sleeping":
      return {
        title: `Siklus #${status.cycle + 1} mulai dalam ${duration((status.nextCycleAt ?? now) - now)}`,
        sub: status.lastCycleAt ? `Siklus terakhir selesai ${clock(status.lastCycleAt)}` : "Menunggu jadwal",
      };
    case "stopped":
      return { title: "Bot berhenti", sub: "Posisi tetap terbuka. Jalankan ulang backend untuk lanjut." };
    default:
      return { title: "Bot baru mulai", sub: "Siklus pertama sedang disiapkan." };
  }
}

/** One-line summary of a finished cycle for the history list. */
function cycleSummary(c: Cycle): string {
  if (c.status === "failed") return "Siklus gagal";
  const opened = c.steps.find((s) => s.key === "open" && s.status === "done");
  if (opened) return opened.label;
  const closes = c.steps
    .find((s) => s.key === "manage")
    ?.children.filter((p) => p.detail?.startsWith("Ditutup")).length;
  if (closes) return `${closes} posisi ditutup`;
  const failed = c.steps.find((s) => s.status === "failed");
  if (failed) return `${failed.label}: gagal`;
  if (c.steps.some((s) => s.key === "ai")) return "AI memutuskan tidak buka posisi";
  return "Tidak ada posisi baru";
}

/** The one warm block on the screen: what the bot is doing and how today went. */
function Hero({ status, snapshot, current }: { status: BotStatus; snapshot: Snapshot; current?: Cycle }) {
  const now = useNow();
  const { title, sub } = headline(status, current, now);
  const today = snapshot.day.realizedSol;
  const t = tone(today);

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__activity">
        <p className={`state state--${status.state}`}>
          <span className="state__dot" aria-hidden="true" />
          {status.state === "running" ? "Sedang berjalan" : status.state === "sleeping" ? "Menunggu" : "Status"}
        </p>
        <h2 id="hero-title" className="hero__title">
          {title}
        </h2>
        <p className="hero__sub">{sub}</p>
      </div>

      <div className="hero__today">
        <p className="hero__label">Hasil hari ini</p>
        <p className="hero__amount">
          {signed(today, 4, "")}
          <span className="hero__unit">SOL</span>
        </p>
        <p className="hero__chips">
          {t !== "flat" && <span className={`hero-chip hero-chip--${t}`}>{t === "up" ? "Untung" : "Rugi"}</span>}
          <span className="hero-chip">
            {snapshot.day.opened} dibuka, {snapshot.day.closed} ditutup
          </span>
          <span className="hero-chip">Batas rugi {sol(snapshot.limits.dailyLossLimitSol, 2)}</span>
        </p>
      </div>
    </section>
  );
}

function CapitalCard({ snapshot, balance }: { snapshot: Snapshot; balance: BalanceFeed }) {
  const cap = snapshot.limits.maxDeployedPct;
  const free = balance.sol;
  // Only real positions count as deployed capital; paper ones hold no SOL.
  const deployed = snapshot.positions
    .filter((p) => !p.paper)
    .reduce((a, p) => a + (p.lastValueSol ?? p.depositSol), 0);
  const total = free === null ? null : free + deployed;
  const usedPct = total && total > 0 ? (deployed / total) * 100 : 0;
  return (
    <section className="tile" aria-labelledby="capital-title">
      <h2 id="capital-title" className="tile__label">
        Modal
      </h2>
      {total === null ? (
        <p className="muted">{balance.error ? `Saldo wallet tak terbaca: ${balance.error}` : "Memuat saldo wallet..."}</p>
      ) : (
        <div className="capital">
          <div>
            <p className="tile__value">{total.toFixed(3)}</p>
            <p className="tile__unit">SOL total</p>
            <dl className="mini-facts">
              <div>
                <dt>Bebas</dt>
                <dd>{sol(free ?? 0)}</dd>
              </div>
              <div>
                <dt>Terpasang</dt>
                <dd>{sol(deployed)}</dd>
              </div>
            </dl>
          </div>
          <Donut pct={usedPct} capPct={cap} />
        </div>
      )}
    </section>
  );
}

function SlotsCard({ snapshot }: { snapshot: Snapshot }) {
  const used = snapshot.positions.length;
  const max = snapshot.limits.maxPositions;
  return (
    <section className="tile" aria-labelledby="slots-title">
      <h2 id="slots-title" className="tile__label">
        Slot posisi
      </h2>
      <p className="tile__value">
        {used}
        <span className="tile__of"> dari {max}</span>
      </p>
      <div className="slots" aria-hidden="true">
        {Array.from({ length: max }, (_, i) => (
          <span key={i} className={i < used ? "slot is-used" : "slot"} />
        ))}
      </div>
      <a className="tile__link" href="#posisi">
        {used > 0 ? "Lihat posisi terbuka" : "Lihat riwayat posisi"}
      </a>
    </section>
  );
}

function ResultsCard({ refreshKey }: { refreshKey: number }) {
  const { rows, error, reload } = useClosed(refreshKey, 12);
  const values = (rows ?? [])
    .map((r) => r.realizedSol)
    .filter((x): x is number => x !== null)
    .reverse();
  const total = values.reduce((a, x) => a + x, 0);

  return (
    <section className="tile" aria-labelledby="results-title">
      <h2 id="results-title" className="tile__label">
        Posisi terakhir ditutup
      </h2>
      {error && !rows ? (
        <div role="alert">
          <p className="muted">Gagal dimuat: {error}</p>
          <button type="button" className="btn btn--small" onClick={reload}>
            Muat ulang
          </button>
        </div>
      ) : !rows ? (
        <p className="muted" role="status">
          Memuat...
        </p>
      ) : values.length === 0 ? (
        <p className="muted">Belum ada posisi yang ditutup. Hasilnya muncul di sini begitu ada.</p>
      ) : (
        <>
          <p className={`tile__value num--${tone(total)}`}>{signed(total, 4, "")}</p>
          <p className="tile__unit">SOL dari {values.length} posisi</p>
          <ResultBars values={values} />
        </>
      )}
    </section>
  );
}

function MarketCard({ snapshot }: { snapshot: Snapshot }) {
  const m = snapshot.market;
  return (
    <section className="tile" aria-labelledby="market-title">
      <h2 id="market-title" className="tile__label">
        Harga SOL
      </h2>
      {m?.known ? (
        <>
          <dl className="mini-facts mini-facts--row">
            <div>
              <dt>1 jam</dt>
              <dd className={`num--${tone(m.solChange1h, 1)}`}>{pct(m.solChange1h)}</dd>
            </div>
            <div>
              <dt>24 jam</dt>
              <dd className={`num--${tone(m.solChange24h, 1)}`}>{pct(m.solChange24h)}</dd>
            </div>
          </dl>
          {m.solDumping && (
            <p className="tile__warn">SOL sedang turun tajam. Bot menutup posisi dan tidak membuka yang baru.</p>
          )}
        </>
      ) : (
        <p className="muted">Belum diketahui. Data harga diambil di awal tiap siklus.</p>
      )}
    </section>
  );
}

interface Props {
  status: BotStatus;
  snapshot: Snapshot;
  cycles: Cycle[];
  refreshKey: number;
  balance: BalanceFeed;
  onResume: () => void;
  resumeBusy: boolean;
}

export function NowScreen({ status, snapshot, cycles, refreshKey, balance, onResume, resumeBusy }: Props) {
  const current = cycles[cycles.length - 1];
  const earlier = cycles.slice(0, -1).reverse();
  const aiCycle = latestAiStep(cycles)?.cycle.n;

  return (
    <div className="screen">
      <header className="page-head">
        <div>
          <h1 className="page-title">{greeting()}</h1>
          <p className="page-sub">Kondisi bot untuk {longDate()}.</p>
        </div>
      </header>

      <div className="now">
        <div className="now__hero">
          <Hero status={status} snapshot={snapshot} current={current} />
          {status.openingPaused && (
            <div className="notice" role="status">
              <p>Buka posisi baru sedang dijeda. Posisi yang ada tetap dikelola dan bisa ditutup.</p>
              <button type="button" className="btn btn--primary" onClick={onResume} disabled={resumeBusy}>
                {resumeBusy ? "Menyimpan..." : "Lanjutkan buka posisi"}
              </button>
            </div>
          )}
        </div>

        <div className="now__rail">
          <CapitalCard snapshot={snapshot} balance={balance} />
          <SlotsCard snapshot={snapshot} />
          <ResultsCard refreshKey={refreshKey} />
          <MarketCard snapshot={snapshot} />
        </div>

        <div className="now__main">
          <DecisionCard snapshot={snapshot} cycles={cycles} />

          <section className="card" aria-labelledby="steps-title">
            <div className="card__head">
              <h2 id="steps-title" className="card__title">
                {current ? `Langkah siklus #${current.n}` : "Langkah siklus"}
              </h2>
              {current && <span className="card__meta">mulai {clock(current.startedAt)}</span>}
            </div>
            {current ? (
              <StepLadder steps={current.steps} aiInCard={aiCycle === current.n} />
            ) : (
              <p className="muted">
                Belum ada siklus sejak backend dinyalakan. Langkah akan muncul di sini begitu siklus pertama mulai.
              </p>
            )}
          </section>

          {earlier.length > 0 && (
            <section aria-labelledby="history-title">
              <div className="section-head">
                <h2 id="history-title" className="card__title">
                  Siklus sebelumnya
                </h2>
                <span className="card__meta">{earlier.length} terakhir</span>
              </div>
              <ul className="rows">
                {earlier.map((c) => (
                  <li key={c.n}>
                    <details className="row-item">
                      <summary className="row">
                        <span className={`avatar avatar--${c.status === "failed" ? "down" : "neutral"}`}>
                          {c.n}
                        </span>
                        <span className="row__main">
                          <span className="row__title">{cycleSummary(c)}</span>
                          <span className="row__meta">
                            Siklus #{c.n}, mulai {clock(c.startedAt)}
                          </span>
                        </span>
                        <span className="row__end row__end--muted">
                          {c.endedAt ? duration(c.endedAt - c.startedAt) : ""}
                        </span>
                      </summary>
                      <div className="row-item__body">
                        <StepLadder steps={c.steps} />
                      </div>
                    </details>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
