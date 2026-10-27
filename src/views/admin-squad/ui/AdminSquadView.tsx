import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { fetchMatchAttendance } from "@/entities/attendance/server";
import { fetchFormations } from "@/entities/formation/server";
import { formatMatchDate, isFutsal, matchTitle, quarterSchedule, seoulToday } from "@/entities/match";
import { fetchMatch } from "@/entities/match/server";
import { fetchMatchNotes } from "@/entities/match-note/server";
import { fieldStrength } from "@/entities/rating";
import { fetchAllRatings } from "@/entities/rating/server";
import { fetchAdminMembers } from "@/entities/member/server";
import { squadForImage } from "@/entities/squad";
import { fetchSquad } from "@/entities/squad/server";
import { computeMemberStats, periodRange } from "@/entities/stats";
import { fetchStatsSource } from "@/entities/stats/server";
import { setAttendanceWindow } from "@/features/attendance-adjust";
import { saveMatchNote } from "@/features/match-note";
import { buildPool, initialBuilder, publishSquad, saveSquad, SquadBuilder } from "@/features/squad-builder";
import { ShareActions, SquadImageViewer } from "@/features/squad-share";
import { adminMatchPath, adminTeamsPath, getServerEnv, ROUTES } from "@/shared/config";
import { adminSquadImagePath, squadImageVersion } from "@/widgets/squad-image";
import { chipClass, Panel, Screen } from "@/shared/ui";

/** 기본 포메이션. 새 쿼터는 이것으로 시작한다(PLAN.md §5). */
const DEFAULT_FORMATION = "4-3-3";

export default async function AdminSquadView({ matchId }: { matchId: string }) {
  const match = await fetchMatch(matchId);
  if (match === null) notFound();
  // 풋살은 쿼터 · 스쿼드 대신 팀 나누기다(PLAN.md §6 "풋살")
  if (isFutsal(match)) redirect(adminTeamsPath(match.id));

  const [attendance, members, formations, saved, season, notes, ratings] = await Promise.all([
    fetchMatchAttendance(match.id),
    fetchAdminMembers(),
    fetchFormations(),
    fetchSquad(match.id),
    fetchStatsSource(periodRange("season", seoulToday())),
    fetchMatchNotes(match.id),
    fetchAllRatings(),
  ]);
  // 자동 배치 스타일이 쓰는 선수 전력(관리자 전용 능력치, PLAN.md §6). 매기지 않은 사람은 없다(평균으로 본다)
  const strengths = Object.fromEntries(Object.entries(ratings).map(([id, values]) => [id, fieldStrength(values)]));
  const seasonAverages = Object.fromEntries(
    computeMemberStats(season).map((row) => [row.memberId, row.avgFieldQuarters]),
  );

  const fallback = formations.find((formation) => formation.name === DEFAULT_FORMATION) ?? formations[0];
  if (fallback === undefined) {
    return (
      <Screen title="스쿼드 편성" back={{ href: adminMatchPath(match.id), label: "매치" }} width="wide">
        <p className="rounded-box border border-danger p-4 text-sm">
          포메이션이 하나도 없어요. 초기 마이그레이션(기본 포메이션 4-3-3 · 4-4-2)이 적용됐는지 확인해 주세요.
        </p>
      </Screen>
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
    <Screen
      title="스쿼드 편성"
      overline={`${formatMatchDate(match.date)} ${match.startsAt} · ${matchTitle(match)}`}
      back={{ href: adminMatchPath(match.id), label: "매치" }}
      width="wide"
      actions={
        <span className={chipClass("band")}>
          {match.squadPublishedAt !== null ? "공개됨" : "공개 전"}
        </span>
      }
    >
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
        strengths={strengths}
      />
      {current.length > 0 &&
        (match.squadPublishedAt !== null ? (
          <Panel title="단톡방에 공유">
            <ShareActions
              shareUrl={`${getServerEnv().SITE_URL}/s/${match.shareToken}`}
              title={`${formatMatchDate(match.date)} ${matchTitle(match)} 스쿼드`}
              imageUrls={imageUrls}
            />
          </Panel>
        ) : (
          <Panel title="이미지" aside="관리자만">
            <p className="mb-3 text-xs text-text-tertiary">
              공개 전이라 관리자만 볼 수 있어요. 마지막으로 저장한 배치로 그려요.
            </p>
            <SquadImageViewer urls={imageUrls} fileName={`${formatMatchDate(match.date)} ${matchTitle(match)} 스쿼드`} />
          </Panel>
        ))}
      <Link href={ROUTES.adminFormations} className="self-start text-sm font-semibold text-primary">
        포메이션 관리
      </Link>
    </Screen>
  );
}
