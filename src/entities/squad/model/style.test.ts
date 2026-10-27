import { describe, expect, it } from "vitest";
import type { Position } from "@/entities/position";
import { autoAssign, type AssignStyle } from "./autoAssign";
import { evaluateSquad } from "./evaluateSquad";
import { fillStrengths } from "./style";
import type { QuarterLineup, SquadInput, SquadPlayer } from "./types";
import { ALL_DAY, fieldPlayers, keeper, player, seeded, sixQuarters } from "./testing";

const SEEDS = Array.from({ length: 8 }, (_, index) => index + 1);

/** 잘하는 순서로 p1 … p17 */
const STRENGTHS = [9, 9, 8.5, 8, 8, 7, 7, 6.5, 6, 5.5, 5, 5, 4.5, 4, 3.5, 3, 3];
const field = fieldPlayers(17).map((p, index) => ({ ...p, strength: STRENGTHS[index] }));
const input: SquadInput = { players: [keeper("gk"), ...field], quarters: sixQuarters() };
const strengthOf = new Map(field.map((p) => [p.id, p.strength]));

const quarterStrengths = (lineup: QuarterLineup[]) =>
  lineup.map((quarter) => quarter.fieldIds.reduce((sum, id) => sum + (id === null ? 0 : (strengthOf.get(id) ?? 0)), 0));
const spread = (values: number[]) => Math.max(...values) - Math.min(...values);
const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
const playsIn = (lineup: QuarterLineup[], id: string, quarter: number) => lineup[quarter].fieldIds.includes(id);
const restPattern = (lineup: QuarterLineup[], id: string) => lineup.map((quarter) => (quarter.fieldIds.includes(id) ? "o" : "x")).join("");

const STYLES: AssignStyle[] = [
  { kind: "default" },
  { kind: "balanced" },
  { kind: "front" },
  { kind: "back" },
  { kind: "focus", quarters: [2, 3] },
];

describe("자동 배치 스타일 (PLAN.md §6 자동 배치 스타일)", () => {
  describe.each(STYLES)("$kind", (style) => {
    it.each(SEEDS)("출전 수는 스타일과 상관없다 — 전원 3~4쿼터, 그중 9명이 4쿼터 (seed %i)", (seed) => {
      const lineup = autoAssign(input, { style, random: seeded(seed) });
      const { fieldCounts, warnings } = evaluateSquad(input, lineup);
      const counts = field.map((p) => fieldCounts[p.id]);
      expect(counts.every((count) => count === 3 || count === 4)).toBe(true);
      expect(counts.filter((count) => count === 4)).toHaveLength(9);
      expect(warnings).toEqual([]);
      expect(lineup.map((quarter) => quarter.keeperId)).toEqual(Array(6).fill("gk"));
    });
  });

  it.each(SEEDS)("균등: 쿼터 전력 차이가 기본보다 크지 않고 2 이하다(쿼터 전력 합 60 안팎의 3%) (seed %i)", (seed) => {
    const plain = quarterStrengths(autoAssign(input, { random: seeded(seed) }));
    const balanced = quarterStrengths(autoAssign(input, { style: { kind: "balanced" }, random: seeded(seed) }));
    expect(spread(balanced)).toBeLessThanOrEqual(spread(plain));
    expect(spread(balanced)).toBeLessThanOrEqual(2);
  });

  it.each(SEEDS)("균등: 기본처럼 3쿼터 연속으로 쉬는 사람이 없다 (seed %i)", (seed) => {
    const lineup = autoAssign(input, { style: { kind: "balanced" }, random: seeded(seed) });
    for (const { id } of field) expect(restPattern(lineup, id), id).not.toContain("xxx");
  });

  it.each(SEEDS)("초반 집중: 앞 세 쿼터가 뒤 세 쿼터보다 세고, 가장 잘하는 다섯 명은 1쿼터에 뛴다 (seed %i)", (seed) => {
    const lineup = autoAssign(input, { style: { kind: "front" }, random: seeded(seed) });
    const strengths = quarterStrengths(lineup);
    expect(mean(strengths.slice(0, 3)) - mean(strengths.slice(3))).toBeGreaterThan(5);
    for (const id of ["p1", "p2", "p3", "p4", "p5"]) expect(playsIn(lineup, id, 0), id).toBe(true);
  });

  it.each(SEEDS)("후반 집중: 뒤 세 쿼터가 앞 세 쿼터보다 세고, 가장 잘하는 다섯 명은 6쿼터에 뛴다 (seed %i)", (seed) => {
    const lineup = autoAssign(input, { style: { kind: "back" }, random: seeded(seed) });
    const strengths = quarterStrengths(lineup);
    expect(mean(strengths.slice(3)) - mean(strengths.slice(0, 3))).toBeGreaterThan(5);
    for (const id of ["p1", "p2", "p3", "p4", "p5"]) expect(playsIn(lineup, id, 5), id).toBe(true);
  });

  it.each(SEEDS)("쿼터 지정: 고른 쿼터(3 · 4쿼터)가 다른 어느 쿼터보다 세다 (seed %i)", (seed) => {
    const strengths = quarterStrengths(autoAssign(input, { style: { kind: "focus", quarters: [2, 3] }, random: seeded(seed) }));
    const others = strengths.filter((_, quarter) => quarter !== 2 && quarter !== 3);
    expect(Math.min(strengths[2], strengths[3])).toBeGreaterThan(Math.max(...others));
  });

  it.each(SEEDS)("아무도 능력치가 없으면 어느 스타일이든 기본과 같다 (seed %i)", (seed) => {
    const unrated: SquadInput = { players: [keeper("gk"), ...fieldPlayers(17)], quarters: sixQuarters() };
    const plain = autoAssign(unrated, { random: seeded(seed) });
    for (const style of STYLES) expect(autoAssign(unrated, { style, random: seeded(seed) })).toEqual(plain);
  });

  it.each(SEEDS)("다시 배치(N쿼터부터)도 스타일로 짜고, 끝난 쿼터는 그대로 둔다 (seed %i)", (seed) => {
    const first = autoAssign(input, { random: seeded(seed) });
    const again = autoAssign(input, {
      style: { kind: "back" },
      random: seeded(seed),
      startQuarter: 3,
      current: first,
      keepers: first.map((quarter) => quarter.keeperId),
    });
    expect(again.slice(0, 3)).toEqual(first.slice(0, 3));
    expect(evaluateSquad(input, again).warnings).toEqual([]);
  });
});

