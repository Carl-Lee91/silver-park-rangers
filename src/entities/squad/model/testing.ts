import type { Position } from "@/entities/position";
import type { SquadPlayer, SquadQuarter } from "./types";

/**
 * 스쿼드 테스트가 같이 쓰는 재료. 테스트에서만 import 한다(index.ts 로 내보내지 않는다).
 */

export const ALL_DAY = [0, 1, 2, 3, 4, 5];

/** 4-3-3 에서 키퍼를 뺀 필드 슬롯 10개 */
export const FIELD_433: Position[] = ["WB", "CB", "CB", "WB", "MF", "MF", "MF", "WG", "FW", "WG"];

export const sixQuarters = (fieldSlots: readonly Position[] = FIELD_433): SquadQuarter[] =>
  Array.from({ length: 6 }, () => ({ fieldSlots }));

export const player = (
  id: string,
  preferredPositions: readonly Position[] = ["MF"],
  availableQuarters: readonly number[] = ALL_DAY,
): SquadPlayer => ({ id, preferredPositions, availableQuarters });

export const keeper = (id: string, availableQuarters: readonly number[] = ALL_DAY): SquadPlayer =>
  player(id, ["GK"], availableQuarters);

const PREFERENCE_ROTATION: Position[][] = [
  ["CB"],
  ["WB", "CB"],
  ["MF"],
  ["MF", "AM"],
  ["WG", "FW"],
  ["FW"],
  ["MF", "WB"],
  ["CB", "MF"],
  ["WG"],
  ["AM", "MF", "WG"],
];

/** 하루 종일 있는 필드 선수 `p1`, `p2`, … */
export const fieldPlayers = (count: number, prefix = "p"): SquadPlayer[] =>
  Array.from({ length: count }, (_, index) =>
    player(`${prefix}${index + 1}`, PREFERENCE_ROTATION[index % PREFERENCE_ROTATION.length]),
  );

/** 같은 seed 면 같은 수열을 내는 난수(mulberry32). 무작위 규칙을 재현하려고 쓴다. */
export const seeded = (seed: number) => {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
