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

  describe("앞 쿼터가 끝난 뒤 다시 계산할 때", () => {
    it("이미 뛴 쿼터를 더해, 남은 쿼터로 맞출 수 있는 가장 큰 보장 수를 낸다", () => {
      // 2쿼터짜리 매치의 1쿼터가 끝났다. p1~p10 은 1쿼터를 뛰었고 p11·p12 는 쉬었다.
      const input = { players: fieldPlayers(12), quarters: sixQuarters().slice(0, 2) };
      const alreadyPlayed = Object.fromEntries(fieldPlayers(10).map((p) => [p.id, 1]));
      const guaranteed = guaranteedQuarters(input, [null, null], { fromQuarter: 1, alreadyPlayed });
      // 남은 1쿼터의 10자리: 쉬었던 둘이 먼저 들어가야 전원 1쿼터 이상이 된다.
      expect(guaranteed.p11).toBe(1);
      expect(guaranteed.p1).toBe(1);
    });

    it("이미 보장 수보다 많이 뛴 사람은 그 수를 그대로 보장으로 본다", () => {
      const input = { players: fieldPlayers(12), quarters: sixQuarters().slice(0, 2) };
      const guaranteed = guaranteedQuarters(input, [null, null], { fromQuarter: 2, alreadyPlayed: { p1: 2 } });
      expect(guaranteed.p1).toBe(2);
      expect(guaranteed.p2).toBe(0);
    });
  });
});
