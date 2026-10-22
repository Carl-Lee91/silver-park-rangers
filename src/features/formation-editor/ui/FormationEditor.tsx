"use client";

import { useActionState, useState } from "react";
import { Jersey, layoutFormation, Pitch, PitchSpot } from "@/entities/formation";
import { positionLabel, type Position } from "@/entities/position";
import { fieldClass, SubmitButton } from "@/shared/ui";
import { DEFAULT_COUNTS, fieldCount, MAX_FIELD, type FormationDraftState } from "../model/formationDraft";

type Props = {
  action: (state: FormationDraftState, formData: FormData) => Promise<FormationDraftState>;
};

/** 수비 → 공격 순. 키퍼는 항상 1명이라 고르지 않는다. */
const EDITABLE: Position[] = ["CB", "WB", "MF", "AM", "WG", "FW"];

/** 포지션별 인원수를 + / − 로 고르면 자리가 저절로 잡힌다(entities/formation layoutFormation). */
export default function FormationEditor({ action }: Props) {
  const [state, formAction] = useActionState(action, {});
  const [name, setName] = useState("");
  const [counts, setCounts] = useState(DEFAULT_COUNTS);
  const field = fieldCount(counts);
  const step = (position: Position, delta: number) =>
    setCounts((current) => ({ ...current, [position]: Math.max(0, current[position] + delta) }));

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div>
        <label htmlFor="formationName" className="text-sm font-semibold">
          이름
        </label>
        <input
          id="formationName"
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={30}
          placeholder="예: 3-5-2"
          className={fieldClass("lg", "mt-2")}
        />
        {state.errors?.name && <p className="mt-2 text-sm text-danger">{state.errors.name}</p>}
      </div>

      <div>
        <p className="text-sm font-semibold">인원수</p>
        <ul className="mt-2 flex flex-col gap-2">
          {EDITABLE.map((position) => (
            <li key={position} className="flex items-center justify-between">
              <span className="text-sm">
                {positionLabel(position)} <span className="text-xs text-text-tertiary">{position}</span>
              </span>
              <span className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label={`${positionLabel(position)} 빼기`}
                  disabled={counts[position] === 0}
                  onClick={() => step(position, -1)}
                  className="size-9 rounded-lg border border-border text-lg disabled:opacity-30"
                >
                  −
                </button>
                <span className="w-4 text-center font-semibold">{counts[position]}</span>
                <button
                  type="button"
                  aria-label={`${positionLabel(position)} 더하기`}
                  disabled={field >= MAX_FIELD}
                  onClick={() => step(position, 1)}
                  className="size-9 rounded-lg border border-border text-lg disabled:opacity-30"
                >
                  +
                </button>
              </span>
              <input type="hidden" name={position} value={counts[position]} />
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-text-secondary">필드 {field}명 + 키퍼 1명</p>
        {state.errors?.counts && <p className="mt-2 text-sm text-danger">{state.errors.counts}</p>}
      </div>

      <Pitch label="미리보기">
        {layoutFormation(counts).map((slot, index) => (
          <PitchSpot key={index} x={slot.x} y={slot.y}>
            <Jersey label={slot.position} tone={slot.position === "GK" ? "keeper" : "kit"} className="size-9" />
          </PitchSpot>
        ))}
      </Pitch>

      {state.message && (
        <p role="alert" className="text-sm text-danger">
          {state.message}
        </p>
      )}
      <SubmitButton
        className="h-12 w-full rounded-xl bg-primary text-base font-semibold text-primary-contrast disabled:opacity-50"
      >
        저장
      </SubmitButton>
    </form>
  );
}
