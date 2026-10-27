import { Emblem } from "@/shared/ui";
import { FORMAT_LABELS, matchTitle, opponentInitial, type Match, type MatchFormat } from "../model/match";

/** 매치 미리보기에 쓰는 값. 종류가 없으면 축구(스쿼드 공유 링크)고, 풋살은 쿼터 수를 안 쓴다(팀 공유 링크) */
type MatchInfo = Pick<Match, "date" | "startsAt" | "endsAt" | "venue" | "opponent"> &
  ({ format?: "football"; quarterCount: number } | { format: Exclude<MatchFormat, "football">; quarterCount?: number });

/**
 * 매치 미리보기(풋볼매니저 경기 전 화면): 우리 팀 엠블럼 · 킥오프 · 상대, 아래 줄에 구장 · 시간 · 쿼터.
 * 날짜와 상대 이름은 화면 머리띠(제목 · 보조 줄)에 있다. 패널처럼 바탕 위에 뜬 상자고,
 * 패널 안에 넣을 때(framed=false)는 바깥 상자를 뺀다.
 */
export default function MatchSummary({ match, framed = true }: { match: MatchInfo; framed?: boolean }) {
  const opponent = match.opponent ? match.opponent : matchTitle(match);
  return (
    <div className={framed ? "overflow-hidden rounded-box border border-border bg-bg-panel" : ""}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-3 pt-5 pb-4">
        <span className="flex flex-col items-center gap-1.5">
          <Emblem className="size-12" />
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
          match.format === undefined || match.format === "football"
            ? ["쿼터", `${match.quarterCount}쿼터`]
            : ["종류", FORMAT_LABELS[match.format]],
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
