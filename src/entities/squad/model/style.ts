import type { Position } from "@/entities/position";
import { seatingScore } from "./seating";
import type { SquadPlayer } from "./types";

/**
 * 자동 배치 스타일(PLAN.md §6 "자동 배치 스타일"). 보장 출전 수 · 상한 · 시간 · 키퍼 규칙은 그대로 두고
 * 누가 어느 쿼터에 뛰는지만 바꾼다. 쿼터 번호는 0부터.
 */
export type AssignStyle =
  | { kind: "default" }
  | { kind: "balanced" }
  | { kind: "front" }
  | { kind: "back" }
  | { kind: "focus"; quarters: readonly number[] };

/** 집중형: 일부러 몰아서 이어서 오래 쉬는 사람이 생길 수 있다(빌더가 고를 때 경고한다) */
export const isFocusStyle = (style: AssignStyle) => style.kind === "front" || style.kind === "back" || style.kind === "focus";

/**
 * 선수 전력. 미평가인 사람은 이번 배치 대상(능력치가 있는 사람)의 평균으로 본다.
 * 아무도 능력치가 없으면 null — 스타일은 기본과 같아진다.
 */
export const fillStrengths = (players: readonly SquadPlayer[]): Map<string, number> | null => {
  const rated = players.flatMap((player) => (player.strength == null ? [] : [player.strength]));
  if (rated.length === 0) return null;
  const average = rated.reduce((sum, value) => sum + value, 0) / rated.length;
  return new Map(players.map((player) => [player.id, player.strength ?? average]));
};

/** 전력을 맞바꿈 목표에 얼마나 크게 볼지. 자리 맞춤 점수(선호 1순위 3점 …)와 견준다 */
const FOCUS_WEIGHT = 10;
const BALANCE_WEIGHT = 1;
const MAX_SWEEPS = 40;
const EPSILON = 1e-9;

/** 집중형 쿼터 가중치(0~1). 높을수록 그 쿼터에 잘하는 사람을 몬다 */
const focusWeights = (style: AssignStyle, count: number): number[] | null => {
  const last = Math.max(1, count - 1);
  switch (style.kind) {
    case "front":
      return Array.from({ length: count }, (_, quarter) => (last - quarter) / last);
    case "back":
      return Array.from({ length: count }, (_, quarter) => quarter / last);
    case "focus":
      return Array.from({ length: count }, (_, quarter) => (style.quarters.includes(quarter) ? 1 : 0));
    default:
      return null;
  }
};

type Improve = {
  style: AssignStyle;
  /** 쿼터마다 뽑힌 필드 선수 id. 맞바꿔 고친다 */
  chosen: string[][];
  /** 쿼터마다 필드 자리 포지션 */
  slots: readonly (readonly Position[])[];
  /** 이 쿼터부터만 바꾼다(앞은 끝난 쿼터) */
  start: number;
  players: ReadonlyMap<string, SquadPlayer>;
  strengths: ReadonlyMap<string, number>;
  /** 그 쿼터에 필드로 뛸 수 있는지(와 있고, 그 쿼터 키퍼가 아님) */
  canPlay: (id: string, quarter: number) => boolean;
};

/**
 * 두 쿼터 사이에서 두 사람을 맞바꿔 스타일 목표를 좋게 한다. 각자 뛰는 쿼터 수는 그대로라 보장 출전 수와
 * 상한은 깨지지 않는다. 목표 = 전력 목표 × 가중치 + 자리 맞춤 점수 — 전력이 좋아지는 맞바꿈만 보고,
 * 자리 맞춤이 그보다 더 나빠지면 하지 않는다.
 *
 * - 균등: 쿼터 전력의 흩어짐(평균과의 차이 제곱 합)을 줄인다. 3쿼터 연속으로 쉬는 사람을 새로 만들지 않는다.
 * - 집중형: 쿼터 가중치 × 쿼터 전력의 합을 키운다.
 */
export const improveByStyle = ({ style, chosen, slots, start, players, strengths, canPlay }: Improve) => {
  if (style.kind === "default") return;
  const count = chosen.length;
  const weights = focusWeights(style, count);
  const active = chosen.flatMap((ids, quarter) => (quarter >= start && ids.length > 0 ? [quarter] : []));
  const strengthOf = (id: string) => strengths.get(id) ?? 0;
  const sums = chosen.map((ids) => ids.reduce((sum, id) => sum + strengthOf(id), 0));
  const target = active.reduce((sum, quarter) => sum + sums[quarter], 0) / Math.max(1, active.length);
  const seated = (ids: readonly string[], quarter: number) => seatingScore(ids.map((id) => players.get(id)!), slots[quarter]);
  const fit = chosen.map((ids, quarter) => (active.includes(quarter) ? seated(ids, quarter) : 0));

  /** 이 사람의 가장 긴 연속 쉼(와 있고 키퍼가 아닌 쿼터에서 안 뛴 것) */
  const longestRest = (id: string, sets: readonly (readonly string[])[]) => {
    let run = 0;
    let longest = 0;
    for (let quarter = 0; quarter < count; quarter++) {
      if (!canPlay(id, quarter)) run = 0;
      else if (sets[quarter].includes(id)) run = 0;
      else longest = Math.max(longest, ++run);
    }
    return longest;
  };

  const strengthGain = (from: number, to: number, a: string, b: string) => {
    const difference = strengthOf(b) - strengthOf(a); // from 쿼터에 a 대신 b 가 온다
    if (weights) return FOCUS_WEIGHT * difference * (weights[from] - weights[to]);
    const before = (sums[from] - target) ** 2 + (sums[to] - target) ** 2;
    const after = (sums[from] + difference - target) ** 2 + (sums[to] - difference - target) ** 2;
    return BALANCE_WEIGHT * (before - after);
  };

  for (let sweep = 0, improved = true; improved && sweep < MAX_SWEEPS; sweep++) {
    improved = false;
    for (const from of active) {
      for (const to of active) {
        if (to <= from) continue;
        for (const a of [...chosen[from]]) {
          if (!chosen[from].includes(a) || chosen[to].includes(a) || !canPlay(a, to)) continue;
          for (const b of [...chosen[to]]) {
            if (chosen[from].includes(b) || !canPlay(b, from)) continue;
            const gain = strengthGain(from, to, a, b);
            if (gain <= EPSILON) continue;

            const nextFrom = chosen[from].map((id) => (id === a ? b : id));
            const nextTo = chosen[to].map((id) => (id === b ? a : id));
            if (style.kind === "balanced") {
              const sets = chosen.map((ids, quarter) => (quarter === from ? nextFrom : quarter === to ? nextTo : ids));
              const longer = [a, b].some((id) => {
                const after = longestRest(id, sets);
                return after >= 3 && after > longestRest(id, chosen);
              });
              if (longer) continue;
            }
            const fitFrom = seated(nextFrom, from);
            const fitTo = seated(nextTo, to);
            if (gain + fitFrom + fitTo - fit[from] - fit[to] <= EPSILON) continue;

            const difference = strengthOf(b) - strengthOf(a);
            chosen[from] = nextFrom;
            chosen[to] = nextTo;
            sums[from] += difference;
            sums[to] -= difference;
            fit[from] = fitFrom;
            fit[to] = fitTo;
            improved = true;
            break; // a 는 이제 이 쿼터에 없다
          }
        }
      }
    }
  }
};
