import Link from "next/link";
import { MatchCard, type Match } from "@/entities/match";
import { fetchPastMatches, fetchUpcomingMatches } from "@/entities/match/server";
import { adminMatchPath, ROUTES } from "@/shared/config";
import { Panel, Screen } from "@/shared/ui";

function MatchRows({ matches }: { matches: Match[] }) {
  return (
    <ul className="divide-y divide-border">
      {matches.map((match) => (
        <li key={match.id} className="even:bg-bg-row">
          <MatchCard match={match} href={adminMatchPath(match.id)} />
        </li>
      ))}
    </ul>
  );
}

export default async function AdminMatchesView() {
  const [upcoming, past] = await Promise.all([fetchUpcomingMatches(), fetchPastMatches()]);

  return (
    <Screen
      title="매치"
      overline="일정"
      width="wide"
      actions={
        <Link href={ROUTES.adminMatchNew} className="inline-flex h-11 items-center rounded-box bg-kit-label px-4 text-sm font-bold text-kit">
          매치 만들기
        </Link>
      }
    >
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6">
        <Panel title="다가오는 매치" aside={`${upcoming.length}`} flush>
          {upcoming.length === 0 ? (
            <p className="p-3 text-sm text-text-tertiary md:p-4">다가오는 매치가 없어요.</p>
          ) : (
            <MatchRows matches={upcoming} />
          )}
        </Panel>
        {past.length > 0 && (
          <Panel title="지난 매치" aside={`최근 ${past.length}`} flush>
            <MatchRows matches={past} />
          </Panel>
        )}
      </div>
    </Screen>
  );
}
