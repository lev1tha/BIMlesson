import { describe, expect, it } from 'vitest';
import {
  checkSla,
  clampAvailability,
  downtimeCost,
  downtimeSeconds,
  evaluateChain,
  formatDuration,
  formatPercent,
  MONTH_SECONDS,
  parallelAvailability,
  PERIODS,
  serialAvailability,
  SLA_LEVELS,
  type ChainItem,
  type ChainPart,
  type SlaTask,
} from './logic';
import { DEFAULT_PARTS, DEFAULT_TASKS } from './data';

const part = (id: string, availability: number): ChainPart => ({
  id,
  name: `Звено ${id}`,
  availability,
  hint: 'подсказка',
});

const item = (p: ChainPart, enabled = true, redundant = false): ChainItem => ({
  part: p,
  enabled,
  redundant,
});

describe('clampAvailability', () => {
  it('оставляет корректные значения как есть', () => {
    expect(clampAvailability(99.9)).toBe(99.9);
  });

  it('обрезает выход за границы и мусор', () => {
    expect(clampAvailability(-5)).toBe(0);
    expect(clampAvailability(150)).toBe(100);
    expect(clampAvailability(Number.NaN)).toBe(0);
  });
});

describe('downtimeSeconds', () => {
  it('99.9% за месяц — 43 минуты 12 секунд', () => {
    expect(downtimeSeconds(99.9, MONTH_SECONDS)).toBeCloseTo(2592, 5);
  });

  it('100% — нулевой простой, 0% — весь период', () => {
    expect(downtimeSeconds(100, 86400)).toBe(0);
    expect(downtimeSeconds(0, 86400)).toBe(86400);
  });

  it('нулевой или отрицательный период даёт 0', () => {
    expect(downtimeSeconds(99, 0)).toBe(0);
    expect(downtimeSeconds(99, -10)).toBe(0);
  });
});

describe('formatDuration', () => {
  it('секунды и ноль', () => {
    expect(formatDuration(0)).toBe('0 с');
    expect(formatDuration(-5)).toBe('0 с');
    expect(formatDuration(42.4)).toBe('42 с');
  });

  it('минуты с остатком и без', () => {
    expect(formatDuration(90)).toBe('1 мин 30 с');
    expect(formatDuration(120)).toBe('2 мин');
  });

  it('часы с минутами и без', () => {
    expect(formatDuration(3600)).toBe('1 ч');
    expect(formatDuration(3900)).toBe('1 ч 5 мин');
  });

  it('сутки с часами и без', () => {
    expect(formatDuration(86400)).toBe('1 д');
    expect(formatDuration(90000)).toBe('1 д 1 ч');
  });
});

describe('serialAvailability', () => {
  it('пустая цепочка — 100%', () => {
    expect(serialAvailability([])).toBe(100);
  });

  it('три звена по 99.9% дают меньше 99.9%', () => {
    const total = serialAvailability([99.9, 99.9, 99.9]);
    expect(total).toBeCloseTo(99.7003, 4);
    expect(total).toBeLessThan(99.9);
  });

  it('одно звено равно самому себе', () => {
    expect(serialAvailability([99.5])).toBeCloseTo(99.5, 10);
  });
});

describe('parallelAvailability', () => {
  it('резерв повышает доступность', () => {
    expect(parallelAvailability(99, 2)).toBeCloseTo(99.99, 10);
  });

  it('одна копия ничего не меняет, копий меньше одной не бывает', () => {
    expect(parallelAvailability(99, 1)).toBeCloseTo(99, 10);
    expect(parallelAvailability(99, 0)).toBeCloseTo(99, 10);
  });
});

describe('formatPercent', () => {
  it('целые печатает без хвоста', () => {
    expect(formatPercent(100)).toBe('100%');
    expect(formatPercent(99)).toBe('99%');
  });

  it('дробные округляет до трёх знаков', () => {
    expect(formatPercent(99.9)).toBe('99.9%');
    expect(formatPercent(99.7003)).toBe('99.7%');
    expect(formatPercent(99.99899)).toBe('99.999%');
  });
});

