import type { Position } from "@/entities/position";
import { fieldStrength, RATING_KEYS, type RatingKey, type RatingValues } from "./rating";

/**
 * 포지션 가중치(PLAN.md §6 "포지션 점수"). 그 포지션에서 능력치 하나가 얼마나 중요한지 0~5 다(0 = 안 본다).
 * 필드 포지션은 필드 능력치 6개만, 골키퍼는 골키퍼 능력치만 본다.
 */
export const POSITION_WEIGHTS: Record<Position, Partial<Record<RatingKey, number>>> = {
  FW: { pace: 3, shooting: 5, passing: 1, dribbling: 3, defending: 0, physical: 4 },
  AM: { pace: 2, shooting: 4, passing: 5, dribbling: 5, defending: 1, physical: 1 },
  WG: { pace: 5, shooting: 3, passing: 2, dribbling: 5, defending: 1, physical: 2 },
  MF: { pace: 2, shooting: 2, passing: 5, dribbling: 3, defending: 3, physical: 3 },
  WM: { pace: 4, shooting: 2, passing: 4, dribbling: 4, defending: 2, physical: 3 },
  DM: { pace: 1, shooting: 1, passing: 4, dribbling: 2, defending: 5, physical: 4 },
  WB: { pace: 5, shooting: 1, passing: 3, dribbling: 3, defending: 3, physical: 3 },
  CB: { pace: 3, shooting: 0, passing: 2, dribbling: 1, defending: 5, physical: 5 },
  FB: { pace: 4, shooting: 0, passing: 2, dribbling: 1, defending: 5, physical: 3 },
  GK: { goalkeeping: 5 },
};

/**
 * 포지션 점수: 그 포지션 가중치로 낸 능력치의 가중 평균(1~10). 매기지 않은 항목은 빼고,
 * 볼 항목을 하나도 매기지 않았으면 null 이다.
 */
export const positionScore = (values: RatingValues, position: Position): number | null => {
  let total = 0;
  let weight = 0;
  for (const key of RATING_KEYS) {
    const w = POSITION_WEIGHTS[position][key] ?? 0;
    const value = values[key];
    if (w === 0 || value === null) continue;
    total += w * value;
    weight += w;
  }
  return weight === 0 ? null : total / weight;
};

/**
 * 선수 전력(자동 배치 스타일이 쿼터마다 더한다): 1순위 포지션의 포지션 점수. 1순위가 골키퍼거나
 * 그 점수를 낼 수 없으면 필드 능력치 평균이다. 하나도 매기지 않았으면 null.
 */
export const playerStrength = (values: RatingValues, preferredPositions: readonly Position[]): number | null => {
  const first = preferredPositions[0];
  const score = first === undefined || first === "GK" ? null : positionScore(values, first);
  return score ?? fieldStrength(values);
};
