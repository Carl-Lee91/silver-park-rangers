"use client";

import { useActionState, useState } from "react";
import { SubmitButton, type ActionState } from "@/shared/ui";

type Props = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  matchId: string;
  memberId: string;
  name: string;
  note: string | null;
};

const MAX = 200;

/** 고른 선수의 이번 매치 특이사항. 비우고 저장하면 지운다. 관리자만 본다. */
export default function NoteEditor({ action, matchId, memberId, name, note }: Props) {
  const [state, formAction] = useActionState(action, {});
  const [text, setText] = useState(note ?? "");
  const changed = text.trim() !== (note ?? "");
  const id = `note-${memberId}`;

  return (
    <form action={formAction} className="flex flex-col gap-1.5 rounded-lg bg-bg-subtle p-3">
      <input type="hidden" name="matchId" value={matchId} />
      <input type="hidden" name="memberId" value={memberId} />
      <label htmlFor={id} className="text-xs font-semibold">
        {name} 특이사항
      </label>
      <textarea
        id={id}
        name="note"
        value={text}
        onChange={(event) => setText(event.target.value)}
        maxLength={MAX}
        rows={2}
        placeholder="예: 무릎 안 좋음 — 수비만"
        className="rounded-lg border border-border bg-bg-base px-3 py-2 text-sm"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-tertiary">
          관리자만 봐요 · {text.length}/{MAX}
        </span>
        <SubmitButton
          disabled={!changed}
          className="h-8 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-contrast disabled:opacity-40"
        >
          메모 저장
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
