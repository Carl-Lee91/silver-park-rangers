import type { Attendance } from "@/entities/attendance";
import type { AdminMember } from "@/entities/member";
import type { TeamBuilderPlayer } from "../ui/TeamBuilder";

/**
 * 풋살 팀 나누기 대상: 참석으로 투표한 사람과, 투표를 바꿨어도 이미 팀에 든 사람(빼야 한다는 걸 보이려고).
 * 전력은 필드 능력치 평균(골키퍼 능력치는 안 본다), 용병 표시는 멤버 구분 · 그날 용병이다(관리자 화면).
 */
export const futsalPool = (
  attendance: readonly Attendance[],
  members: readonly AdminMember[],
  saved: Readonly<Record<string, number>>,
  strengths: Readonly<Record<string, number | null>>,
): TeamBuilderPlayer[] => {
  const byId = new Map(members.map((member) => [member.id, member]));
  const coming = new Set(attendance.filter((row) => row.response === "yes").map((row) => row.memberId));
  const ids = [...new Set([...coming, ...Object.keys(saved)])];
  return ids
    .flatMap((id) => {
      const member = byId.get(id);
      return member
        ? [
            {
              id,
              realName: member.realName,
              jerseyNumber: member.jerseyNumber,
              strength: strengths[id] ?? null,
              guest: member.memberType === "guest" || member.guestMatchId !== null,
            },
          ]
        : [];
    })
    .sort((a, b) => a.realName.localeCompare(b.realName, "ko"));
};
