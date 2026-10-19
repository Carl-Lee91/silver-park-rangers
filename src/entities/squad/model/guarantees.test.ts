import { describe, expect, it } from "vitest";
import { guaranteedQuarters } from "./guarantees";
import { fieldPlayers, keeper, player, sixQuarters } from "./testing";

const keeperAllDay = (id: string) => Array<string>(6).fill(id);

describe("보장 출전 수 (PLAN.md §6)", () => {
  it("필드 17명이 하루 종일 있으면 전원 3쿼터를 보장한다", () => {
    const input = { players: [keeper("gk"), ...fieldPlayers(17)], quarters: sixQuarters() };
    const guaranteed = guaranteedQuarters(input, keeperAllDay("gk"));
    expect(Object.values(guaranteed)).toEqual(Array(17).fill(3));
  });

  it("전담 키퍼는 보장 대상이 아니다", () => {
    const input = { players: [keeper("gk"), ...fieldPlayers(17)], quarters: sixQuarters() };
    expect(guaranteedQuarters(input, keeperAllDay("gk"))).not.toHaveProperty("gk");
  });

  it("필드 인원이 슬롯보다 적으면 전원 모든 쿼터를 보장한다", () => {
    const input = { players: [keeper("gk"), ...fieldPlayers(10)], quarters: sixQuarters() };
    expect(Object.values(guaranteedQuarters(input, keeperAllDay("gk")))).toEqual(Array(10).fill(6));
  });

  it("뛸 수 있는 쿼터가 모자란 사람은 그만큼만 보장하고, 나머지는 영향받지 않는다", () => {
    const early = player("early", ["MF"], [0, 1]); // 11:00 에 떠난다
    const input = { players: [keeper("gk"), ...fieldPlayers(16), early], quarters: sixQuarters() };
    const guaranteed = guaranteedQuarters(input, keeperAllDay("gk"));
    expect(guaranteed.early).toBe(2);
    expect(guaranteed.p1).toBe(3);
  });

  it("키퍼로 뛰는 쿼터는 필드 보장에서 뺀다", () => {
    // 전담 키퍼가 없어서 p1 이 앞 3쿼터 키퍼를 본다.
    const input = { players: fieldPlayers(12), quarters: sixQuarters() };
    const guaranteed = guaranteedQuarters(input, ["p1", "p1", "p1", null, null, null]);
    expect(guaranteed.p1).toBe(3);
    expect(guaranteed.p2).toBe(5);
  });
});
