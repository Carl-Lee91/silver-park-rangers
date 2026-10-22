"use client";

import { useActionState, useState } from "react";
import { FootPicker, JerseyNumberSelect, missingProfileItems, PositionPicker, type Foot } from "@/entities/member";
import type { Position } from "@/entities/position";
import { fieldClass, MissingHint, SubmitButton } from "@/shared/ui";
import type { OnboardingState } from "../model/onboardingSchema";

type Props = {
  action: (state: OnboardingState, formData: FormData) => Promise<OnboardingState>;
  /** 다른 사람이 쓰는 등번호 */
  takenNumbers: readonly number[];
};

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-2 text-sm text-danger">{message}</p> : null;
}

/**
 * 신청 정보가 빠진 계정이 마저 입력한다(PLAN.md §4). 실명 · 주발 · 선호 포지션 · 등번호(§5).
 * 실명 말고는 모두 고르는 방식이다.
 *
 * 선호 포지션은 누른 순서가 우선순위다. 숨은 입력칸을 고른 순서대로 그려서
 * 서버가 그 순서 그대로 받는다.
 */
export default function OnboardingForm({ action, takenNumbers }: Props) {
  const [state, formAction] = useActionState(action, {});
  const [realName, setRealName] = useState("");
  const [feet, setFeet] = useState<Foot[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [number, setNumber] = useState("");

  const missing = missingProfileItems({ realName, feet, positions });
  const ready = missing.length === 0;

  return (
    <form action={formAction} className="flex flex-col gap-8">
      <div>
        <label htmlFor="realName" className="text-sm font-semibold">
          실명
        </label>
        <input
          id="realName"
          name="realName"
          value={realName}
          onChange={(event) => setRealName(event.target.value)}
          maxLength={20}
          autoComplete="name"
          className={fieldClass("lg", "mt-2")}
        />
        <p className="mt-2 text-xs text-text-tertiary">관리자가 본인인지 확인할 때 봐요.</p>
        <FieldError message={state.errors?.realName} />
      </div>

      <fieldset>
        <legend className="text-sm font-semibold">주로 쓰는 발</legend>
        <p className="mt-1 text-xs text-text-tertiary">양발이면 둘 다 골라 주세요.</p>
        <FootPicker value={feet} onChange={setFeet} />
        <FieldError message={state.errors?.feet} />
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold">선호 포지션</legend>
        <p className="mt-1 text-xs text-text-tertiary">
          3개, 누른 순서가 우선순위예요. 1순위로 골키퍼를 고르면 골키퍼 하나만 골라요.
        </p>
        <PositionPicker value={positions} onChange={setPositions} />
        <FieldError message={state.errors?.preferredPositions} />
      </fieldset>

      <div>
        <label htmlFor="jerseyNumber" className="text-sm font-semibold">
          등번호 <span className="font-normal text-text-tertiary">(선택)</span>
        </label>
        <JerseyNumberSelect value={number} onChange={setNumber} takenNumbers={takenNumbers} />
        <FieldError message={state.errors?.jerseyNumber} />
      </div>

      {state.message && (
        <p role="alert" className="text-sm text-danger">
          {state.message}
        </p>
      )}

      <SubmitButton
        disabled={!ready}
        className="h-13 w-full rounded-xl bg-primary text-base font-semibold text-primary-contrast disabled:opacity-40"
      >
        가입 신청
      </SubmitButton>
      <MissingHint items={missing} />
    </form>
  );
}
