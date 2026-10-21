import Link from "next/link";
import { notFound } from "next/navigation";
import { AttendanceList } from "@/entities/attendance";
import { fetchMatchAttendance } from "@/entities/attendance/server";
import {
  formatDeadline,
  formatMatchDate,
  isVotingOpen,
  matchTitle,
  MatchSummary,
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

export default async function MatchDetailView({ matchId }: { matchId: string }) {
  const match = await fetchMatch(matchId);
  if (match === null) notFound();

  const [attendance, userId, squad, result] = await Promise.all([
    fetchMatchAttendance(match.id),
    getAuthUserId(),
    // 공개 전에는 RLS 가 빈 배열을 준다.
    match.squadPublishedAt ? fetchSquad(match.id) : Promise.resolve([]),
    fetchMatchResult(match.id),
  ]);
  const summary = summarizeResult(match.quarterCount, result.scores, result.goals);
  const mine = attendance.find((row) => row.memberId === userId && row.response !== null);
  const open = isVotingOpen(match);
  const image = squadForImage(match, squad);
  const version = image === null ? "" : squadImageVersion(image);

  return (
    <main className="mx-auto flex w-full max-w-100 flex-1 flex-col gap-8 px-4 py-8">
      <Link href={ROUTES.home} className="text-sm text-text-secondary">
        ← 홈
      </Link>
      <MatchSummary match={match} />

      {summary.quarters.length > 0 && (
        <section>
          <h2 className="mb-3 font-semibold">경기 결과</h2>
          <ResultSummaryView summary={summary} />
        </section>
      )}

      <section className="rounded-xl border border-border p-4">
        <h2 className="font-semibold">참석 투표</h2>
        <p className="mt-1 mb-4 text-xs text-text-tertiary">
          {open ? `${formatDeadline(votingClosesAt(match).toISOString())}까지` : "마감됨"}
        </p>
        <AttendanceVoteForm
          action={submitVote}
          matchId={match.id}
          schedule={quarterSchedule(match)}
          current={mine ? { response: mine.response!, arriveAt: mine.arriveAt, leaveAt: mine.leaveAt } : null}
          open={open}
        />
      </section>

      <section>
        <h2 className="mb-3 font-semibold">참석자</h2>
        <AttendanceList attendance={attendance} />
      </section>

      <section>
        <h2 className="mb-3 font-semibold">스쿼드</h2>
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
          <p className="rounded-xl bg-bg-subtle p-4 text-sm text-text-secondary">스쿼드는 아직 공개 전이에요.</p>
        )}
      </section>
    </main>
  );
}
