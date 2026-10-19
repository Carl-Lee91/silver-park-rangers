import { describe, expect, it } from "vitest";
import type { Position } from "@/entities/position";
import { autoAssign } from "./autoAssign";
import { evaluateSquad } from "./evaluateSquad";
import type { QuarterLineup, SquadInput, SquadPlayer } from "./types";
import { ALL_DAY, FIELD_433, fieldPlayers, keeper, player, seeded, sixQuarters } from "./testing";

const SEEDS = Array.from({ length: 20 }, (_, index) => index + 1);

/** 그 사람이 필드로 뛴 쿼터 번호 */
const fieldQuartersOf = (lineup: QuarterLineup[], id: string) =>
  lineup.flatMap((quarter, index) => (quarter.fieldIds.includes(id) ? [index] : []));

describe("자동 배치 (PLAN.md §6)", () => {
  describe("보장 출전 수", () => {
    it.each(SEEDS)("18명(전담 키퍼 1 + 필드 17)이면 전원 3~4쿼터, 그중 9명이 4쿼터를 뛴다 (seed %i)", (seed) => {
      const field = fieldPlayers(17);
      const input: SquadInput = { players: [keeper("gk"), ...field], quarters: sixQuarters() };
      const lineup = autoAssign(input, { random: seeded(seed) });
      const { fieldCounts, warnings } = evaluateSquad(input, lineup);

      const counts = field.map((p) => fieldCounts[p.id]);
      expect(counts.every((count) => count === 3 || count === 4)).toBe(true);
      expect(counts.filter((count) => count === 4)).toHaveLength(9);
      expect(warnings).toEqual([]);
    });

    it("필드 인원이 모자라면 있는 만큼 채우고 남는 슬롯은 비운다", () => {
      const input: SquadInput = { players: [keeper("gk"), ...fieldPlayers(8)], quarters: sixQuarters() };
      const lineup = autoAssign(input, { random: seeded(1) });
      for (const quarter of lineup) {
        expect(quarter.fieldIds.filter((id) => id !== null)).toHaveLength(8);
        expect(quarter.fieldIds.filter((id) => id === null)).toHaveLength(2);
      }
    });
  });

  describe("전담 키퍼", () => {
    it("선호 1순위가 GK 인 사람은 뛸 수 있는 모든 쿼터에서 키퍼를 맡고 필드에는 안 들어간다", () => {
      const input: SquadInput = { players: [keeper("gk"), ...fieldPlayers(17)], quarters: sixQuarters() };
      const lineup = autoAssign(input, { random: seeded(1) });
      expect(lineup.map((quarter) => quarter.keeperId)).toEqual(Array(6).fill("gk"));
      expect(fieldQuartersOf(lineup, "gk")).toEqual([]);
    });

    it("전담 키퍼가 둘이면 키퍼 쿼터를 똑같이 나눈다", () => {
      const input: SquadInput = {
        players: [keeper("gk1"), keeper("gk2"), ...fieldPlayers(17)],
        quarters: sixQuarters(),
      };
      const { keeperCounts } = evaluateSquad(input, autoAssign(input, { random: seeded(1) }));
      expect(keeperCounts.gk1).toBe(3);
      expect(keeperCounts.gk2).toBe(3);
    });

    it("전담 키퍼가 일찍 가면 남은 쿼터의 키퍼 자리는 비워 두고 알려준다", () => {
      const input: SquadInput = {
        players: [keeper("gk", [0, 1, 2, 3]), ...fieldPlayers(17)],
        quarters: sixQuarters(),
      };
      const lineup = autoAssign(input, { random: seeded(1) });
      expect(lineup.map((quarter) => quarter.keeperId)).toEqual(["gk", "gk", "gk", "gk", null, null]);
      expect(evaluateSquad(input, lineup).warnings).toEqual([
        { kind: "keeper-missing", quarter: 4 },
        { kind: "keeper-missing", quarter: 5 },
      ]);
    });

    it("GK 를 2·3순위로 고른 사람도 자동으로 키퍼에 뽑지 않는다", () => {
      const input: SquadInput = {
        players: [player("sub", ["MF", "GK"]), ...fieldPlayers(16)],
        quarters: sixQuarters(),
      };
      const lineup = autoAssign(input, { random: seeded(1) });
      expect(lineup.map((quarter) => quarter.keeperId)).toEqual(Array(6).fill(null));
    });
  });

  describe("운영진이 정한 키퍼", () => {
    const noDedicatedKeeper: SquadInput = { players: fieldPlayers(18), quarters: sixQuarters() };
    const keepers = ["p1", null, null, null, null, null];

    it("정해 둔 키퍼는 그대로 두고, 그 사람은 그 쿼터 필드에서 빠진다", () => {
      const lineup = autoAssign(noDedicatedKeeper, { keepers, random: seeded(1) });
      expect(lineup[0].keeperId).toBe("p1");
      expect(lineup[0].fieldIds).not.toContain("p1");
    });

    it.each(SEEDS)("키퍼로 뛴 쿼터는 출전으로 세지 않고, 필드 출전은 똑같이 보장한다 (seed %i)", (seed) => {
      const lineup = autoAssign(noDedicatedKeeper, { keepers, random: seeded(seed) });
      const { guaranteed, fieldCounts, keeperCounts } = evaluateSquad(noDedicatedKeeper, lineup);
      expect(keeperCounts.p1).toBe(1);
      expect(guaranteed.p1).toBe(3);
      expect(fieldCounts.p1).toBeGreaterThanOrEqual(3);
    });

    it("다시 배치하면 키퍼 자리는 그대로 두고 필드만 새로 짠다", () => {
      const input: SquadInput = { players: [keeper("gk"), ...fieldPlayers(17)], quarters: sixQuarters() };
      const first = autoAssign(input, { random: seeded(1) });
      const edited = first.map((quarter) => quarter.keeperId);
      edited[5] = "p1"; // 마지막 쿼터는 운영진이 p1 을 키퍼로 바꿨다

      const second = autoAssign(input, { keepers: edited, random: seeded(2) });
      expect(second.map((quarter) => quarter.keeperId)).toEqual(edited);
      expect(second[5].fieldIds).not.toContain("p1");
    });
  });

  describe("늦게 오는 사람 · 일찍 가는 사람", () => {
    it.each(SEEDS)("12:00 에 떠나는 사람은 첫 쿼터부터 들어가고 보장 수를 채운다 (seed %i)", (seed) => {
      const leavers = [player("e1", ["MF"], [0, 1, 2, 3]), player("e2", ["CB"], [0, 1, 2, 3])];
      const input: SquadInput = {
        players: [keeper("gk"), ...fieldPlayers(15), ...leavers],
        quarters: sixQuarters(),
      };
      const lineup = autoAssign(input, { random: seeded(seed) });
      for (const { id } of leavers) {
        const played = fieldQuartersOf(lineup, id);
        expect(played[0]).toBe(0);
        expect(played.every((quarter) => quarter <= 3)).toBe(true);
        expect(played.length).toBeGreaterThanOrEqual(3);
      }
    });

    it.each(SEEDS)("11:00 에 오는 사람은 도착하자마자 들어가고 보장 수를 채운다 (seed %i)", (seed) => {
      const latecomers = [player("l1", ["FW"], [2, 3, 4, 5]), player("l2", ["WB"], [2, 3, 4, 5])];
      const input: SquadInput = {
        players: [keeper("gk"), ...fieldPlayers(15), ...latecomers],
        quarters: sixQuarters(),
      };
      const lineup = autoAssign(input, { random: seeded(seed) });
      for (const { id } of latecomers) {
        const played = fieldQuartersOf(lineup, id);
        expect(played[0]).toBe(2);
        expect(played.length).toBeGreaterThanOrEqual(3);
      }
    });

    it.each(SEEDS)("쉬는 쿼터가 한쪽으로 몰리지 않는다 — 3쿼터 연속으로 쉬는 사람이 없다 (seed %i)", (seed) => {
      const field = fieldPlayers(17);
      const input: SquadInput = { players: [keeper("gk"), ...field], quarters: sixQuarters() };
      const lineup = autoAssign(input, { random: seeded(seed) });
      for (const { id } of field) {
        const restPattern = lineup.map((quarter) => (quarter.fieldIds.includes(id) ? "o" : "x")).join("");
        expect(restPattern, id).not.toContain("xxx");
      }
    });
  });

  describe("포지션", () => {
    it.each(SEEDS)("남는 자리는 비어 있는 포지션을 선호하는 사람에게 먼저 간다 (seed %i)", (seed) => {
      // 11명이 슬롯 10개를 두고 다툰다. CB 슬롯을 원하는 사람은 한 명뿐이다.
      const fieldSlots: Position[] = ["CB", ...Array<Position>(9).fill("FW")];
      const forwards = Array.from({ length: 10 }, (_, index) => player(`fw${index}`, ["FW"], [0]));
      const input: SquadInput = {
        players: [...forwards, player("cb", ["CB"], [0])],
        quarters: [{ fieldSlots }],
      };
      const [quarter] = autoAssign(input, { random: seeded(seed) });
      expect(quarter.fieldIds[0]).toBe("cb");
    });

    it("선발된 사람은 선호 순위 점수의 합이 가장 크게 슬롯에 놓인다", () => {
      // a 를 FW 에 넣으면 b 는 CB(0점)로 밀린다. a 가 2순위 CB 로 가는 쪽이 합이 크다.
      const input: SquadInput = {
        players: [player("a", ["FW", "CB"], [0]), player("b", ["FW"], [0])],
        quarters: [{ fieldSlots: ["FW", "CB"] }],
      };
      const [quarter] = autoAssign(input, { random: seeded(1) });
      expect(quarter.fieldIds).toEqual(["b", "a"]);
    });
  });

  describe("어떤 입력이든 지키는 규칙", () => {
    const OUTFIELD: Position[] = ["FW", "AM", "WG", "MF", "WB", "CB"];

    const randomScenario = (random: () => number) => {
      const int = (min: number, max: number) => min + Math.floor(random() * (max - min + 1));
      const range = (from: number, to: number) => ALL_DAY.filter((q) => q >= from && q < to);
      const window = () => {
        const roll = random();
        if (roll < 0.2) return range(0, int(1, 5)); // 일찍 간다
        if (roll < 0.4) return range(int(1, 4), 6); // 늦게 온다
        return ALL_DAY;
      };
      const preferences = (): Position[] => {
        const shuffled = [...OUTFIELD].sort(() => random() - 0.5).slice(0, int(1, 3));
        if (shuffled.length > 1 && random() < 0.15) shuffled[shuffled.length - 1] = "GK";
        return shuffled;
      };

      const players: SquadPlayer[] = [
        ...Array.from({ length: int(0, 2) }, (_, index) => keeper(`gk${index}`, window())),
        ...Array.from({ length: int(11, 22) }, (_, index) => player(`p${index}`, preferences(), window())),
      ];
      const outfield = players.filter((p) => p.preferredPositions[0] !== "GK");
      const keepers = ALL_DAY.map((q) => {
        if (random() >= 0.3) return null;
        const available = outfield.filter((p) => p.availableQuarters.includes(q));
        return available.length > 0 ? available[int(0, available.length - 1)].id : null;
      });
      return { input: { players, quarters: sixQuarters() }, keepers };
    };

    it("무작위 입력 300개에서 배치 규칙을 하나도 어기지 않는다", () => {
      for (let seed = 1; seed <= 300; seed++) {
        const random = seeded(seed);
        const { input, keepers } = randomScenario(random);
        const lineup = autoAssign(input, { keepers, random });
        const byId = new Map(input.players.map((p) => [p.id, p]));
        const isDedicated = (id: string) => byId.get(id)!.preferredPositions[0] === "GK";
        const where = `seed ${seed}`;

        lineup.forEach((quarter, q) => {
          if (keepers[q]) expect(quarter.keeperId, where).toBe(keepers[q]);

          const onPitch = [quarter.keeperId, ...quarter.fieldIds].filter((id) => id !== null);
          expect(new Set(onPitch).size, `${where}: 한 쿼터에 같은 사람이 두 번`).toBe(onPitch.length);

          for (const id of quarter.fieldIds) {
            if (id === null) continue;
            expect(byId.get(id)!.availableQuarters, `${where}: ${id} 가 없는 쿼터에 뜀`).toContain(q);
            expect(isDedicated(id), `${where}: 전담 키퍼 ${id} 가 필드에 들어감`).toBe(false);
          }

          const eligible = input.players.filter(
            (p) => !isDedicated(p.id) && p.availableQuarters.includes(q) && p.id !== quarter.keeperId,
          ).length;
          const filled = quarter.fieldIds.filter((id) => id !== null).length;
          expect(filled, `${where}: ${q}쿼터를 채울 수 있는데 비움`).toBe(Math.min(FIELD_433.length, eligible));
        });

        const { guaranteed, fieldCounts, warnings } = evaluateSquad(input, lineup);
        expect(warnings.filter((w) => w.kind === "below-guarantee"), where).toEqual([]);
        for (const [id, count] of Object.entries(guaranteed)) {
          expect(fieldCounts[id], `${where}: ${id} 가 보장 수보다 2쿼터 이상 더 뜀`).toBeLessThanOrEqual(count + 1);
        }
      }
    });
  });
});
