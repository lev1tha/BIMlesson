import type { HotkeyTask } from './logic';

/** Базовые горячие клавиши, одинаковые в Windows (Ctrl) и macOS (Cmd). */
export const DEFAULT_HOTKEYS: HotkeyTask[] = [
  { id: 'copy', action: 'Копировать', combo: 'Ctrl+C' },
  { id: 'paste', action: 'Вставить', combo: 'Ctrl+V' },
  { id: 'cut', action: 'Вырезать', combo: 'Ctrl+X' },
  { id: 'undo', action: 'Отменить действие', combo: 'Ctrl+Z' },
  { id: 'save', action: 'Сохранить', combo: 'Ctrl+S' },
  { id: 'find', action: 'Найти на странице', combo: 'Ctrl+F' },
  { id: 'all', action: 'Выделить всё', combo: 'Ctrl+A' },
  { id: 'print', action: 'Печать документа', combo: 'Ctrl+P' },
  { id: 'bold', action: 'Сделать текст жирным', combo: 'Ctrl+B' },
  { id: 'redo', action: 'Вернуть отменённое (redo)', combo: 'Ctrl+Y' },
];
