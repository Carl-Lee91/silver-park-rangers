"use client";

import { useActionState, useState } from "react";
import { FEET, type Foot } from "@/entities/member";
import { POSITIONS, type Position } from "@/entities/position";
import type { OnboardingState } from "../model/onboardingSchema";

const MAX_POSITIONS = 3;

type Props = {
  action: (state: OnboardingState, formData: FormData) => Promise<OnboardingState>;
};

const chip =
  "flex h-11 items-center justify-center gap-1.5 rounded-xl border px-3 text-sm font-medium aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-contrast border-border";

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-2 text-sm text-danger">{message}</p> : null;
}

/**
 * 실명 · 주발 · 선호 포지션(PLAN.md §5). 실명 말고는 모두 고르는 방식이다.
 *
 * 선호 포지션은 누른 순서가 우선순위다. 숨은 입력칸을 고른 순서대로 그려서
 * 서버가 그 순서 그대로 받는다.
 */
export default function OnboardingForm({ action }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const [realName, setRealName] = useState("");
  const [feet, setFeet] = useState<Foot[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);

  const toggleFoot = (foot: Foot) =>
    // 왼발·오른발 순서를 지켜 둔다. 누른 순서는 의미가 없다.
    setFeet((current) =>
      FEET.map(({ code }) => code).filter((code) =>
        code === foot ? !current.includes(code) : current.includes(code),
      ),
    );

  const togglePosition = (position: Position) =>
    setPositions((current) => {
      if (current.includes(position)) return current.filter((code) => code !== position);
      return current.length >= MAX_POSITIONS ? current : [...current, position];
    });

  const ready = realName.trim().length > 0 && feet.length > 0 && positions.length > 0;

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
          className="mt-2 h-12 w-full rounded-xl border border-border px-4 text-base"
        />
        <p className="mt-2 text-xs text-text-tertiary">관리자가 본인인지 확인할 때 봐요.</p>
        <FieldError message={state.errors?.realName} />
      </div>

      <fieldset>
        <legend className="text-sm font-semibold">주로 쓰는 발</legend>
        <p className="mt-1 text-xs text-text-tertiary">양발이면 둘 다 골라 주세요.</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {FEET.map(({ code, label }) => (
            <button
              key={code}
              type="button"
              aria-pressed={feet.includes(code)}
              onClick={() => toggleFoot(code)}
              className={chip}
            >
              {label}
            </button>
          ))}
        </div>
        {feet.map((code) => (
          <input key={code} type="hidden" name="feet" value={code} />
        ))}
        <FieldError message={state.errors?.feet} />
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold">선호 포지션</legend>
        <p className="mt-1 text-xs text-text-tertiary">최대 3개, 누른 순서가 우선순위예요.</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {POSITIONS.map(({ code, label }) => {
            const rank = positions.indexOf(code) + 1;
            return (
              <button
                key={code}
                type="button"
                aria-pressed={rank > 0}
                onClick={() => togglePosition(code)}
                className={chip}
              >
                <span>{label}</span>
                {rank > 0 && (
                  <>
                    {" "}
                    <span className="text-xs opacity-80">{rank}순위</span>
                  </>
                )}
              </button>
            );
          })}
        </div>
        {positions.map((code) => (
          <input key={code} type="hidden" name="preferredPositions" value={code} />
        ))}
        <FieldError message={state.errors?.preferredPositions} />
      </fieldset>

      {state.message && (
        <p role="alert" className="text-sm text-danger">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={!ready || pending}
        className="h-13 w-full rounded-xl bg-primary text-base font-semibold text-primary-contrast disabled:opacity-40"
      >
        가입 신청
      </button>
    </form>
  );
}
