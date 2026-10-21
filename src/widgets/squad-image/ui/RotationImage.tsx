import { rotationTable, type SharedSquad } from "@/entities/squad";
import { PALETTE } from "../lib/palette";
import MatchHeading from "./MatchHeading";

const WIDTH = 1080;
const PADDING = 40;
const HEADING = 190;
const ROW = 56;
const NAME = 260;
const TOTAL = 110;
const FOOTNOTE = 60;

export const rotationImageSize = (squad: SharedSquad) => ({
  width: WIDTH,
  height: PADDING * 2 + HEADING + ROW * (rotationTable(squad.quarters).length + 1) + FOOTNOTE,
});

/** 출전표 한 장: 사람 × 쿼터. 키퍼 쿼터는 GK 로 쓰고 출전 수에 넣지 않는다. */
export default function RotationImage({ squad }: { squad: SharedSquad }) {
  const rows = rotationTable(squad.quarters);
  const cell = (WIDTH - PADDING * 2 - NAME - TOTAL) / Math.max(1, squad.quarters.length);
  const line = { display: "flex", height: ROW, alignItems: "center", borderBottom: `1px solid ${PALETTE.border}` } as const;
  const center = { display: "flex", justifyContent: "center", alignItems: "center" } as const;

  return (
    <div
      style={{
        ...rotationImageSize(squad),
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
        <MatchHeading squad={squad} />
      </div>
      <div style={{ ...line, fontSize: 22, color: PALETTE.textSecondary }}>
        <div style={{ display: "flex", width: NAME }}>이름</div>
        {squad.quarters.map((quarter) => (
          <div key={quarter.number} style={{ ...center, width: cell }}>{`${quarter.number}Q`}</div>
        ))}
        <div style={{ ...center, width: TOTAL }}>출전</div>
      </div>
      {rows.map((row) => (
        <div key={row.memberId} style={{ ...line, fontSize: 26 }}>
          <div style={{ display: "flex", width: NAME, fontWeight: 700 }}>
            {row.jerseyNumber === null ? row.name : `${row.jerseyNumber} ${row.name}`}
          </div>
          {row.marks.map((mark, index) => (
            <div
              key={index}
              style={{
                ...center,
                width: cell,
                color: mark === "keeper" ? PALETTE.textSecondary : PALETTE.primary,
                fontSize: mark === "keeper" ? 20 : 26,
                fontWeight: 700,
              }}
            >
              {mark === "field" ? "●" : mark === "keeper" ? "GK" : ""}
            </div>
          ))}
          <div style={{ ...center, width: TOTAL, fontWeight: 700 }}>{String(row.fieldCount)}</div>
        </div>
      ))}
      <div style={{ display: "flex", height: FOOTNOTE, alignItems: "flex-end", fontSize: 20, color: PALETTE.textTertiary }}>
        GK 로 뛴 쿼터는 출전 수에 넣지 않아요.
      </div>
    </div>
  );
}
