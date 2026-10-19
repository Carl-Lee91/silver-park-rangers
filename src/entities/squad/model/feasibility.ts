import { maxFlow, type FlowEdge } from "../lib/maxFlow";

export type PlayerNeed = {
  id: string;
  /** 앞으로 더 뛰어야 하는 쿼터 수 */
  need: number;
};

/**
 * 남은 자리만으로 모두가 `need` 만큼 더 뛸 수 있는지.
 *
 * 선수 → 쿼터(그 쿼터에 뛸 수 있으면 1) → 끝(그 쿼터의 남은 자리)으로 흐르는 그래프를
 * 만든다. 최대 유량이 필요한 합과 같으면 가능하다.
 */
export const canMeetNeeds = (
  needs: readonly PlayerNeed[],
  seats: readonly number[],
  canPlay: (id: string, quarter: number) => boolean,
): boolean => {
  const demanding = needs.filter(({ need }) => need > 0);
  const required = demanding.reduce((sum, { need }) => sum + need, 0);
  if (required === 0) return true;
  if (required > seats.reduce((sum, count) => sum + count, 0)) return false;

  const source = 0;
  const playerNode = (index: number) => 1 + index;
  const quarterNode = (quarter: number) => 1 + demanding.length + quarter;
  const sink = 1 + demanding.length + seats.length;

  const edges: FlowEdge[] = [];
  demanding.forEach(({ id, need }, index) => {
    edges.push({ from: source, to: playerNode(index), capacity: need });
    seats.forEach((count, quarter) => {
      if (count > 0 && canPlay(id, quarter)) {
        edges.push({ from: playerNode(index), to: quarterNode(quarter), capacity: 1 });
      }
    });
  });
  seats.forEach((count, quarter) => {
    if (count > 0) edges.push({ from: quarterNode(quarter), to: sink, capacity: count });
  });

  return maxFlow(sink + 1, edges, source, sink) === required;
};

export type PlayerBounds = {
  id: string;
  /** 앞으로 적어도 더 뛰어야 하는 쿼터 수 */
  min: number;
  /** 앞으로 많아야 더 뛸 수 있는 쿼터 수 */
  max: number;
};

/**
 * 쿼터마다 정확히 `fills[q]` 명을 채우면서, 모두가 min 이상 max 이하로 뛰게 할 수 있는지.
 *
 * `canMeetNeeds` 는 하한만 본다. 그것만 보고 앞 쿼터부터 채우면 n+1 쿼터를 뛴 사람이
 * 너무 일찍 많아져서, 마지막 쿼터를 채우려면 누군가 n+2 를 뛰어야 하는 일이 생긴다.
 * 그래서 하한·상한·쿼터별 인원을 한 번에 본다.
 *
 * 하한이 있는 유량 문제다. 간선 u→v 의 하한 l 을 떼어 내 보조 출발점에서 v 로, u 에서
 * 보조 도착점으로 l 씩 보내는 문제로 바꾼다. 보조 출발점에서 나가는 간선이 모두 차면 가능하다.
 */
export const canMeetBounds = (
  players: readonly PlayerBounds[],
  fills: readonly number[],
  canPlay: (id: string, quarter: number) => boolean,
): boolean => {
  if (players.some(({ min, max }) => max < 0 || max < min)) return false;
  const totalFill = fills.reduce((sum, count) => sum + count, 0);
  const totalMin = players.reduce((sum, { min }) => sum + min, 0);
  const totalMax = players.reduce((sum, { max }) => sum + max, 0);
  if (totalFill < totalMin || totalFill > totalMax) return false;

  const source = 0;
  const playerNode = (index: number) => 1 + index;
  const quarterNode = (quarter: number) => 1 + players.length + quarter;
  const sink = 1 + players.length + fills.length;
  const helperSource = sink + 1;
  const helperSink = sink + 2;

  const edges: FlowEdge[] = [{ from: sink, to: source, capacity: totalFill }];
  players.forEach(({ id, min, max }, index) => {
    edges.push({ from: source, to: playerNode(index), capacity: max - min });
    edges.push({ from: helperSource, to: playerNode(index), capacity: min });
    edges.push({ from: source, to: helperSink, capacity: min });
    fills.forEach((count, quarter) => {
      if (count > 0 && canPlay(id, quarter)) {
        edges.push({ from: playerNode(index), to: quarterNode(quarter), capacity: 1 });
      }
    });
  });
  fills.forEach((count, quarter) => {
    // 쿼터 → 끝 간선은 하한 = 상한 = count 라서 남는 용량이 0이다. 하한 몫만 옮긴다.
    edges.push({ from: helperSource, to: sink, capacity: count });
    edges.push({ from: quarterNode(quarter), to: helperSink, capacity: count });
  });

  return maxFlow(helperSink + 1, edges, helperSource, helperSink) === totalMin + totalFill;
};
