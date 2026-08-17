/**
 * Чистая логика визуализатора сортировки — без React и без DOM.
 * Генерирует пошаговые состояния сортировки пузырьком для анимации. Покрыто тестами.
 */

export interface SortStep {
  /** Состояние массива после этого шага. */
  array: number[];
  /** Индексы, которые сравнивались на этом шаге (или null для начального/финального). */
  comparing: [number, number] | null;
  /** Была ли перестановка на этом шаге. */
  swapped: boolean;
  /** С какого индекса «хвост» уже отсортирован (для подсветки). */
  sortedFrom: number;
}

export function isSorted(arr: readonly number[]): boolean {
  for (let i = 1; i < arr.length; i++) {
    if (arr[i - 1] > arr[i]) return false;
  }
  return true;
}

/** Все шаги сортировки пузырьком: сравнения и перестановки по порядку. */
export function bubbleSortSteps(input: readonly number[]): SortStep[] {
  const arr = [...input];
  const n = arr.length;
  const steps: SortStep[] = [{ array: [...arr], comparing: null, swapped: false, sortedFrom: n }];

  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - 1 - i; j++) {
      const swapped = arr[j] > arr[j + 1];
      if (swapped) {
        const tmp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = tmp;
      }
      steps.push({ array: [...arr], comparing: [j, j + 1], swapped, sortedFrom: n - i - 1 });
    }
  }

  steps.push({ array: [...arr], comparing: null, swapped: false, sortedFrom: 0 });
  return steps;
}

/** Сколько сравнений (шагов со сравнением) в наборе шагов. */
export function countComparisons(steps: readonly SortStep[]): number {
  return steps.filter((s) => s.comparing !== null).length;
}

/** Сколько перестановок в наборе шагов. */
export function countSwaps(steps: readonly SortStep[]): number {
  return steps.filter((s) => s.swapped).length;
}
