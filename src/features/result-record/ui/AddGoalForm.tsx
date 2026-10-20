"use client";

import { useActionState } from "react";
import type { ActionState } from "@/shared/ui";

type Person = { id: string; realName: string };

type Props = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  matchId: string;
  quarter: number;
  /** 그 쿼터에 뛴 사람(먼저 보인다) */
  played: Person[];
  /** 그 밖의 멤버 */
  others: Person[];
};

const select = "h-9 w-full rounded-lg border border-border bg-bg-base px-2 text-sm";

function People({ played, others }: { played: Person[]; others: Person[] }) {
  return (
    <>
      {played.length > 0 && (
        <optgroup label="이 쿼터 출전">
          {played.map((person) => (
            <option key={person.id} value={person.id}>
              {person.realName}
            </option>
          ))}
        </optgroup>
      )}
      {others.length > 0 && (
        <optgroup label="그 밖">
          {others.map((person) => (
            <option key={person.id} value={person.id}>
              {person.realName}
            </option>
          ))}
        </optgroup>
      )}
    </>
  );
}

/** 골 하나 남기기. 득점자를 모르거나 상대 자책골이면 "모름"으로 둔다. */
export default function AddGoalForm({ action, matchId, quarter, played, others }: Props) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-1.5">
      <input type="hidden" name="matchId" value={matchId} />
      <input type="hidden" name="quarter" value={quarter} />
      <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
        <label className="sr-only" htmlFor={`scorer-${quarter}`}>
          {quarter}쿼터 득점
        </label>
        <select id={`scorer-${quarter}`} name="scorerId" defaultValue="" className={select}>
          <option value="">득점자 모름 · 상대 자책골</option>
          <People played={played} others={others} />
        </select>
        <label className="sr-only" htmlFor={`assist-${quarter}`}>
          {quarter}쿼터 도움
        </label>
        <select id={`assist-${quarter}`} name="assistId" defaultValue="" className={select}>
          <option value="">도움 없음</option>
          <People played={played} others={others} />
        </select>
        <button
          type="submit"
          disabled={pending}
          className="h-9 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-contrast disabled:opacity-50"
        >
          골 추가
        </button>
      </div>
      {state.error && (
        <p role="alert" className="text-xs text-danger">
          {state.error}
        </p>
      )}
    </form>
  );
}
