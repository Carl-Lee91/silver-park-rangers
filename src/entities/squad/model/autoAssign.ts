import type { Position } from "@/entities/position";
import { canMeetBounds } from "./feasibility";
import { guaranteedQuarters } from "./guarantees";
import { canPlayField, isDedicatedKeeper, preferenceScore } from "./rules";
import { seatByPreference } from "./seating";
import { fillStrengths, improveByStyle, type AssignStyle } from "./style";
import type { QuarterLineup, SquadInput, SquadPlayer } from "./types";

export type { AssignStyle } from "./style";

export type AutoAssignOptions = {
  /** 쿼터별로 이미 정해 둔 키퍼. 그대로 둔다. 비어 있는 쿼터만 전담 키퍼로 채운다. */
  keepers?: readonly (string | null)[];
  /** "같으면 무작위" 규칙에 쓰는 난수. 테스트에서 결과를 고정하려고 받는다. */
  random?: () => number;
  /**
   * 이 쿼터부터 다시 짠다(당일 변동). 그 앞 쿼터는 이미 끝났으므로 `current` 를 그대로 두고,
   * 거기서 뛴 수를 더해 남은 쿼터를 고르게 나눈다. 기본값 0 은 전 쿼터를 새로 짠다.
   */
  startQuarter?: number;
  /** 지금 배치. `startQuarter` 앞 쿼터를 여기서 가져온다 */
  current?: readonly QuarterLineup[];
  /** 자동 배치 스타일(PLAN.md §6). 기본은 능력치를 보지 않는다 */
  style?: AssignStyle;
};

/**
 * 전담 키퍼를 쿼터에 앉힌다. 둘 이상이면 키퍼 쿼터가 적은 사람부터, 같으면 먼저 떠나는
 * 사람부터 맡긴다. 전담 키퍼가 없는 쿼터는 비워 둔다 — 관리자가 직접 차출한다.
 * 끝난 쿼터(`start` 앞)는 손대지 않는다.
 */
const assignKeepers = (input: SquadInput, fixed: readonly (string | null)[], start: number) => {
  const dedicated = input.players.filter(isDedicatedKeeper);
  const keeperCount = new Map(dedicated.map((player) => [player.id, 0]));
  for (const id of fixed) {
    if (id !== null && keeperCount.has(id)) keeperCount.set(id, keeperCount.get(id)! + 1);
  }

  return input.quarters.map((_, quarter) => {
    const fixedId = fixed[quarter] ?? null;
    if (fixedId !== null || quarter < start) return fixedId;

    const remaining = (player: SquadPlayer) =>
      player.availableQuarters.filter((index) => index >= quarter).length;
    const available = dedicated.filter((player) => player.availableQuarters.includes(quarter));
    if (available.length === 0) return null;

    const pick = available.reduce((best, player) => {
      const difference = keeperCount.get(player.id)! - keeperCount.get(best.id)!;
      return difference < 0 || (difference === 0 && remaining(player) < remaining(best))
        ? player
        : best;
    });
    keeperCount.set(pick.id, keeperCount.get(pick.id)! + 1);
    return pick.id;
  });
};

/** 아직 그 포지션을 원하는 사람이 안 뽑힌 슬롯 중, 이 사람이 가장 원하는 것의 점수 */
const fitScore = (player: SquadPlayer, openSlots: readonly Position[]) => {
  const position = player.preferredPositions.find((candidate) => openSlots.includes(candidate));
  return position === undefined ? 0 : preferenceScore(player, position);
};

const takeOpenSlot = (player: SquadPlayer, openSlots: Position[]) => {
  const position = player.preferredPositions.find((candidate) => openSlots.includes(candidate));
  if (position !== undefined) openSlots.splice(openSlots.indexOf(position), 1);
};

/**
 * 전 쿼터(또는 `startQuarter` 부터)의 필드를 채운다(PLAN.md §6 자동 배치 규칙).
 *
 * 1. 보장 출전 수 n 을 정한다(`guaranteedQuarters`). 누구도 n+1 을 넘기지 않는다.
 *    단, 그래서는 필드를 다 채울 수 없을 때만 상한을 한 쿼터씩 올린다.
 * 2. 앞 쿼터부터, 한 명씩 뽑는다. 순서는
 *    급한 사람("남은 보장 수 ÷ 남은 기회"가 큰 사람) → 빈 포지션을 원하는 사람 → 무작위.
 *    일찍 가는 사람·늦게 오는 사람·앞에서 덜 뛴 사람은 남은 기회에 비해 남은 몫이 커서
 *    저절로 먼저 뽑힌다.
 * 3. 뽑을 때마다 "이대로 가도 모두 보장 수와 상한을 지키며 남은 쿼터를 다 채울 수 있나"를
 *    최대 유량으로 확인한다(`canMeetBounds`). 안 되면 그 사람을 건너뛴다. 그래서 보장 수와
 *    상한은 순서 규칙과 상관없이 지켜진다.
 * 4. 스타일이 있으면(균등 · 초반 · 후반 · 쿼터 지정) 쿼터끼리 두 사람을 맞바꿔 스타일 목표를 좋게 한다
 *    (`improveByStyle`). 각자 뛰는 쿼터 수는 그대로라 1~3번 규칙이 그대로 지켜진다.
 * 5. 뽑힌 사람을 선호 점수 합이 가장 크게 슬롯에 놓는다.
 */
