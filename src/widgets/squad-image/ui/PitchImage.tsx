import type { SavedQuarter } from "@/entities/squad";
import { PALETTE } from "../lib/palette";

/**
 * Satori 로 그리는 경기장. 화면용 Pitch(entities/formation)와 같은 선·색이지만,
 * Satori 는 퍼센트 위치·CSS 변수·grid 를 못 써서 따로 둔다. 좌표는 px 로 계산한다.
 */
export default function PitchImage({ quarter, width }: { quarter: SavedQuarter; width: number }) {
  const height = Math.round((width * 105) / 68);
  const circle = Math.min(Math.round(width * 0.13), 52);
  const labelWidth = Math.round(circle * 2.6);
  const nameSize = Math.max(12, Math.round(circle * 0.38));
  // 동그라미 + 이름표가 경기장 밖으로 나가지 않게 한다(작은 카드에서 키퍼 이름이 잘렸다).
  const markerHeight = circle + nameSize + 10;
  const topOf = (y: number) =>
    Math.min(Math.max(Math.round((y / 100) * height - circle / 2), 2), height - markerHeight);

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        width,
        height,
        background: PALETTE.pitch,
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      <svg width={width} height={height} viewBox="0 0 68 105" style={{ position: "absolute", left: 0, top: 0 }}>
        <g fill="none" stroke={PALETTE.pitchLine} strokeWidth="0.4">
          <rect x="1.5" y="1.5" width="65" height="102" />
          <line x1="1.5" y1="52.5" x2="66.5" y2="52.5" />
          <circle cx="34" cy="52.5" r="9.15" />
          <rect x="13.84" y="1.5" width="40.32" height="16.5" />
          <rect x="24.84" y="1.5" width="18.32" height="5.5" />
          <rect x="13.84" y="87" width="40.32" height="16.5" />
          <rect x="24.84" y="98" width="18.32" height="5.5" />
        </g>
      </svg>
      {quarter.slots.map((slot) => {
        const empty = slot.memberName === null;
        const keeper = slot.position === "GK";
        return (
          <div
            key={slot.slotIndex}
            style={{
              position: "absolute",
              left: Math.round((slot.x / 100) * width - labelWidth / 2),
              top: topOf(slot.y),
              width: labelWidth,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: circle,
                height: circle,
                borderRadius: circle / 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: Math.round(circle * 0.34),
                fontWeight: 700,
                background: empty ? "transparent" : keeper ? PALETTE.keeper : PALETTE.kit,
                color: empty ? PALETTE.bgBase : keeper ? PALETTE.keeperLabel : PALETTE.kitLabel,
                border: empty ? `2px dashed ${PALETTE.bgBase}` : "none",
              }}
            >
              {slot.jerseyNumber === null ? slot.position : String(slot.jerseyNumber)}
            </div>
            {!empty && (
              <div
                style={{
                  marginTop: 3,
                  padding: "1px 6px",
                  borderRadius: 4,
                  background: "rgba(0, 0, 0, 0.45)",
                  color: PALETTE.bgBase,
                  fontSize: nameSize,
                  fontWeight: 700,
                }}
              >
                {slot.memberName}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export const pitchHeight = (width: number) => Math.round((width * 105) / 68);
