import { formatMatchDate, matchTitle } from "@/entities/match";
import type { SharedSquad } from "@/entities/squad";
import { PALETTE } from "../lib/palette";

/** 이미지 머리글: 팀 이름 · 날짜 · 상대 · 시간 */
export default function MatchHeading({ squad, scale = 1 }: { squad: SharedSquad; scale?: number }) {
  const { match } = squad;
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ fontSize: 20 * scale, fontWeight: 700, color: PALETTE.primary }}>Silver Park Rangers</div>
      <div style={{ marginTop: 14 * scale, fontSize: 24 * scale, color: PALETTE.textSecondary }}>
        {formatMatchDate(match.date)}
      </div>
      <div style={{ marginTop: 4 * scale, fontSize: 44 * scale, fontWeight: 700, color: PALETTE.textPrimary }}>
        {matchTitle(match)}
      </div>
      <div style={{ marginTop: 10 * scale, fontSize: 22 * scale, color: PALETTE.textSecondary }}>
        {`${match.startsAt}~${match.endsAt} · ${match.quarterCount}쿼터${match.venue ? ` · ${match.venue}` : ""}`}
      </div>
    </div>
  );
}
