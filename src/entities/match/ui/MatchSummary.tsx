import { Emblem } from "@/shared/ui";
import { matchTitle, opponentInitial, type Match } from "../model/match";

/** 매치 미리보기에 쓰는 값 */
type MatchInfo = Pick<Match, "date" | "startsAt" | "endsAt" | "quarterCount" | "venue" | "opponent">;

/**
 * 매치 미리보기(풋볼매니저 경기 전 화면): 우리 팀 엠블럼 · 킥오프 · 상대, 아래 줄에 구장 · 시간 · 쿼터.
 * 날짜와 상대 이름은 화면 머리띠(제목 · 보조 줄)에 있다. 패널처럼 바탕 위에 뜬 상자다.
 */
export default function MatchSummary({ match }: { match: MatchInfo }) {
  const opponent = match.opponent ? match.opponent : matchTitle(match);
  return (
    <div className="overflow-hidden rounded-box border border-border bg-bg-panel">
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-3 pt-5 pb-4">
        <span className="flex flex-col items-center gap-1.5">
          <Emblem className="h-12 w-11" />
          <span className="text-sm font-bold">우리 팀</span>
        </span>
        <span className="flex flex-col items-center">
          <span className="text-xs font-semibold text-text-tertiary">킥오프</span>
          <span className="text-3xl font-extrabold tracking-tight tabular-nums">{match.startsAt}</span>
        </span>
        <span className="flex flex-col items-center gap-1.5">
          <span
            aria-hidden="true"
            className="flex size-12 items-center justify-center rounded-full border border-border-strong bg-bg-subtle text-lg font-extrabold text-text-secondary"
          >
            {opponentInitial(match.opponent)}
          </span>
          <span className="max-w-full truncate text-sm font-bold">{opponent}</span>
        </span>
      </div>
      <dl className="grid grid-cols-3 divide-x divide-border border-t border-border bg-bg-subtle">
        {[
          ["구장", match.venue ?? "–"],
          ["시간", `${match.startsAt}~${match.endsAt}`],
          ["쿼터", `${match.quarterCount}쿼터`],
        ].map(([term, detail]) => (
          <div key={term} className="min-w-0 px-3 py-2.5">
            <dt className="text-xs font-semibold text-text-tertiary">{term}</dt>
            <dd className="mt-0.5 truncate text-sm font-bold tabular-nums">{detail}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
