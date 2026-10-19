import { guaranteedQuarters } from "./guarantees";
import type { QuarterLineup, SquadInput, SquadWarning } from "./types";

export type SquadReport = {
  /** 필드 선수의 보장 출전 수. 전담 키퍼는 없다. */
  guaranteed: Record<string, number>;
  /** 필드로 뛴 쿼터 수. 키퍼로 뛴 쿼터는 넣지 않는다. */
  fieldCounts: Record<string, number>;
  keeperCounts: Record<string, number>;
  warnings: SquadWarning[];
};

/**
 * 지금 배치를 점검한다. 자동 배치 직후에도, 관리자가 드래그로 고친 뒤에도 같은 기준으로 본다.
 */
export const evaluateSquad = (input: SquadInput, lineup: readonly QuarterLineup[]): SquadReport => {
  const guaranteed = guaranteedQuarters(
    input,
    lineup.map((quarter) => quarter.keeperId),
  );
  const zero = () => Object.fromEntries(input.players.map((player) => [player.id, 0]));
  const fieldCounts: Record<string, number> = zero();
  const keeperCounts: Record<string, number> = zero();
  const warnings: SquadWarning[] = [];

  lineup.forEach((quarter, index) => {
    if (quarter.keeperId === null) {
      warnings.push({ kind: "keeper-missing", quarter: index });
    } else {
      keeperCounts[quarter.keeperId] = (keeperCounts[quarter.keeperId] ?? 0) + 1;
    }

    let emptySlots = 0;
    for (const id of quarter.fieldIds) {
      if (id === null) emptySlots++;
      else fieldCounts[id] = (fieldCounts[id] ?? 0) + 1;
    }
    if (emptySlots > 0) warnings.push({ kind: "field-short", quarter: index, emptySlots });
  });

  for (const player of input.players) {
    const target = guaranteed[player.id];
    if (target !== undefined && fieldCounts[player.id] < target) {
      warnings.push({
        kind: "below-guarantee",
        playerId: player.id,
        played: fieldCounts[player.id],
        guaranteed: target,
      });
    }
  }

  return { guaranteed, fieldCounts, keeperCounts, warnings };
};
