import { outcomeOf } from "../model/form";
import type { Goal, ResultSummary } from "../model/result";
import ResultChip from "./ResultChip";

const goalLine = (goal: Goal) => {
  const scorer = goal.scorerId === null ? "득점자 모름" : (goal.scorerName ?? "알 수 없음");
  return goal.assistName ? `${scorer} (도움 ${goal.assistName})` : scorer;
};

/**
 * 팀원이 보는 결과: 합계와 매치 결과(승무패) · 쿼터 전적, 아래에 쿼터별 점수와 득점자 표.
 * 패널 안(flush)에 둔다.
 */
export default function ResultSummaryView({ summary }: { summary: ResultSummary }) {
  if (summary.quarters.length === 0) {
    return <p className="p-3 text-sm text-text-tertiary md:p-4">아직 결과를 남기지 않았어요.</p>;
  }
  const { win, draw, loss } = summary.record;
  return (
    <div>
      <div className="flex items-center gap-3 px-3 py-3 md:px-4">
        <p className="text-3xl font-extrabold tracking-tight tabular-nums">
          {summary.total.ours} : {summary.total.theirs}
        </p>
        <ResultChip outcome={outcomeOf(summary.total)} />
        <span className="ml-auto text-sm text-text-secondary tabular-nums">
          쿼터 {win}승 {draw}무 {loss}패
        </span>
      </div>
      <ul className="border-t border-border">
        {summary.quarters.map((quarter) => (
          <li
            key={quarter.number}
            className="grid grid-cols-[3.5rem_3rem_minmax(0,1fr)] items-baseline gap-2 px-3 py-2 text-sm even:bg-bg-row md:px-4"
          >
            <span className="text-xs font-bold text-text-tertiary">{quarter.number}쿼터</span>
            <span className="font-bold tabular-nums">
              {quarter.ours} : {quarter.theirs}
            </span>
            <span className="text-xs text-text-secondary">{quarter.goals.map(goalLine).join(", ")}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
