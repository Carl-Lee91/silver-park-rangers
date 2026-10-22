"use client";

import { useActionState, useState } from "react";
import { FootPicker, JerseyNumberSelect, missingProfileItems, PositionPicker, type Foot } from "@/entities/member";
import type { Position } from "@/entities/position";
import { MissingHint, SubmitButton } from "@/shared/ui";
import type { ProfileState } from "../model/profileSchema";

type Props = {
  action: (state: ProfileState, formData: FormData) => Promise<ProfileState>;
  feet: Foot[];
  preferredPositions: Position[];
  jerseyNumber: number | null;
  /** 다른 사람이 쓰는 번호. 고를 수 없게 막는다 */
  takenNumbers: number[];
};

/** 주발·선호 포지션·등번호 고치기. 가입 신청 때와 같은 방식으로 고른다(PLAN.md §5). */
export default function ProfileForm({
  action,
  feet: initialFeet,
  preferredPositions: initialPositions,
  jerseyNumber: initialJersey,
  takenNumbers,
}: Props) {
  const initialNumber = initialJersey === null ? "" : String(initialJersey);
  // 비교 기준은 "마지막으로 저장한 값"이다. 처음 값과 비교하면 저장한 뒤에도 바뀐 것으로 보인다.
  const [saved, setSaved] = useState({ feet: initialFeet.join(), positions: initialPositions.join(), number: initialNumber });
  const [state, formAction] = useActionState<ProfileState, FormData>(async (previous, formData) => {
    const result = await action(previous, formData);
    if (result.saved) {
      setSaved({
        feet: formData.getAll("feet").join(),
        positions: formData.getAll("preferredPositions").join(),
        number: String(formData.get("jerseyNumber") ?? ""),
      });
    }
    return result;
  }, {});
  const [feet, setFeet] = useState(initialFeet);
  const [positions, setPositions] = useState(initialPositions);
  const [number, setNumber] = useState(initialNumber);
  const changed = feet.join() !== saved.feet || positions.join() !== saved.positions || number !== saved.number;
  const missing = missingProfileItems({ feet, positions });
  const ready = missing.length === 0;

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
        <p className="mt-1 text-xs text-text-tertiary">
          3개, 누른 순서가 우선순위예요. 1순위로 골키퍼를 고르면 골키퍼 하나만 골라요. 다음 자동 배치부터 반영돼요.
        </p>
        <PositionPicker value={positions} onChange={setPositions} />
        {state.errors?.preferredPositions && (
          <p className="mt-2 text-sm text-danger">{state.errors.preferredPositions}</p>
        )}
      </fieldset>

      <div>
        <label htmlFor="jerseyNumber" className="text-sm font-semibold">
          등번호
        </label>
        <p className="mt-1 text-xs text-text-tertiary">쿼터 보드와 공유 이미지의 동그라미에 들어가요. 같은 번호는 한 사람만 써요.</p>
        <JerseyNumberSelect value={number} onChange={setNumber} takenNumbers={takenNumbers} />
        {state.errors?.jerseyNumber && <p className="mt-2 text-sm text-danger">{state.errors.jerseyNumber}</p>}
      </div>

      {state.message && (
        <p role="alert" className="text-sm text-danger">
          {state.message}
        </p>
      )}
      {state.saved && !changed && <p className="text-sm text-text-secondary">저장했어요.</p>}

      <SubmitButton
        disabled={!changed || !ready}
        className="h-13 w-full rounded-xl bg-primary text-base font-semibold text-primary-contrast disabled:opacity-40"
      >
        저장
      </SubmitButton>
      <MissingHint items={changed ? missing : []} />
    </form>
  );
}
