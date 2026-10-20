import Link from "next/link";
import { redirect } from "next/navigation";
import { fetchMyMember, fetchTakenJerseyNumbers } from "@/entities/member/server";
import { ProfileForm, updateProfile } from "@/features/profile-edit";
import { SignOutButton } from "@/features/sign-out";
import { ROUTES } from "@/shared/config";

export default async function MeView() {
  const me = await fetchMyMember();
  if (me === null) redirect(ROUTES.onboarding);
  const takenNumbers = await fetchTakenJerseyNumbers();

  return (
    <main className="mx-auto flex w-full max-w-100 flex-1 flex-col gap-8 px-4 py-8">
      <Link href={ROUTES.home} className="text-sm text-text-secondary">
        ← 홈
      </Link>
      <header>
        <h1 className="text-xl font-bold">내 정보</h1>
        <p className="mt-2 text-sm text-text-secondary">
          {me.realName} · 카카오 {me.kakaoNickname ?? "-"}
        </p>
        <p className="mt-1 text-xs text-text-tertiary">실명은 관리자에게 바꿔 달라고 해 주세요.</p>
      </header>
      <ProfileForm
        action={updateProfile}
        feet={me.feet}
        preferredPositions={me.preferredPositions}
        jerseyNumber={me.jerseyNumber}
        takenNumbers={takenNumbers}
      />
      <SignOutButton />
    </main>
  );
}
