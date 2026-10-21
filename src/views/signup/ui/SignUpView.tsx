import Link from "next/link";
import { fetchTakenJerseyNumbers } from "@/entities/member/server";
import { signUp, SignUpForm, SignUpUnavailable } from "@/features/sign-up";
import { fetchSignUpAvailability } from "@/features/sign-up/server";
import { ROUTES } from "@/shared/config";

/** 설정이 빠졌으면 무엇을 바꿀지부터 보인다. 그래야 DB 를 깔기 전에도 안내가 뜬다. */
async function SignUpBody() {
  const availability = await fetchSignUpAvailability();
  if (availability !== "ready" && availability !== "unknown") return <SignUpUnavailable reason={availability} />;
  return <SignUpForm action={signUp} takenNumbers={await fetchTakenJerseyNumbers()} />;
}

export default function SignUpView() {
  return (
    <main className="mx-auto w-full max-w-100 flex-1 px-4 py-10">
      <Link href={ROUTES.login} className="text-sm text-text-secondary">
        ← 로그인
      </Link>
      <header className="mt-6 mb-8">
        <h1 className="text-xl font-bold">가입 신청</h1>
        <p className="mt-2 text-sm text-text-secondary">
          신청하면 관리자가 확인한 뒤 승인해요. 주발·포지션·등번호는 나중에 바꿀 수 있어요.
        </p>
      </header>
      <SignUpBody />
    </main>
  );
}
