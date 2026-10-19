import { POSITION_CODES, type Position } from "@/entities/position";
import type { FormationSlot } from "./formation";

export type PositionCounts = Record<Position, number>;

/**
 * 포지션별 줄. 위에서 아래로 가 아니라 **우리 골문에서 상대 골문 쪽으로** 놓는다(y=0 이 상대 골문).
 * 가운데 포지션은 가운데부터 고르게 펼치고, 측면 포지션(윙백·윙)은 양쪽 끝부터 채운다.
 */
const LINES: { position: Position; y: number; flank?: number[] }[] = [
  { position: "GK", y: 92 },
  { position: "CB", y: 78 },
  { position: "WB", y: 70, flank: [12, 88, 28, 72] },
  { position: "MF", y: 55 },
  { position: "AM", y: 40 },
  { position: "WG", y: 28, flank: [15, 85, 30, 70] },
  { position: "FW", y: 17 },
];

/** 가운데 줄: 간격은 최대 25, 양 끝은 15~85 안 */
const centerXs = (count: number) => {
  if (count <= 1) return count === 1 ? [50] : [];
  const gap = Math.min(25, 70 / (count - 1));
  return Array.from({ length: count }, (_, index) => 50 + (index - (count - 1) / 2) * gap);
};

/** 인원수만 정하면 자리를 잡아 준다. 커스텀 포메이션을 좌표 없이 만들 때 쓴다. */
export const layoutFormation = (counts: PositionCounts): FormationSlot[] =>
  LINES.flatMap(({ position, y, flank }) => {
    const count = counts[position];
    const xs = flank && count <= flank.length ? flank.slice(0, count).sort((a, b) => a - b) : centerXs(count);
    return xs.map((x) => ({ position, x, y }));
  });

export const countsOf = (slots: readonly { position: Position }[]): PositionCounts => {
  const counts = Object.fromEntries(POSITION_CODES.map((code) => [code, 0])) as PositionCounts;
  for (const slot of slots) counts[slot.position]++;
  return counts;
};

/** "CB 3 · WB 2 · MF 3 · FW 2" — 키퍼는 빼고 수비부터 */
export const compositionLabel = (slots: readonly { position: Position }[]) => {
  const counts = countsOf(slots);
  return LINES.filter(({ position }) => position !== "GK" && counts[position] > 0)
    .map(({ position }) => `${position} ${counts[position]}`)
    .join(" · ");
};
