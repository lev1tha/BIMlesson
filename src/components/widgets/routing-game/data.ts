import type { Graph } from './logic';

export interface RoutingScenario {
  graph: Graph;
  positions: Record<string, { x: number; y: number }>;
  from: string;
  to: string;
}

/** Сеть из 5 маршрутизаторов. Кратчайший A→E: A-B-C-D-E = 8. */
export const DEFAULT_SCENARIO: RoutingScenario = {
  graph: {
    A: { B: 2, C: 5 },
    B: { A: 2, C: 2, D: 7 },
    C: { A: 5, B: 2, D: 3, E: 6 },
    D: { B: 7, C: 3, E: 1 },
    E: { C: 6, D: 1 },
  },
  positions: {
    A: { x: 40, y: 110 },
    B: { x: 150, y: 40 },
    C: { x: 150, y: 180 },
    D: { x: 270, y: 90 },
    E: { x: 300, y: 190 },
  },
  from: 'A',
  to: 'E',
};
