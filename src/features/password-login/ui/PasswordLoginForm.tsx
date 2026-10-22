"use client";

import { useActionState } from "react";
import { fieldClass, SubmitButton } from "@/shared/ui";
import type { PasswordLoginState } from "../lib/passwordLogin";

type Props = {
  action: (state: PasswordLoginState, formData: FormData) => Promise<PasswordLoginState>;
};

const input = fieldClass("lg", "mt-2");

export default function PasswordLoginForm({ action }: Props) {
  const [state, formAction] = useActionState(action, {});

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
      <SubmitButton
        className="h-13 w-full rounded-xl bg-primary text-base font-semibold text-primary-contrast disabled:opacity-50"
      >
        로그인
      </SubmitButton>
    </form>
  );
}
