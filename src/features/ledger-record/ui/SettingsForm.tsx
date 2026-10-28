"use client";

import { useActionState, useId } from "react";
import type { DuesSettings } from "@/entities/ledger";
import { fieldClass, SubmitButton, useToast, type ActionState } from "@/shared/ui";

type Props = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  settings: DuesSettings;
};

const FIELDS = [
  { name: "monthlyFee", key: "monthlyFee", label: "월회비", hint: "멤버가 달마다" },
  { name: "matchFee", key: "matchFee", label: "경기비", hint: "용병이 온 매치마다" },
  { name: "noShowFine", key: "noShowFine", label: "노쇼 벌금", hint: "참석 투표하고 안 온 매치마다" },
] as const;

/** 금액 설정(PLAN.md §10). 0 이면 그 항목은 받지 않는다(체크표가 숨는다). 바꿔도 이미 받은 줄의 금액은 그대로다 */
export default function SettingsForm({ action, settings }: Props) {
  const id = useId();
  const { show, toast } = useToast();
  const [state, formAction] = useActionState<ActionState, FormData>(async (previous, formData) => {
    const result = await action(previous, formData);
    if (result.error === undefined) show("저장했어요.");
    return result;
  }, {});

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="grid gap-3 md:grid-cols-3">
        {FIELDS.map(({ name, key, label, hint }) => (
          <div key={name}>
            <label htmlFor={`${id}-${name}`} className="text-sm font-semibold">
              {label} <span className="font-normal text-text-tertiary">({hint})</span>
            </label>
            <input
              id={`${id}-${name}`}
              name={name}
              inputMode="numeric"
              defaultValue={settings[key]}
              className={fieldClass("md", "mt-2")}
            />
          </div>
        ))}
      </div>
      <p className="text-xs text-text-tertiary">0 은 받지 않는다는 뜻이에요. 바꿔도 이미 받은 금액은 그대로예요.</p>
      {state.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      <SubmitButton className="h-11 w-full rounded-box border border-border-strong bg-bg-subtle text-sm font-semibold md:max-w-60">
        금액 저장
      </SubmitButton>
      {toast}
    </form>
  );
}