describe("미평가 선수의 전력", () => {
  it("능력치가 없는 사람은 이번 배치 대상의 평균으로 본다", () => {
    const strengths = fillStrengths([
      { ...player("a"), strength: 8 },
      { ...player("b"), strength: 4 },
      { ...player("c"), strength: null },
      player("d"),
    ]);
    expect(Object.fromEntries(strengths!)).toEqual({ a: 8, b: 4, c: 6, d: 6 });
  });

  it("아무도 능력치가 없으면 전력을 쓰지 않는다", () => {
    expect(fillStrengths([player("a"), { ...player("b"), strength: null }])).toBeNull();
  });
});

describe("어떤 입력이든 스타일이 규칙을 어기지 않는다", () => {
  const OUTFIELD: Position[] = ["FW", "AM", "WG", "MF", "WB", "CB"];

  it("무작위 입력 40개 × 스타일 5개", () => {
    for (let seed = 1; seed <= 40; seed++) {
      const random = seeded(seed);
      const int = (min: number, max: number) => min + Math.floor(random() * (max - min + 1));
      const range = (from: number, to: number) => ALL_DAY.filter((q) => q >= from && q < to);
      const window = () => {
        const roll = random();
        if (roll < 0.2) return range(0, int(1, 5));
        if (roll < 0.4) return range(int(1, 4), 6);
        return ALL_DAY;
      };
      const players: SquadPlayer[] = [
        ...Array.from({ length: int(0, 2) }, (_, index) => keeper(`gk${index}`, window())),
        ...Array.from({ length: int(11, 22) }, (_, index) => ({
          ...player(`p${index}`, [...OUTFIELD].sort(() => random() - 0.5).slice(0, int(1, 3)), window()),
          strength: random() < 0.15 ? null : int(1, 10),
        })),
      ];
      const scenario: SquadInput = { players, quarters: sixQuarters() };
      const byId = new Map(players.map((p) => [p.id, p]));

      for (const style of STYLES) {
        const where = `seed ${seed} ${style.kind}`;
        const lineup = autoAssign(scenario, { style, random: seeded(seed) });
        lineup.forEach((quarter, q) => {
          const onPitch = [quarter.keeperId, ...quarter.fieldIds].filter((id) => id !== null);
          expect(new Set(onPitch).size, `${where}: 한 쿼터에 같은 사람이 두 번`).toBe(onPitch.length);
          for (const id of quarter.fieldIds) {
            if (id === null) continue;
            expect(byId.get(id)!.availableQuarters, `${where}: ${id} 가 없는 쿼터에 뜀`).toContain(q);
            expect(byId.get(id)!.preferredPositions[0], `${where}: 전담 키퍼가 필드에`).not.toBe("GK");
          }
        });
        const { guaranteed, fieldCounts, warnings } = evaluateSquad(scenario, lineup);
        expect(warnings.filter((w) => w.kind === "below-guarantee"), where).toEqual([]);
        for (const [id, count] of Object.entries(guaranteed)) {
          expect(fieldCounts[id], `${where}: ${id} 가 보장 수보다 2쿼터 이상 더 뜀`).toBeLessThanOrEqual(count + 1);
        }
      }
    }
  });
});
