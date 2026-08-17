import { describe, expect, it } from 'vitest';
import {
  checkRaid,
  evaluateRaid,
  formatTb,
  RAID_INFO,
  RAID_ORDER,
  type RaidLevel,
  type RaidTask,
} from './logic';
import { DEFAULT_TASKS, DISK_SIZES_TB } from './data';

describe('evaluateRaid: валидация', () => {
  it('нулевой и отрицательный объём диска', () => {
    expect(evaluateRaid({ level: 'RAID0', disks: 2, sizeTb: 0 }).valid).toBe(false);
    expect(evaluateRaid({ level: 'RAID0', disks: 2, sizeTb: -1 }).valid).toBe(false);
    expect(evaluateRaid({ level: 'RAID0', disks: 2, sizeTb: Number.NaN }).valid).toBe(false);
  });

  it('меньше минимума дисков для уровня', () => {
    const r5 = evaluateRaid({ level: 'RAID5', disks: 2, sizeTb: 4 });
    expect(r5.valid).toBe(false);
    expect(r5.error).toContain('минимум 3');
    const r6 = evaluateRaid({ level: 'RAID6', disks: 3, sizeTb: 4 });
    expect(r6.valid).toBe(false);
    expect(r6.error).toContain('минимум 4');
    expect(evaluateRaid({ level: 'RAID1', disks: 1, sizeTb: 4 }).valid).toBe(false);
    expect(evaluateRaid({ level: 'RAID0', disks: Number.NaN, sizeTb: 4 }).valid).toBe(false);
  });

  it('RAID 10 требует чётного числа дисков', () => {
    const odd = evaluateRaid({ level: 'RAID10', disks: 5, sizeTb: 2 });
    expect(odd.valid).toBe(false);
    expect(odd.error).toContain('чётным');
    expect(evaluateRaid({ level: 'RAID10', disks: 6, sizeTb: 2 }).valid).toBe(true);
  });

  it('дробное число дисков округляется вниз', () => {
    const r = evaluateRaid({ level: 'RAID0', disks: 3.9, sizeTb: 1 });
    expect(r.valid).toBe(true);
    expect(r.rawTb).toBe(3);
  });
});

describe('evaluateRaid: ёмкость и отказоустойчивость', () => {
  it('RAID 0: весь объём, нулевая защита', () => {
    const r = evaluateRaid({ level: 'RAID0', disks: 4, sizeTb: 2 });
    expect(r.capacityTb).toBe(8);
    expect(r.overheadTb).toBe(0);
    expect(r.tolerance).toBe(0);
    expect(r.explanation).toContain('отказ ЛЮБОГО');
  });

  it('RAID 1: объём одного диска, живёт до последнего', () => {
    const r = evaluateRaid({ level: 'RAID1', disks: 3, sizeTb: 4 });
    expect(r.capacityTb).toBe(4);
    expect(r.rawTb).toBe(12);
    expect(r.overheadTb).toBe(8);
    expect(r.tolerance).toBe(2);
  });

  it('RAID 5: минус один диск, держит один отказ', () => {
    const r = evaluateRaid({ level: 'RAID5', disks: 4, sizeTb: 4 });
    expect(r.capacityTb).toBe(12);
    expect(r.overheadTb).toBe(4);
    expect(r.tolerance).toBe(1);
  });

  it('RAID 6: минус два диска, держит два отказа', () => {
    const r = evaluateRaid({ level: 'RAID6', disks: 6, sizeTb: 8 });
    expect(r.capacityTb).toBe(32);
    expect(r.overheadTb).toBe(16);
    expect(r.tolerance).toBe(2);
  });

  it('RAID 10: половина объёма, 1 гарантированно и до n/2 в лучшем случае', () => {
    const r = evaluateRaid({ level: 'RAID10', disks: 6, sizeTb: 2 });
    expect(r.capacityTb).toBe(6);
    expect(r.tolerance).toBe(1);
    expect(r.toleranceMax).toBe(3);
  });

  it('у остальных уровней toleranceMax не задан', () => {
    expect(evaluateRaid({ level: 'RAID5', disks: 3, sizeTb: 1 }).toleranceMax).toBeUndefined();
  });
});

describe('formatTb', () => {
  it('целые без хвоста, дробные с одним знаком', () => {
    expect(formatTb(6)).toBe('6 ТБ');
    expect(formatTb(1.5)).toBe('1.5 ТБ');
    expect(formatTb(2.04)).toBe('2 ТБ');
  });
});

describe('checkRaid', () => {
  const task: RaidTask = {
    id: 't',
    goal: 'цель',
    options: ['RAID0', 'RAID1', 'RAID5'],
    correct: 'RAID5',
    why: 'потому что баланс.',
    wrongReasons: { RAID0: 'нет защиты.' },
  };

  it('правильный выбор подтверждается с объяснением', () => {
    const r = checkRaid(task, 'RAID5');
    expect(r.correct).toBe(true);
    expect(r.reason).toContain('потому что баланс');
  });

  it('типичная ошибка получает специальное объяснение', () => {
    const r = checkRaid(task, 'RAID0');
    expect(r.correct).toBe(false);
    expect(r.reason).toBe('нет защиты.');
  });

  it('прочие ошибки получают общее объяснение с правильным ответом', () => {
    const r = checkRaid(task, 'RAID1');
    expect(r.correct).toBe(false);
    expect(r.reason).toContain('RAID 5');
    expect(r.reason).toContain('потому что баланс');
  });
});

describe('наборы данных', () => {
  it('в каждой задаче correct входит в options, wrongReasons не описывают correct', () => {
    for (const task of DEFAULT_TASKS) {
      expect(task.options).toContain(task.correct);
      expect(new Set(task.options).size).toBe(task.options.length);
      for (const key of Object.keys(task.wrongReasons ?? {})) {
        expect(key).not.toBe(task.correct);
        expect(task.options).toContain(key as RaidLevel);
      }
      expect(checkRaid(task, task.correct).correct).toBe(true);
    }
  });

  it('размеры дисков положительные, порядок уровней согласован со справочником', () => {
    for (const size of DISK_SIZES_TB) expect(size).toBeGreaterThan(0);
    for (const level of RAID_ORDER) expect(RAID_INFO[level].minDisks).toBeGreaterThanOrEqual(2);
  });
});
