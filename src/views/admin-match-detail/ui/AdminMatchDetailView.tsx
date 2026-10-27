import Link from "next/link";
import { notFound } from "next/navigation";
import { AttendanceList, groupAttendance, unrespondedMembers } from "@/entities/attendance";
import { fetchMatchAttendance } from "@/entities/attendance/server";
import { fetchTeamAssignments } from "@/entities/futsal/server";
import { formatDeadline, formatMatchDate, isFutsal, isVotingOpen, matchTitle, MatchSummary, votingClosesAt } from "@/entities/match";
import { fetchMatch } from "@/entities/match/server";
import { regularMembers } from "@/entities/member";
import { fetchAdminMembers } from "@/entities/member/server";
import { fetchMatchResult } from "@/entities/result/server";
import { fetchSquad } from "@/entities/squad/server";
import { AttendanceConfirm, confirmRows } from "@/features/attendance-confirm";
import { deleteMatch } from "@/features/match-form";
import { MatchGuests } from "@/features/match-guest";
import { ResultEditor } from "@/features/result-record";
import { adminMatchEditPath, adminSquadPath, adminTeamsPath, ROUTES } from "@/shared/config";
import { ActionButton, chipClass, Panel, Screen } from "@/shared/ui";

export default async function AdminMatchDetailView({ matchId }: { matchId: string }) {
  const match = await fetchMatch(matchId);
  if (match === null) notFound();

  const futsal = isFutsal(match);
  const [attendance, members, squad, result, teams] = await Promise.all([
    fetchMatchAttendance(match.id),
    fetchAdminMembers(),
    fetchSquad(match.id),
    fetchMatchResult(match.id),
    futsal ? fetchTeamAssignments(match.id) : Promise.resolve({}),
  ]);
  // 이 매치에서 볼 사람: 승인된 멤버와 이 매치의 그날 용병. 다른 매치의 그날 용병은 뺀다.
  const approved = regularMembers(members, match.id);
  const guests = approved.filter((member) => member.guestMatchId === match.id);
  const waiting = unrespondedMembers(approved, attendance);
  // 출석 확정의 기준: 축구는 스쿼드에 든 사람, 풋살은 팀에 든 사람(PLAN.md §6 "풋살")
  const squadIds = futsal
    ? new Set(Object.keys(teams))
    : new Set(squad.flatMap((quarter) => quarter.slots.flatMap((slot) => (slot.memberId ? [slot.memberId] : []))));
  const open = isVotingOpen(match);
  const groups = groupAttendance(attendance);

  return (
    <Screen
      title={matchTitle(match)}
      overline={`${formatMatchDate(match.date)} · 매치 관리`}
      back={{ href: ROUTES.adminMatches, label: "매치" }}
      width="wide"
      actions={
        <Link
          href={futsal ? adminTeamsPath(match.id) : adminSquadPath(match.id)}
          className="inline-flex h-11 items-center rounded-box bg-kit-label px-4 text-sm font-bold text-kit"
        >
          {futsal ? "팀 나누기" : "스쿼드 짜기"}
        </Link>
      }
    >
      <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-end lg:gap-6">
        <MatchSummary match={match} />
        <div className="flex flex-col gap-2">
          <p className="flex flex-wrap items-center gap-2 text-xs text-text-tertiary">
            투표 {open ? `${formatDeadline(votingClosesAt(match).toISOString())} 마감` : "마감됨"}
            <span className={chipClass(match.squadPublishedAt ? "good" : "muted")}>
              스쿼드 {match.squadPublishedAt ? "공개됨" : "공개 전"}
            </span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Link
              href={adminMatchEditPath(match.id)}
              className="flex h-11 items-center justify-center rounded-box border border-border-strong bg-bg-subtle text-sm font-medium"
            >
              고치기
            </Link>
            <ActionButton
              action={deleteMatch}
              fields={{ matchId: match.id }}
              label="지우기"
              tone="danger"
              confirmMessage="이 매치를 지울까요? 참석 투표도 함께 지워져요."
            />
          </div>
        </div>
      </div>

      {/* 데스크톱: 왼쪽은 참석(투표·그날 용병), 오른쪽은 출석·결과 */}
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6">
        <div className="flex flex-col gap-4 lg:gap-6">
          <Panel title="참석 투표" aside={`참석 ${groups.yes.length} · 미정 ${groups.maybe.length} · 불참 ${groups.no.length}`} flush>
            <AttendanceList attendance={attendance} />
            <div className="border-t border-border px-3 py-3 md:px-4">
              <h3 className="flex items-baseline gap-1.5 text-xs font-bold">
                <span className="text-danger">아직 투표 안 함</span>
                <span className="text-text-tertiary tabular-nums">{waiting.length}</span>
              </h3>
              {waiting.length === 0 ? (
                <p className="mt-1 text-sm text-text-tertiary">모두 투표했어요.</p>
              ) : (
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {waiting.map((member) => (
                    <li key={member.id} className="rounded-chip border border-border-strong px-2 py-1 text-sm">
                      {member.realName}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Panel>

          <Panel title="그날 용병" aside={`${guests.length}명`}>
            <p className="mb-3 text-xs text-text-tertiary">
              가입하지 않고 이번 매치만 뛰는 용병이에요. 넣으면 참석으로 잡혀요. 팀원에게는 이름만 보여요.
            </p>
            <MatchGuests
              matchId={match.id}
              guests={guests.map(({ id, realName, feet, preferredPositions, jerseyNumber }) => ({
                id,
                realName,
                feet,
                preferredPositions,
                jerseyNumber,
              }))}
            />
          </Panel>
        </div>

        <div className="flex flex-col gap-4 lg:gap-6">
          <Panel title="실제 출석" aside="매치가 끝나면">
            <p className="mb-3 text-xs text-text-tertiary">매치가 끝나면 정해 주세요. 참석률·노쇼 통계가 이 값을 써요.</p>
            <AttendanceConfirm
              matchId={match.id}
              rows={confirmRows(attendance, squadIds, members)}
              members={approved}
              hasSquad={squadIds.size > 0}
              squadLabel={futsal ? "팀 명단" : "스쿼드"}
            />
          </Panel>

          {/* 풋살은 경기 결과를 아직 남기지 않는다(PLAN.md §6 "풋살") */}
          {!futsal && (
            <Panel title="경기 결과" aside="쿼터마다">
              <p className="mb-3 text-xs text-text-tertiary">쿼터마다 골과 상대 점수를 남겨요. 우리 점수는 골 수로 세요.</p>
              <ResultEditor
                matchId={match.id}
                quarterCount={match.quarterCount}
                scores={result.scores}
                goals={result.goals}
                squad={squad}
                members={approved.map((member) => ({ id: member.id, realName: member.realName }))}
              />
            </Panel>
          )}
        </div>
      </div>
    </Screen>
  );
}
