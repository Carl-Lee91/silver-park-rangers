import type { Position } from "@/entities/position";
import type { SquadPlayer } from "./types";

/** 선호 포지션 1순위가 GK 면 전담 키퍼다. 필드 배분에서 빠진다(PLAN.md §6). */
export const isDedicatedKeeper = (player: SquadPlayer) => player.preferredPositions[0] === "GK";

/** 선호 1순위 3점, 2순위 2점, 3순위 1점, 그 밖은 0점 */
export const preferenceScore = (player: Pick<SquadPlayer, "preferredPositions">, position: Position) => {
  const rank = player.preferredPositions.indexOf(position);
  return rank === -1 ? 0 : Math.max(0, 3 - rank);
};

/**
 * 그 쿼터에 필드로 뛸 수 있는지. 전담 키퍼가 아니고, 와 있고, 그 쿼터 키퍼가 아니어야 한다.
 */
export const canPlayField = (
  player: SquadPlayer,
  quarter: number,
  keepers: readonly (string | null)[],
) =>
  !isDedicatedKeeper(player) &&
  player.availableQuarters.includes(quarter) &&
  keepers[quarter] !== player.id;
