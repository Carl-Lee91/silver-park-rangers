import type { Position } from "@/entities/position";
import { bestAssignment } from "../lib/bestAssignment";
import { canMeetBounds } from "./feasibility";
import { guaranteedQuarters } from "./guarantees";
import { canPlayField, isDedicatedKeeper, preferenceScore } from "./rules";
import type { QuarterLineup, SquadInput, SquadPlayer } from "./types";

export type AutoAssignOptions = {
  /** 쿼터별로 이미 정해 둔 키퍼. 그대로 둔다. 비어 있는 쿼터만 전담 키퍼로 채운다. */
  keepers?: readonly (string | null)[];
  /** "같으면 무작위" 규칙에 쓰는 난수. 테스트에서 결과를 고정하려고 받는다. */
  random?: () => number;
};

/**
 * 전담 키퍼를 쿼터에 앉힌다. 둘 이상이면 키퍼 쿼터가 적은 사람부터, 같으면 먼저 떠나는
 * 사람부터 맡긴다. 전담 키퍼가 없는 쿼터는 비워 둔다 — 운영진이 직접 차출한다.
 */
const assignKeepers = (input: SquadInput, fixed: readonly (string | null)[]) => {
  const dedicated = input.players.filter(isDedicatedKeeper);
  const keeperCount = new Map(dedicated.map((player) => [player.id, 0]));
  for (const id of fixed) {
    if (id !== null && keeperCount.has(id)) keeperCount.set(id, keeperCount.get(id)! + 1);
  }

  return input.quarters.map((_, quarter) => {
    const fixedId = fixed[quarter] ?? null;
    if (fixedId !== null) return fixedId;

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
 * 전 쿼터의 필드를 채운다(PLAN.md §6 자동 배치 규칙).
 *
 * 1. 보장 출전 수 n 을 정한다(`guaranteedQuarters`). 누구도 n+1 을 넘기지 않는다.
 *    단, 그래서는 필드를 다 채울 수 없을 때만 상한을 한 쿼터씩 올린다.
 * 2. 앞 쿼터부터, 한 명씩 뽑는다. 순서는
 *    급한 사람("남은 보장 수 ÷ 남은 기회"가 큰 사람) → 빈 포지션을 원하는 사람 → 무작위.
 *    일찍 가는 사람·늦게 오는 사람은 남은 기회가 적어서 저절로 먼저 뽑힌다.
 * 3. 뽑을 때마다 "이대로 가도 모두 보장 수와 상한을 지키며 남은 쿼터를 다 채울 수 있나"를
 *    최대 유량으로 확인한다(`canMeetBounds`). 안 되면 그 사람을 건너뛴다. 그래서 보장 수와
 *    상한은 순서 규칙과 상관없이 지켜진다.
 * 4. 뽑힌 사람을 선호 점수 합이 가장 크게 슬롯에 놓는다.
 */
export const autoAssign = (
  input: SquadInput,
  { keepers: fixedKeepers = [], random = Math.random }: AutoAssignOptions = {},
): QuarterLineup[] => {
  const keepers = assignKeepers(input, fixedKeepers);
  const guaranteed = guaranteedQuarters(input, keepers);
  const field = input.players.filter((player) => !isDedicatedKeeper(player));
  const byId = new Map(input.players.map((player) => [player.id, player]));
  const canPlay = (player: SquadPlayer, quarter: number) => canPlayField(player, quarter, keepers);
  const canPlayById = (id: string, quarter: number) => canPlay(byId.get(id)!, quarter);

  const capacity = new Map(
    field.map((player) => [
      player.id,
      input.quarters.filter((_, quarter) => canPlay(player, quarter)).length,
    ]),
  );
  const fills = input.quarters.map((quarter, index) =>
    Math.min(quarter.fieldSlots.length, field.filter((player) => canPlay(player, index)).length),
  );

  const upperWithSlack = (slack: number) =>
    new Map(
      field.map((player) => [
        player.id,
        Math.min(capacity.get(player.id)!, guaranteed[player.id] + slack),
      ]),
    );
  let slack = 1;
  let upper = upperWithSlack(slack);
  while (
    slack < input.quarters.length &&
    !canMeetBounds(
      field.map((player) => ({ id: player.id, min: guaranteed[player.id], max: upper.get(player.id)! })),
      fills,
      canPlayById,
    )
  ) {
    upper = upperWithSlack(++slack);
  }

  const played = new Map(field.map((player) => [player.id, 0]));
  const need = (player: SquadPlayer) => Math.max(0, guaranteed[player.id] - played.get(player.id)!);
  const chosen: string[][] = input.quarters.map(() => []);

  const stillFeasible = (current: number) =>
    canMeetBounds(
      field.map((player) => ({
        id: player.id,
        min: need(player),
        max: upper.get(player.id)! - played.get(player.id)!,
      })),
      fills.map((count, index) => {
        if (index < current) return 0;
        if (index === current) return count - chosen[current].length;
        return count;
      }),
      (id, quarter) => canPlayById(id, quarter) && !(quarter === current && chosen[current].includes(id)),
    );

  const tryPick = (current: number, player: SquadPlayer, force = false) => {
    chosen[current].push(player.id);
    played.set(player.id, played.get(player.id)! + 1);
    if (force || stillFeasible(current)) return true;
    chosen[current].pop();
    played.set(player.id, played.get(player.id)! - 1);
    return false;
  };

  input.quarters.forEach((quarter, current) => {
    const candidates = field.filter((player) => canPlay(player, current));
    const tiebreak = new Map(candidates.map((player) => [player.id, random()]));
    const openSlots = [...quarter.fieldSlots];
    const chancesLeft = (player: SquadPlayer) =>
      input.quarters.filter((_, index) => index >= current && canPlay(player, index)).length;

    while (chosen[current].length < fills[current]) {
      const ranked = candidates
        .filter((player) => !chosen[current].includes(player.id))
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
      const pick = ranked.find((player) => tryPick(current, player)) ?? ranked[0];
      if (!chosen[current].includes(pick.id)) tryPick(current, pick, true);
      takeOpenSlot(pick, openSlots);
    }
  });

  return input.quarters.map((quarter, current) => {
    const players = chosen[current].map((id) => byId.get(id)!);
    const columns = bestAssignment(
      players.map((player) => quarter.fieldSlots.map((position) => preferenceScore(player, position))),
    );
    const fieldIds: (string | null)[] = quarter.fieldSlots.map(() => null);
    columns.forEach((column, row) => {
      fieldIds[column] = players[row].id;
    });
    return { keeperId: keepers[current], fieldIds };
  });
};
