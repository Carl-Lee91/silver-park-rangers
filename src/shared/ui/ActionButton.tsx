"use client";

import { useActionState, type FormEvent } from "react";

export type ActionState = { error?: string };

type Props = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  /** 함께 보낼 숨은 값(대상 id 등) */
  fields: Record<string, string>;
  label: string;
  tone?: "primary" | "neutral" | "danger";
  /** 있으면 보내기 전에 묻는다. 되돌리기 번거로운 일(거절·휴면·관리자 해제)에 쓴다. */
  confirmMessage?: string;
  disabled?: boolean;
};

const TONES = {
  primary: "bg-primary text-primary-contrast",
  neutral: "border border-border text-text-primary",
  danger: "border border-border text-danger",
};

/** 한 번 누르면 서버 동작 하나를 부르는 단추. 실패하면 단추 아래에 이유를 보인다. */
export default function ActionButton({
  action,
  fields,
  label,
  tone = "neutral",
  confirmMessage,
  disabled = false,
}: Props) {
  const [state, formAction, pending] = useActionState(action, {});

  const confirmFirst = (event: FormEvent<HTMLFormElement>) => {
    if (confirmMessage !== undefined && !window.confirm(confirmMessage)) event.preventDefault();
  };

  return (
    <form action={formAction} onSubmit={confirmFirst}>
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <button
        type="submit"
        disabled={pending || disabled}
        className={`h-10 w-full rounded-lg px-3 text-sm font-medium disabled:opacity-50 ${TONES[tone]}`}
      >
        {label}
      </button>
      {state.error && (
        <p role="alert" className="mt-1 text-xs text-danger">
          {state.error}
        </p>
      )}
    </form>
  );
}
