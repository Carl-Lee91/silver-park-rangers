import Link from "next/link";
import { passwordLogin, PasswordLoginForm } from "@/features/password-login";
import { ROUTES } from "@/shared/config";
import { Emblem, Panel, Screen } from "@/shared/ui";

export default function LoginView() {
  return (
    <Screen title="로그인" overline="Silver Park Rangers" width="narrow" className="md:pt-10">
      <div className="flex flex-col items-center gap-2 py-4 text-center">
        <Emblem label="Silver Park Rangers" className="h-20 w-18" />
        <p className="mt-2 text-xs font-bold tracking-wider text-primary">우리 팀 전용</p>
        <p className="text-xl font-extrabold">Silver Park Rangers</p>
        <p className="text-sm text-text-secondary">참석 투표부터 쿼터별 스쿼드까지 한곳에서.</p>
      </div>

      <Panel title="로그인">
        <PasswordLoginForm action={passwordLogin} />
      </Panel>

      <div className="flex flex-col gap-3">
        <Link
          href={ROUTES.signup}
          className="flex h-12 items-center justify-center rounded-box border border-border-strong bg-bg-subtle text-base font-semibold"
        >
          처음이면 가입 신청
        </Link>
        <p className="text-xs leading-5 text-text-tertiary">
          관리자가 승인한 사람만 쓸 수 있어요. 비밀번호를 잊었으면 관리자에게 임시 비밀번호를 받아 주세요.
        </p>
      </div>
    </Screen>
  );
}
