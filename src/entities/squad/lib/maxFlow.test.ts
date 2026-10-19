import { describe, expect, it } from "vitest";
import { maxFlow } from "./maxFlow";

describe("최대 유량", () => {
  it("간선 하나면 그 용량만큼 흐른다", () => {
    expect(maxFlow(2, [{ from: 0, to: 1, capacity: 3 }], 0, 1)).toBe(3);
  });

  it("가장 좁은 곳에서 막힌다", () => {
    const edges = [
      { from: 0, to: 1, capacity: 5 },
      { from: 1, to: 2, capacity: 2 },
    ];
    expect(maxFlow(3, edges, 0, 2)).toBe(2);
  });

  it("먼저 잡은 경로를 되돌려서라도 최대치를 찾는다", () => {
    // 0→1→2→3 을 먼저 쓰면 0→2, 1→3 이 막힌다. 되돌림 간선이 있어야 2가 나온다.
    const edges = [
      { from: 0, to: 1, capacity: 1 },
      { from: 0, to: 2, capacity: 1 },
      { from: 1, to: 2, capacity: 1 },
      { from: 1, to: 3, capacity: 1 },
      { from: 2, to: 3, capacity: 1 },
    ];
    expect(maxFlow(4, edges, 0, 3)).toBe(2);
  });

  it("이어지지 않으면 0이다", () => {
    expect(maxFlow(3, [{ from: 0, to: 1, capacity: 1 }], 0, 2)).toBe(0);
  });
});
