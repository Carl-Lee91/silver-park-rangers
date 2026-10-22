"use client";

import { useActionState, useState } from "react";
import { FootPicker, JerseyNumberSelect, missingProfileItems, PositionPicker, type Foot } from "@/entities/member";
import type { Position } from "@/entities/position";
import { fieldClass, MissingHint, SubmitButton } from "@/shared/ui";
import type { SignUpState } from "../model/signUpSchema";

type Props = {
  action: (state: SignUpState, formData: FormData) => Promise<SignUpState>;
  /** 다른 사람이 쓰는 등번호 */
  takenNumbers: readonly number[];
};

const input = fieldClass("lg", "mt-2");

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-2 text-sm text-danger">{message}</p> : null;
}

/**
 * 가입 신청(PLAN.md §4·§5). 계정과 프로필을 한 번에 보낸다.
 * 입력칸은 모두 상태로 들고 있다 — 서버가 오류를 돌려줘도 입력한 값이 지워지지 않게.
 */
export default function SignUpForm({ action, takenNumbers }: Props) {
  const [state, formAction] = useActionState(action, {});
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [realName, setRealName] = useState("");
  const [feet, setFeet] = useState<Foot[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [number, setNumber] = useState("");

  const missing = [
    email.trim() === "" ? "이메일" : null,
    password === "" ? "비밀번호" : null,
    passwordConfirm === "" ? "비밀번호 확인" : null,
  ]
    .filter((item): item is string => item !== null)
    .concat(missingProfileItems({ realName, feet, positions }));
  const ready = missing.length === 0;

  return (
    <form action={formAction} className="flex flex-col gap-8">
      <div className="flex flex-col gap-5">
        <div>
          <label htmlFor="email" className="text-sm font-semibold">
            이메일
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="username"
            placeholder="name@example.com"
            className={input}
          />
          <p className="mt-2 text-xs text-text-tertiary">로그인할 때 써요. 메일은 보내지 않아요.</p>
          <FieldError message={state.errors?.email} />
        </div>
        <div>
          <label htmlFor="password" className="text-sm font-semibold">
            비밀번호
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            className={input}
          />
          <p className="mt-2 text-xs text-text-tertiary">8자 이상. 잊으면 관리자가 임시 비밀번호를 만들어 줘요.</p>
          <FieldError message={state.errors?.password} />
        </div>
        <div>
          <label htmlFor="passwordConfirm" className="text-sm font-semibold">
            비밀번호 확인
          </label>
          <input
            id="passwordConfirm"
            name="passwordConfirm"
            type="password"
            value={passwordConfirm}
            onChange={(event) => setPasswordConfirm(event.target.value)}
            autoComplete="new-password"
            className={input}
          />
          <FieldError message={state.errors?.passwordConfirm} />
        </div>
      </div>

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
          placeholder="예: 홍길동"
          className={input}
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
