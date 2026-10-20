import { matchTitle, type Match } from "../model/match";
import { formatMatchDate } from "../model/matchTime";

/** 매치 머리글: 날짜 · 상대 · 시간 · 장소 */
type MatchInfo = Pick<Match, "date" | "startsAt" | "endsAt" | "quarterCount" | "venue" | "opponent">;

export default function MatchSummary({ match }: { match: MatchInfo }) {
  return (
    <div>
      <p className="text-sm text-text-secondary">{formatMatchDate(match.date)}</p>
      <h1 className="mt-1 text-xl font-bold">{matchTitle(match)}</h1>
      <p className="mt-1 text-sm text-text-secondary">
        {match.startsAt}~{match.endsAt} · {match.quarterCount}쿼터
        {match.venue && ` · ${match.venue}`}
      </p>
    </div>
  );
}
