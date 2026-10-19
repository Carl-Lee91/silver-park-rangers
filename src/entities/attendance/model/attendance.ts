import { z } from "zod";

export type AttendanceResponse = "yes" | "no" | "maybe";

export const RESPONSE_LABELS: Record<AttendanceResponse, string> = {
  yes: "참석",
  maybe: "미정",
  no: "불참",
};

export type Attendance = {
  memberId: string;
  /** 볼 수 없는 멤버(휴면 등)면 null */
  realName: string | null;
  /** 관리자가 출석만 남긴 행은 투표가 없다 */
  response: AttendanceResponse | null;
  arriveAt: string | null;
  leaveAt: string | null;
  /** 매치 후 관리자가 확정한다. null 이면 미확정 */
  attended: boolean | null;
};

export const ATTENDANCE_COLUMNS = "member_id, response, arrive_at, leave_at, attended, members(real_name)";

const time = z
  .string()
  .regex(/^\d{2}:\d{2}(:\d{2})?$/)
  .transform((value) => value.slice(0, 5))
  .nullable();
const name = z.object({ real_name: z.string() });

const rowSchema = z.object({
  member_id: z.string(),
  response: z.enum(["yes", "no", "maybe"]).nullable(),
  arrive_at: time,
  leave_at: time,
  attended: z.boolean().nullable(),
  // 다대일 관계라 객체로 오지만, 관계를 못 알아보면 배열로 온다. 둘 다 받는다.
  members: z.union([name, z.array(name)]).nullable(),
});

export const toAttendance = (row: unknown): Attendance => {
  const parsed = rowSchema.parse(row);
  const member = Array.isArray(parsed.members) ? (parsed.members[0] ?? null) : parsed.members;
  return {
    memberId: parsed.member_id,
    realName: member?.real_name ?? null,
    response: parsed.response,
    arriveAt: parsed.arrive_at,
    leaveAt: parsed.leave_at,
    attended: parsed.attended,
  };
};

export type AttendanceGroups = Record<AttendanceResponse, Attendance[]>;

const byName = (a: { realName: string | null }, b: { realName: string | null }) =>
  (a.realName ?? "").localeCompare(b.realName ?? "", "ko");

/** 응답별로 나눈다. 투표가 없는 행과 이름을 볼 수 없는 사람은 뺀다. */
export const groupAttendance = (attendance: readonly Attendance[]): AttendanceGroups => {
  const visible = attendance.filter((row) => row.realName !== null).sort(byName);
  return {
    yes: visible.filter((row) => row.response === "yes"),
    maybe: visible.filter((row) => row.response === "maybe"),
    no: visible.filter((row) => row.response === "no"),
  };
};

/** "11:00 도착" · "12:00 출발" · "10:30~12:00". 처음부터 끝까지면 null */
export const attendanceTimeNote = ({ arriveAt, leaveAt }: Pick<Attendance, "arriveAt" | "leaveAt">) => {
  if (arriveAt !== null && leaveAt !== null) return `${arriveAt}~${leaveAt}`;
  if (arriveAt !== null) return `${arriveAt} 도착`;
  if (leaveAt !== null) return `${leaveAt} 출발`;
  return null;
};

/** 아직 투표하지 않은 사람. 관리자가 출석만 남긴 사람(응답 없음)도 들어간다. */
export const unrespondedMembers = <T extends { id: string; realName: string }>(
  members: readonly T[],
  attendance: readonly Attendance[],
): T[] => {
  const responded = new Set(attendance.filter((row) => row.response !== null).map((row) => row.memberId));
  return members.filter((member) => !responded.has(member.id)).sort(byName);
};
