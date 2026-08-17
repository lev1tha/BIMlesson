'use client';

import { useSyncExternalStore } from 'react';

/**
 * Единственная точка доступа к localStorage (CLAUDE.md → «Прогресс»).
 *
 * Ключи версионированы префиксом `bim:v1`. Меняешь форму данных — поднимай версию
 * и пиши миграцию, не ломай прогресс студентам посреди семестра.
 *
 * SSR-безопасно: на сервере снапшот всегда пустой, реальные данные подтягиваются
 * после гидратации через `useSyncExternalStore`. Снапшоты кэшируются по «сырой»
 * строке — это держит ссылочную стабильность и не даёт бесконечный ре-рендер.
 */

const VERSION = 'v1';
const PREFIX = `bim:${VERSION}`;

export type LessonStatus = 'not-started' | 'in-progress' | 'done';

export interface LessonProgress {
  status: LessonStatus;
  updatedAt: number;
}

export interface WidgetScore {
  best: number;
  attempts: number;
  updatedAt: number;
}

interface XpState {
  total: number;
  updatedAt: number;
}

interface AchievementsState {
  unlocked: string[];
  updatedAt: number;
}

export const progressKeys = {
  lesson: (subject: string, slug: string) => `${PREFIX}:progress:${subject}:${slug}`,
  score: (widgetId: string) => `${PREFIX}:score:${widgetId}`,
  xp: () => `${PREFIX}:xp`,
  achievements: () => `${PREFIX}:achievements`,
};

// --- подписки: локальные записи + синхронизация между вкладками ---
const listeners = new Set<() => void>();

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key.startsWith(PREFIX)) onChange();
  };
  if (typeof window !== 'undefined') window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(onChange);
    if (typeof window !== 'undefined') window.removeEventListener('storage', onStorage);
  };
}

function notify(): void {
  for (const listener of listeners) listener();
}

// --- кэш снапшотов ради ссылочной стабильности useSyncExternalStore ---
const snapshotCache = new Map<string, { raw: string | null; value: unknown }>();
const EMPTY_STRING_ARRAY: readonly string[] = [];

function readRaw(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function read<T>(key: string): T | null {
  const raw = readRaw(key);
  const cached = snapshotCache.get(key);
  if (cached && cached.raw === raw) return cached.value as T | null;

  let value: T | null = null;
  if (raw !== null) {
    try {
      value = JSON.parse(raw) as T;
    } catch {
      value = null;
    }
  }
  snapshotCache.set(key, { raw, value });
  return value;
}

function write<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = JSON.stringify(value);
    window.localStorage.setItem(key, raw);
    snapshotCache.set(key, { raw, value });
  } catch {
    // приватный режим / переполнение квоты — молча игнорируем
  }
  notify();
}

// --- очки виджета ---
export function getScore(widgetId: string): WidgetScore | null {
  return read<WidgetScore>(progressKeys.score(widgetId));
}

export function saveScore(widgetId: string, score: number): WidgetScore {
  const key = progressKeys.score(widgetId);
  const prev = read<WidgetScore>(key);
  const next: WidgetScore = {
    best: Math.max(score, prev?.best ?? 0),
    attempts: (prev?.attempts ?? 0) + 1,
    updatedAt: Date.now(),
  };
  write(key, next);
  return next;
}

export function useScore(widgetId: string): WidgetScore | null {
  const key = progressKeys.score(widgetId);
  return useSyncExternalStore(
    subscribe,
    () => read<WidgetScore>(key),
    () => null,
  );
}

// --- статус лекции ---
export function getLessonProgress(subject: string, slug: string): LessonProgress | null {
  return read<LessonProgress>(progressKeys.lesson(subject, slug));
}

export function setLessonStatus(subject: string, slug: string, status: LessonStatus): void {
  write(progressKeys.lesson(subject, slug), { status, updatedAt: Date.now() } satisfies LessonProgress);
}

export function useLessonProgress(subject: string, slug: string): LessonProgress | null {
  const key = progressKeys.lesson(subject, slug);
  return useSyncExternalStore(
    subscribe,
    () => read<LessonProgress>(key),
    () => null,
  );
}

// --- XP ---
export function getXp(): number {
  return read<XpState>(progressKeys.xp())?.total ?? 0;
}

export function addXp(delta: number): number {
  const key = progressKeys.xp();
  const total = (read<XpState>(key)?.total ?? 0) + delta;
  write(key, { total, updatedAt: Date.now() } satisfies XpState);
  return total;
}

export function useXp(): number {
  return useSyncExternalStore(
    subscribe,
    () => read<XpState>(progressKeys.xp())?.total ?? 0,
    () => 0,
  );
}

// --- достижения ---
export function getAchievements(): readonly string[] {
  return read<AchievementsState>(progressKeys.achievements())?.unlocked ?? EMPTY_STRING_ARRAY;
}

export function unlockAchievement(id: string): readonly string[] {
  const key = progressKeys.achievements();
  const current = read<AchievementsState>(key)?.unlocked ?? [];
  if (current.includes(id)) return current;
  const unlocked = [...current, id];
  write(key, { unlocked, updatedAt: Date.now() } satisfies AchievementsState);
  return unlocked;
}
