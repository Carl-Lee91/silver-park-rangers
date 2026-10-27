/**
 * 풋살 팀 나누기(PLAN.md §6 "풋살"). 참석한 사람을 2 · 3팀으로 하루 동안 고정해서 나눈다.
 * 팀 평균 전력(필드 능력치 평균 — 골키퍼 능력치는 안 본다)이 비슷하게, 포지션은 보지 않는다.
 */

export const TEAM_LABELS = ["A팀", "B팀", "C팀"] as const;

export type TeamCount = 2 | 3;

export type TeamPlayer = { id: string; strength: number | null };

/** 팀 인원: 똑같이 나누고 남는 사람은 앞 팀부터 한 명씩 더(차이는 1명까지) */
export const teamSizes = (players: number, teams: number) =>
  Array.from({ length: teams }, (_, index) => Math.floor(players / teams) + (index < players % teams ? 1 : 0));

/** 몇 번 처음부터 다시 나눠 보는지. 그중 가장 고른 것들 가운데 하나를 고른다 */
const RESTARTS = 40;
/** 가장 고른 결과와 이만큼(평균 전력 차이)까지는 같게 보고, 그중 무작위로 고른다 — 다시 누르면 다른 조합 */
const TOLERANCE = 0.15;
const EPSILON = 1e-9;

const shuffle = <T>(items: readonly T[], random: () => number) => {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [copy[index], copy[other]] = [copy[other], copy[index]];
  }
  return copy;
};

/** 점수: 팀 평균 전력의 최대 - 최소(작을수록 고르다). 같으면 평균과의 차이 제곱 합 */
const scoreOf = (teams: readonly string[][], strengthOf: (id: string) => number) => {
  const averages = teams.map((team) => (team.length === 0 ? 0 : team.reduce((sum, id) => sum + strengthOf(id), 0) / team.length));
  const mean = averages.reduce((sum, value) => sum + value, 0) / averages.length;
  return {
    spread: Math.max(...averages) - Math.min(...averages),
    squares: averages.reduce((sum, value) => sum + (value - mean) ** 2, 0),
  };
};

const better = (a: ReturnType<typeof scoreOf>, b: ReturnType<typeof scoreOf>) =>
  a.spread < b.spread - EPSILON || (Math.abs(a.spread - b.spread) <= EPSILON && a.squares < b.squares - EPSILON);

/** 두 팀 사이에서 두 사람을 맞바꿔(인원은 그대로) 더 고르게 되는 동안 되풀이한다 */
const improve = (teams: string[][], strengthOf: (id: string) => number) => {
  let current = scoreOf(teams, strengthOf);
  for (let improved = true; improved; ) {
    improved = false;
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        for (let a = 0; a < teams[i].length; a++) {
          for (let b = 0; b < teams[j].length; b++) {
            [teams[i][a], teams[j][b]] = [teams[j][b], teams[i][a]];
            const next = scoreOf(teams, strengthOf);
            if (better(next, current)) {
              current = next;
              improved = true;
            } else {
              [teams[i][a], teams[j][b]] = [teams[j][b], teams[i][a]];
            }
          }
        }
      }
    }
  }
  return current;
};

/**
 * 팀을 나눈다. 무작위로 나눈 뒤 맞바꿈으로 팀 평균 전력을 고르게 하기를 여러 번 하고, 가장 고른 것과 거의 같은
 * 결과들 가운데 하나를 고른다. 능력치가 없는 사람은 능력치가 있는 사람들의 평균으로 본다(아무도 없으면 인원만 맞춘다).
 */
export const splitTeams = (players: readonly TeamPlayer[], teamCount: number, random: () => number = Math.random): string[][] => {
  const rated = players.flatMap((player) => (player.strength === null ? [] : [player.strength]));
  const fallback = rated.length === 0 ? 0 : rated.reduce((sum, value) => sum + value, 0) / rated.length;
  const strengths = new Map(players.map((player) => [player.id, player.strength ?? fallback]));
  const strengthOf = (id: string) => strengths.get(id)!;
  const sizes = teamSizes(players.length, teamCount);

  const results = Array.from({ length: RESTARTS }, () => {
    const order = shuffle(
      players.map((player) => player.id),
      random,
    );
    let offset = 0;
    const teams = sizes.map((size) => {
      const team = order.slice(offset, offset + size);
      offset += size;
      return team;
    });
    return { teams, score: improve(teams, strengthOf) };
  });

  const best = results.reduce((top, result) => (better(result.score, top.score) ? result : top));
  const close = results.filter((result) => result.score.spread <= best.score.spread + TOLERANCE);
  return close[Math.floor(random() * close.length)].teams;
};

/** 팀 평균 전력(관리자 화면). 미평가는 빼고, 아무도 능력치가 없으면 null */
export const teamAverage = (ids: readonly string[], strengths: Readonly<Record<string, number | null>>) => {
  const rated = ids.flatMap((id) => (strengths[id] == null ? [] : [strengths[id]!]));
  return rated.length === 0 ? null : rated.reduce((sum, value) => sum + value, 0) / rated.length;
};

/** 경기 인원(5:5 면 5명)보다 적은 팀의 번호(0부터) */
export const shortTeams = (teams: readonly (readonly string[])[], perSide: number) =>
  teams.flatMap((team, index) => (team.length < perSide ? [index] : []));
