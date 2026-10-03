import { describe, expect, it } from 'vitest';
import {
  ALL_FLAGS,
  checkVerdict,
  countSolved,
  evaluateFlags,
  FLAG_LABELS,
  type EmailTask,
} from './logic';
import { DEFAULT_EMAILS } from './data';

const phish: EmailTask = {
  id: 'p',
  from: 'X <x@fake.site>',
  subject: 's',
  body: 'b',
  isPhishing: true,
  flags: ['domain', 'urgency'],
  explanation: 'Объяснение фишинга.',
};

const legit: EmailTask = {
  id: 'l',
  from: 'Y <y@real.kg>',
  subject: 's',
  body: 'b',
  isPhishing: false,
  flags: [],
  explanation: 'Объяснение настоящего.',
};

describe('checkVerdict', () => {
  it('верный вердикт по фишингу зовёт отмечать признаки', () => {
    const r = checkVerdict(phish, 'phish');
    expect(r.correct).toBe(true);
    expect(r.reason).toContain('признаки');
  });

  it('пропущенный фишинг объясняется', () => {
    const r = checkVerdict(phish, 'legit');
    expect(r.correct).toBe(false);
    expect(r.reason).toContain('Объяснение фишинга');
  });

  it('верный вердикт по настоящему письму подтверждается', () => {
    const r = checkVerdict(legit, 'legit');
    expect(r.correct).toBe(true);
    expect(r.reason).toContain('Объяснение настоящего');
  });

  it('ложная тревога мягко поправляется', () => {
    const r = checkVerdict(legit, 'phish');
    expect(r.correct).toBe(false);
    expect(r.reason).toContain('Перестраховка');
  });
});

describe('evaluateFlags', () => {
  it('все признаки точно — perfect', () => {
    const r = evaluateFlags(phish, ['domain', 'urgency']);
    expect(r.perfect).toBe(true);
    expect(r.missed).toEqual([]);
    expect(r.extra).toEqual([]);
  });

  it('упущенные перечисляются', () => {
    const r = evaluateFlags(phish, ['domain']);
    expect(r.perfect).toBe(false);
    expect(r.missed).toEqual(['urgency']);
    expect(r.reason).toContain('Упущено');
  });

  it('лишние перечисляются', () => {
    const r = evaluateFlags(phish, ['domain', 'urgency', 'creds']);
    expect(r.perfect).toBe(false);
    expect(r.extra).toEqual(['creds']);
    expect(r.reason).toContain('Лишнее');
  });

  it('пустой выбор — отдельная подсказка', () => {
    const r = evaluateFlags(phish, []);
    expect(r.perfect).toBe(false);
    expect(r.reason).toContain('ни одного');
  });

  it('у настоящего письма perfect невозможен (нет флагов)', () => {
    const r = evaluateFlags(legit, []);
    expect(r.perfect).toBe(false);
  });
});

describe('countSolved', () => {
  it('считает только верные вердикты', () => {
    const m = new Map([
      ['a', true],
      ['b', false],
      ['c', true],
    ]);
    expect(countSolved(m)).toBe(2);
    expect(countSolved(new Map())).toBe(0);
  });
});

describe('набор писем', () => {
  it('структура валидна: флаги из каталога, у настоящих их нет, у фишинга есть', () => {
    expect(DEFAULT_EMAILS.length).toBeGreaterThanOrEqual(6);
    for (const email of DEFAULT_EMAILS) {
      for (const f of email.flags) expect(ALL_FLAGS).toContain(f);
      if (email.isPhishing) expect(email.flags.length).toBeGreaterThan(0);
      else expect(email.flags).toEqual([]);
      expect(email.explanation.length).toBeGreaterThan(20);
      expect(checkVerdict(email, email.isPhishing ? 'phish' : 'legit').correct).toBe(true);
    }
  });

  it('есть и фишинг, и настоящие письма; у каждого флага есть подпись', () => {
    expect(DEFAULT_EMAILS.some((e) => e.isPhishing)).toBe(true);
    expect(DEFAULT_EMAILS.some((e) => !e.isPhishing)).toBe(true);
    for (const f of ALL_FLAGS) expect(FLAG_LABELS[f].length).toBeGreaterThan(5);
  });
});
