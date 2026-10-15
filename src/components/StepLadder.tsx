import type { Step, StepStatus } from "../types";
import { duration, useNow } from "../format";

const STATUS_WORD: Record<StepStatus, string> = {
  running: "Berjalan",
  done: "Selesai",
  skipped: "Dilewati",
  failed: "Gagal",
};

function Rung({ step, nested, aiInCard }: { step: Step; nested?: boolean; aiInCard?: boolean }) {
  const now = useNow();
  const elapsed = (step.endedAt ?? now) - step.startedAt;
  return (
    <li className={`rung rung--${step.status}${nested ? " rung--nested" : ""}`}>
      <span className="rung__mark" aria-hidden="true" />
      <div className="rung__body">
        <div className="rung__head">
          <span className="rung__label">{step.label}</span>
          <span className="rung__status">
            {STATUS_WORD[step.status]}
            {step.status === "running" ? `, ${duration(elapsed)}` : ""}
          </span>
        </div>
        {step.detail && <p className="rung__detail">{step.detail}</p>}
        {aiInCard && step.key === "ai" && step.children.length > 0 && (
          <p className="rung__detail rung__detail--hint">
            Jejak {step.children.length} langkah AI ada di kartu Keputusan AI.
          </p>
        )}
        {!(aiInCard && step.key === "ai") && step.children.length > 0 && (
          <ol className="ladder ladder--nested">
            {step.children.map((c) => (
              <Rung key={c.id} step={c} nested />
            ))}
          </ol>
        )}
      </div>
    </li>
  );
}

/**
 * Each cycle step is one rung of the ladder (the "anak tangga" motif from DESIGN.md).
 * `aiInCard`: the AI step's trace is already shown in the decision card, so only its summary appears here.
 */
export function StepLadder({ steps, aiInCard }: { steps: Step[]; aiInCard?: boolean }) {
  if (steps.length === 0) {
    return <p className="muted">Siklus baru dimulai, langkah pertama sedang disiapkan.</p>;
  }
  return (
    <ol className="ladder">
      {steps.map((s) => (
        <Rung key={s.id} step={s} aiInCard={aiInCard} />
      ))}
    </ol>
  );
}
