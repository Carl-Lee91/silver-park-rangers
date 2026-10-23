import {
  attendanceTimeNote,
  groupAttendance,
  RESPONSE_LABELS,
  type Attendance,
  type AttendanceResponse,
} from "../model/attendance";

const ORDER: AttendanceResponse[] = ["yes", "maybe", "no"];

/** 참석 · 미정 · 불참 명단. 늦게 오거나 일찍 가는 사람은 시간을 붙인다. */
export default function AttendanceList({ attendance }: { attendance: readonly Attendance[] }) {
  const groups = groupAttendance(attendance);

  return (
    <div className="flex flex-col gap-4">
      {ORDER.map((response) => (
        <section key={response}>
          <h3 className="text-sm font-semibold">
            {RESPONSE_LABELS[response]} <span className="text-text-secondary">{groups[response].length}</span>
          </h3>
          {groups[response].length === 0 ? (
            <p className="mt-1 text-sm text-text-tertiary">없음</p>
          ) : (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {groups[response].map((row) => {
                const note = attendanceTimeNote(row);
                return (
                  <li key={row.memberId} className="rounded-box bg-bg-subtle px-2 py-1 text-sm">
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
