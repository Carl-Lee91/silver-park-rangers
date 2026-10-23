import { OUTCOME_LABELS, type Outcome } from "../model/form";

const TONES: Record<Outcome, string> = {
  win: "bg-result-win text-bg-base",
  draw: "bg-result-draw text-text-primary",
  loss: "bg-result-loss text-bg-base",
};

const SIZES = { sm: "size-6 text-xs", md: "size-8 text-sm" } as const;

/** 승 · 무 · 패 칸(풋볼매니저 폼). 색과 글자를 같이 둔다 */
export default function ResultChip({ outcome, size = "md" }: { outcome: Outcome; size?: keyof typeof SIZES }) {
  return (
    <span
      data-outcome={outcome}
      className={`inline-flex shrink-0 items-center justify-center rounded-chip font-extrabold ${SIZES[size]} ${TONES[outcome]}`}
    >
      {OUTCOME_LABELS[outcome]}
    </span>
  );
}
