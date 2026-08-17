import { describe, expect, it } from 'vitest';
import { CORRECT_ORDER, OSI_LAYERS, checkStackOrder, layerByNumber } from './logic';
import { INITIAL_ORDER } from './data';

describe('OSI_LAYERS', () => {
  it('семь уровней с уникальными номерами 1..7', () => {
    expect(OSI_LAYERS).toHaveLength(7);
    const nums = OSI_LAYERS.map((l) => l.number);
    expect(new Set(nums).size).toBe(7);
    expect([...nums].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
  it('заданы сверху вниз: от L7 к L1', () => {
    expect(OSI_LAYERS.map((l) => l.number)).toEqual([7, 6, 5, 4, 3, 2, 1]);
  });
});

describe('CORRECT_ORDER', () => {
  it('равен 7..1', () => expect(CORRECT_ORDER).toEqual([7, 6, 5, 4, 3, 2, 1]));
});

describe('layerByNumber', () => {
  it('находит уровень по номеру', () => {
    expect(layerByNumber(3)?.ru).toBe('Сетевой');
    expect(layerByNumber(4)?.en).toBe('Transport');
  });
  it('вне диапазона → undefined', () => {
    expect(layerByNumber(0)).toBeUndefined();
    expect(layerByNumber(8)).toBeUndefined();
  });
});

describe('checkStackOrder', () => {
  it('правильный порядок — всё верно', () => {
    const r = checkStackOrder([7, 6, 5, 4, 3, 2, 1]);
    expect(r.correct).toBe(true);
    expect(r.correctSlots.every(Boolean)).toBe(true);
    expect(r.firstError).toBeNull();
  });
  it('перепутаны L3 и L4 — объясняет первую ошибку', () => {
    const r = checkStackOrder([7, 6, 5, 3, 4, 2, 1]);
    expect(r.correct).toBe(false);
    expect(r.correctSlots[3]).toBe(false);
    expect(r.firstError).toContain('Позиция 4');
    expect(r.firstError).toContain('Транспортный');
  });
  it('полностью перевёрнутый стек', () => {
    const r = checkStackOrder([1, 2, 3, 4, 5, 6, 7]);
    expect(r.correct).toBe(false);
    expect(r.firstError).toContain('Позиция 1');
  });
  it('стартовая раскладка ещё не решена', () => {
    expect(checkStackOrder(INITIAL_ORDER).correct).toBe(false);
  });
  it('неверная длина — не считается решённой', () => {
    expect(checkStackOrder([7, 6, 5]).correct).toBe(false);
  });
  it('несуществующий номер уровня не роняет проверку', () => {
    const r = checkStackOrder([99, 6, 5, 4, 3, 2, 1]);
    expect(r.correct).toBe(false);
    expect(r.firstError).toContain('Позиция 1');
  });
});
