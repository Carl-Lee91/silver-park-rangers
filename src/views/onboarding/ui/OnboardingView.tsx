import { completeOnboarding, OnboardingForm } from "@/features/onboarding";

export default function OnboardingView() {
  return (
    <main className="mx-auto w-full max-w-100 flex-1 px-4 py-10">
      <header className="mb-8">
        <h1 className="text-xl font-bold">가입 신청</h1>
        <p className="mt-2 text-sm text-text-secondary">
          신청하면 관리자가 확인한 뒤 승인해요. 주발과 포지션은 나중에 바꿀 수 있어요.
        </p>
      </header>
      <OnboardingForm action={completeOnboarding} />
    </main>
  );
}
