"use client";

import { useActionState, useState } from "react";
import { SubmitButton, useToast, type ActionState } from "@/shared/ui";

type Candidate = { id: string; realName: string; jerseyNumber: number | null };

type Props = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  matchId: string;
  /** 뽑을 수 있는 사람(그 매치에 뛴 사람, 나는 빼고) */
  candidates: readonly Candidate[];
  /** 이미 뽑은 사람. 마감 전까지 바꾼다 */
  current: string | null;
};

/** MVP 투표(PLAN.md §10). 한 사람을 고른다. 큰 줄로, 휴대폰에서 한 번에 누르게 */
export default function MvpVoteForm({ action, matchId, candidates, current }: Props) {
  const [picked, setPicked] = useState(current ?? "");
  const { show, toast } = useToast();
  const [state, formAction] = useActionState<ActionState, FormData>(async (previous, formData) => {
    const result = await action(previous, formData);
    if (result.error === undefined) show("투표했어요. 결과는 마감 뒤에 나와요.");
    return result;
  }, {});

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="matchId" value={matchId} />
      <fieldset>
        <legend className="sr-only">MVP 고르기</legend>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {candidates.map((candidate) => (
            <label
              key={candidate.id}
              className="flex min-h-11 cursor-pointer items-center gap-2 rounded-box border border-border px-3 text-sm font-semibold has-checked:border-primary has-checked:bg-primary/15"
            >
              <input
                type="radio"
                name="candidateId"
                value={candidate.id}
                checked={picked === candidate.id}
                onChange={() => setPicked(candidate.id)}
                className="accent-primary"
              />
              <span className="min-w-0 truncate">
                {candidate.jerseyNumber !== null && `${candidate.jerseyNumber} `}
                {candidate.realName}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      {state.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      <SubmitButton
        disabled={picked === "" || picked === current}
        className="h-11 w-full rounded-box bg-primary text-sm font-semibold text-primary-contrast disabled:opacity-40"
      >
        {current === null ? "투표" : "바꾸기"}
      </SubmitButton>
      {toast}
    </form>
  );
}
