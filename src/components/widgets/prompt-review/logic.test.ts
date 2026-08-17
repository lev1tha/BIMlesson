import { describe, expect, it } from 'vitest';
import { reviewPrompt } from './logic';

describe('reviewPrompt', () => {
  it('пустой промпт → 0 и подсказка написать', () => {
    const r = reviewPrompt('   ');
    expect(r.score).toBe(0);
    expect(r.summary).toContain('Пустой');
  });

  it('короткая заготовка без критериев → низкий балл', () => {
    const r = reviewPrompt('сделай отчёт');
    expect(r.score).toBeLessThanOrEqual(1);
    expect(r.summary).toContain('Заготовка');
  });

  it('средний промпт (контекст + формат) → 2–3 балла', () => {
    const r = reviewPrompt('Напиши пост для инстаграма списком');
    expect(r.score).toBeGreaterThanOrEqual(2);
    expect(r.score).toBeLessThanOrEqual(3);
    expect(r.summary).toContain('есть куда расти');
  });

  it('сильный промпт хитует все критерии', () => {
    const r = reviewPrompt(
      'Ты — опытный маркетолог. Напиши для аудитории малого бизнеса пост в виде списка из 5 пунктов, объёмом не более 100 слов, избегай канцелярита.',
    );
    expect(r.score).toBe(r.max);
    expect(r.summary).toContain('Сильный');
    expect(r.criteria.every((c) => c.ok)).toBe(true);
  });

  it('каждый критерий имеет подсказку и метку', () => {
    const r = reviewPrompt('тест');
    expect(r.criteria).toHaveLength(5);
    for (const c of r.criteria) {
      expect(c.label.length).toBeGreaterThan(0);
      expect(c.tip.length).toBeGreaterThan(0);
    }
  });
});
