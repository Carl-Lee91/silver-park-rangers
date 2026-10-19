/**
 * 행(사람)마다 서로 다른 열(칸)을 하나씩 골라 점수 합을 가장 크게 만든다(헝가리안 알고리즘).
 * 행 수는 열 수보다 많을 수 없다. 돌려주는 값은 행마다 고른 열 번호다.
 *
 * 앞사람부터 가장 높은 칸을 고르면, 뒷사람이 0점 칸으로 밀려 합이 줄어드는 경우가 있다.
 * 그래서 탐욕적으로 고르지 않는다.
 */
export const bestAssignment = (score: readonly (readonly number[])[]): number[] => {
  const rows = score.length;
  if (rows === 0) return [];
  const columns = score[0].length;

  // 최소 비용 판으로 풀기 위해 점수를 뒤집는다. 아래 배열은 1부터 센다(0은 보조 칸).
  const cost = (row: number, column: number) => -score[row - 1][column - 1];
  const rowPotential = new Array<number>(rows + 1).fill(0);
  const columnPotential = new Array<number>(columns + 1).fill(0);
  const owner = new Array<number>(columns + 1).fill(0);
  const way = new Array<number>(columns + 1).fill(0);

  for (let row = 1; row <= rows; row++) {
    owner[0] = row;
    let column = 0;
    const minimum = new Array<number>(columns + 1).fill(Infinity);
    const used = new Array<boolean>(columns + 1).fill(false);

    do {
      used[column] = true;
      const current = owner[column];
      let delta = Infinity;
      let nextColumn = 0;
      for (let candidate = 1; candidate <= columns; candidate++) {
        if (used[candidate]) continue;
        const reduced = cost(current, candidate) - rowPotential[current] - columnPotential[candidate];
        if (reduced < minimum[candidate]) {
          minimum[candidate] = reduced;
          way[candidate] = column;
        }
        if (minimum[candidate] < delta) {
          delta = minimum[candidate];
          nextColumn = candidate;
        }
      }
      for (let candidate = 0; candidate <= columns; candidate++) {
        if (used[candidate]) {
          rowPotential[owner[candidate]] += delta;
          columnPotential[candidate] -= delta;
        } else {
          minimum[candidate] -= delta;
        }
      }
      column = nextColumn;
    } while (owner[column] !== 0);

    do {
      const previous = way[column];
      owner[column] = owner[previous];
      column = previous;
    } while (column !== 0);
  }

  const result = new Array<number>(rows).fill(-1);
  for (let column = 1; column <= columns; column++) {
    if (owner[column] !== 0) result[owner[column] - 1] = column - 1;
  }
  return result;
};
