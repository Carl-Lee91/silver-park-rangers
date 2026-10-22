"use client";

import { useActionState, type FormEvent } from "react";
import { SubmitButton } from "@/shared/ui";
import type { TemporaryPasswordState } from "../api/actions";

type Props = {
  action: (state: TemporaryPasswordState, formData: FormData) => Promise<TemporaryPasswordState>;
  memberId: string;
  memberName: string;
};

/**
 * 임시 비밀번호 만들기. 만든 비밀번호는 이 화면에 한 번만 보인다 — 다시 누르면 새로 만든다.
 * 클립보드는 카톡 인앱 브라우저에서 막힐 수 있어서, 글자를 그대로 보여 주고 길게 눌러 복사하게 한다.
 */
export default function TemporaryPasswordButton({ action, memberId, memberName }: Props) {
  const [state, formAction] = useActionState(action, {});

  const confirmFirst = (event: FormEvent<HTMLFormElement>) => {
    const ok = window.confirm(`${memberName}님의 비밀번호를 임시 비밀번호로 바꿀까요? 지금 비밀번호는 더 못 써요.`);
    if (!ok) event.preventDefault();
  };

  return (
    <form action={formAction} onSubmit={confirmFirst} className="col-span-2 flex flex-col gap-2">
      <input type="hidden" name="memberId" value={memberId} />
      <SubmitButton
        className="h-11 rounded-xl border border-border text-sm font-medium disabled:opacity-50"
      >
        임시 비밀번호 만들기
      </SubmitButton>
      {state.password && (
        <div role="status" className="rounded-lg bg-bg-subtle p-3 text-sm leading-6">
          <p className="select-all font-mono text-base font-bold">{state.password}</p>
          <p className="text-xs text-text-secondary">
            {memberName}님에게 알려 주세요. 이 비밀번호로 로그인한 뒤 내 정보에서 바꾸면 돼요.
          </p>
        </div>
      )}
      {state.error && (
        <p role="alert" className="text-xs text-danger">
          {state.error}
        </p>
      )}
    </form>
  );
}
