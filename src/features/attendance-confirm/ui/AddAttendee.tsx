"use client";

import { useActionState } from "react";
import { type ActionState, Select, SubmitButton } from "@/shared/ui";
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
        <Select id="addAttendee" name="memberId" fieldSize="md" className="flex-1">
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.realName}
            </option>
          ))}
        </Select>
        <SubmitButton
          className="h-11 shrink-0 rounded-xl border border-border px-4 text-sm font-medium disabled:opacity-50"
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
