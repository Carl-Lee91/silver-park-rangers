import Link from "next/link";
import type { ReactNode } from "react";
import { matchShape, matchTitle, type Match } from "../model/match";
import { formatMatchDate, matchDateParts } from "../model/matchTime";

/**
 * 매치 목록 한 줄(풋볼매니저 일정표). 왼쪽 일정 칸에 월 · 일 · 요일, 가운데 상대와 시간 · 쿼터 · 장소,
 * 오른쪽 자리(aside)에 내 투표 같은 표시를 둔다. 패널 안 목록(li)에 넣는다.
 */
export default function MatchCard({ match, href, aside }: { match: Match; href: string; aside?: ReactNode }) {
  const { month, day, weekday } = matchDateParts(match.date);
  return (
    <Link href={href} className="flex min-h-16 items-center gap-3 px-3 py-2 md:px-4">
      <span
        data-date-block
        aria-hidden="true"
        className="flex h-13 w-11 shrink-0 flex-col items-center justify-center rounded-chip border border-border bg-bg-subtle text-xs leading-tight font-semibold text-text-tertiary"
      >
        <span>{month}</span>
        <span className="text-lg leading-tight font-extrabold text-text-primary tabular-nums">{day}</span>
        <span>{weekday}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="sr-only">{formatMatchDate(match.date)}</span>
        <span className="block truncate font-bold">{matchTitle(match)}</span>
        <span className="mt-0.5 block truncate text-sm text-text-secondary">
          {match.startsAt}~{match.endsAt} · {matchShape(match)}{match.venue && ` · ${match.venue}`}
        </span>
      </span>
      {aside}
    </Link>
  );
}
