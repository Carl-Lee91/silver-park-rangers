"use client";

import { useActionState } from "react";
import { SubmitButton, type ActionState } from "@/shared/ui";

type Props = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  matchId: string;
  quarter: number;
  /** 남긴 상대 점수. 안 남겼으면 undefined */
  theirs: number | undefined;
  /** 그 쿼터에 우리 골을 남겼는지. 남겼으면 결과가 있는 쿼터라 상대 점수는 0 으로 본다 */
  hasGoals: boolean;
};

const step = "flex size-11 items-center justify-center rounded-box border border-border text-lg font-semibold disabled:opacity-30";

/**
 * 상대 점수: 흔히 쓰는 `− 숫자 +`. 누를 때마다 바로 남긴다(서버 RPC).
 * 결과가 하나도 없는 쿼터는 숫자 자리에 흐린 0 을 두고, 0:0 으로 끝났으면 "무실점"으로 남긴다 —
 * 점수도 골도 없는 쿼터는 전적에 넣지 않으므로(PLAN.md §10 경기 결과) 0 을 따로 남겨야 한다.
 */
export default function TheirScoreStepper({ action, matchId, quarter, theirs, hasGoals }: Props) {
  const [state, formAction] = useActionState(action, {});
  const recorded = theirs !== undefined || hasGoals;
  const value = theirs ?? 0;

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="matchId" value={matchId} />
      <input type="hidden" name="quarter" value={quarter} />
      <div className="flex items-center gap-2">
        {!recorded && (
          <SubmitButton name="theirScore" value="0" className="h-11 rounded-box border border-border-strong bg-bg-subtle px-3 text-sm font-medium">
            무실점
          </SubmitButton>
        )}
        <SubmitButton name="theirScore" value={String(Math.max(0, value - 1))} disabled={value === 0} aria-label="상대 점수 1 줄이기" className={step}>
          −
        </SubmitButton>
        <output
          aria-label={`${quarter}쿼터 상대 점수`}
          aria-live="polite"
          className={`w-8 text-center text-lg font-semibold tabular-nums ${recorded ? "" : "text-text-tertiary"}`}
        >
          {value}
        </output>
        <SubmitButton name="theirScore" value={String(value + 1)} aria-label="상대 점수 1 늘리기" className={step}>
          +
        </SubmitButton>
      </div>
      {state.error && (
        <p role="alert" className="text-xs text-danger">
          {state.error}
        </p>
      )}
    </form>
  );
}
