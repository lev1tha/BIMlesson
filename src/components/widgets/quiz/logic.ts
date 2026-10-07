/**
 * Чистая логика квиза — без React и без DOM.
 * Перемешивание вариантов, чтобы правильный ответ не стоял всегда первым.
 * Покрыто тестами.
 */

/** Генератор случайных чисел в [0, 1) — как Math.random. */
export type Rng = () => number;

/** Детерминированный ГПСЧ (mulberry32): одинаковое зерно → одинаковая последовательность. */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Хеш строки (FNV-1a, 32 бита) — зерно для стабильного порядка на сервере. */
export function hashString(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Перестановка индексов 0..n-1 (Фишер — Йетс).
 * Если вариантов больше одного, правильный ответ `avoidFirst` не оставляем
 * на первом месте — иначе привычка «жми первый» снова срабатывает.
 */
export function shuffledOrder(n: number, rng: Rng, avoidFirst?: number): number[] {
  const order = Array.from({ length: Math.max(0, n) }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  if (avoidFirst !== undefined && order.length > 1 && order[0] === avoidFirst) {
    const swapWith = 1 + Math.floor(rng() * (order.length - 1));
    [order[0], order[swapWith]] = [order[swapWith], order[0]];
  }
  return order;
}

/** Порядки для всех вопросов. `rng` не передан → стабильный порядок по тексту вопроса (для SSR). */
export function orderQuestions(
  questions: { question: string; options: string[]; answer: number }[],
  rng?: Rng,
): number[][] {
  return questions.map((q) =>
    shuffledOrder(q.options.length, rng ?? seededRng(hashString(q.question)), q.answer),
  );
}
