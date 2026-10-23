import Link from "next/link";
import { fetchYesCounts } from "@/entities/attendance/server";
import { MatchCard, type Match } from "@/entities/match";
import { fetchPastMatches, fetchUpcomingMatches } from "@/entities/match/server";
import { SQUAD_STATUS_LABELS, squadStatus, type SquadStatus } from "@/entities/squad";
import { fetchSquadMatchIds } from "@/entities/squad/server";
import { adminSquadPath, ROUTES } from "@/shared/config";
import { chipClass, Panel, Screen, type ChipTone } from "@/shared/ui";

/** 지난 매치는 최근 몇 개만 둔다. 스쿼드는 다가오는 매치를 짜는 곳이라서다. */
const RECENT_PAST = 5;

const TONE: Record<SquadStatus, ChipTone> = { none: "danger", saved: "warn", published: "good" };

function SquadAside({ status, yes }: { status: SquadStatus; yes: number }) {
  return (
    <span className="flex shrink-0 flex-col items-end gap-1 text-right">
      <span className={chipClass(TONE[status])}>{SQUAD_STATUS_LABELS[status]}</span>
      <span className="text-xs text-text-tertiary tabular-nums">참석 {yes}명</span>
    </span>
  );
}

function MatchRows({ matches, saved, yes }: { matches: Match[]; saved: Set<string>; yes: Record<string, number> }) {
  return (
    <ul className="divide-y divide-border">
      {matches.map((match) => (
        <li key={match.id} className="even:bg-bg-row">
          <MatchCard
            match={match}
            href={adminSquadPath(match.id)}
            aside={
              <SquadAside
                status={squadStatus({ hasSquad: saved.has(match.id), squadPublishedAt: match.squadPublishedAt })}
                yes={yes[match.id] ?? 0}
              />
            }
          />
        </li>
      ))}
    </ul>
  );
}

/** 관리 › 스쿼드(PLAN.md §7). 매치마다 스쿼드가 어디까지 왔는지 보고, 누르면 바로 빌더로 간다. */
export default async function AdminSquadsView() {
  const [upcoming, past] = await Promise.all([fetchUpcomingMatches(), fetchPastMatches(undefined, RECENT_PAST)]);
  const ids = [...upcoming, ...past].map((match) => match.id);
  const [saved, yes] = await Promise.all([fetchSquadMatchIds(ids), fetchYesCounts(ids)]);

  return (
    <Screen title="스쿼드" overline="쿼터별 편성" width="wide">
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6">
      <Panel title="다가오는 매치" aside={`${upcoming.length}`} flush>
        {upcoming.length === 0 ? (
          <div className="flex flex-col items-start gap-3 p-3 text-sm text-text-tertiary md:p-4">
            <p>다가오는 매치가 없어요. 매치를 만들면 여기서 바로 스쿼드를 짤 수 있어요.</p>
            <Link href={ROUTES.adminMatchNew} className="font-semibold text-primary">
              매치 만들기
            </Link>
          </div>
        ) : (
          <MatchRows matches={upcoming} saved={saved} yes={yes} />
        )}
      </Panel>

      {past.length > 0 && (
        <Panel title="지난 매치" aside={`최근 ${past.length}`} flush>
          <MatchRows matches={past} saved={saved} yes={yes} />
        </Panel>
      )}
      </div>
    </Screen>
  );
}
