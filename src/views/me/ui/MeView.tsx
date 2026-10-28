import { redirect } from "next/navigation";
import { fetchMyMember, fetchTakenJerseyNumbers } from "@/entities/member/server";
import { InstallAppCard } from "@/features/app-install";
import { changePassword, PasswordChangeForm } from "@/features/password-change";
import { ProfileForm, updateProfile } from "@/features/profile-edit";
import { isSignedInByLink } from "@/shared/api";
import { ROUTES } from "@/shared/config";
import { Panel, Screen } from "@/shared/ui";

export default async function MeView() {
  const me = await fetchMyMember();
  if (me === null) redirect(ROUTES.onboarding);
  const [takenNumbers, byLink] = await Promise.all([fetchTakenJerseyNumbers(), isSignedInByLink()]);

  return (
    <Screen title="내 정보" overline={me.realName} back={{ href: ROUTES.home, label: "홈" }} width="narrow">
      <Panel title="프로필" aside="실명은 관리자가 바꿔요">
        <ProfileForm
          action={updateProfile}
          feet={me.feet}
          preferredPositions={me.preferredPositions}
          jerseyNumber={me.jerseyNumber}
          takenNumbers={takenNumbers}
        />
      </Panel>
      {byLink ? (
        // 개인 링크로 들어온 계정은 비밀번호가 없다(PLAN.md §4)
        <Panel title="개인 링크로 들어왔어요">
          <p className="text-sm leading-6 text-text-secondary">
            이 휴대폰에서는 계속 들어와 있어요. 로그아웃했거나 휴대폰을 바꿨으면 관리자에게 새 링크를 받아 주세요.
          </p>
        </Panel>
      ) : (
        <Panel title="비밀번호">
          <p className="mb-4 text-xs text-text-tertiary">관리자에게 받은 임시 비밀번호로 들어왔다면 여기서 바꿔 주세요.</p>
          <PasswordChangeForm action={changePassword} />
        </Panel>
      )}
      <InstallAppCard />
    </Screen>
  );
}
