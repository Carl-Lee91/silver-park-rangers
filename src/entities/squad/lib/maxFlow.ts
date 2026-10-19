export type FlowEdge = {
  from: number;
  to: number;
  capacity: number;
};

/**
 * 최대 유량(Edmonds–Karp). 노드가 수십 개뿐이라 BFS 로 경로를 찾는 단순한 판으로 충분하다.
 *
 * 간선 `i` 의 되돌림 간선은 `i ^ 1` 이다. 먼저 잡은 경로를 되돌려야 최대치가 나오는
 * 경우가 있어서 되돌림 간선이 필요하다.
 */
export const maxFlow = (
  nodeCount: number,
  edges: readonly FlowEdge[],
  source: number,
  sink: number,
): number => {
  const head: number[] = [];
  const capacity: number[] = [];
  const outgoing: number[][] = Array.from({ length: nodeCount }, () => []);

  for (const edge of edges) {
    outgoing[edge.from].push(head.length);
    head.push(edge.to);
    capacity.push(edge.capacity);
    outgoing[edge.to].push(head.length);
    head.push(edge.from);
    capacity.push(0);
  }

  let flow = 0;
  for (;;) {
    const via = new Array<number>(nodeCount).fill(-1);
    const seen = new Array<boolean>(nodeCount).fill(false);
    seen[source] = true;
    const queue = [source];

    for (let index = 0; index < queue.length && !seen[sink]; index++) {
      for (const edge of outgoing[queue[index]]) {
        const next = head[edge];
        if (seen[next] || capacity[edge] === 0) continue;
        seen[next] = true;
        via[next] = edge;
        queue.push(next);
      }
    }
    if (!seen[sink]) return flow;

    let push = Infinity;
    for (let node = sink; node !== source; node = head[via[node] ^ 1]) {
      push = Math.min(push, capacity[via[node]]);
    }
    for (let node = sink; node !== source; node = head[via[node] ^ 1]) {
      capacity[via[node]] -= push;
      capacity[via[node] ^ 1] += push;
    }
    flow += push;
  }
};
