import { notFound } from "next/navigation";
import { AttendanceList, groupAttendance } from "@/entities/attendance";
import { fetchMatchAttendance } from "@/entities/attendance/server";
import { TeamRoster } from "@/entities/futsal";
import { fetchTeamLists } from "@/entities/futsal/server";
import {
  formatDeadline,
  formatMatchDate,
  isFutsal,
  isVotingOpen,
  MatchSummary,
  matchTitle,
  playersPerSide,
  quarterSchedule,
  votingClosesAt,
} from "@/entities/match";
import { fetchMatch } from "@/entities/match/server";
import { canManageMembers } from "@/entities/member";
import { fetchMemberProfiles, fetchMyGate } from "@/entities/member/server";
import { fetchAllRatings } from "@/entities/rating/server";
import { ResultSummaryView, summarizeResult } from "@/entities/result";
import { fetchMatchResult } from "@/entities/result/server";
import { squadForImage } from "@/entities/squad";
import { fetchSquad } from "@/entities/squad/server";
import { mvpClosesAt, mvpPhase, mvpWinners } from "@/entities/mvp";
import { fetchMvpResults, fetchMvpVoterCount, fetchMyMvpVote } from "@/entities/mvp/server";
import { AttendanceVoteForm, submitVote } from "@/features/attendance-vote";
import { matchReportText } from "@/features/match-report";
import { MvpVoteForm, submitMvpVote } from "@/features/mvp-vote";
import { ShareActions } from "@/features/squad-share";
import { getAuthUserId } from "@/shared/api";
import { getServerEnv, matchPath, ROUTES } from "@/shared/config";
import { QuarterBoard } from "@/widgets/quarter-board";
import { playerTips } from "@/widgets/player-tip";
import { squadImagePath, squadImageVersion } from "@/widgets/squad-image";
import { chipClass, CopyButton, Panel, Screen } from "@/shared/ui";

