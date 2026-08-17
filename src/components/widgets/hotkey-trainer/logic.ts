/**
 * Чистая логика тренажёра горячих клавиш — без React и без DOM.
 * Нормализация сочетания и проверка ответа; покрыто тестами.
 */

export interface KeyCombo {
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  meta: boolean;
  key: string;
}

/** Клавиши-модификаторы сами по себе не считаются ответом. */
export function isModifierKey(key: string): boolean {
  return key === 'Control' || key === 'Alt' || key === 'Shift' || key === 'Meta';
}

/**
 * Приводит нажатое сочетание к канону вида "Ctrl+Shift+Z".
 * Cmd (meta) на Mac считаем эквивалентом Ctrl — сочетания кроссплатформенные.
 */
export function normalizeCombo(c: KeyCombo): string {
  const parts: string[] = [];
  if (c.ctrl || c.meta) parts.push('Ctrl');
  if (c.alt) parts.push('Alt');
  if (c.shift) parts.push('Shift');
  const key = c.key.length === 1 ? c.key.toUpperCase() : c.key;
  parts.push(key);
  return parts.join('+');
}

export interface HotkeyTask {
  id: string;
  action: string;
  combo: string;
  note?: string;
}

export function checkHotkey(task: HotkeyTask, pressed: string): boolean {
  return pressed === task.combo;
}
