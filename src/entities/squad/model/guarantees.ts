import { canMeetNeeds } from "./feasibility";
import { canPlayField, isDedicatedKeeper } from "./rules";
import type { SquadInput } from "./types";

/**
 * 필드 선수마다 보장하는 출전 쿼터 수(PLAN.md §6). 전담 키퍼는 들어 있지 않다.
 *
 * 모두에게 같은 수 n 을 주되, 뛸 수 있는 쿼터가 n 보다 적은 사람은 그만큼만 준다.
 * 그렇게 해도 실제로 배치할 수 있는 가장 큰 n 을 찾는다. 늦게 오거나 일찍 가는 사람이
 * 못 채운 몫은 이렇게 나머지에게 넘어간다.
 *
 * 키퍼로 뛰는 쿼터(`keepers`)는 필드로 못 뛰는 쿼터로 본다. 키퍼 쿼터는 출전으로 세지 않는다.
 */
export const guaranteedQuarters = (
  input: SquadInput,
  keepers: readonly (string | null)[],
): Record<string, number> => {
  const field = input.players.filter((player) => !isDedicatedKeeper(player));
  const byId = new Map(field.map((player) => [player.id, player]));
  const canPlay = (id: string, quarter: number) => canPlayField(byId.get(id)!, quarter, keepers);
  const seats = input.quarters.map((quarter) => quarter.fieldSlots.length);
  const capacity = field.map(
    (player) => input.quarters.filter((_, quarter) => canPlay(player.id, quarter)).length,
  );

  for (let level = input.quarters.length; level > 0; level--) {
    const needs = field.map((player, index) => ({
      id: player.id,
      need: Math.min(capacity[index], level),
    }));
    if (canMeetNeeds(needs, seats, canPlay)) {
      return Object.fromEntries(needs.map(({ id, need }) => [id, need]));
    }
  }
  return Object.fromEntries(field.map((player) => [player.id, 0]));
};
