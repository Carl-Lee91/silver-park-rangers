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
import { ResultSummaryView, summarizeResult } from "@/entities/result";
import { fetchMatchResult } from "@/entities/result/server";
import { squadForImage } from "@/entities/squad";
import { fetchSquad } from "@/entities/squad/server";
import { AttendanceVoteForm, submitVote } from "@/features/attendance-vote";
import { ShareActions } from "@/features/squad-share";
import { getAuthUserId } from "@/shared/api";
import { getServerEnv, ROUTES } from "@/shared/config";
import { QuarterBoard } from "@/widgets/quarter-board";
import { squadImagePath, squadImageVersion } from "@/widgets/squad-image";
import { chipClass, Panel, Screen } from "@/shared/ui";

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
  const summary = summarizeResult(match.quarterCount, result.scores, result.goals);
  const mine = attendance.find((row) => row.memberId === userId && row.response !== null);
  const open = isVotingOpen(match);
  const groups = groupAttendance(attendance);
  const image = squadForImage(match, squad);
  const version = image === null ? "" : squadImageVersion(image);

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
            <AttendanceList attendance={attendance} />
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
                <TeamRoster teams={teams} perSide={playersPerSide(match.format)} />
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
                <QuarterBoard quarters={squad} schedule={quarterSchedule(match)} />
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
