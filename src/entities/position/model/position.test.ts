import { describe, expect, it } from "vitest";
import { POSITIONS, positionLabel } from "./position";

describe("포지션", () => {
  it("기획(PLAN.md §5)의 7개 포지션을 이 순서로 가진다", () => {
    expect(POSITIONS.map((position) => position.code)).toEqual([
      "FW",
      "AM",
      "WG",
      "MF",
      "WB",
      "CB",
      "GK",
    ]);
  });

  it("코드로 한국어 이름을 찾는다", () => {
    expect(positionLabel("AM")).toBe("공격형 미드필더");
    expect(positionLabel("MF")).toBe("미드필더");
    expect(positionLabel("GK")).toBe("골키퍼");
  });
});
