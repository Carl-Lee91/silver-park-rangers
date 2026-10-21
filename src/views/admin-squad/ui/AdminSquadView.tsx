import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchMatchAttendance } from "@/entities/attendance/server";
import { fetchFormations } from "@/entities/formation/server";
import { formatMatchDate, matchTitle, quarterSchedule, seoulToday } from "@/entities/match";
import { fetchMatch } from "@/entities/match/server";
import { fetchMatchNotes } from "@/entities/match-note/server";
import { fetchAdminMembers } from "@/entities/member/server";
import { squadForImage } from "@/entities/squad";
import { fetchSquad } from "@/entities/squad/server";
import { computeMemberStats, periodRange } from "@/entities/stats";
import { fetchStatsSource } from "@/entities/stats/server";
import { setAttendanceWindow } from "@/features/attendance-adjust";
import { saveMatchNote } from "@/features/match-note";
import { buildPool, initialBuilder, publishSquad, saveSquad, SquadBuilder } from "@/features/squad-builder";
import { ShareActions, SquadImageViewer } from "@/features/squad-share";
import { adminMatchPath, getServerEnv, ROUTES } from "@/shared/config";
import { adminSquadImagePath, squadImageVersion } from "@/widgets/squad-image";

/** 기본 포메이션. 새 쿼터는 이것으로 시작한다(PLAN.md §5). */
const DEFAULT_FORMATION = "4-3-3";

export default async function AdminSquadView({ matchId }: { matchId: string }) {
  const match = await fetchMatch(matchId);
  if (match === null) notFound();

  const [attendance, members, formations, saved, season, notes] = await Promise.all([
    fetchMatchAttendance(match.id),
    fetchAdminMembers(),
    fetchFormations(),
    fetchSquad(match.id),
    fetchStatsSource(periodRange("season", seoulToday())),
    fetchMatchNotes(match.id),
  ]);
  const seasonAverages = Object.fromEntries(
    computeMemberStats(season).map((row) => [row.memberId, row.avgFieldQuarters]),
  );

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
  // 이미지는 저장한 배치로 그린다. 공개 전에도 관리자는 본다(관리자 전용 주소, PLAN.md §7).
  const image = squadForImage(match, current);
  const version = image === null ? "" : squadImageVersion(image);
  const imageUrls = {
    quarters: adminSquadImagePath(match.id, "quarters", version),
    rotation: adminSquadImagePath(match.id, "rotation", version),
  };

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
        seasonAverages={seasonAverages}
        notes={notes}
        noteAction={saveMatchNote}
        windowAction={setAttendanceWindow}
      />
      {current.length > 0 &&
        (match.squadPublishedAt !== null ? (
          <section>
            <h2 className="mb-2 text-sm font-semibold">단톡방에 공유</h2>
            <ShareActions
              shareUrl={`${getServerEnv().SITE_URL}/s/${match.shareToken}`}
              title={`${formatMatchDate(match.date)} ${matchTitle(match)} 스쿼드`}
              imageUrls={imageUrls}
            />
          </section>
        ) : (
          <section>
            <h2 className="text-sm font-semibold">이미지</h2>
            <p className="mt-1 mb-2 text-xs text-text-tertiary">
              공개 전이라 관리자만 볼 수 있어요. 마지막으로 저장한 배치로 그려요.
            </p>
            <SquadImageViewer urls={imageUrls} fileName={`${formatMatchDate(match.date)} ${matchTitle(match)} 스쿼드`} />
          </section>
        ))}
    </div>
  );
}
