import { redirect } from "next/navigation";
import type { MemberStatus } from "@/entities/member";
import { fetchMyMember } from "@/entities/member/server";
import { SignOutButton } from "@/features/sign-out";
import { ROUTES } from "@/shared/config";

const COPY: Record<Exclude<MemberStatus, "approved">, { title: string; body: string }> = {
  pending: {
    title: "가입 신청을 보냈어요",
    body: "관리자가 확인하고 승인하면 바로 쓸 수 있어요.",
  },
  rejected: {
    title: "가입이 승인되지 않았어요",
    body: "우리 팀 멤버라면 관리자에게 문의해 주세요.",
  },
  inactive: {
    title: "휴면 처리된 계정이에요",
    body: "다시 쓰려면 관리자에게 문의해 주세요.",
  },
};

export default async function PendingView() {
  const me = await fetchMyMember();
  // 게이트가 이미 걸렀지만, 직접 불려도 엉뚱한 화면을 그리지 않는다.
  if (me === null) redirect(ROUTES.onboarding);
  if (me.status === "approved") redirect(ROUTES.home);

  const copy = COPY[me.status];

  return (
    <main className="mx-auto flex w-full max-w-narrow flex-1 flex-col justify-center gap-8 px-4 py-12">
      <header>
        <h1 className="text-xl font-bold">{copy.title}</h1>
        <p className="mt-2 text-sm text-text-secondary">{copy.body}</p>
      </header>
      <dl className="rounded-xl bg-bg-subtle p-4 text-sm leading-7">
        <div className="flex justify-between">
          <dt className="text-text-secondary">실명</dt>
          <dd>{me.realName}</dd>
        </div>
      </dl>
      <SignOutButton />
    </main>
  );
}