export default async function MatchDetailView({ matchId }: { matchId: string }) {
  const match = await fetchMatch(matchId);
  if (match === null) notFound();

  const futsal = isFutsal(match);
  const published = match.squadPublishedAt !== null;
  const [attendance, userId, squad, result, teams] = await Promise.all([
    fetchMatchAttendance(match.id),
    getAuthUserId(),
    // 공개 전에는 RLS 가 빈 배열을 준다.
    published && !futsal ? fetchSquad(match.id) : Promise.resolve([]),
    fetchMatchResult(match.id),
    published && futsal ? fetchTeamLists(match.id, match.teamCount) : Promise.resolve([]),
  ]);
  // 이름 앞 ! 단추(선수 정보): 이 매치에 나오는 사람의 포지션 · 주발. 능력치는 관리자가 볼 때만 읽는다(PLAN.md §5)
  const ids = new Set([
    ...attendance.map((row) => row.memberId),
    ...squad.flatMap((quarter) => quarter.slots.flatMap((slot) => (slot.memberId ? [slot.memberId] : []))),
    ...teams.flatMap((team) => team.flatMap((member) => (member.id ? [member.id] : []))),
  ]);
  const [profiles, ratings] = await Promise.all([
    fetchMemberProfiles([...ids]),
    fetchMyGate().then((gate) => (canManageMembers(gate) ? fetchAllRatings() : null)),
  ]);
  const tips = playerTips(profiles, ratings);
  const summary = summarizeResult(match.quarterCount, result.scores, result.goals);
  const mine = attendance.find((row) => row.memberId === userId && row.response !== null);
  const open = isVotingOpen(match);
  const groups = groupAttendance(attendance);
  const image = squadForImage(match, squad);
  const version = image === null ? "" : squadImageVersion(image);

  // MVP 투표(PLAN.md §10): 끝나고 이틀 동안, 뛴 사람끼리. 결과는 마감 뒤에만 온다.
  const phase = mvpPhase(match);
  const played = attendance.filter((row) => row.realName !== null && (row.attended === true || (row.attended === null && row.response === "yes")));
  const [myMvp, mvpVoters, mvpTally] =
    phase === "before"
      ? [null, 0, []]
      : await Promise.all([fetchMyMvpVote(match.id), fetchMvpVoterCount(match.id), phase === "closed" ? fetchMvpResults(match.id) : []]);
  const mvp = mvpWinners(mvpTally);
  const report =
    summary.quarters.length === 0
      ? null
      : matchReportText({
          title: `${formatMatchDate(match.date)} ${matchTitle(match)}`,
          summary,
          mvp,
          attendedCount: attendance.filter((row) => row.attended === true).length,
          url: `${getServerEnv().SITE_URL}${matchPath(match.id)}`,
        });

  return (
    <Screen
      title={matchTitle(match)}
      overline={`${formatMatchDate(match.date)} · 매치`}
      back={{ href: ROUTES.home, label: "홈" }}
    >
      <MatchSummary match={match} />

      {/* 데스크톱: 왼쪽은 결과·투표·참석자, 오른쪽은 스쿼드 */}
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-5 lg:items-start lg:gap-6">
        <div className="flex flex-col gap-4 lg:col-span-2 lg:gap-6">
          {summary.quarters.length > 0 && (
            <Panel title="경기 결과" flush>
              <ResultSummaryView summary={summary} />
              {report && (
                <div className="border-t border-border p-3 md:p-4">
                  <CopyButton text={report} label="경기 리포트 복사" done="복사했어요. 단톡방에 붙여 넣으세요." />
                </div>
              )}
            </Panel>
          )}

          {phase !== "before" && (
            <Panel
              title="MVP"
              aside={phase === "open" ? `${mvpVoters}명 투표 · ${formatDeadline(mvpClosesAt(match).toISOString())} 마감` : `${mvpVoters}명 투표`}
            >
              {phase === "closed" ? (
                mvp.length === 0 ? (
                  <p className="text-sm text-text-secondary">아무도 투표하지 않았어요.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    <p className="text-xl font-extrabold">
                      {mvp.map((row) => `${row.jerseyNumber === null ? "" : `${row.jerseyNumber} `}${row.realName}`).join(" · ")}
                    </p>
                    <p className="text-sm text-text-secondary">
                      {mvpTally
                        .slice(0, 5)
                        .map((row) => `${row.realName} ${row.votes}표`)
                        .join(" · ")}
                    </p>
                  </div>
                )
              ) : played.some((row) => row.memberId === userId) ? (
                <MvpVoteForm
                  action={submitMvpVote}
                  matchId={match.id}
                  current={myMvp}
                  candidates={played
                    .filter((row) => row.memberId !== userId)
                    .map((row) => ({ id: row.memberId, realName: row.realName!, jerseyNumber: row.jerseyNumber }))
                    .sort((a, b) => a.realName.localeCompare(b.realName, "ko"))}
                />
              ) : (
                <p className="text-sm text-text-secondary">이 매치에 뛴 사람만 투표해요. 결과는 마감 뒤에 나와요.</p>
              )}
            </Panel>
          )}

          <Panel title="참석 투표" aside={open ? `${formatDeadline(votingClosesAt(match).toISOString())}까지` : "마감됨"}>
            <AttendanceVoteForm
              action={submitVote}
              matchId={match.id}
              schedule={quarterSchedule(match)}
              current={mine ? { response: mine.response!, arriveAt: mine.arriveAt, leaveAt: mine.leaveAt } : null}
              open={open}
              askTime={!futsal}
            />
          </Panel>

          <Panel title="참석자" aside={`참석 ${groups.yes.length} · 미정 ${groups.maybe.length} · 불참 ${groups.no.length}`} flush>
            <AttendanceList attendance={attendance} tips={tips} />
          </Panel>
        </div>

        {futsal ? (
          <Panel
            title="팀"
            aside={published ? <span className={chipClass("good")}>공개됨</span> : <span className={chipClass("muted")}>공개 전</span>}
            className="lg:col-span-3"
          >
            {published ? (
              <div className="flex flex-col gap-5">
                <TeamRoster teams={teams} perSide={playersPerSide(match.format)} tips={tips} />
                <ShareActions
                  shareUrl={`${getServerEnv().SITE_URL}/s/${match.shareToken}`}
                  title={`${formatMatchDate(match.date)} ${matchTitle(match)} 팀`}
                />
              </div>
            ) : (
              <p className="text-sm text-text-secondary">팀은 아직 공개 전이에요. 관리자가 나눠서 공개하면 여기에 팀 명단이 떠요.</p>
            )}
          </Panel>
        ) : (
          <Panel
            title="스쿼드"
            aside={squad.length > 0 ? <span className={chipClass("good")}>공개됨</span> : <span className={chipClass("muted")}>공개 전</span>}
            className="lg:col-span-3"
          >
            {squad.length > 0 ? (
              <div className="flex flex-col gap-5">
                <QuarterBoard quarters={squad} schedule={quarterSchedule(match)} tips={tips} />
                <ShareActions
                  shareUrl={`${getServerEnv().SITE_URL}/s/${match.shareToken}`}
                  title={`${formatMatchDate(match.date)} ${matchTitle(match)} 스쿼드`}
                  imageUrls={{
                    quarters: squadImagePath(match.shareToken, "quarters", version),
                    rotation: squadImagePath(match.shareToken, "rotation", version),
                  }}
                />
              </div>
            ) : (
              <p className="text-sm text-text-secondary">스쿼드는 아직 공개 전이에요. 관리자가 공개하면 여기에 쿼터별 배치가 떠요.</p>
            )}
          </Panel>
        )}
      </div>
    </Screen>
  );
}
