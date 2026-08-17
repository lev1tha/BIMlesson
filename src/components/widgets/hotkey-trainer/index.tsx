'use client';

import * as React from 'react';
import { Check, Keyboard, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Panel } from '@/components/ui/card';
import { XpBadge } from '@/components/ui/xp-badge';
import { saveScore, useScore } from '@/lib/progress';
import { useGameStore } from '@/lib/store';
import { checkHotkey, isModifierKey, normalizeCombo, type HotkeyTask } from './logic';
import { DEFAULT_HOTKEYS } from './data';

const WIDGET_ID = 'hotkey-trainer';

export interface HotkeyTrainerProps {
  widgetId?: string;
  hotkeys?: HotkeyTask[];
}

function Kbd({ combo }: { combo: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      {combo.split('+').map((k, i) => (
        <React.Fragment key={k}>
          {i > 0 && <span className="text-fd-muted-foreground">+</span>}
          <kbd className="rounded border border-fd-border bg-fd-muted px-2 py-1 font-mono text-sm font-semibold shadow-sm">
            {k}
          </kbd>
        </React.Fragment>
      ))}
    </span>
  );
}

export function HotkeyTrainer({ widgetId = WIDGET_ID, hotkeys = DEFAULT_HOTKEYS }: HotkeyTrainerProps) {
  const awardXp = useGameStore((s) => s.awardXp);
  const score = useScore(widgetId);
  const [index, setIndex] = React.useState(0);
  const [done, setDone] = React.useState<ReadonlySet<string>>(() => new Set());
  const [feedback, setFeedback] = React.useState<{ pressed: string; correct: boolean } | null>(null);

  const task = hotkeys[index];
  const allDone = done.size === hotkeys.length;

  const awarded = React.useRef(false);
  React.useEffect(() => {
    if (allDone && !awarded.current) {
      awarded.current = true;
      saveScore(widgetId, 100);
      awardXp(30, 'hotkey-master');
    }
  }, [allDone, awardXp, widgetId]);

  const nextUndone = (from: number, doneSet: ReadonlySet<string>): number => {
    for (let step = 1; step <= hotkeys.length; step++) {
      const i = (from + step) % hotkeys.length;
      if (!doneSet.has(hotkeys[i].id)) return i;
    }
    return from;
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (isModifierKey(e.key)) return;
    e.preventDefault();
    const pressed = normalizeCombo({
      ctrl: e.ctrlKey,
      alt: e.altKey,
      shift: e.shiftKey,
      meta: e.metaKey,
      key: e.key,
    });
    const correct = checkHotkey(task, pressed);
    setFeedback({ pressed, correct });
    if (correct) {
      const newDone = new Set(done).add(task.id);
      setDone(newDone);
      if (newDone.size < hotkeys.length) setIndex(nextUndone(index, newDone));
    }
  };

  return (
    <Panel className="not-prose my-6 overflow-hidden">
      <header className="flex items-center justify-between gap-3 border-b border-fd-border bg-fd-muted/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-subject-lit/10 text-subject-lit">
            <Keyboard className="size-4" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-bold leading-tight">Горячие клавиши</p>
            <p className="text-xs text-fd-muted-foreground">
              освоено {done.size} / {hotkeys.length}
            </p>
          </div>
        </div>
        <XpBadge />
      </header>

      <div className="space-y-3 p-4">
        {allDone ? (
          <p
            role="status"
            className="flex items-center gap-2 rounded-lg border border-edu-ok/40 bg-edu-ok/10 p-3 text-sm font-semibold text-edu-ok"
          >
            <Check className="size-4" aria-hidden /> Все сочетания освоены! +30 XP
          </p>
        ) : (
          <div
            tabIndex={0}
            role="application"
            aria-label={`Тренажёр горячих клавиш. Действие: ${task.action}. Нажми нужное сочетание клавиш.`}
            onKeyDown={onKeyDown}
            className="cursor-text rounded-xl border-2 border-dashed border-fd-border bg-fd-background p-6 text-center outline-none focus-visible:border-fd-primary focus-visible:ring-2 focus-visible:ring-fd-ring"
          >
            <p className="text-xs text-fd-muted-foreground">Кликни сюда и нажми сочетание для действия</p>
            <p className="my-2 text-lg font-bold">{task.action}</p>
            <div className="flex items-center justify-center gap-1">
              <Kbd combo={task.combo} />
            </div>
          </div>
        )}

        <div aria-live="polite" className="min-h-5 text-center text-sm">
          {feedback &&
            (feedback.correct ? (
              <span className="inline-flex items-center gap-1.5 font-semibold text-edu-ok">
                <Check className="size-4" aria-hidden /> Верно: {feedback.pressed}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-edu-bad">
                <X className="size-4" aria-hidden /> Вы нажали {feedback.pressed} — нужно {task.combo}
              </span>
            ))}
        </div>

        <div className="flex flex-wrap justify-center gap-1.5">
          {hotkeys.map((h) => (
            <span
              key={h.id}
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-semibold',
                done.has(h.id) ? 'bg-edu-ok/10 text-edu-ok' : 'bg-fd-muted text-fd-muted-foreground',
              )}
            >
              {h.action}
            </span>
          ))}
        </div>
      </div>

      {score && score.attempts > 0 && (
        <footer className="border-t border-fd-border px-4 py-2 text-xs text-fd-muted-foreground">
          Лучший результат: {score.best} · попыток: {score.attempts}
        </footer>
      )}
    </Panel>
  );
}

export default HotkeyTrainer;
