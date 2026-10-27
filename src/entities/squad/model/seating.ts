import type { Position } from "@/entities/position";
import { bestAssignment } from "../lib/bestAssignment";
import { preferenceScore } from "./rules";

/** 가장 잘 앉혔을 때의 선호 점수 합. 자동 배치 스타일이 맞바꿈으로 자리 맞춤이 얼마나 바뀌는지 볼 때 쓴다 */
export const seatingScore = (
  players: readonly { id: string; preferredPositions: readonly Position[] }[],
  positions: readonly Position[],
) => {
  const byId = new Map(players.map((player) => [player.id, player]));
  return seatByPreference(players, positions).reduce(
    (sum, id, seat) => sum + (id === null ? 0 : preferenceScore(byId.get(id)!, positions[seat])),
    0,
  );
};

/**
 * 사람들을 자리(포지션 목록)에 앉힌다. 선호 1순위 3점, 2순위 2점, 3순위 1점으로 계산해서
 * 합이 가장 큰 배치를 고른다(PLAN.md §6). 돌려주는 값은 자리마다 앉은 사람 id(비면 null)다.
 *
 * 사람이 자리보다 많으면(포메이션을 바꿔 필드 자리가 줄었을 때) 자리 쪽에서 사람을 고른다 —
 * 점수 합이 가장 큰 사람들만 앉고 나머지는 앉지 않는다.
 */
export const seatByPreference = (
  players: readonly { id: string; preferredPositions: readonly Position[] }[],
  positions: readonly Position[],
): (string | null)[] => {
  const seats: (string | null)[] = positions.map(() => null);
  if (players.length <= positions.length) {
    const columns = bestAssignment(players.map((player) => positions.map((position) => preferenceScore(player, position))));
    columns.forEach((column, row) => {
      seats[column] = players[row].id;
    });
    return seats;
  }
  const chosen = bestAssignment(positions.map((position) => players.map((player) => preferenceScore(player, position))));
  chosen.forEach((player, seat) => {
    seats[seat] = players[player].id;
  });
  return seats;
};
