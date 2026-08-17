import { describe, expect, it } from 'vitest';
import { checkHotkey, isModifierKey, normalizeCombo, type HotkeyTask, type KeyCombo } from './logic';

const combo = (over: Partial<KeyCombo>): KeyCombo => ({
  ctrl: false,
  alt: false,
  shift: false,
  meta: false,
  key: '',
  ...over,
});

describe('isModifierKey', () => {
  it('распознаёт модификаторы', () => {
    expect(isModifierKey('Control')).toBe(true);
    expect(isModifierKey('Shift')).toBe(true);
    expect(isModifierKey('Meta')).toBe(true);
    expect(isModifierKey('Alt')).toBe(true);
  });
  it('обычные клавиши — нет', () => {
    expect(isModifierKey('c')).toBe(false);
    expect(isModifierKey('Enter')).toBe(false);
  });
});

describe('normalizeCombo', () => {
  it('Ctrl+C', () => {
    expect(normalizeCombo(combo({ ctrl: true, key: 'c' }))).toBe('Ctrl+C');
  });
  it('Cmd (meta) считается как Ctrl', () => {
    expect(normalizeCombo(combo({ meta: true, key: 'c' }))).toBe('Ctrl+C');
  });
  it('Ctrl+Shift+Z', () => {
    expect(normalizeCombo(combo({ ctrl: true, shift: true, key: 'Z' }))).toBe('Ctrl+Shift+Z');
  });
  it('Alt+F4 — многобуквенная клавиша не апперкейзится лишний раз', () => {
    expect(normalizeCombo(combo({ alt: true, key: 'F4' }))).toBe('Alt+F4');
  });
  it('одиночная буква без модификаторов', () => {
    expect(normalizeCombo(combo({ key: 'a' }))).toBe('A');
  });
});

describe('checkHotkey', () => {
  const task: HotkeyTask = { id: 'copy', action: 'Копировать', combo: 'Ctrl+C' };
  it('верное сочетание', () => expect(checkHotkey(task, 'Ctrl+C')).toBe(true));
  it('неверное сочетание', () => expect(checkHotkey(task, 'Ctrl+V')).toBe(false));
});
