import { redirect } from "next/navigation";
import { fetchMyMember, fetchTakenJerseyNumbers } from "@/entities/member/server";
import { changePassword, PasswordChangeForm } from "@/features/password-change";
import { ProfileForm, updateProfile } from "@/features/profile-edit";
import { SignOutButton } from "@/features/sign-out";
import { ROUTES } from "@/shared/config";
import { BackLink } from "@/shared/ui";

export default async function MeView() {
  const me = await fetchMyMember();
  if (me === null) redirect(ROUTES.onboarding);
  const takenNumbers = await fetchTakenJerseyNumbers();

  return (
    <main className="mx-auto flex w-full max-w-narrow flex-1 flex-col gap-8 px-4 py-8">
      <BackLink href={ROUTES.home} label="홈" />
      <header>
        <h1 className="text-xl font-bold">내 정보</h1>
        <p className="mt-2 text-sm text-text-secondary">{me.realName}</p>
        <p className="mt-1 text-xs text-text-tertiary">실명은 관리자에게 바꿔 달라고 해 주세요.</p>
      </header>
      <ProfileForm
        action={updateProfile}
        feet={me.feet}
        preferredPositions={me.preferredPositions}
        jerseyNumber={me.jerseyNumber}
        takenNumbers={takenNumbers}
      />
      <section className="flex flex-col gap-4 border-t border-border pt-8">
        <h2 className="font-semibold">비밀번호</h2>
        <p className="-mt-2 text-xs text-text-tertiary">관리자에게 받은 임시 비밀번호로 들어왔다면 여기서 바꿔 주세요.</p>
        <PasswordChangeForm action={changePassword} />
      </section>
      <SignOutButton />
    </main>
  );
}
