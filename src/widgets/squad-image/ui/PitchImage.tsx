import { JERSEY_PATH, JERSEY_VIEWBOX } from "@/entities/formation";
import type { SavedQuarter } from "@/entities/squad";
import { PALETTE } from "../lib/palette";

/**
 * Satori 로 그리는 경기장. 화면용 Pitch(entities/formation)와 같은 선·색이지만,
 * Satori 는 퍼센트 위치·CSS 변수·grid 를 못 써서 따로 둔다. 좌표는 px 로 계산한다.
 * 선수는 화면처럼 유니폼 모양(entities/formation 의 JERSEY_PATH) 안에 등번호다.
 */
export default function PitchImage({ quarter, width }: { quarter: SavedQuarter; width: number }) {
  const height = Math.round((width * 105) / 68);
  const shirt = Math.min(Math.round(width * 0.14), 56);
  const labelWidth = Math.round(shirt * 2.4);
  const nameSize = Math.max(12, Math.round(shirt * 0.35));
  // 유니폼 + 이름표가 경기장 밖으로 나가지 않게 한다(작은 카드에서 키퍼 이름이 잘렸다).
  const markerHeight = shirt + nameSize + 10;
  const topOf = (y: number) =>
    Math.min(Math.max(Math.round((y / 100) * height - shirt / 2), 2), height - markerHeight);

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        width,
        height,
        background: PALETTE.pitch,
        borderRadius: 6,
        overflow: "hidden",
      }}
    >
      <svg width={width} height={height} viewBox="0 0 68 105" style={{ position: "absolute", left: 0, top: 0 }}>
        {/* 잔디 줄무늬: 앱 경기장(Pitch)과 같다 */}
        <g fill={PALETTE.pitchStripe}>
          {[10.5, 31.5, 52.5, 73.5, 94.5].map((y) => (
            <rect key={y} x="0" y={y} width="68" height="10.5" />
          ))}
        </g>
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
                position: "relative",
                width: shirt,
                height: shirt,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width={shirt} height={shirt} viewBox={JERSEY_VIEWBOX} style={{ position: "absolute", left: 0, top: 0 }}>
                <path
                  d={JERSEY_PATH}
                  fill={empty ? "none" : keeper ? PALETTE.keeper : PALETTE.kit}
                  stroke={empty ? PALETTE.textPrimary : PALETTE.bgBase}
                  strokeOpacity={empty ? 0.7 : 0.4}
                  strokeWidth="1.2"
                  strokeDasharray={empty ? "3 2" : undefined}
                  strokeLinejoin="round"
                />
              </svg>
              <div
                style={{
                  marginTop: Math.round(shirt * 0.1),
                  fontSize: Math.round(shirt * 0.3),
                  fontWeight: 700,
                  color: empty ? PALETTE.textPrimary : keeper ? PALETTE.keeperLabel : PALETTE.kitLabel,
                }}
              >
                {slot.jerseyNumber === null ? slot.position : String(slot.jerseyNumber)}
              </div>
            </div>
            {!empty && (
              <div
                style={{
                  marginTop: 3,
                  padding: "1px 6px",
                  borderRadius: 4,
                  background: "rgba(0, 0, 0, 0.45)",
                  color: PALETTE.textPrimary,
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
