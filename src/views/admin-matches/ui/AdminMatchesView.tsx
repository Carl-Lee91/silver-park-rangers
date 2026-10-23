import Link from "next/link";
import { MatchCard } from "@/entities/match";
import { fetchPastMatches, fetchUpcomingMatches } from "@/entities/match/server";
import { adminMatchPath, ROUTES } from "@/shared/config";

export default async function AdminMatchesView() {
  const [upcoming, past] = await Promise.all([fetchUpcomingMatches(), fetchPastMatches()]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">매치</h1>
        <Link
          href={ROUTES.adminMatchNew}
          className="inline-flex h-11 items-center rounded-box bg-primary px-4 text-sm font-semibold text-primary-contrast"
        >
          매치 만들기
        </Link>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-text-secondary">다가오는 매치</h2>
        {upcoming.length === 0 ? (
          <p className="rounded-box bg-bg-subtle p-4 text-sm text-text-tertiary">다가오는 매치가 없어요.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((match) => (
              <MatchCard key={match.id} match={match} href={adminMatchPath(match.id)} />
            ))}
          </div>
        )}
      </section>

      {past.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-text-secondary">지난 매치</h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {past.map((match) => (
              <MatchCard key={match.id} match={match} href={adminMatchPath(match.id)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
