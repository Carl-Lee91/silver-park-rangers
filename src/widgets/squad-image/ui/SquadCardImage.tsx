import { countPlayers, type SharedSquad } from "@/entities/squad";
import { PALETTE } from "../lib/palette";
import MatchHeading from "./MatchHeading";
import PitchImage from "./PitchImage";

export const CARD_SIZE = { width: 800, height: 400 } as const;

/**
 * 카톡 미리보기 카드(PLAN.md §8). 카드 한 장에 전 쿼터 이름을 다 넣으면 못 읽으므로
 * 1쿼터 포메이션(이름 포함)과 요약만 넣는다. 전체는 링크로 본다.
 */
export default function SquadCardImage({ squad }: { squad: SharedSquad }) {
  const first = squad.quarters[0];
  return (
    <div
      style={{
        width: CARD_SIZE.width,
        height: CARD_SIZE.height,
        display: "flex",
        background: PALETTE.bgBase,
        // 글자색을 따로 안 준 글자(쿼터 제목 등)도 어두운 바탕에서 보이게. Satori 의 기본 글자색은 검정이다
        color: PALETTE.textPrimary,
        fontFamily: "Pretendard",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "36px 36px 32px",
        }}
      >
        <MatchHeading squad={squad} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: PALETTE.textPrimary }}>
            {`스쿼드 공개 · ${countPlayers(squad.quarters)}명`}
          </div>
          <div style={{ marginTop: 6, fontSize: 18, color: PALETTE.textTertiary }}>
            {first ? `1쿼터 ${first.formationName} · 눌러서 전체 쿼터 보기` : "눌러서 스쿼드 보기"}
          </div>
        </div>
      </div>
      {first && (
        <div style={{ display: "flex", padding: 0 }}>
          <PitchImage quarter={first} width={259} />
        </div>
      )}
    </div>
  );
}
