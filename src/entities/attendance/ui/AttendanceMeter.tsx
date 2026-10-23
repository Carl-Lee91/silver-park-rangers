import type { AttendanceResponse } from "../model/attendance";
import { RESPONSE_LABELS } from "../model/attendance";

const PARTS: { response: AttendanceResponse; color: string }[] = [
  { response: "yes", color: "bg-primary" },
  { response: "maybe", color: "bg-fit-fair" },
  { response: "no", color: "bg-text-tertiary" },
];

/**
 * 참석 · 미정 · 불참 인원(홈 다음 매치). 막대는 응답한 사람 중 비율이고 꾸밈이라 읽지 않는다 —
 * 숫자는 아래 글자로 적는다. 참석은 12명에서 21명까지 오가서(PLAN.md §6) 인원은 늘 숫자로 보인다.
 */
export default function AttendanceMeter({ counts }: { counts: Record<AttendanceResponse, number> }) {
  const total = counts.yes + counts.maybe + counts.no;
  return (
    <div className="flex flex-col gap-2">
      <div data-meter aria-hidden="true" className="flex h-2 overflow-hidden rounded-chip bg-border">
        {total > 0 &&
          PARTS.map(({ response, color }) => (
            <span key={response} data-part={response} className={color} style={{ width: `${(counts[response] / total) * 100}%` }} />
          ))}
      </div>
      {total === 0 ? (
        <p className="text-xs text-text-tertiary">아직 응답이 없어요.</p>
      ) : (
        <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-secondary tabular-nums">
          {PARTS.map(({ response, color }) => (
            <span key={response} className="inline-flex items-center gap-1">
              <span aria-hidden="true" className={`size-2 rounded-chip ${color}`} />
              <span>{RESPONSE_LABELS[response]}</span> <b className="text-text-primary">{counts[response]}</b>
            </span>
          ))}
        </p>
      )}
    </div>
  );
}
