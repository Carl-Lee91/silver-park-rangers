"use client";

import { useActionState, useState } from "react";
import { timeWindowOptions, type QuarterTime } from "@/entities/match";
import { SubmitButton, type ActionState } from "@/shared/ui";

type Props = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  matchId: string;
  memberId: string;
  name: string;
  schedule: readonly QuarterTime[];
  arriveAt: string | null;
  leaveAt: string | null;
};

const select = "h-9 w-full rounded-lg border border-border bg-bg-base px-2 text-sm";

/**
 * 당일 변동을 남긴다: 늦게 온 사람의 도착, 일찍 가거나 다친 사람의 떠나는 시간.
 * 저장하면 그 쿼터부터는 벤치에서 빠진다. 그다음 "N쿼터부터 다시 배치"를 누른다.
 */
export default function TimeWindowEditor({ action, matchId, memberId, name, schedule, arriveAt, leaveAt }: Props) {
  const [state, formAction] = useActionState(action, {});
  const [arrive, setArrive] = useState(arriveAt ?? "");
  const [leave, setLeave] = useState(leaveAt ?? "");
  const options = timeWindowOptions(schedule);
  const changed = arrive !== (arriveAt ?? "") || leave !== (leaveAt ?? "");

  return (
    <form action={formAction} className="flex flex-col gap-1.5 rounded-lg bg-bg-subtle p-3">
      <input type="hidden" name="matchId" value={matchId} />
      <input type="hidden" name="memberId" value={memberId} />
      <p className="text-xs font-semibold">당일 시간 바꾸기</p>
      <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
        <div>
          <label htmlFor={`arrive-${memberId}`} className="sr-only">
            {name} 도착
          </label>
          <select id={`arrive-${memberId}`} name="arriveAt" value={arrive} onChange={(event) => setArrive(event.target.value)} className={select}>
            {options.arrive.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`leave-${memberId}`} className="sr-only">
            {name} 떠나는 시간
          </label>
          <select id={`leave-${memberId}`} name="leaveAt" value={leave} onChange={(event) => setLeave(event.target.value)} className={select}>
            {options.leave.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <SubmitButton
          disabled={!changed}
          className="h-9 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-contrast disabled:opacity-40"
        >
          시간 저장
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
