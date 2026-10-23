import {
  attendanceTimeNote,
  groupAttendance,
  RESPONSE_LABELS,
  type Attendance,
  type AttendanceResponse,
} from "../model/attendance";

const ORDER: AttendanceResponse[] = ["yes", "maybe", "no"];

const HEADING_TONE: Record<AttendanceResponse, string> = {
  yes: "text-primary",
  maybe: "text-fit-fair",
  no: "text-text-secondary",
};

/**
 * 참석 · 미정 · 불참 명단. 늦게 오거나 일찍 가는 사람은 시간을 붙인다.
 * 패널 안(flush)에 응답마다 한 칸씩 쌓고, 이름은 칩으로 늘어놓는다 — 21명이 와도 몇 줄 안에 든다.
 */
export default function AttendanceList({ attendance }: { attendance: readonly Attendance[] }) {
  const groups = groupAttendance(attendance);

  return (
    <div className="flex flex-col divide-y divide-border">
      {ORDER.map((response) => (
        <section key={response} className="px-3 py-3 md:px-4">
          <h3 className="flex items-baseline gap-1.5 text-xs font-bold">
            <span className={HEADING_TONE[response]}>{RESPONSE_LABELS[response]}</span>
            <span className="text-text-tertiary tabular-nums">{groups[response].length}</span>
          </h3>
          {groups[response].length === 0 ? (
            <p className="mt-1 text-sm text-text-tertiary">없음</p>
          ) : (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {groups[response].map((row) => {
                const note = attendanceTimeNote(row);
                return (
                  <li key={row.memberId} className="rounded-chip bg-bg-subtle px-2 py-1 text-sm">
                    {row.realName}
                    {note && <span className="ml-1 text-xs text-text-secondary">{note}</span>}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
