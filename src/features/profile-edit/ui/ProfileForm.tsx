"use client";

import { useActionState, useState } from "react";
import { FootPicker, PositionPicker, type Foot } from "@/entities/member";
import type { Position } from "@/entities/position";
import type { ProfileState } from "../model/profileSchema";

type Props = {
  action: (state: ProfileState, formData: FormData) => Promise<ProfileState>;
  feet: Foot[];
  preferredPositions: Position[];
};

/** 주발·선호 포지션 고치기. 가입 신청 때와 같은 방식으로 고른다(PLAN.md §5). */
export default function ProfileForm({ action, feet: initialFeet, preferredPositions: initialPositions }: Props) {
  // 비교 기준은 "마지막으로 저장한 값"이다. 처음 값과 비교하면 저장한 뒤에도 바뀐 것으로 보인다.
  const [saved, setSaved] = useState({ feet: initialFeet.join(), positions: initialPositions.join() });
  const [state, formAction, pending] = useActionState<ProfileState, FormData>(async (previous, formData) => {
    const result = await action(previous, formData);
    if (result.saved) {
      setSaved({ feet: formData.getAll("feet").join(), positions: formData.getAll("preferredPositions").join() });
    }
    return result;
  }, {});
  const [feet, setFeet] = useState(initialFeet);
  const [positions, setPositions] = useState(initialPositions);
  const changed = feet.join() !== saved.feet || positions.join() !== saved.positions;
  const ready = feet.length > 0 && positions.length > 0;

  return (
    <form action={formAction} className="flex flex-col gap-8">
      <fieldset>
        <legend className="text-sm font-semibold">주로 쓰는 발</legend>
        <p className="mt-1 text-xs text-text-tertiary">양발이면 둘 다 골라 주세요.</p>
        <FootPicker value={feet} onChange={setFeet} />
        {state.errors?.feet && <p className="mt-2 text-sm text-danger">{state.errors.feet}</p>}
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold">선호 포지션</legend>
        <p className="mt-1 text-xs text-text-tertiary">최대 3개, 누른 순서가 우선순위예요. 다음 자동 배치부터 반영돼요.</p>
        <PositionPicker value={positions} onChange={setPositions} />
        {state.errors?.preferredPositions && (
          <p className="mt-2 text-sm text-danger">{state.errors.preferredPositions}</p>
        )}
      </fieldset>

      {state.message && (
        <p role="alert" className="text-sm text-danger">
          {state.message}
        </p>
      )}
      {state.saved && !changed && <p className="text-sm text-text-secondary">저장했어요.</p>}

      <button
        type="submit"
        disabled={!changed || !ready || pending}
        className="h-13 w-full rounded-xl bg-primary text-base font-semibold text-primary-contrast disabled:opacity-40"
      >
        저장
      </button>
    </form>
  );
}