describe('evaluateChain', () => {
  it('пустая цепочка объясняет, что звеньев нет', () => {
    const result = evaluateChain([item(part('a', 99), false)]);
    expect(result.availability).toBe(100);
    expect(result.downtimePerMonth).toBe(0);
    expect(result.weakest).toBeNull();
    expect(result.explanation).toContain('нет ни одного звена');
  });

  it('одно звено — итог равен его доступности', () => {
    const result = evaluateChain([item(part('web', 99.9))]);
    expect(result.availability).toBeCloseTo(99.9, 10);
    expect(result.weakest?.id).toBe('web');
    expect(result.explanation).toContain('Одно звено');
  });

  it('несколько звеньев перемножаются, слабейшее найдено', () => {
    const result = evaluateChain([item(part('cdn', 99.99)), item(part('mail', 99.5))]);
    expect(result.availability).toBeCloseTo(99.49005, 5);
    expect(result.weakest?.id).toBe('mail');
    expect(result.explanation).toContain('×');
    expect(result.downtimePerMonth).toBeGreaterThan(0);
  });

  it('слабейшее звено находится и когда оно стоит первым', () => {
    const result = evaluateChain([item(part('mail', 99.5)), item(part('cdn', 99.99))]);
    expect(result.weakest?.id).toBe('mail');
  });

  it('резервирование звена поднимает итог', () => {
    const plain = evaluateChain([item(part('web', 99))]);
    const backed = evaluateChain([item(part('web', 99), true, true)]);
    expect(backed.availability).toBeGreaterThan(plain.availability);
    expect(backed.availability).toBeCloseTo(99.99, 10);
  });

  it('после резерва слабым считается уже другое звено', () => {
    const result = evaluateChain([
      item(part('mail', 99.5), true, true), // с дублем становится 99.9975%
      item(part('web', 99.9)),
    ]);
    expect(result.weakest?.id).toBe('web');
    expect(result.explanation).toContain('Звено web');
  });
});

describe('checkSla', () => {
  const task: SlaTask = {
    id: 't',
    goal: 'цель',
    budgetMinutes: 50,
    options: [99, 99.5, 99.9, 99.99],
    correct: 99.9,
    why: 'потому что',
  };

  it('верный ответ подтверждается и объясняется', () => {
    const result = checkSla(task, 99.9);
    expect(result.correct).toBe(true);
    expect(result.reason).toContain('43 мин 12 с');
    expect(result.reason).toContain('потому что');
  });

  it('слишком слабый уровень — объясняет превышение бюджета', () => {
    const result = checkSla(task, 99);
    expect(result.correct).toBe(false);
    expect(result.reason).toContain('Мало');
    expect(result.reason).toContain('7 ч 12 мин');
  });

  it('слишком строгий уровень — объясняет переплату', () => {
    const result = checkSla(task, 99.99);
    expect(result.correct).toBe(false);
    expect(result.reason).toContain('Избыточно');
    expect(result.reason).toContain('99.9%');
  });
});

describe('downtimeCost', () => {
  it('считает потери по цене часа простоя', () => {
    expect(downtimeCost(3600, 200000)).toBe(200000);
    expect(downtimeCost(1800, 100000)).toBe(50000);
  });

  it('без цены и при отрицательном простое — ноль', () => {
    expect(downtimeCost(3600, 0)).toBe(0);
    expect(downtimeCost(-100, 1000)).toBe(0);
  });
});

describe('наборы данных', () => {
  it('в каждой задаче правильный ответ — минимальный достаточный уровень', () => {
    for (const task of DEFAULT_TASKS) {
      const budget = task.budgetMinutes * 60;
      expect(task.options).toContain(task.correct);
      expect(downtimeSeconds(task.correct, MONTH_SECONDS)).toBeLessThanOrEqual(budget);
      const cheaper = task.options.filter((value) => value < task.correct);
      for (const value of cheaper) {
        expect(downtimeSeconds(value, MONTH_SECONDS)).toBeGreaterThan(budget);
      }
      expect(checkSla(task, task.correct).correct).toBe(true);
    }
  });

  it('звенья цепочки заданы валидно, периоды и уровни не пусты', () => {
    for (const chainPart of DEFAULT_PARTS) {
      expect(chainPart.availability).toBeGreaterThan(0);
      expect(chainPart.availability).toBeLessThanOrEqual(100);
    }
    expect(PERIODS.length).toBeGreaterThan(0);
    expect(SLA_LEVELS[0]).toBe(99);
  });
});
