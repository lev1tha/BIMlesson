import { describe, expect, it } from 'vitest';
import { hashString, orderQuestions, seededRng, shuffledOrder } from './logic';

const isPermutation = (order: number[], n: number) =>
  order.length === n && [...order].sort((a, b) => a - b).every((v, i) => v === i);

describe('seededRng', () => {
  it('одинаковое зерно даёт одинаковую последовательность в [0, 1)', () => {
    const a = seededRng(42);
    const b = seededRng(42);
    for (let i = 0; i < 20; i++) {
      const x = a();
      expect(x).toBe(b());
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });

  it('разные зёрна — разные последовательности', () => {
    expect(seededRng(1)()).not.toBe(seededRng(2)());
  });
});

describe('hashString', () => {
  it('стабилен и различает строки, пустая строка не ломается', () => {
    expect(hashString('вопрос')).toBe(hashString('вопрос'));
    expect(hashString('вопрос')).not.toBe(hashString('вопрос?'));
    expect(hashString('')).toBe(0x811c9dc5);
  });
});

describe('shuffledOrder', () => {
  it('возвращает перестановку всех индексов', () => {
    for (let seed = 0; seed < 50; seed++) {
      expect(isPermutation(shuffledOrder(4, seededRng(seed)), 4)).toBe(true);
    }
  });

  it('правильный ответ никогда не остаётся первым', () => {
    for (let seed = 0; seed < 200; seed++) {
      expect(shuffledOrder(4, seededRng(seed), 0)[0]).not.toBe(0);
      expect(shuffledOrder(3, seededRng(seed), 2)[0]).not.toBe(2);
    }
  });

  it('правильный ответ попадает на все остальные позиции', () => {
    const seen = new Set<number>();
    for (let seed = 0; seed < 200; seed++) seen.add(shuffledOrder(4, seededRng(seed), 0).indexOf(0));
    expect([...seen].sort()).toEqual([1, 2, 3]);
  });

  it('если тасовка поставила ответ первым — меняем его местами', () => {
    // rng()=0: Фишер — Йетс даёт [1, 0], ответ 1 оказался первым → обмен.
    const order = shuffledOrder(2, () => 0, 1);
    expect(order[0]).not.toBe(1);
    expect(isPermutation(order, 2)).toBe(true);
  });

  it('граничные случаи: 0 и 1 вариант, отрицательная длина', () => {
    expect(shuffledOrder(0, seededRng(1), 0)).toEqual([]);
    expect(shuffledOrder(1, seededRng(1), 0)).toEqual([0]);
    expect(shuffledOrder(-3, seededRng(1))).toEqual([]);
  });
});

describe('orderQuestions', () => {
  const questions = [
    { question: 'А?', options: ['да', 'нет', 'может'], answer: 0 },
    { question: 'Б?', options: ['1', '2', '3', '4'], answer: 3 },
  ];

  it('без rng порядок стабилен (одинаков на сервере и клиенте)', () => {
    expect(orderQuestions(questions)).toEqual(orderQuestions(questions));
  });

  it('с rng — случайный порядок, ответ не первым', () => {
    const orders = orderQuestions(questions, seededRng(7));
    expect(isPermutation(orders[0], 3)).toBe(true);
    expect(orders[0][0]).not.toBe(0);
    expect(orders[1][0]).not.toBe(3);
  });
});
