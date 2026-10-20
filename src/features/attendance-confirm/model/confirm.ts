import type { Attendance, AttendanceResponse } from "@/entities/attendance";

export type ConfirmRow = {
  memberId: string;
  realName: string;
  response: AttendanceResponse | null;
  /** 저장된 스쿼드의 어느 쿼터든 뛰었는지(키퍼 포함) */
  inSquad: boolean;
  /** null 이면 미확정 */
  attended: boolean | null;
};

type NamedMember = { id: string; realName: string };

/**
 * 매치 후 실제 출석을 정할 명단(PLAN.md §9 match_attendance.attended).
 * 참석·미정으로 투표한 사람, 스쿼드에 든 사람, 이미 출석이 기록된 사람을 모은다.
 */
export const confirmRows = (
  attendance: readonly Attendance[],
  squadMemberIds: ReadonlySet<string>,
  members: readonly NamedMember[],
): ConfirmRow[] => {
  const byMember = new Map(attendance.map((row) => [row.memberId, row]));
  const ids = new Set<string>([
    ...attendance
      .filter((row) => row.response === "yes" || row.response === "maybe" || row.attended !== null)
      .map((row) => row.memberId),
    ...squadMemberIds,
  ]);

  return members
    .filter((member) => ids.has(member.id))
    .map((member) => {
      const row = byMember.get(member.id);
      return {
        memberId: member.id,
        realName: member.realName,
        response: row?.response ?? null,
        inSquad: squadMemberIds.has(member.id),
        attended: row?.attended ?? null,
      };
    })
    .sort((a, b) => a.realName.localeCompare(b.realName, "ko"));
};

/** 스쿼드대로 확정: 스쿼드에 든 사람은 출석, 나머지는 불참 */
export const squadDefaults = (rows: readonly ConfirmRow[]) =>
  rows.map((row) => ({ memberId: row.memberId, attended: row.inSquad }));

/** 투표 없이 온 사람을 더할 때 고를 수 있는 사람: 명단에 아직 없는 승인 멤버 */
export const addableMembers = <T extends NamedMember>(members: readonly T[], rows: readonly ConfirmRow[]) => {
  const listed = new Set(rows.map((row) => row.memberId));
  return members.filter((member) => !listed.has(member.id));
};
