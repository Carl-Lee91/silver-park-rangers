import { describe, expect, it } from "vitest";
import { shortTeams, splitTeams, TEAM_LABELS, teamAverage, teamSizes } from "./teams";

/** 같은 seed 면 같은 수열(mulberry32) */
const seeded = (seed: number) => {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const roster = (strengths: (number | null)[]) => strengths.map((strength, index) => ({ id: `p${index + 1}`, strength }));
const averages = (teams: string[][], strengths: Map<string, number>) =>
  teams.map((team) => team.reduce((sum, id) => sum + strengths.get(id)!, 0) / team.length);
const spread = (values: number[]) => Math.max(...values) - Math.min(...values);
const SEEDS = Array.from({ length: 10 }, (_, index) => index + 1);

describe("팀 인원 (PLAN.md §6 풋살)", () => {
  it("똑같이 나누고, 남는 사람은 앞 팀부터 한 명씩 더 — 차이는 1명까지", () => {
    expect(teamSizes(13, 2)).toEqual([7, 6]);
    expect(teamSizes(13, 3)).toEqual([5, 4, 4]);
    expect(teamSizes(18, 3)).toEqual([6, 6, 6]);
  });

  it("팀 이름은 A · B · C 팀이다", () => {
    expect(TEAM_LABELS).toEqual(["A팀", "B팀", "C팀"]);
  });
});

describe("팀 나누기", () => {
  const STRENGTHS = [9, 8.5, 8, 7.5, 7, 6.5, 6, 5.5, 5, 4.5, 4, 3.5, 3];
  const players = roster(STRENGTHS);
  const strengthOf = new Map(players.map((player) => [player.id, player.strength!]));

  it.each(SEEDS)("모두 한 팀에 한 번씩 들고, 팀 인원은 똑같이(7 · 6) (seed %i)", (seed) => {
    const teams = splitTeams(players, 2, seeded(seed));
    expect(teams.flat().sort()).toEqual(players.map((player) => player.id).sort());
    expect(teams.map((team) => team.length).sort()).toEqual([6, 7]);
  });

  it.each(SEEDS)("2팀이면 팀 평균 전력 차이가 0.3 이하다 (seed %i)", (seed) => {
    expect(spread(averages(splitTeams(players, 2, seeded(seed)), strengthOf))).toBeLessThanOrEqual(0.3);
  });

  it.each(SEEDS)("3팀(18명)이면 인원 6 · 6 · 6 에 팀 평균 전력 차이가 0.3 이하다 (seed %i)", (seed) => {
    const eighteen = roster([...STRENGTHS, 9, 7, 5, 3, 6]);
    const strengths = new Map(eighteen.map((player) => [player.id, player.strength!]));
    const teams = splitTeams(eighteen, 3, seeded(seed));
    expect(teams.map((team) => team.length)).toEqual([6, 6, 6]);
    expect(spread(averages(teams, strengths))).toBeLessThanOrEqual(0.3);
  });

  it("다시 누르면(다른 난수) 전력은 비슷하면서 다른 조합이 나온다", () => {
    const splits = SEEDS.map((seed) => JSON.stringify(splitTeams(players, 2, seeded(seed)).map((team) => [...team].sort()).sort()));
    expect(new Set(splits).size).toBeGreaterThan(1);
  });

  it("능력치가 없는 사람은 평균으로 본다 — 잘하는 사람 둘이 한 팀에 몰리지 않는다", () => {
    const mixed = roster([9, 9, null, null, 3, 3]);
    for (const seed of SEEDS) {
      const teams = splitTeams(mixed, 2, seeded(seed));
      expect(teams.find((team) => team.includes("p1"))).not.toContain("p2");
    }
  });

  it("아무도 능력치가 없으면 인원만 맞춰 나눈다", () => {
    const teams = splitTeams(roster([null, null, null, null, null]), 2, seeded(1));
    expect(teams.map((team) => team.length).sort()).toEqual([2, 3]);
  });
});

describe("팀 평균 전력과 모자란 팀", () => {
  it("팀 평균 전력. 미평가는 빼고, 아무도 없으면 null", () => {
    const strengths = { a: 8, b: 6, c: null };
    expect(teamAverage(["a", "b", "c"], strengths)).toBe(7);
    expect(teamAverage(["c"], strengths)).toBeNull();
  });

  it("경기 인원(5:5 면 5명)보다 적은 팀을 알려 준다", () => {
    expect(shortTeams([["a", "b", "c", "d", "e"], ["f", "g", "h", "i"]], 5)).toEqual([1]);
    expect(shortTeams([["a", "b", "c", "d", "e"], ["f", "g", "h", "i", "j"]], 5)).toEqual([]);
  });
});
