"use client";

import type { ButtonHTMLAttributes } from "react";
import { useFormStatus } from "react-dom";
import { useProgressWhile } from "./progress/useProgressWhile";
import Spinner from "./Spinner";

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type">;

/**
 * 폼 제출 단추. 서버로 보내는 동안 막히고 스피너가 돌며, 맨 위 로딩 바도 켠다.
 * 모든 폼의 제출 단추는 이것을 쓴다 — 그래야 앱 전체에 같은 로딩이 걸린다.
 *
 * 단추가 여럿인 폼(참석·불참처럼 name·value 가 다른 단추)은 누른 단추에만 스피너를 돌리고,
 * 나머지는 막기만 한다.
 */
export default function SubmitButton({ children, disabled = false, name, value, ...rest }: Props) {
  const { pending, data } = useFormStatus();
  const mine = pending && (name === undefined || data?.get(name) === String(value));
  useProgressWhile(mine);

  return (
    <button type="submit" name={name} value={value} disabled={disabled || pending} aria-busy={mine} {...rest}>
      {mine && (
        <>
          <Spinner />{" "}
        </>
      )}
      {children}
    </button>
  );
}
