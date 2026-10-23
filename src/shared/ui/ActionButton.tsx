"use client";

import { useActionState } from "react";
import SubmitButton from "./SubmitButton";
import { useConfirmBeforeSubmit } from "./useConfirm";

export type ActionState = { error?: string };

type Props = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  /** 함께 보낼 숨은 값(대상 id 등) */
  fields: Record<string, string>;
  label: string;
  tone?: "primary" | "neutral" | "danger";
  /** 있으면 보내기 전에 확인 창으로 묻는다. 되돌리기 번거로운 일(거절·휴면·관리자 해제)에 쓴다. 확인 단추 이름은 label 이다 */
  confirmMessage?: string;
  disabled?: boolean;
};

/** 주 단추는 하늘색, 보조는 밝은 칸에 진한 테두리, 위험은 빨간 테두리(PLAN.md §7 "테마") */
const TONES = {
  primary: "bg-primary font-bold text-primary-contrast",
  neutral: "border border-border-strong bg-bg-subtle text-text-primary",
  danger: "border border-danger/60 text-danger",
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
  const [state, formAction] = useActionState(action, {});

  const { formRef, onSubmit, dialog } = useConfirmBeforeSubmit(
    confirmMessage === undefined
      ? undefined
      : { message: confirmMessage, confirmLabel: label, tone: tone === "danger" ? "danger" : "primary" },
  );

  return (
    <form ref={formRef} action={formAction} onSubmit={onSubmit}>
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <SubmitButton
        disabled={disabled}
        className={`h-11 w-full whitespace-nowrap rounded-box px-3 text-sm font-medium disabled:opacity-50 ${TONES[tone]}`}
      >
        {label}
      </SubmitButton>
      {state.error && (
        <p role="alert" className="mt-1 text-xs text-danger">
          {state.error}
        </p>
      )}
      {dialog}
    </form>
  );
}
