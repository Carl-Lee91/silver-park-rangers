import { POSITION_CODES, type Position } from "@/entities/position";
import type { FormationSlot } from "./formation";

export type PositionCounts = Record<Position, number>;

/**
 * 포지션별 자리. 위에서 아래로 가 아니라 **우리 골문에서 상대 골문 쪽으로** 놓는다(y=0 이 상대 골문).
 * 5선(센터백 · 풀백) → 1선(공격수) 순이고, 같은 줄의 측면은 중앙보다 조금 앞이다(풀백 > 센터백).
 * 가운데 포지션은 가운데부터 고르게 펼치고, 측면 포지션은 양쪽 끝부터 채운다.
 * 센터백은 간격을 조금 좁힌다 — 5백(센터백 3 + 풀백 2)에서 풀백과 겹치지 않게.
 */
const LINES: { position: Position; y: number; flank?: number[]; gap?: number }[] = [
  { position: "GK", y: 92 },
  { position: "CB", y: 79, gap: 22 },
  { position: "FB", y: 74, flank: [10, 90, 25, 75] },
  { position: "DM", y: 66 },
  { position: "WB", y: 62, flank: [10, 90, 25, 75] },
  { position: "MF", y: 52 },
  { position: "WM", y: 50, flank: [12, 88, 27, 73] },
  { position: "AM", y: 38 },
  { position: "WG", y: 27, flank: [15, 85, 30, 70] },
  { position: "FW", y: 17 },
];

/** 가운데 줄: 간격은 최대 25(센터백 22), 양 끝은 15~85 안 */
const centerXs = (count: number, maxGap = 25) => {
  if (count <= 1) return count === 1 ? [50] : [];
  const gap = Math.min(maxGap, 70 / (count - 1));
  return Array.from({ length: count }, (_, index) => 50 + (index - (count - 1) / 2) * gap);
};

/** 인원수만 정하면 자리를 잡아 준다. 커스텀 포메이션을 좌표 없이 만들 때 쓴다. */
export const layoutFormation = (counts: PositionCounts): FormationSlot[] =>
  LINES.flatMap(({ position, y, flank, gap }) => {
    const count = counts[position];
    const xs = flank && count <= flank.length ? flank.slice(0, count).sort((a, b) => a - b) : centerXs(count, gap);
    return xs.map((x) => ({ position, x, y }));
  });

export const countsOf = (slots: readonly { position: Position }[]): PositionCounts => {
  const counts = Object.fromEntries(POSITION_CODES.map((code) => [code, 0])) as PositionCounts;
  for (const slot of slots) counts[slot.position]++;
  return counts;
};

/** "CB 3 · DM 1 · WB 2 · MF 2 · FW 2" — 키퍼는 빼고 수비부터 */
export const compositionLabel = (slots: readonly { position: Position }[]) => {
  const counts = countsOf(slots);
  return LINES.filter(({ position }) => position !== "GK" && counts[position] > 0)
    .map(({ position }) => `${position} ${counts[position]}`)
    .join(" · ");
};
