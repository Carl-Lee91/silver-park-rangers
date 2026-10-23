import Link from "next/link";
import type { ReactNode } from "react";
import { matchTitle, type Match } from "../model/match";
import { formatMatchDate } from "../model/matchTime";

/** 매치 목록 한 줄. 오른쪽 자리(aside)에 내 투표 같은 표시를 둔다. */
export default function MatchCard({ match, href, aside }: { match: Match; href: string; aside?: ReactNode }) {
  return (
    <Link href={href} className="flex items-center justify-between gap-3 rounded-box border border-border p-4">
      <span className="min-w-0">
        <span className="block text-sm text-text-secondary">{formatMatchDate(match.date)}</span>
        <span className="mt-0.5 block truncate font-semibold">{matchTitle(match)}</span>
        <span className="mt-0.5 block truncate text-xs text-text-tertiary">
          {match.startsAt}~{match.endsAt} · {match.quarterCount}쿼터{match.venue && ` · ${match.venue}`}
        </span>
      </span>
      {aside}
    </Link>
  );
}