export const autoAssign = (
  input: SquadInput,
  {
    keepers: givenKeepers = [],
    random = Math.random,
    startQuarter = 0,
    current = [],
    style = { kind: "default" },
  }: AutoAssignOptions = {},
): QuarterLineup[] => {
  const start = Math.max(0, Math.min(startQuarter, input.quarters.length));
  const fixedKeepers = input.quarters.map((_, quarter) =>
    quarter < start ? (current[quarter]?.keeperId ?? null) : (givenKeepers[quarter] ?? null),
  );
  const keepers = assignKeepers(input, fixedKeepers, start);
  const field = input.players.filter((player) => !isDedicatedKeeper(player));
  const byId = new Map(input.players.map((player) => [player.id, player]));

  // 끝난 쿼터에서 이미 필드로 뛴 수
  const played = new Map(field.map((player) => [player.id, 0]));
  for (const quarter of current.slice(0, start)) {
    for (const id of quarter.fieldIds) {
      if (id !== null && played.has(id)) played.set(id, played.get(id)! + 1);
    }
  }
  const alreadyPlayed = Object.fromEntries(played);
  const guaranteed = guaranteedQuarters(input, keepers, { fromQuarter: start, alreadyPlayed });

  const canPlay = (player: SquadPlayer, quarter: number) =>
    quarter >= start && canPlayField(player, quarter, keepers);
  const canPlayById = (id: string, quarter: number) => canPlay(byId.get(id)!, quarter);

  // 끝까지 뛸 수 있는 최대 수 = 이미 뛴 수 + 남은 쿼터 중 뛸 수 있는 수
  const capacity = new Map(
    field.map((player) => [
      player.id,
      alreadyPlayed[player.id] + input.quarters.filter((_, quarter) => canPlay(player, quarter)).length,
    ]),
  );
  const fills = input.quarters.map((quarter, index) =>
    index < start ? 0 : Math.min(quarter.fieldSlots.length, field.filter((player) => canPlay(player, index)).length),
  );

  const need = (player: SquadPlayer) => Math.max(0, guaranteed[player.id] - played.get(player.id)!);
  const chosen: string[][] = input.quarters.map(() => []);

  const feasibleFrom = (from: number, upper: ReadonlyMap<string, number>) =>
    canMeetBounds(
      field.map((player) => ({
        id: player.id,
        min: need(player),
        max: upper.get(player.id)! - played.get(player.id)!,
      })),
      fills.map((count, index) => {
        if (index < from) return 0;
        if (index === from) return count - chosen[from].length;
        return count;
      }),
      (id, quarter) => canPlayById(id, quarter) && !(quarter === from && chosen[from].includes(id)),
    );

  const upperWithSlack = (slack: number) =>
    new Map(
      field.map((player) => [
        player.id,
        Math.min(capacity.get(player.id)!, Math.max(played.get(player.id)!, guaranteed[player.id] + slack)),
      ]),
    );
  let slack = 1;
  let upper = upperWithSlack(slack);
  while (slack < input.quarters.length && !feasibleFrom(start, upper)) {
    upper = upperWithSlack(++slack);
  }

  const tryPick = (quarter: number, player: SquadPlayer, force = false) => {
    chosen[quarter].push(player.id);
    played.set(player.id, played.get(player.id)! + 1);
    if (force || feasibleFrom(quarter, upper)) return true;
    chosen[quarter].pop();
    played.set(player.id, played.get(player.id)! - 1);
    return false;
  };

  input.quarters.forEach((quarter, index) => {
    if (index < start) return;
    const candidates = field.filter((player) => canPlay(player, index));
    const tiebreak = new Map(candidates.map((player) => [player.id, random()]));
    const openSlots = [...quarter.fieldSlots];
    const chancesLeft = (player: SquadPlayer) =>
      input.quarters.filter((_, later) => later >= index && canPlay(player, later)).length;

    while (chosen[index].length < fills[index]) {
      const ranked = candidates
        .filter((player) => !chosen[index].includes(player.id))
        .map((player) => ({
          player,
          belowUpper: played.get(player.id)! < upper.get(player.id)! ? 1 : 0,
          urgency: need(player) / chancesLeft(player),
          fit: fitScore(player, openSlots),
          tie: tiebreak.get(player.id)!,
        }))
        .sort(
          (a, b) =>
            b.belowUpper - a.belowUpper || b.urgency - a.urgency || b.fit - a.fit || a.tie - b.tie,
        )
        .map(({ player }) => player);

      // 규칙을 지키며 뽑을 수 있는 사람이 반드시 있다(위 3번). 그래도 없으면 순서대로 채운다.
      const pick = ranked.find((player) => tryPick(index, player)) ?? ranked[0];
      if (!chosen[index].includes(pick.id)) tryPick(index, pick, true);
      takeOpenSlot(pick, openSlots);
    }
  });

  const strengths = fillStrengths(field);
  if (strengths !== null) {
    improveByStyle({
      style,
      chosen,
      slots: input.quarters.map((quarter) => quarter.fieldSlots),
      start,
      players: byId,
      strengths,
      canPlay: canPlayById,
    });
  }

  return input.quarters.map((quarter, index) =>
    index < start
      ? { keeperId: current[index]?.keeperId ?? null, fieldIds: [...(current[index]?.fieldIds ?? quarter.fieldSlots.map(() => null))] }
      : {
          keeperId: keepers[index],
          fieldIds: seatByPreference(
            chosen[index].map((id) => byId.get(id)!),
            quarter.fieldSlots,
          ),
        },
  );
};
