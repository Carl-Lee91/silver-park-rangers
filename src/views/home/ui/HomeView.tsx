import { redirect } from "next/navigation";
import { fetchMyMember } from "@/entities/member/server";
import { SignOutButton } from "@/features/sign-out";
import { ROUTES } from "@/shared/config";

export default async function HomeView() {
  const me = await fetchMyMember();
  if (me === null) redirect(ROUTES.onboarding);

  return (
    <main className="mx-auto flex w-full max-w-100 flex-1 flex-col gap-8 px-4 py-10">
      <header>
        <p className="text-sm text-text-secondary">Silver Park Rangers</p>
        <h1 className="mt-1 text-xl font-bold">{me.realName}님, 안녕하세요</h1>
      </header>
      <p className="rounded-xl bg-bg-subtle p-4 text-sm text-text-secondary">
        다가오는 매치는 곧 여기에 보여요.
      </p>
      <SignOutButton />
    </main>
  );
}
