import { OUTCOME_LABELS, type MatchResultLine } from "../model/form";
import ResultChip from "./ResultChip";

/**
 * 최근 폼(풋볼매니저): 결과 칸을 왼쪽 오래된 매치부터 오른쪽 최신까지 늘어놓는다.
 * 결과는 최근 순으로 받는다(recentResults). 읽을 때는 한 문장으로 읽는다.
 */
export default function FormStrip({ results }: { results: readonly MatchResultLine[] }) {
  if (results.length === 0) return <p className="text-sm text-text-tertiary">아직 결과를 남긴 매치가 없어요.</p>;
  const oldestFirst = [...results].reverse();
  return (
    <div
      role="img"
      aria-label={`최근 ${results.length}매치: ${oldestFirst.map((result) => OUTCOME_LABELS[result.outcome]).join(", ")} (오른쪽이 최신)`}
      className="flex gap-1.5"
    >
      {oldestFirst.map((result) => (
        <ResultChip key={result.matchId} outcome={result.outcome} />
      ))}
    </div>
  );
}
