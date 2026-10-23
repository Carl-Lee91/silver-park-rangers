import { quarterSchedule } from "@/entities/match";
import type { SharedSquad } from "@/entities/squad";
import { PALETTE } from "../lib/palette";
import MatchHeading from "./MatchHeading";
import PitchImage, { pitchHeight } from "./PitchImage";

const WIDTH = 1080;
const PADDING = 40;
const GAP = 40;
const CELL = (WIDTH - PADDING * 2 - GAP) / 2;
const HEADING = 190;
const CAPTION = 44;

/** 전 쿼터를 두 줄로 모은 한 장(PLAN.md §7 이미지 익스포트) */
export const quarterSheetSize = (squad: SharedSquad) => {
  const rows = Math.max(1, Math.ceil(squad.quarters.length / 2));
  return { width: WIDTH, height: PADDING * 2 + HEADING + rows * (CAPTION + pitchHeight(CELL)) + (rows - 1) * GAP };
};

export default function QuarterSheetImage({ squad, emblem }: { squad: SharedSquad; emblem: string }) {
  const schedule = quarterSchedule(squad.match);
  return (
    <div
      style={{
        ...quarterSheetSize(squad),
        display: "flex",
        flexDirection: "column",
        padding: PADDING,
        background: PALETTE.bgBase,
        // 글자색을 따로 안 준 글자(쿼터 제목 등)도 어두운 바탕에서 보이게. Satori 의 기본 글자색은 검정이다
        color: PALETTE.textPrimary,
        fontFamily: "Pretendard",
      }}
    >
      <div style={{ display: "flex", height: HEADING }}>
        <MatchHeading squad={squad} emblem={emblem} />
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: GAP }}>
        {squad.quarters.map((quarter) => (
          <div key={quarter.number} style={{ display: "flex", flexDirection: "column", width: CELL }}>
            <div style={{ display: "flex", height: CAPTION, alignItems: "center", fontSize: 26, fontWeight: 700 }}>
              {`${quarter.number}쿼터`}
              <span style={{ marginLeft: 10, fontSize: 22, fontWeight: 400, color: PALETTE.textSecondary }}>
                {`${schedule[quarter.number - 1]?.startsAt ?? ""} · ${quarter.formationName}`}
              </span>
            </div>
            <PitchImage quarter={quarter} width={CELL} />
          </div>
        ))}
      </div>
    </div>
  );
}
