import type { Goal, ResultSummary } from "../model/result";

const goalLine = (goal: Goal) => {
  const scorer = goal.scorerId === null ? "득점자 모름" : (goal.scorerName ?? "알 수 없음");
  return goal.assistName ? `${scorer} (도움 ${goal.assistName})` : scorer;
};

/** 팀원이 보는 결과: 합계 · 쿼터 전적 · 쿼터별 점수와 득점자 */
export default function ResultSummaryView({ summary }: { summary: ResultSummary }) {
  if (summary.quarters.length === 0) {
    return <p className="rounded-xl bg-bg-subtle p-4 text-sm text-text-secondary">아직 결과를 남기지 않았어요.</p>;
  }
  const { win, draw, loss } = summary.record;
  return (
    <div className="flex flex-col gap-3">
      <p className="text-2xl font-bold tabular-nums">
        {summary.total.ours} : {summary.total.theirs}
        <span className="ml-2 text-sm font-normal text-text-secondary">
          {win}승 {draw}무 {loss}패
        </span>
      </p>
      <ul className="flex flex-col gap-2">
        {summary.quarters.map((quarter) => (
          <li key={quarter.number} className="rounded-lg border border-border px-3 py-2 text-sm">
            <span className="font-semibold">{quarter.number}쿼터</span>{" "}
            <span>
              {quarter.ours} : {quarter.theirs}
            </span>
            {quarter.goals.length > 0 && (
              <span className="block text-xs text-text-secondary">{quarter.goals.map(goalLine).join(", ")}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
