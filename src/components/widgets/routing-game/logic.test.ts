import { describe, expect, it } from 'vitest';
import { checkPath, dijkstra, edgeCost, neighbors, pathCost } from './logic';
import { DEFAULT_SCENARIO } from './data';

const g = DEFAULT_SCENARIO.graph;

describe('edgeCost / neighbors', () => {
  it('стоимость существующего канала', () => expect(edgeCost(g, 'A', 'B')).toBe(2));
  it('нет канала → null', () => expect(edgeCost(g, 'A', 'E')).toBeNull());
  it('соседи узла', () => expect(neighbors(g, 'A').sort()).toEqual(['B', 'C']));
  it('соседи неизвестного узла — пусто', () => expect(neighbors(g, 'Z')).toEqual([]));
});

/** Разорванная сеть: остров Y↔Z физически не связан с A. */
const split = { A: { B: 1 }, B: { A: 1 }, Y: { Z: 1 }, Z: { Y: 1 } };

describe('pathCost', () => {
  it('суммирует стоимости', () => expect(pathCost(g, ['A', 'B', 'C'])).toBe(4));
  it('один узел — 0', () => expect(pathCost(g, ['A'])).toBe(0));
  it('пустой путь — null', () => expect(pathCost(g, [])).toBeNull());
  it('несуществующий канал — null', () => expect(pathCost(g, ['A', 'E'])).toBeNull());
});

describe('dijkstra', () => {
  it('кратчайший A→E', () => {
    const r = dijkstra(g, 'A', 'E');
    expect(r).not.toBeNull();
    expect(r?.cost).toBe(8);
    expect(r?.path).toEqual(['A', 'B', 'C', 'D', 'E']);
  });
  it('несуществующий узел → null', () => {
    expect(dijkstra(g, 'A', 'Z')).toBeNull();
  });
  it('узел есть, но недостижим (сеть разорвана) → null', () => {
    expect(dijkstra(split, 'A', 'Z')).toBeNull();
  });
});

describe('checkPath', () => {
  it('оптимальный путь — верно', () => {
    const r = checkPath(g, 'A', 'E', ['A', 'B', 'C', 'D', 'E']);
    expect(r.correct).toBe(true);
    expect(r.cost).toBe(8);
  });
  it('рабочий, но дорогой путь', () => {
    const r = checkPath(g, 'A', 'E', ['A', 'C', 'E']); // 5 + 6 = 11
    expect(r.correct).toBe(false);
    expect(r.cost).toBe(11);
    expect(r.reason).toContain('8');
  });
  it('несуществующий канал', () => {
    const r = checkPath(g, 'A', 'E', ['A', 'E']);
    expect(r.correct).toBe(false);
    expect(r.cost).toBeNull();
  });
  it('путь не доходит до цели', () => {
    const r = checkPath(g, 'A', 'E', ['A', 'B']);
    expect(r.correct).toBe(false);
    expect(r.reachesDest).toBe(false);
  });
  it('цель недостижима — оптимального пути нет', () => {
    const r = checkPath(split, 'A', 'Z', ['A', 'B']);
    expect(r.correct).toBe(false);
    expect(r.optimalPath).toEqual([]);
    expect(r.optimalCost).toBe(Infinity);
  });
});
