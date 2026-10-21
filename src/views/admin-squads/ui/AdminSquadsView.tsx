import Link from "next/link";
import { fetchYesCounts } from "@/entities/attendance/server";
import { MatchCard, type Match } from "@/entities/match";
import { fetchPastMatches, fetchUpcomingMatches } from "@/entities/match/server";
import { SQUAD_STATUS_LABELS, squadStatus, type SquadStatus } from "@/entities/squad";
import { fetchSquadMatchIds } from "@/entities/squad/server";
import { adminSquadPath, ROUTES } from "@/shared/config";

/** 지난 매치는 최근 몇 개만 둔다. 스쿼드는 다가오는 매치를 짜는 곳이라서다. */
const RECENT_PAST = 5;

const BADGE: Record<SquadStatus, string> = {
  none: "border border-border text-text-secondary",
  saved: "bg-bg-subtle text-text-primary",
  published: "bg-primary text-primary-contrast",
};

function SquadAside({ status, yes }: { status: SquadStatus; yes: number }) {
  return (
    <span className="flex shrink-0 flex-col items-end gap-1 text-right">
      <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${BADGE[status]}`}>{SQUAD_STATUS_LABELS[status]}</span>
      <span className="text-xs text-text-tertiary">참석 {yes}명</span>
    </span>
  );
}

function MatchGrid({ matches, saved, yes }: { matches: Match[]; saved: Set<string>; yes: Record<string, number> }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {matches.map((match) => (
        <MatchCard
          key={match.id}
          match={match}
          href={adminSquadPath(match.id)}
          aside={
            <SquadAside
              status={squadStatus({ hasSquad: saved.has(match.id), squadPublishedAt: match.squadPublishedAt })}
              yes={yes[match.id] ?? 0}
            />
          }
        />
      ))}
    </div>
  );
}

/** 관리 › 스쿼드(PLAN.md §7). 매치마다 스쿼드가 어디까지 왔는지 보고, 누르면 바로 빌더로 간다. */
export default async function AdminSquadsView() {
  const [upcoming, past] = await Promise.all([fetchUpcomingMatches(), fetchPastMatches(undefined, RECENT_PAST)]);
  const ids = [...upcoming, ...past].map((match) => match.id);
  const [saved, yes] = await Promise.all([fetchSquadMatchIds(ids), fetchYesCounts(ids)]);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-xl font-bold">스쿼드</h1>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-text-secondary">다가오는 매치</h2>
        {upcoming.length === 0 ? (
          <div className="flex flex-col items-start gap-3 rounded-xl bg-bg-subtle p-4 text-sm text-text-tertiary">
            <p>다가오는 매치가 없어요. 매치를 만들면 여기서 바로 스쿼드를 짤 수 있어요.</p>
            <Link href={ROUTES.adminMatchNew} className="font-semibold text-primary">
              매치 만들기
            </Link>
          </div>
        ) : (
          <MatchGrid matches={upcoming} saved={saved} yes={yes} />
        )}
      </section>

      {past.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-text-secondary">지난 매치</h2>
          <MatchGrid matches={past} saved={saved} yes={yes} />
        </section>
      )}
    </div>
  );
}
