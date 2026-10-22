"use client";

import { useActionState, useId, useState } from "react";
import { FootPicker, JerseyNumberSelect, missingProfileItems, PositionPicker, type Foot } from "@/entities/member";
import type { Position } from "@/entities/position";
import { fieldClass, MissingHint, SubmitButton } from "@/shared/ui";
import type { GuestState } from "../model/guestSchema";

export type GuestValues = {
  id: string;
  realName: string;
  feet: Foot[];
  preferredPositions: Position[];
  jerseyNumber: number | null;
};

type Props = {
  action: (state: GuestState, formData: FormData) => Promise<GuestState>;
  matchId: string;
  submitLabel: string;
  /** 고칠 때 지금 값. 없으면 새로 넣는다 */
  guest?: GuestValues;
};

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-2 text-sm text-danger">{message}</p> : null;
}

/**
 * 그날 용병 넣기·고치기(PLAN.md §4). 가입 신청과 같은 항목을 같은 방식으로 고른다(이메일·비밀번호 없이).
 * 새로 넣고 나면 칸을 비워 다음 용병을 받는다. 한 화면에 여러 개가 뜨므로 입력칸 id 를 따로 만든다.
 */
export default function GuestForm({ action, matchId, submitLabel, guest }: Props) {
  const id = useId();
  const [realName, setRealName] = useState(guest?.realName ?? "");
  const [feet, setFeet] = useState<Foot[]>(guest?.feet ?? []);
  const [positions, setPositions] = useState<Position[]>(guest?.preferredPositions ?? []);
  const [number, setNumber] = useState(guest?.jerseyNumber == null ? "" : String(guest.jerseyNumber));
  const [state, formAction] = useActionState<GuestState, FormData>(async (previous, formData) => {
    const result = await action(previous, formData);
    if (result.saved && guest === undefined) {
      setRealName("");
      setFeet([]);
      setPositions([]);
      setNumber("");
    }
    return result;
  }, {});

  const missing = missingProfileItems({ realName, feet, positions });
  const ready = missing.length === 0;

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="matchId" value={matchId} />
      {guest && <input type="hidden" name="memberId" value={guest.id} />}
      <div>
        <label htmlFor={`${id}-name`} className="text-sm font-semibold">
          이름
        </label>
        <input
          id={`${id}-name`}
          name="realName"
          value={realName}
          onChange={(event) => setRealName(event.target.value)}
          maxLength={20}
          placeholder="예: 홍길동"
          className={fieldClass("md", "mt-2")}
        />
        <FieldError message={state.errors?.realName} />
      </div>
      <fieldset>
        <legend className="text-sm font-semibold">주로 쓰는 발</legend>
        <FootPicker value={feet} onChange={setFeet} />
        <FieldError message={state.errors?.feet} />
      </fieldset>
      <fieldset>
        <legend className="text-sm font-semibold">선호 포지션</legend>
        <p className="mt-1 text-xs text-text-tertiary">3개, 누른 순서가 우선순위예요. 1순위 골키퍼면 하나만.</p>
        <PositionPicker value={positions} onChange={setPositions} />
        <FieldError message={state.errors?.preferredPositions} />
      </fieldset>
      <div>
        <label htmlFor={`${id}-number`} className="text-sm font-semibold">
          등번호 <span className="font-normal text-text-tertiary">(선택 · 멤버 번호와 겹쳐도 돼요)</span>
        </label>
        <JerseyNumberSelect id={`${id}-number`} value={number} onChange={setNumber} />
        <FieldError message={state.errors?.jerseyNumber} />
      </div>
      {state.message && (
        <p role="alert" className="text-sm text-danger">
          {state.message}
        </p>
      )}
      <SubmitButton
        disabled={!ready}
        className="h-11 w-full rounded-xl bg-primary text-sm font-semibold text-primary-contrast disabled:opacity-40"
      >
        {submitLabel}
      </SubmitButton>
      <MissingHint items={missing} />
    </form>
  );
}
