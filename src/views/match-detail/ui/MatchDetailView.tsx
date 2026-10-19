import Link from "next/link";
import { notFound } from "next/navigation";
import { AttendanceList } from "@/entities/attendance";
import { fetchMatchAttendance } from "@/entities/attendance/server";
import { formatDeadline, isVotingOpen, MatchSummary, quarterSchedule, votingClosesAt } from "@/entities/match";
import { fetchMatch } from "@/entities/match/server";
import { AttendanceVoteForm, submitVote } from "@/features/attendance-vote";
import { getAuthUserId } from "@/shared/api";
import { ROUTES } from "@/shared/config";

export default async function MatchDetailView({ matchId }: { matchId: string }) {
  const match = await fetchMatch(matchId);
  if (match === null) notFound();

  const [attendance, userId] = await Promise.all([fetchMatchAttendance(match.id), getAuthUserId()]);
  const mine = attendance.find((row) => row.memberId === userId && row.response !== null);
  const open = isVotingOpen(match);

  return (
    <main className="mx-auto flex w-full max-w-100 flex-1 flex-col gap-8 px-4 py-8">
      <Link href={ROUTES.home} className="text-sm text-text-secondary">
        ← 홈
      </Link>
      <MatchSummary match={match} />

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

      <section className="rounded-xl bg-bg-subtle p-4 text-sm text-text-secondary">
        {match.squadPublishedAt ? "스쿼드가 공개됐어요. 쿼터 보드는 곧 여기에 보여요." : "스쿼드는 아직 공개 전이에요."}
      </section>
    </main>
  );
}
