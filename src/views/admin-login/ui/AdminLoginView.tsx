import Link from "next/link";
import { passwordLogin, PasswordLoginForm } from "@/features/password-login";
import { ROUTES } from "@/shared/config";

export default function AdminLoginView() {
  return (
    <main className="mx-auto flex w-full max-w-100 flex-1 flex-col justify-center gap-8 px-4 py-12">
      <header>
        <h1 className="text-xl font-bold">어드민 계정 로그인</h1>
        <p className="mt-2 text-sm text-text-secondary">
          선수가 아닌 운영용 계정이에요. 팀원은 카카오로 로그인해 주세요.
        </p>
      </header>
      <PasswordLoginForm action={passwordLogin} />
      <Link href={ROUTES.login} className="text-sm text-text-secondary underline underline-offset-4">
        카카오 로그인으로 돌아가기
      </Link>
    </main>
  );
}
