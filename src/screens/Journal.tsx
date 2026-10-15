import { useEffect, useState, type ReactNode } from "react";
import { api } from "../api";
import type { JournalEntry } from "../types";
import { IconClaim, IconClose, IconHalt, IconPlus, IconSkip } from "../components/Icons";
import { STRATEGY_LABEL, clock, closeReasonLabel, dayLabel, signed, sol, tone } from "../format";

type Filter = "all" | JournalEntry["type"];

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Semua" },
  { id: "open", label: "Dibuka" },
  { id: "close", label: "Ditutup" },
  { id: "claim", label: "Claim fee" },
  { id: "skip", label: "Dilewati" },
];

const TYPE: Record<JournalEntry["type"], { label: string; icon: ReactNode; tint: string }> = {
  open: { label: "Dibuka", icon: <IconPlus />, tint: "brand" },
  close: { label: "Ditutup", icon: <IconClose />, tint: "neutral" },
  claim: { label: "Claim fee", icon: <IconClaim />, tint: "up" },
  skip: { label: "Dilewati", icon: <IconSkip />, tint: "neutral" },
  halt: { label: "Tutup semua", icon: <IconHalt />, tint: "down" },
};

function detail(e: JournalEntry): string {
  switch (e.type) {
    case "open":
      return (
        `${STRATEGY_LABEL[e.strategy ?? ""] ?? e.strategy}, ${e.shape} -${e.rangePct?.toFixed(0)}%` +
        `${e.binStep !== undefined ? `, bin step ${e.binStep}` : ""}${e.paper ? ", paper" : ""}` +
        (e.decidedBy === "ai"
          ? `. Dipilih AI${e.confidence !== undefined ? `, yakin ${Math.round(e.confidence * 100)}%` : ""}.`
          : e.decidedBy === "rules"
            ? ". Dipilih rule engine."
            : "")
      );
    case "close":
      return `${closeReasonLabel(e.reason)}${e.heldMin !== undefined ? `, setelah ${e.heldMin} menit` : ""}`;
    case "claim":
      return "Fee masuk ke wallet";
    case "skip":
      return e.why ?? "";
    default:
      return e.reason ?? "";
  }
}

function Amount({ e }: { e: JournalEntry }) {
  if (e.type === "close" && e.realizedSol !== undefined) {
    return <span className={`row__amount num--${tone(e.realizedSol)}`}>{signed(e.realizedSol, 4)}</span>;
  }
  if (e.type === "claim" && e.sol !== undefined) {
    return <span className={`row__amount num--${tone(e.sol)}`}>{signed(e.sol, 4)}</span>;
  }
  if (e.type === "open" && e.depositSol !== undefined) {
    return <span className="row__amount">{sol(e.depositSol)}</span>;
  }
  return null;
}

/** Entries arrive newest first; keep that order and cut them into days. */
function byDay(entries: JournalEntry[]): { day: string; items: JournalEntry[] }[] {
  const out: { day: string; items: JournalEntry[] }[] = [];
  for (const e of entries) {
    const day = dayLabel(e.ts);
    const last = out[out.length - 1];
    if (last && last.day === day) last.items.push(e);
    else out.push({ day, items: [e] });
  }
  return out;
}

export function JournalScreen({ refreshKey }: { refreshKey: number }) {
  const [entries, setEntries] = useState<JournalEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let alive = true;
    api
      .journal(150, filter === "all" ? undefined : filter)
      .then((r) => {
        if (!alive) return;
        setEntries(r.entries);
        setError(null);
      })
      .catch((e: Error) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [refreshKey, reload, filter]);

  const pick = (f: Filter) => {
    if (f === filter) return;
    setEntries(null);
    setError(null);
    setFilter(f);
  };

  return (
    <div className="screen">
      <header className="page-head">
        <div>
          <h1 className="page-title">Jurnal</h1>
          <p className="page-sub">Semua yang bot lakukan dan alasannya. Diperbarui tiap siklus selesai.</p>
        </div>
      </header>

      <div className="filters" role="group" aria-label="Saring jurnal">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className="filter"
            aria-pressed={filter === f.id}
            onClick={() => pick(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && !entries && (
        <div className="empty" role="alert">
          <p className="empty__title">Jurnal gagal dimuat.</p>
          <p className="muted">{error}</p>
          <button type="button" className="btn btn--secondary" onClick={() => setReload((x) => x + 1)}>
            Muat ulang jurnal
          </button>
        </div>
      )}
      {!error && !entries && (
        <p className="muted" role="status">
          Memuat jurnal...
        </p>
      )}
      {entries && entries.length === 0 && (
        <div className="empty">
          <p className="empty__title">{filter === "all" ? "Jurnal masih kosong." : "Tidak ada catatan untuk saringan ini."}</p>
          <p className="muted">
            Setiap posisi dibuka, ditutup, claim fee, dan kandidat yang dilewati beserta alasannya tercatat di sini.
          </p>
        </div>
      )}
      {entries &&
        byDay(entries).map((g) => (
          <section key={g.day} className="day" aria-label={g.day}>
            <h2 className="day__title">{g.day}</h2>
            <ol className="rows">
              {g.items.map((e, i) => {
                const t = TYPE[e.type];
                return (
                  <li key={`${e.ts}-${i}`} className="row row--top">
                    <span className={`avatar avatar--${t.tint}`} aria-hidden="true">
                      {t.icon}
                    </span>
                    <span className="row__main">
                      <span className="row__title">
                        {t.label}
                        {e.pool ? <span className="row__pool"> {e.pool}</span> : null}
                      </span>
                      <span className="row__text">{detail(e)}</span>
                    </span>
                    <span className="row__end">
                      <Amount e={e} />
                      <time className="row__meta" dateTime={e.ts}>
                        {clock(e.ts)}
                      </time>
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
    </div>
  );
}
