"use client";

import { useActionState } from "react";
import { SubmitButton, type ActionState } from "@/shared/ui";

type Props = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  token: string;
  memberName: string;
  /** 서버 전용 키가 있는지. 없으면 무엇이 빠졌는지 보이고 단추를 막는다 */
  ready: boolean;
  /** 지금 다른 사람으로 들어와 있다 */
  switching: boolean;
};

/** 개인 링크의 "○○님으로 들어가기" 단추 하나(PLAN.md §4). 큰 단추로, 어르신도 한 번에 누른다 */
export default function LinkLoginForm({ action, token, memberName, ready, switching }: Props) {
  const [state, formAction] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="token" value={token} />
      {switching && (
        <p className="rounded-box bg-bg-subtle p-3 text-sm text-text-secondary">
          지금은 다른 사람으로 들어와 있어요. 누르면 {memberName}님으로 바뀌어요.
        </p>
      )}
      <SubmitButton
        disabled={!ready}
        className="h-14 w-full rounded-box bg-primary text-lg font-bold text-primary-contrast disabled:opacity-40"
      >
        {memberName}님으로 들어가기
      </SubmitButton>
      {!ready && (
        <p role="alert" className="text-sm text-danger">
          서버에 SUPABASE_SERVICE_ROLE_KEY 가 없어서 링크로 들어갈 수 없어요. 관리자에게 알려 주세요(docs/SETUP.md).
        </p>
      )}
      {state.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
    </form>
  );
}
