import Link from "next/link";
import { passwordLogin, PasswordLoginForm } from "@/features/password-login";
import { ROUTES } from "@/shared/config";

export default function LoginView() {
  return (
    <main className="mx-auto flex w-full max-w-narrow flex-1 flex-col justify-center gap-10 px-4 py-12">
      <header>
        <p className="text-sm font-medium text-primary">우리 팀 전용</p>
        <h1 className="mt-1 text-2xl font-bold">Silver Park Rangers</h1>
        <p className="mt-2 text-sm text-text-secondary">참석 투표부터 쿼터별 스쿼드까지 한곳에서.</p>
      </header>

      <PasswordLoginForm action={passwordLogin} />

      <div className="flex flex-col gap-3">
        <Link
          href={ROUTES.signup}
          className="flex h-12 items-center justify-center rounded-xl border border-border text-base font-semibold"
        >
          처음이면 가입 신청
        </Link>
        <p className="text-xs leading-5 text-text-tertiary">
          관리자가 승인한 사람만 쓸 수 있어요. 비밀번호를 잊었으면 관리자에게 임시 비밀번호를 받아 주세요.
        </p>
      </div>
    </main>
  );
}
