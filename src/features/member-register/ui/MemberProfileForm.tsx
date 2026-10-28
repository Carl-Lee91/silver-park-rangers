"use client";

import Link from "next/link";
import { useActionState, useId, useState } from "react";
import { FootPicker, JerseyNumberSelect, missingProfileItems, PositionPicker, type Foot, type MemberType } from "@/entities/member";
import type { Position } from "@/entities/position";
import { adminMemberPath, ROUTES } from "@/shared/config";
import { fieldClass, MissingHint, SubmitButton, useToast } from "@/shared/ui";
import type { RegisterState } from "../model/registerSchema";

export type ProfileValues = {
  id: string;
  realName: string;
  feet: Foot[];
  preferredPositions: Position[];
  jerseyNumber: number | null;
};

type Props = {
  action: (state: RegisterState, formData: FormData) => Promise<RegisterState>;
  /** 다른 사람이 쓰는 번호. 고칠 때는 이 사람 번호를 빼고 넘긴다 */
  takenNumbers: readonly number[];
  /** 고칠 때 지금 값. 없으면 새로 등록한다(멤버 / 용병도 고른다) */
  member?: ProfileValues;
};

const KINDS: { code: MemberType; label: string }[] = [
  { code: "member", label: "멤버" },
  { code: "guest", label: "용병" },
];

const chip =
  "flex min-h-11 items-center justify-center rounded-box border border-border px-3 text-sm font-medium aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-contrast";

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-2 text-sm text-danger">{message}</p> : null;
}

/**
 * 관리자의 선수 등록 · 프로필 고치기(PLAN.md §4 관리자 등록). 가입 신청과 같은 항목을 같은 방식으로 고르고,
 * 등록할 때는 멤버 / 용병을 더한다. 등록하면 칸을 비워 다음 사람을 받고, 개인 링크를 보내러 가는 길을 둔다.
 */
export default function MemberProfileForm({ action, takenNumbers, member }: Props) {
  const id = useId();
  const editing = member !== undefined;
  const [realName, setRealName] = useState(member?.realName ?? "");
  const [feet, setFeet] = useState<Foot[]>(member?.feet ?? []);
  const [positions, setPositions] = useState<Position[]>(member?.preferredPositions ?? []);
  const [number, setNumber] = useState(member?.jerseyNumber == null ? "" : String(member.jerseyNumber));
  const [kind, setKind] = useState<MemberType | "">("");
  const [registered, setRegistered] = useState<{ id: string; name: string } | null>(null);
  const { show, toast } = useToast();
  const [state, formAction] = useActionState<RegisterState, FormData>(async (previous, formData) => {
    const result = await action(previous, formData);
    if (result.saved && editing) show("고쳤어요.");
    if (result.saved && !editing) {
      const name = String(formData.get("realName")).trim();
      show(`${name}님을 등록했어요.`);
      setRegistered(result.memberId ? { id: result.memberId, name } : null);
      setRealName("");
      setFeet([]);
      setPositions([]);
      setNumber("");
      setKind("");
    }
    return result;
  }, {});

  const missing = [...missingProfileItems({ realName, feet, positions }), ...(editing || kind !== "" ? [] : ["멤버 / 용병"])];

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {member && <input type="hidden" name="memberId" value={member.id} />}
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
      {!editing && (
        <fieldset>
          <legend className="text-sm font-semibold">구분</legend>
          <p className="mt-1 text-xs text-text-tertiary">관리자만 봐요. 팀원 화면에는 이름만 나와요.</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {KINDS.map(({ code, label }) => (
              <button key={code} type="button" aria-pressed={kind === code} onClick={() => setKind(code)} className={chip}>
                {label}
              </button>
            ))}
          </div>
          <input type="hidden" name="kind" value={kind} />
          <FieldError message={state.errors?.kind} />
        </fieldset>
      )}
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
          등번호 <span className="font-normal text-text-tertiary">(선택)</span>
        </label>
        <JerseyNumberSelect id={`${id}-number`} value={number} onChange={setNumber} takenNumbers={takenNumbers} />
        <FieldError message={state.errors?.jerseyNumber} />
      </div>
      {state.message && (
        <p role="alert" className="text-sm text-danger">
          {state.message}
        </p>
      )}
      <SubmitButton
        disabled={missing.length > 0}
        className="h-11 w-full rounded-box bg-primary text-sm font-semibold text-primary-contrast disabled:opacity-40"
      >
        {editing ? "저장" : "등록하기"}
      </SubmitButton>
      <MissingHint items={missing} />
      {registered && (
        <Link
          href={adminMemberPath(registered.id, ROUTES.adminMembers)}
          className="flex h-11 items-center justify-center rounded-box border border-primary text-sm font-semibold text-primary"
        >
          {registered.name}님에게 개인 링크 보내기 ›
        </Link>
      )}
      {toast}
    </form>
  );
}
