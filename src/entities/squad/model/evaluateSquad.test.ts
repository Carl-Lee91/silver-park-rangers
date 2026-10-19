import { describe, expect, it } from "vitest";
import { evaluateSquad } from "./evaluateSquad";
import type { SquadInput } from "./types";
import { keeper, player } from "./testing";

const TWO_QUARTERS = [0, 1];

const input: SquadInput = {
  players: [
    keeper("gk", TWO_QUARTERS),
    player("a", ["MF"], TWO_QUARTERS),
    player("b", ["MF"], TWO_QUARTERS),
    player("c", ["MF"], TWO_QUARTERS),
  ],
  quarters: [{ fieldSlots: ["MF", "MF"] }, { fieldSlots: ["MF", "MF"] }],
};

describe("스쿼드 점검 (PLAN.md §6 경고)", () => {
  it("출전 수는 필드만 세고, 키퍼로 뛴 쿼터는 따로 센다", () => {
    const { fieldCounts, keeperCounts } = evaluateSquad(input, [
      { keeperId: "a", fieldIds: ["b", "c"] },
      { keeperId: "gk", fieldIds: ["a", "b"] },
    ]);
    expect(fieldCounts).toEqual({ gk: 0, a: 1, b: 2, c: 1 });
    expect(keeperCounts).toEqual({ gk: 1, a: 1, b: 0, c: 0 });
  });

  it("문제가 없으면 경고가 없다", () => {
    const { warnings } = evaluateSquad(input, [
      { keeperId: "gk", fieldIds: ["a", "b"] },
      { keeperId: "gk", fieldIds: ["b", "c"] },
    ]);
    expect(warnings).toEqual([]);
  });

  it("키퍼가 빈 쿼터를 알려준다", () => {
    const { warnings } = evaluateSquad(input, [
      { keeperId: "gk", fieldIds: ["a", "b"] },
      { keeperId: null, fieldIds: ["b", "c"] },
    ]);
    expect(warnings).toEqual([{ kind: "keeper-missing", quarter: 1 }]);
  });

  it("필드를 다 못 채운 쿼터를 빈 슬롯 수와 함께 알려준다", () => {
    const { warnings } = evaluateSquad(input, [
      { keeperId: "gk", fieldIds: ["a", null] },
      { keeperId: "gk", fieldIds: ["b", "c"] },
    ]);
    expect(warnings).toContainEqual({ kind: "field-short", quarter: 0, emptySlots: 1 });
  });

  it("보장 수에 못 미치는 사람을 알려준다", () => {
    // 필드 3명이 슬롯 4개를 나누므로 전원 1쿼터가 보장이다.
    const { guaranteed, warnings } = evaluateSquad(input, [
      { keeperId: "gk", fieldIds: ["a", "b"] },
      { keeperId: "gk", fieldIds: ["a", "b"] },
    ]);
    expect(guaranteed).toEqual({ a: 1, b: 1, c: 1 });
    expect(warnings).toEqual([{ kind: "below-guarantee", playerId: "c", played: 0, guaranteed: 1 }]);
  });

  it("전담 키퍼는 필드에 안 나와도 보장 미달이 아니다", () => {
    const { warnings } = evaluateSquad(input, [
      { keeperId: "gk", fieldIds: ["a", "b"] },
      { keeperId: "gk", fieldIds: ["c", "a"] },
    ]);
    expect(warnings).toEqual([]);
  });
});
