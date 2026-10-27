import { describe, expect, it } from "vitest";
import { POSITION_LINES, POSITIONS, positionLabel } from "./position";

describe("포지션", () => {
  it("기획(PLAN.md §5)의 10개 포지션을 공격 줄부터 이 순서로 가진다", () => {
    expect(POSITIONS.map((position) => position.code)).toEqual(["FW", "AM", "WG", "MF", "WM", "DM", "WB", "CB", "FB", "GK"]);
  });

  it("코드로 한국어 이름을 찾는다", () => {
    expect(positionLabel("AM")).toBe("공격형 미드필더");
    expect(positionLabel("MF")).toBe("중앙 미드필더");
    expect(positionLabel("WM")).toBe("와이드 미드필더");
    expect(positionLabel("DM")).toBe("수비형 미드필더");
    expect(positionLabel("FB")).toBe("풀백");
    expect(positionLabel("GK")).toBe("골키퍼");
  });

  it("줄은 1선(공격) ~ 5선(수비)이고, 줄마다 중앙 하나 · 측면 하나다. 골키퍼는 따로다", () => {
    expect(POSITION_LINES.map(({ label, codes }) => [label, codes])).toEqual([
      ["1선", ["FW"]],
      ["2선", ["AM", "WG"]],
      ["3선", ["MF", "WM"]],
      ["4선", ["DM", "WB"]],
      ["5선", ["CB", "FB"]],
      ["골키퍼", ["GK"]],
    ]);
  });
});
