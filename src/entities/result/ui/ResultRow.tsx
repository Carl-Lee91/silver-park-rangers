import Link from "next/link";
import type { MatchResultLine } from "../model/form";
import ResultChip from "./ResultChip";

/**
 * 결과 한 줄: 날짜 · 상대 · 합계 점수 · 승무패. 날짜 글자(dateLabel)는 부르는 쪽이 매치 표기로 만든다
 * (엔티티끼리는 값을 가져오지 않는다).
 */
export default function ResultRow({ result, dateLabel, href }: { result: MatchResultLine; dateLabel: string; href: string }) {
  return (
    <Link href={href} className="flex min-h-12 items-center gap-3 px-3 py-1.5 md:px-4">
      <span className="min-w-0 flex-1">
        <span className="block text-xs text-text-tertiary">{dateLabel}</span>
        <span className="block truncate text-sm font-bold">{result.opponent ? `vs ${result.opponent}` : "상대 미정"}</span>
      </span>
      <span className="text-lg font-extrabold tracking-tight tabular-nums">
        {result.ours} : {result.theirs}
      </span>
      <ResultChip outcome={result.outcome} size="sm" />
    </Link>
  );
}
