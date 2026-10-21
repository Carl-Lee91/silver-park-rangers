"use client";

import { useActionState, useState } from "react";
import type { PasswordChangeState } from "../model/passwordChange";

type Props = {
  action: (state: PasswordChangeState, formData: FormData) => Promise<PasswordChangeState>;
};

const input = "mt-2 h-12 w-full rounded-xl border border-border px-4 text-base";

/** 비밀번호 바꾸기. 바꾸고 나면 칸을 비운다 — 화면에 비밀번호를 남겨 두지 않는다. */
export default function PasswordChangeForm({ action }: Props) {
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [state, formAction, pending] = useActionState<PasswordChangeState, FormData>(async (previous, formData) => {
    const result = await action(previous, formData);
    if (result.saved) {
      setPassword("");
      setPasswordConfirm("");
    }
    return result;
  }, {});

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div>
        <label htmlFor="newPassword" className="text-sm font-semibold">
          새 비밀번호
        </label>
        <input
          id="newPassword"
          name="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
          className={input}
        />
        {state.errors?.password && <p className="mt-2 text-sm text-danger">{state.errors.password}</p>}
      </div>
      <div>
        <label htmlFor="newPasswordConfirm" className="text-sm font-semibold">
          새 비밀번호 확인
        </label>
        <input
          id="newPasswordConfirm"
          name="passwordConfirm"
          type="password"
          value={passwordConfirm}
          onChange={(event) => setPasswordConfirm(event.target.value)}
          autoComplete="new-password"
          className={input}
        />
        {state.errors?.passwordConfirm && <p className="mt-2 text-sm text-danger">{state.errors.passwordConfirm}</p>}
      </div>
      {state.message && (
        <p role="alert" className="text-sm text-danger">
          {state.message}
        </p>
      )}
      {state.saved && password === "" && <p className="text-sm text-text-secondary">비밀번호를 바꿨어요.</p>}
      <button
        type="submit"
        disabled={password === "" || passwordConfirm === "" || pending}
        className="h-12 w-full rounded-xl border border-border text-base font-semibold disabled:opacity-40"
      >
        비밀번호 바꾸기
      </button>
    </form>
  );
}
