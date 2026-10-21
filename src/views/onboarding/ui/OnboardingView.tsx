import { fetchTakenJerseyNumbers } from "@/entities/member/server";
import { completeOnboarding, OnboardingForm } from "@/features/onboarding";

/** 신청 정보 없이 계정만 있는 사람(대시보드에서 만든 계정 등)이 온다(PLAN.md §4). */
export default async function OnboardingView() {
  const takenNumbers = await fetchTakenJerseyNumbers();
  return (
    <main className="mx-auto w-full max-w-narrow flex-1 px-4 py-10 md:py-16">
      <header className="mb-8">
        <h1 className="text-xl font-bold">가입 신청</h1>
        <p className="mt-2 text-sm text-text-secondary">
          계정에 가입 정보가 없어요. 마저 입력하면 관리자가 확인한 뒤 승인해요.
        </p>
      </header>
      <OnboardingForm action={completeOnboarding} takenNumbers={takenNumbers} />
    </main>
  );
}
