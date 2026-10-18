import { useEffect, useState, type ReactNode } from "react";
import { api } from "../api";
import type { Cycle, JournalEntry } from "../types";
import { IconClaim, IconClose, IconHalt, IconPlus, IconSkip } from "./Icons";
import { StepLadder } from "./StepLadder";
import { STRATEGY_LABEL, clock, closeReasonLabel, dayLabel, duration, signed, sol, tone } from "../format";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Disclosure } from "@/components/Disclosure";

type Filter = "all" | JournalEntry["type"];

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Semua" },
  { id: "open", label: "Dibuka" },
  { id: "close", label: "Ditutup" },
  { id: "claim", label: "Claim" },
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
    return <span className={`arow__amount num--${tone(e.realizedSol)}`}>{signed(e.realizedSol, 4)}</span>;
  }
  if (e.type === "claim" && e.sol !== undefined) {
    return <span className={`arow__amount num--${tone(e.sol)}`}>{signed(e.sol, 4)}</span>;
  }
  if (e.type === "open" && e.depositSol !== undefined) {
    return <span className="arow__amount">{sol(e.depositSol)}</span>;
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

function Journal({ refreshKey }: { refreshKey: number }) {
  const [entries, setEntries] = useState<JournalEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let alive = true;
    api
      .journal(100, filter === "all" ? undefined : filter)
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
    <>
      <ToggleGroup
        type="single"
        value={filter}
        onValueChange={(v) => v && pick(v as Filter)}
        variant="outline"
        size="sm"
        className="mb-2.5 flex-wrap justify-start gap-1"
        aria-label="Saring jurnal"
      >
        {FILTERS.map((f) => (
          <ToggleGroupItem
            key={f.id}
            value={f.id}
            className="h-7 rounded-full! border! px-2.5 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            {f.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <div className="activity__scroll">
        {error && !entries && (
          <div className="empty" role="alert">
            <p className="empty__title">Jurnal gagal dimuat.</p>
            <p className="muted">{error}</p>
            <Button type="button" size="sm" variant="outline" onClick={() => setReload((x) => x + 1)}>
              Muat ulang jurnal
            </Button>
          </div>
        )}
        {!error && !entries && (
          <p className="muted panel__pad" role="status">
            Memuat jurnal...
          </p>
        )}
        {entries && entries.length === 0 && (
          <div className="empty">
            <p className="empty__title">{filter === "all" ? "Jurnal masih kosong." : "Tidak ada catatan untuk saringan ini."}</p>
            <p className="muted">Posisi dibuka, ditutup, claim fee, dan kandidat yang dilewati tercatat di sini.</p>
          </div>
        )}
        {entries &&
          byDay(entries).map((g) => (
            <section key={g.day} className="aday" aria-label={g.day}>
              <h3 className="aday__title">{g.day}</h3>
              <ol className="alist">
                {g.items.map((e, i) => {
                  const t = TYPE[e.type];
                  return (
                    <li key={`${e.ts}-${i}`} className="arow">
                      <span className={`avatar avatar--sm avatar--${t.tint}`} aria-hidden="true">
                        {t.icon}
                      </span>
                      <span className="arow__main">
                        <span className="arow__title">
                          {t.label}
                          {e.pool ? <span className="arow__pool"> {e.pool}</span> : null}
                        </span>
                        <span className="arow__text">{detail(e)}</span>
                      </span>
                      <span className="arow__end">
                        <Amount e={e} />
                        <time className="arow__time" dateTime={e.ts}>
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
    </>
  );
}

/** One-line summary of a finished cycle. */
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
  const gate = c.steps.find((s) => s.key === "gate" && s.status === "skipped");
  if (gate?.detail) return gate.detail;
  return "Tidak ada posisi baru";
}

function Cycles({ cycles }: { cycles: Cycle[] }) {
  const earlier = cycles.filter((c) => c.status !== "running").reverse();
  if (earlier.length === 0) {
    return (
      <div className="empty">
        <p className="empty__title">Belum ada siklus selesai.</p>
        <p className="muted">Ringkasan tiap siklus muncul di sini begitu kucing selesai bekerja.</p>
      </div>
    );
  }
  return (
    <div className="activity__scroll">
      <ul className="alist">
        {earlier.map((c) => (
          <li key={c.n}>
            <Disclosure className="cycle-item" triggerClassName="arow" chevron={false} title={<><span className={`avatar avatar--sm avatar--${c.status === "failed" ? "down" : "neutral"}`}>{c.n}</span>
                <span className="arow__main">
                  <span className="arow__title">{cycleSummary(c)}</span>
                  <span className="arow__text">Mulai {clock(c.startedAt)}</span>
                </span>
                <span className="arow__end">
                  <span className="arow__time">{c.endedAt ? duration(c.endedAt - c.startedAt) : ""}</span>
                </span></>}>
              <div className="cycle-item__body">
                <StepLadder steps={c.steps} />
              </div>
            </Disclosure>
          </li>
        ))}
      </ul>
    </div>
  );
}

type View = "journal" | "cycles";

export function ActivityPanel({ cycles, refreshKey }: { cycles: Cycle[]; refreshKey: number }) {
  const [view, setView] = useState<View>("journal");
  return (
    <Card role="region" id="aktivitas" className="panel activity" aria-labelledby="activity-title">
      <header className="panel__head">
        <h2 id="activity-title" className="panel__title">
          Aktivitas
        </h2>
        <Tabs value={view} onValueChange={(v) => setView(v as View)}>
          <TabsList aria-label="Tampilkan aktivitas">
            <TabsTrigger value="journal">Jurnal</TabsTrigger>
            <TabsTrigger value="cycles">Siklus</TabsTrigger>
          </TabsList>
        </Tabs>
      </header>
      {view === "journal" ? <Journal refreshKey={refreshKey} /> : <Cycles cycles={cycles} />}
    </Card>
  );
}
