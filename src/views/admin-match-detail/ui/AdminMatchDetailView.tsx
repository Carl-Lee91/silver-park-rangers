import Link from "next/link";
import { notFound } from "next/navigation";
import { AttendanceList, unrespondedMembers } from "@/entities/attendance";
import { fetchMatchAttendance } from "@/entities/attendance/server";
import { formatDeadline, isVotingOpen, MatchSummary, votingClosesAt } from "@/entities/match";
import { fetchMatch } from "@/entities/match/server";
import { fetchAdminMembers } from "@/entities/member/server";
import { fetchMatchResult } from "@/entities/result/server";
import { fetchSquad } from "@/entities/squad/server";
import { AttendanceConfirm, confirmRows } from "@/features/attendance-confirm";
import { deleteMatch } from "@/features/match-form";
import { ResultEditor } from "@/features/result-record";
import { adminMatchEditPath, adminSquadPath, ROUTES } from "@/shared/config";
import { ActionButton } from "@/shared/ui";

export default async function AdminMatchDetailView({ matchId }: { matchId: string }) {
  const match = await fetchMatch(matchId);
  if (match === null) notFound();

  const [attendance, members, squad, result] = await Promise.all([
    fetchMatchAttendance(match.id),
    fetchAdminMembers(),
    fetchSquad(match.id),
    fetchMatchResult(match.id),
  ]);
  const approved = members.filter((member) => member.status === "approved");
  const waiting = unrespondedMembers(approved, attendance);
  const squadIds = new Set(squad.flatMap((quarter) => quarter.slots.flatMap((slot) => (slot.memberId ? [slot.memberId] : []))));
  const open = isVotingOpen(match);

  return (
    <div className="flex flex-col gap-8">
      <Link href={ROUTES.adminMatches} className="text-sm text-text-secondary">
        ← 매치 목록
      </Link>
      <MatchSummary match={match} />
      <p className="-mt-6 text-xs text-text-tertiary">
        투표 {open ? `${formatDeadline(votingClosesAt(match).toISOString())} 마감` : "마감됨"}
      </p>

      <div className="grid grid-cols-2 gap-2">
        <Link
          href={adminMatchEditPath(match.id)}
          className="flex h-10 items-center justify-center rounded-lg border border-border text-sm font-medium"
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

      <section>
        <h2 className="mb-3 font-semibold">참석 투표</h2>
        <AttendanceList attendance={attendance} />
        <div className="mt-4">
          <h3 className="text-sm font-semibold">
            아직 투표 안 함 <span className="text-text-secondary">{waiting.length}</span>
          </h3>
          {waiting.length === 0 ? (
            <p className="mt-1 text-sm text-text-tertiary">모두 투표했어요.</p>
          ) : (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {waiting.map((member) => (
                <li key={member.id} className="rounded-lg border border-border px-2 py-1 text-sm">
                  {member.realName}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <Link
        href={adminSquadPath(match.id)}
        className="flex items-center justify-between rounded-xl bg-primary p-4 text-primary-contrast"
      >
        <span className="font-semibold">스쿼드 짜기</span>
        <span className="text-sm opacity-80">{match.squadPublishedAt ? "팀원에게 공개됨" : "공개 전"}</span>
      </Link>

      <section>
        <h2 className="mb-3 font-semibold">실제 출석</h2>
        <p className="mb-3 text-xs text-text-tertiary">매치가 끝나면 정해 주세요. 참석률·노쇼 통계가 이 값을 써요.</p>
        <AttendanceConfirm
          matchId={match.id}
          rows={confirmRows(attendance, squadIds, members)}
          members={approved}
          hasSquad={squadIds.size > 0}
        />
      </section>

      <section>
        <h2 className="mb-1 font-semibold">경기 결과</h2>
        <p className="mb-3 text-xs text-text-tertiary">쿼터마다 골과 상대 점수를 남겨요. 우리 점수는 골 수로 세요.</p>
        <ResultEditor
          matchId={match.id}
          quarterCount={match.quarterCount}
          scores={result.scores}
          goals={result.goals}
          squad={squad}
          members={approved.map((member) => ({ id: member.id, realName: member.realName }))}
        />
      </section>
    </div>
  );
}
