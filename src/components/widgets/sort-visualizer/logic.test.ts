import { describe, expect, it } from 'vitest';
import { bubbleSortSteps, countComparisons, countSwaps, isSorted } from './logic';

describe('isSorted', () => {
  it('отсортированный массив', () => expect(isSorted([1, 2, 3])).toBe(true));
  it('неотсортированный', () => expect(isSorted([3, 1, 2])).toBe(false));
  it('пустой и один элемент', () => {
    expect(isSorted([])).toBe(true);
    expect(isSorted([5])).toBe(true);
  });
});

describe('bubbleSortSteps', () => {
  it('первый шаг — исходный массив, последний — отсортированный', () => {
    const steps = bubbleSortSteps([3, 1, 2]);
    expect(steps[0].array).toEqual([3, 1, 2]);
    expect(steps[steps.length - 1].array).toEqual([1, 2, 3]);
    expect(isSorted(steps[steps.length - 1].array)).toBe(true);
  });
  it('каждое промежуточное состояние — массив той же длины', () => {
    const steps = bubbleSortSteps([5, 2, 8, 1]);
    for (const s of steps) expect(s.array).toHaveLength(4);
  });
  it('уже отсортированный массив всё равно даёт шаги без перестановок', () => {
    const steps = bubbleSortSteps([1, 2, 3]);
    expect(steps[steps.length - 1].array).toEqual([1, 2, 3]);
    expect(countSwaps(steps)).toBe(0);
  });
  it('обратный порядок даёт максимум перестановок', () => {
    const steps = bubbleSortSteps([3, 2, 1]);
    expect(steps[steps.length - 1].array).toEqual([1, 2, 3]);
    expect(countSwaps(steps)).toBe(3); // 3+2+1 сравнений, все три пары меняются
  });
  it('пустой и одиночный массив', () => {
    expect(bubbleSortSteps([]).at(-1)?.array).toEqual([]);
    expect(bubbleSortSteps([7]).at(-1)?.array).toEqual([7]);
  });
});

describe('счётчики', () => {
  it('число сравнений для 4 элементов = 3+2+1 = 6', () => {
    expect(countComparisons(bubbleSortSteps([4, 3, 2, 1]))).toBe(6);
  });
});
