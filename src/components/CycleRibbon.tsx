import { useState } from "react";
import type { BotStatus, Cycle, Step } from "../types";
import { clock, duration, useNow } from "../format";
import { Badge } from "@/components/ui/badge";
import { Disclosure } from "@/components/Disclosure";
import { StepLadder } from "./StepLadder";

interface Desk {
  keys: string[];
  label: string;
}

/** Same order as the backend cycle (run-cycle.use-case.ts). */
const STEPS: Desk[] = [
  { keys: ["market"], label: "Cek SOL" },
  { keys: ["manage", "manual"], label: "Kelola posisi" },
  { keys: ["gate"], label: "Izin buka" },
  { keys: ["screen"], label: "Screening" },
  { keys: ["ai", "deep"], label: "Keputusan" },
  { keys: ["open"], label: "Buka posisi" },
];

type StepState = "running" | "done" | "skipped" | "failed" | "waiting" | "unused";

const STATE_WORD: Record<StepState, string> = {
  running: "Bekerja",
  done: "Selesai",
  skipped: "Dilewati",
  failed: "Gagal",
  waiting: "Menunggu giliran",
  unused: "Tidak dipakai",
};

function lastStep(cycle: Cycle | undefined, keys: string[]): Step | undefined {
  if (!cycle) return undefined;
  for (let i = cycle.steps.length - 1; i >= 0; i--) {
    if (keys.includes(cycle.steps[i].key)) return cycle.steps[i];
  }
  return undefined;
}

function stateOf(step: Step | undefined, cycle: Cycle | undefined): StepState {
  if (step) return step.status;
  return cycle?.status === "running" ? "waiting" : "unused";
}

function headline(status: BotStatus, now: number): string {
  switch (status.state) {
    case "running":
      return `Siklus #${status.cycle} berjalan`;
    case "sleeping":
      return `Siklus #${status.cycle + 1} mulai dalam ${duration((status.nextCycleAt ?? now) - now)}`;
    case "stopped":
      return "Bot berhenti. Posisi tetap terbuka.";
    default:
      return "Bot baru mulai";
  }
}

/**
 * The cycle as a compact stepper: each step is a clickable node, the running
 * one pulses. Clicking a node shows its detail below; the full tree stays in
 * the disclosure. Replaces the cat office.
 */
export function CycleRibbon({
  status,
  cycles,
  decisionMode,
}: {
  status: BotStatus;
  cycles: Cycle[];
  decisionMode: "ai" | "rules";
}) {
  const current = cycles[cycles.length - 1];
  const now = useNow();
  const steps = STEPS.map((d) => lastStep(current, d.keys));
  const states = steps.map((s) => stateOf(s, current));
  const runningIdx = states.indexOf("running");
  // Idle between cycles: point at the last step that actually did something.
  const lastActiveIdx = states.reduce((acc, s, i) => (s !== "unused" && s !== "waiting" ? i : acc), -1);
  const [picked, setPicked] = useState<number | null>(null);
  const selected = picked ?? (runningIdx >= 0 ? runningIdx : lastActiveIdx);

  const labelAt = (i: number) =>
    STEPS[i].keys.includes("ai") && decisionMode !== "ai" ? "Rule engine" : STEPS[i].label;
  const selStep = selected >= 0 ? steps[selected] : undefined;
  const selState = selected >= 0 ? states[selected] : "unused";

  return (
    <section className="cycle" aria-labelledby="cycle-title">
      <header className="cycle__head">
        <Badge variant="secondary" className={`state state--${status.state} bg-background`}>
          <span className="state__dot" aria-hidden="true" />
          {status.state === "running" ? "Berjalan" : status.state === "sleeping" ? "Menunggu" : "Status"}
        </Badge>
        <p id="cycle-title" className="cycle__title">
          {headline(status, now)}
          {status.state === "running" && runningIdx >= 0 ? <span className="cycle__now"> · {labelAt(runningIdx)}</span> : null}
        </p>
      </header>

      <ol className="cycle__steps" aria-label="Langkah siklus">
        {STEPS.map((d, i) => {
          const st = states[i];
          const step = steps[i];
          return (
            <li key={d.label} className={`cycle__step cycle__step--${st}${selected === i ? " is-selected" : ""}`}>
              <button
                type="button"
                className="cycle__btn"
                onClick={() => setPicked(i)}
                aria-pressed={selected === i}
                title={step?.detail ? `${labelAt(i)}: ${step.detail}` : labelAt(i)}
              >
                <span className={`cycle__dot cycle__dot--${st}`} aria-hidden="true">
                  {i + 1}
                </span>
                <span className="cycle__label">{labelAt(i)}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <p className="cycle__detail" aria-live="polite">
        {selected >= 0 ? (
          <>
            <strong>{labelAt(selected)}</strong> · {STATE_WORD[selState]}
            {selStep?.detail ? `: ${selStep.detail}` : "."}
          </>
        ) : current ? (
          "Belum ada langkah berjalan di siklus ini."
        ) : (
          "Belum ada siklus sejak backend dinyalakan."
        )}
      </p>

      {current && current.steps.length > 0 && (
        <Disclosure
          className="disclosure cycle__more"
          title={
            <>
              Rincian siklus #{current.n}, mulai {clock(current.startedAt)}
            </>
          }
        >
          <StepLadder steps={current.steps} />
        </Disclosure>
      )}
    </section>
  );
}
