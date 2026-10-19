import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchMatchAttendance } from "@/entities/attendance/server";
import { fetchFormations } from "@/entities/formation/server";
import { formatMatchDate, matchTitle, quarterSchedule } from "@/entities/match";
import { fetchMatch } from "@/entities/match/server";
import { fetchAdminMembers } from "@/entities/member/server";
import { fetchSquad } from "@/entities/squad/server";
import { buildPool, initialBuilder, publishSquad, saveSquad, SquadBuilder } from "@/features/squad-builder";
import { ShareActions } from "@/features/squad-share";
import { adminMatchPath, getServerEnv, ROUTES } from "@/shared/config";
import { shortHash } from "@/shared/lib";
import { squadImagePath } from "@/widgets/squad-image";

/** 기본 포메이션. 새 쿼터는 이것으로 시작한다(PLAN.md §5). */
const DEFAULT_FORMATION = "4-3-3";

export default async function AdminSquadView({ matchId }: { matchId: string }) {
  const match = await fetchMatch(matchId);
  if (match === null) notFound();

  const [attendance, members, formations, saved] = await Promise.all([
    fetchMatchAttendance(match.id),
    fetchAdminMembers(),
    fetchFormations(),
    fetchSquad(match.id),
  ]);

  const fallback = formations.find((formation) => formation.name === DEFAULT_FORMATION) ?? formations[0];
  if (fallback === undefined) {
    return (
      <p className="rounded-xl border border-danger p-4 text-sm">
        포메이션이 하나도 없어요. 초기 마이그레이션(기본 포메이션 4-3-3 · 4-4-2)이 적용됐는지 확인해 주세요.
      </p>
    );
  }

  const schedule = quarterSchedule(match);
  const current = saved.filter((quarter) => quarter.number <= match.quarterCount);
  const placed = new Set(current.flatMap((quarter) => quarter.slots.flatMap((slot) => (slot.memberId ? [slot.memberId] : []))));

  return (
    <div className="flex flex-col gap-5">
      <Link href={adminMatchPath(match.id)} className="text-sm text-text-secondary">
        ← {formatMatchDate(match.date)} {matchTitle(match)}
      </Link>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">스쿼드 짜기</h1>
        <Link href={ROUTES.adminFormations} className="text-sm text-primary">
          포메이션 관리
        </Link>
      </div>
      <SquadBuilder
        matchId={match.id}
        schedule={schedule}
        pool={buildPool(attendance, members, schedule, placed)}
        formations={formations}
        initial={initialBuilder(match.quarterCount, current, fallback)}
        published={match.squadPublishedAt !== null}
        saveAction={saveSquad}
        publishAction={publishSquad}
      />
      {match.squadPublishedAt !== null && current.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold">단톡방에 공유</h2>
          <ShareActions
            shareUrl={`${getServerEnv().SITE_URL}/s/${match.shareToken}`}
            title={`${formatMatchDate(match.date)} ${matchTitle(match)} 스쿼드`}
            imageUrls={{
              quarters: squadImagePath(match.shareToken, "quarters", shortHash(JSON.stringify(current))),
              rotation: squadImagePath(match.shareToken, "rotation", shortHash(JSON.stringify(current))),
            }}
          />
        </section>
      )}
    </div>
  );
}
