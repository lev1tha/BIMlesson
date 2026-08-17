'use client';

import { useEffect } from 'react';
import { create } from 'zustand';
import { addXp, getAchievements, getXp, unlockAchievement } from './progress';

/**
 * Клиентский стор геймификации (XP, ачивки, задел под дерево навыков).
 * Источник истины в памяти, но любая запись на диск идёт ТОЛЬКО через
 * `lib/progress.ts` — прямого localStorage в сторе нет (CLAUDE.md).
 * На сервере стор инициализируется нулями; реальные значения подтягиваются
 * в `useHydrateGame()` после гидратации.
 */

const EMPTY: readonly string[] = [];

interface GameState {
  xp: number;
  achievements: readonly string[];
  hydrated: boolean;
  hydrate: () => void;
  awardXp: (amount: number, achievement?: string) => void;
}

export const useGameStore = create<GameState>()((set, get) => ({
  xp: 0,
  achievements: EMPTY,
  hydrated: false,
  hydrate: () => {
    if (get().hydrated) return;
    set({ xp: getXp(), achievements: getAchievements(), hydrated: true });
  },
  awardXp: (amount, achievement) => {
    const xp = addXp(amount);
    const achievements = achievement ? unlockAchievement(achievement) : get().achievements;
    set({ xp, achievements });
  },
}));

/** Подтягивает XP/ачивки из localStorage один раз после монтирования. */
export function useHydrateGame(): void {
  const hydrate = useGameStore((state) => state.hydrate);
  useEffect(() => {
    hydrate();
  }, [hydrate]);
}
