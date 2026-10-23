import { fetchTakenJerseyNumbers } from "@/entities/member/server";
import { completeOnboarding, OnboardingForm } from "@/features/onboarding";
import { Panel, Screen } from "@/shared/ui";

/** 신청 정보 없이 계정만 있는 사람(대시보드에서 만든 계정 등)이 온다(PLAN.md §4). */
export default async function OnboardingView() {
  const takenNumbers = await fetchTakenJerseyNumbers();
  return (
    <Screen title="가입 신청" overline="Silver Park Rangers" width="narrow">
      <p className="text-sm text-text-secondary">계정에 가입 정보가 없어요. 마저 입력하면 관리자가 확인한 뒤 승인해요.</p>
      <Panel title="가입 정보">
        <OnboardingForm action={completeOnboarding} takenNumbers={takenNumbers} />
      </Panel>
    </Screen>
  );
}
