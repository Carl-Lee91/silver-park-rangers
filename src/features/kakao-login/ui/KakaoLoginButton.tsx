"use client";

import { useFormStatus } from "react-dom";
import { startKakaoLogin } from "../api/startKakaoLogin";

/** 카카오 말풍선 심볼 */
function KakaoSymbol() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5">
      <path
        fill="currentColor"
        d="M12 3C6.48 3 2 6.47 2 10.75c0 2.76 1.86 5.18 4.66 6.55-.2.74-.74 2.7-.85 3.12-.13.52.19.51.4.37.17-.11 2.66-1.8 3.74-2.53.66.1 1.34.15 2.05.15 5.52 0 10-3.47 10-7.66S17.52 3 12 3Z"
      />
    </svg>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-kakao text-base font-semibold text-kakao-label disabled:opacity-60"
    >
      <KakaoSymbol />
      {pending ? "카카오로 이동하는 중…" : "카카오로 시작하기"}
    </button>
  );
}

export default function KakaoLoginButton() {
  return (
    <form action={startKakaoLogin}>
      <SubmitButton />
    </form>
  );
}
