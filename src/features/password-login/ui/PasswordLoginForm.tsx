"use client";

import { useActionState } from "react";
import type { PasswordLoginState } from "../lib/passwordLogin";

type Props = {
  action: (state: PasswordLoginState, formData: FormData) => Promise<PasswordLoginState>;
};

const input = "mt-2 h-12 w-full rounded-xl border border-border px-4 text-base";

export default function PasswordLoginForm({ action }: Props) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div>
        <label htmlFor="email" className="text-sm font-semibold">
          이메일
        </label>
        <input id="email" name="email" type="email" autoComplete="username" className={input} />
      </div>
      <div>
        <label htmlFor="password" className="text-sm font-semibold">
          비밀번호
        </label>
        <input id="password" name="password" type="password" autoComplete="current-password" className={input} />
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="h-13 w-full rounded-xl bg-primary text-base font-semibold text-primary-contrast disabled:opacity-50"
      >
        로그인
      </button>
    </form>
  );
}
