import Link from "next/link";
import { redirect } from "next/navigation";
import { RESPONSE_LABELS, type AttendanceResponse } from "@/entities/attendance";
import { fetchMyResponses } from "@/entities/attendance/server";
import { isVotingOpen, MatchCard } from "@/entities/match";
import { fetchUpcomingMatches } from "@/entities/match/server";
import { isAdmin } from "@/entities/member";
import { fetchMyMember } from "@/entities/member/server";
import { SignOutButton } from "@/features/sign-out";
import { matchPath, ROUTES } from "@/shared/config";

function ResponseBadge({ response, open }: { response: AttendanceResponse | undefined; open: boolean }) {
  if (response !== undefined) {
    const tone = response === "yes" ? "bg-primary text-primary-contrast" : "bg-bg-subtle text-text-secondary";
    return <span className={`shrink-0 rounded-lg px-2 py-1 text-xs font-semibold ${tone}`}>{RESPONSE_LABELS[response]}</span>;
  }
  return open ? (
    <span className="shrink-0 rounded-lg border border-danger px-2 py-1 text-xs font-semibold text-danger">투표 전</span>
  ) : (
    <span className="shrink-0 text-xs text-text-tertiary">마감</span>
  );
}

export default async function HomeView() {
  const me = await fetchMyMember();
  if (me === null) redirect(ROUTES.onboarding);

  const matches = await fetchUpcomingMatches();
  const responses = await fetchMyResponses(matches.map((match) => match.id));

  return (
    <main className="mx-auto flex w-full max-w-100 flex-1 flex-col gap-8 px-4 py-10">
      <header className="flex items-start justify-between">
        <div>
          <p className="text-sm text-text-secondary">Silver Park Rangers</p>
          <h1 className="mt-1 text-xl font-bold">{me.realName}님, 안녕하세요</h1>
        </div>
        <Link href={ROUTES.me} className="text-sm text-text-secondary underline underline-offset-4">
          내 정보
        </Link>
      </header>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-text-secondary">다가오는 매치</h2>
        {matches.length === 0 ? (
          <p className="rounded-xl bg-bg-subtle p-4 text-sm text-text-secondary">다가오는 매치가 없어요.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {matches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                href={matchPath(match.id)}
                aside={<ResponseBadge response={responses[match.id]} open={isVotingOpen(match)} />}
              />
            ))}
          </div>
        )}
      </section>

      {isAdmin(me) && (
        <Link href={ROUTES.admin} className="rounded-xl border border-border p-4 text-sm font-semibold">
          관리 화면으로
        </Link>
      )}
      <SignOutButton />
    </main>
  );
}
