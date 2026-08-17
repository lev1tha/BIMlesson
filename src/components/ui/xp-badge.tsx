'use client';

import { Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useGameStore, useHydrateGame } from '@/lib/store';

/** Бейдж опыта: гидрируется из lib/progress.ts и живёт в сторе Zustand. Общий для всех виджетов. */
export function XpBadge() {
  useHydrateGame();
  const xp = useGameStore((s) => s.xp);
  return (
    <Badge tone="accent">
      <Zap className="size-3" aria-hidden />
      <span aria-label={`Опыт: ${xp} XP`}>{xp} XP</span>
    </Badge>
  );
}
