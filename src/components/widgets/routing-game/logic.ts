/**
 * Чистая логика мини-игры «маршрутизация» — без React и без DOM.
 * Граф сети со стоимостью каналов, кратчайший путь (Дейкстра), проверка пути.
 * Покрыто тестами.
 */

export type Graph = Record<string, Record<string, number>>;

export function edgeCost(graph: Graph, a: string, b: string): number | null {
  const cost = graph[a]?.[b];
  return typeof cost === 'number' ? cost : null;
}

export function neighbors(graph: Graph, node: string): string[] {
  return Object.keys(graph[node] ?? {});
}

/** Суммарная стоимость пути. null, если между соседними узлами нет канала. */
export function pathCost(graph: Graph, path: readonly string[]): number | null {
  if (path.length === 0) return null;
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const cost = edgeCost(graph, path[i], path[i + 1]);
    if (cost === null) return null;
    total += cost;
  }
  return total;
}

export interface ShortestResult {
  path: string[];
  cost: number;
}

/** Кратчайший путь по стоимости (алгоритм Дейкстры). null, если недостижимо. */
export function dijkstra(graph: Graph, from: string, to: string): ShortestResult | null {
  const nodes = Object.keys(graph);
  if (!nodes.includes(from) || !nodes.includes(to)) return null;

  const dist: Record<string, number> = {};
  const prev: Record<string, string | null> = {};
  const visited = new Set<string>();
  for (const n of nodes) {
    dist[n] = Infinity;
    prev[n] = null;
  }
  dist[from] = 0;

  while (visited.size < nodes.length) {
    let u: string | null = null;
    let best = Infinity;
    for (const n of nodes) {
      if (!visited.has(n) && dist[n] < best) {
        best = dist[n];
        u = n;
      }
    }
    if (u === null) break;
    visited.add(u);
    if (u === to) break;
    for (const [v, w] of Object.entries(graph[u])) {
      if (dist[u] + w < dist[v]) {
        dist[v] = dist[u] + w;
        prev[v] = u;
      }
    }
  }

  if (dist[to] === Infinity) return null;

  const path: string[] = [];
  let cur: string | null = to;
  while (cur !== null) {
    path.unshift(cur);
    cur = prev[cur];
  }
  return { path, cost: dist[to] };
}

export interface PathCheck {
  reachesDest: boolean;
  cost: number | null;
  optimalCost: number;
  optimalPath: string[];
  correct: boolean;
  reason: string;
}

export function checkPath(graph: Graph, from: string, to: string, path: readonly string[]): PathCheck {
  const optimal = dijkstra(graph, from, to);
  const optimalCost = optimal ? optimal.cost : Infinity;
  const optimalPath = optimal ? optimal.path : [];
  const cost = pathCost(graph, path);
  const reachesDest = path.length > 0 && path[0] === from && path[path.length - 1] === to;

  if (cost === null) {
    return { reachesDest, cost, optimalCost, optimalPath, correct: false, reason: 'Такого канала нет — двигайся только по существующим линиям.' };
  }
  if (!reachesDest) {
    return { reachesDest, cost, optimalCost, optimalPath, correct: false, reason: `Путь должен идти от ${from} до ${to}.` };
  }
  if (cost === optimalCost) {
    return { reachesDest, cost, optimalCost, optimalPath, correct: true, reason: `Оптимально! Суммарная стоимость ${cost}.` };
  }
  return { reachesDest, cost, optimalCost, optimalPath, correct: false, reason: `Стоимость ${cost}, но можно дешевле — за ${optimalCost}.` };
}
