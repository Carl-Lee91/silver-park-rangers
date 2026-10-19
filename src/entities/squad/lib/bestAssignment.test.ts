import { describe, expect, it } from "vitest";
import { bestAssignment } from "./bestAssignment";

const total = (score: number[][], columns: number[]) =>
  columns.reduce((sum, column, row) => sum + score[row][column], 0);

describe("점수 합이 가장 큰 배치", () => {
  it("각자 가장 높은 칸이 겹치지 않으면 그대로 간다", () => {
    expect(bestAssignment([
      [0, 3],
      [3, 0],
    ])).toEqual([1, 0]);
  });

  it("앞사람이 욕심내면 합이 줄어드는 경우를 피한다", () => {
    // 0번이 0열(3점)을 먹으면 1번은 0점이 되어 합이 3이다. 양보하면 2 + 3 = 5다.
    const score = [
      [3, 2],
      [3, 0],
    ];
    const columns = bestAssignment(score);
    expect(columns).toEqual([1, 0]);
    expect(total(score, columns)).toBe(5);
  });

  it("사람보다 칸이 많으면 남는 칸은 비운다", () => {
    expect(bestAssignment([
      [1, 0, 0],
      [0, 0, 2],
    ])).toEqual([0, 2]);
  });

  it("점수가 전부 0이어도 서로 다른 칸에 놓는다", () => {
    const columns = bestAssignment([
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ]);
    expect(new Set(columns).size).toBe(3);
  });

  it("사람이 없으면 빈 배열이다", () => {
    expect(bestAssignment([])).toEqual([]);
  });
});
