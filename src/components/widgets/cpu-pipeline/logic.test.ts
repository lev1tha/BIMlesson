import { describe, expect, it } from 'vitest';
import {
  STAGES,
  STAGE_COUNT,
  checkPipelinedAnswer,
  pipelinedCycles,
  sequentialCycles,
  speedup,
  stageAt,
  type CycleTask,
} from './logic';

describe('STAGES', () => {
  it('четыре стадии с короткими именами', () => {
    expect(STAGE_COUNT).toBe(4);
    expect(STAGES.map((s) => s.short)).toEqual(['IF', 'ID', 'EX', 'WB']);
  });
});

describe('stageAt', () => {
  it('инструкция 0 проходит стадии 0..3 в такты 0..3', () => {
    expect(stageAt(0, 0)).toBe(0);
    expect(stageAt(0, 3)).toBe(3);
  });
  it('до входа и после выхода — null', () => {
    expect(stageAt(2, 1)).toBeNull(); // ещё не вошла
    expect(stageAt(0, 4)).toBeNull(); // уже вышла
  });
  it('инструкция 2 стартует на такт позже каждой предыдущей', () => {
    expect(stageAt(2, 2)).toBe(0);
    expect(stageAt(2, 5)).toBe(3);
  });
});

describe('подсчёт тактов', () => {
  it('конвейер: stages + (n − 1)', () => {
    expect(pipelinedCycles(1, 4)).toBe(4);
    expect(pipelinedCycles(5, 4)).toBe(8);
    expect(pipelinedCycles(10, 4)).toBe(13);
  });
  it('последовательно: n × stages', () => {
    expect(sequentialCycles(5, 4)).toBe(20);
    expect(sequentialCycles(1, 4)).toBe(4);
  });
  it('ноль инструкций → ноль тактов', () => {
    expect(pipelinedCycles(0)).toBe(0);
    expect(sequentialCycles(0)).toBe(0);
  });
});

describe('speedup', () => {
  it('5 инструкций, 4 стадии → ×2.5', () => {
    expect(speedup(5, 4)).toBe(2.5);
  });
  it('нет инструкций → 0', () => {
    expect(speedup(0)).toBe(0);
  });
});

describe('checkPipelinedAnswer', () => {
  const task: CycleTask = { id: 't', label: '', n: 5, stages: 4 };
  it('правильный ответ засчитан', () => {
    const r = checkPipelinedAnswer(task, 8);
    expect(r.correct).toBe(true);
    expect(r.reason).toContain('8');
  });
  it('неправильный ответ объясняет обе формулы', () => {
    const r = checkPipelinedAnswer(task, 20);
    expect(r.correct).toBe(false);
    expect(r.reason).toContain('20'); // последовательный вариант
    expect(r.reason).toContain('8'); // правильный ответ
  });
});
