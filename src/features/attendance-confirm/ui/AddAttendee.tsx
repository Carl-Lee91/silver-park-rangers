"use client";

import { useActionState } from "react";
import { SubmitButton, type ActionState } from "@/shared/ui";
import { setAttended } from "../api/actions";

/** 투표 없이 온 사람을 출석으로 더한다. */
export default function AddAttendee({ matchId, members }: { matchId: string; members: { id: string; realName: string }[] }) {
  const [state, formAction] = useActionState<ActionState, FormData>(setAttended, {});
  if (members.length === 0) return null;

  return (
    <form action={formAction} className="flex flex-col gap-1">
      <input type="hidden" name="matchId" value={matchId} />
      <input type="hidden" name="attended" value="true" />
      <label htmlFor="addAttendee" className="text-sm font-semibold">
        투표 없이 온 사람
      </label>
      <div className="flex gap-2">
        <select id="addAttendee" name="memberId" className="h-10 flex-1 rounded-lg border border-border bg-bg-base px-3 text-sm">
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.realName}
            </option>
          ))}
        </select>
        <SubmitButton
          className="h-10 rounded-lg border border-border px-3 text-sm font-medium disabled:opacity-50"
        >
          출석으로 추가
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
