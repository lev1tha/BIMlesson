import { describe, expect, it } from 'vitest';
import {
  ALIGN_OPTIONS,
  DIRECTION_OPTIONS,
  JUSTIFY_OPTIONS,
  checkFlexAnswer,
  toCss,
  type FlexState,
} from './logic';

const base: FlexState = { direction: 'row', justify: 'center', align: 'center' };

describe('наборы значений', () => {
  it('содержат ожидаемые опции', () => {
    expect(DIRECTION_OPTIONS).toContain('column');
    expect(JUSTIFY_OPTIONS).toContain('space-between');
    expect(ALIGN_OPTIONS).toContain('stretch');
  });
});

describe('checkFlexAnswer', () => {
  it('полное совпадение — верно', () => {
    const r = checkFlexAnswer(base, { ...base });
    expect(r.correct).toBe(true);
  });
  it('отличается направление', () => {
    const r = checkFlexAnswer(base, { ...base, direction: 'column' });
    expect(r.correct).toBe(false);
    expect(r.reason).toContain('flex-direction');
  });
  it('отличается justify', () => {
    const r = checkFlexAnswer(base, { ...base, justify: 'flex-end' });
    expect(r.correct).toBe(false);
    expect(r.reason).toContain('justify-content');
  });
  it('отличается align', () => {
    const r = checkFlexAnswer(base, { ...base, align: 'stretch' });
    expect(r.correct).toBe(false);
    expect(r.reason).toContain('align-items');
  });
  it('несколько отличий перечислены', () => {
    const r = checkFlexAnswer(base, { direction: 'column', justify: 'flex-end', align: 'stretch' });
    expect(r.correct).toBe(false);
    expect(r.reason).toContain('flex-direction');
    expect(r.reason).toContain('justify-content');
    expect(r.reason).toContain('align-items');
  });
});

describe('toCss', () => {
  it('собирает валидный CSS', () => {
    const css = toCss(base);
    expect(css).toContain('display: flex;');
    expect(css).toContain('justify-content: center;');
    expect(css).toContain('align-items: center;');
  });
});
