import { formatMatchDate, matchTitle } from "@/entities/match";
import type { SharedSquad } from "@/entities/squad";
import { PALETTE } from "../lib/palette";

/**
 * 이미지 머리글: 왼쪽에 팀 엠블럼, 오른쪽에 팀 이름 · 날짜 · 상대 · 시간.
 * 엠블럼은 서버가 파일을 읽어 data URI 로 넘긴다(loadImageEmblem).
 */
export default function MatchHeading({ squad, emblem, scale = 1 }: { squad: SharedSquad; emblem: string; scale?: number }) {
  const { match } = squad;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 24 * scale }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- 서버 이미지(Satori)는 img 만 그린다 */}
      <img src={emblem} width={112 * scale} height={112 * scale} alt="" />
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 20 * scale, fontWeight: 700, color: PALETTE.kit }}>Silver Park Rangers</div>
        <div style={{ marginTop: 10 * scale, fontSize: 24 * scale, color: PALETTE.textSecondary }}>
          {formatMatchDate(match.date)}
        </div>
        <div style={{ marginTop: 2 * scale, fontSize: 44 * scale, fontWeight: 700, color: PALETTE.textPrimary }}>
          {matchTitle(match)}
        </div>
        <div style={{ marginTop: 8 * scale, fontSize: 22 * scale, color: PALETTE.textSecondary }}>
          {`${match.startsAt}~${match.endsAt} · ${match.quarterCount}쿼터${match.venue ? ` · ${match.venue}` : ""}`}
        </div>
      </div>
    </div>
  );
}
