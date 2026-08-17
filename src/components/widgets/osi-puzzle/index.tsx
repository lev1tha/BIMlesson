'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Panel } from '@/components/ui/card';
import { XpBadge } from '@/components/ui/xp-badge';
import { saveScore, useScore } from '@/lib/progress';
import { useGameStore } from '@/lib/store';
import { checkStackOrder, layerByNumber, OSI_LAYERS } from './logic';
import { INITIAL_ORDER } from './data';

const WIDGET_ID = 'osi-puzzle';
type Mode = 'stack' | 'build';

export interface OsiPuzzleProps {
  widgetId?: string;
  initialOrder?: readonly number[];
}

function StackView() {
  const [open, setOpen] = React.useState<number | null>(7);
  return (
    <ol className="space-y-1.5">
      {OSI_LAYERS.map((layer) => {
        const isOpen = open === layer.number;
        return (
          <li key={layer.number}>
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : layer.number)}
              className="flex w-full items-center gap-3 rounded-lg border border-fd-border bg-fd-background px-3 py-2 text-left transition-colors hover:bg-fd-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-md bg-subject-cs/10 font-mono text-xs font-bold text-subject-cs">
                L{layer.number}
              </span>
              <span className="flex-1">
                <span className="text-sm font-semibold">{layer.ru}</span>
                <span className="ml-2 text-xs text-fd-muted-foreground">{layer.en}</span>
              </span>
              <span className="hidden rounded-full bg-fd-muted px-2 py-0.5 text-xs text-fd-muted-foreground sm:inline">
                {layer.pdu}
              </span>
              <ChevronDown
                className={cn('size-4 shrink-0 text-fd-muted-foreground transition-transform', isOpen && 'rotate-180')}
                aria-hidden
              />
            </button>
            {isOpen && (
              <div className="mt-1 space-y-1 rounded-lg border border-fd-border/60 bg-fd-muted/20 px-3 py-2 text-sm">
                <p>
                  <span className="text-fd-muted-foreground">PDU:</span> {layer.pdu} ·{' '}
                  <span className="text-fd-muted-foreground">добавляет</span> {layer.adds}
                </p>
                <p>
                  <span className="text-fd-muted-foreground">Примеры:</span> {layer.examples.join(', ')}
                </p>
                <p className="text-fd-muted-foreground">{layer.business}</p>
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function BuildView({ widgetId, initialOrder }: { widgetId: string; initialOrder: readonly number[] }) {
  const reduce = useReducedMotion();
  const awardXp = useGameStore((s) => s.awardXp);
  const [order, setOrder] = React.useState<number[]>(() => [...initialOrder]);

  const check = checkStackOrder(order);

  const awarded = React.useRef(false);
  React.useEffect(() => {
    if (check.correct && !awarded.current) {
      awarded.current = true;
      saveScore(widgetId, 100);
      awardXp(40, 'osi-master');
    }
  }, [check.correct, awardXp, widgetId]);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= order.length) return;
    setOrder((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-fd-muted-foreground">
        Сообщение покидает браузер и идёт вниз по стеку. Расставь уровни в порядке инкапсуляции: сверху{' '}
        <strong className="text-fd-foreground">Прикладной (L7)</strong>, снизу{' '}
        <strong className="text-fd-foreground">Физический (L1)</strong>.
      </p>
      <ol className="space-y-1.5">
        {order.map((num, i) => {
          const layer = layerByNumber(num);
          if (!layer) return null;
          const ok = check.correctSlots[i];
          return (
            <motion.li
              key={num}
              layout={reduce ? false : 'position'}
              transition={{ duration: 0.2 }}
              className={cn(
                'flex items-center gap-2 rounded-lg border px-3 py-2',
                ok ? 'border-edu-ok bg-edu-ok/10' : 'border-fd-border bg-fd-background',
              )}
            >
              <span
                className={cn(
                  'grid size-7 shrink-0 place-items-center rounded-md font-mono text-xs font-bold',
                  ok ? 'bg-edu-ok/15 text-edu-ok' : 'bg-fd-muted text-fd-muted-foreground',
                )}
              >
                L{layer.number}
              </span>
              <span className="min-w-0 flex-1">
                <span className="text-sm font-semibold">{layer.ru}</span>
                <span className="ml-2 hidden text-xs text-fd-muted-foreground sm:inline">{layer.pdu}</span>
              </span>
              {ok && <Check className="size-4 shrink-0 text-edu-ok" aria-hidden />}
              <span className="flex shrink-0 flex-col">
                <button
                  type="button"
                  onClick={() => move(i, i - 1)}
                  disabled={i === 0}
                  aria-label={`Поднять «${layer.ru}» выше`}
                  className="grid size-6 place-items-center rounded text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring disabled:opacity-30"
                >
                  <ChevronUp className="size-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, i + 1)}
                  disabled={i === order.length - 1}
                  aria-label={`Опустить «${layer.ru}» ниже`}
                  className="grid size-6 place-items-center rounded text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring disabled:opacity-30"
                >
                  <ChevronDown className="size-4" aria-hidden />
                </button>
              </span>
            </motion.li>
          );
        })}
      </ol>
      <div aria-live="polite" className="min-h-5">
        {check.correct ? (
          <p
            role="status"
            className="flex items-center gap-2 rounded-lg border border-edu-ok/40 bg-edu-ok/10 p-2.5 text-sm font-semibold text-edu-ok"
          >
            <Check className="size-4" aria-hidden /> Стек собран верно! +40 XP
          </p>
        ) : (
          <p className="text-xs text-fd-muted-foreground">{check.firstError}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => setOrder([...initialOrder])}
        className="text-xs font-semibold text-fd-muted-foreground underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
      >
        Сбросить
      </button>
    </div>
  );
}

export function OsiPuzzle({ widgetId = WIDGET_ID, initialOrder = INITIAL_ORDER }: OsiPuzzleProps) {
  const [mode, setMode] = React.useState<Mode>('stack');
  const score = useScore(widgetId);

  return (
    <Panel className="not-prose my-6 overflow-hidden">
      <header className="flex items-center justify-between gap-3 border-b border-fd-border bg-fd-muted/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-subject-cs/10 text-subject-cs">
            <Layers className="size-4" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-bold leading-tight">Модель OSI</p>
            <p className="text-xs text-fd-muted-foreground">7 уровней · инкапсуляция</p>
          </div>
        </div>
        <XpBadge />
      </header>

      <div className="flex gap-1 border-b border-fd-border p-1.5" role="group" aria-label="Режим тренажёра">
        {(['stack', 'build'] as const).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            onClick={() => setMode(m)}
            className={cn(
              'flex-1 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring',
              mode === m
                ? 'bg-fd-primary text-fd-primary-foreground'
                : 'text-fd-muted-foreground hover:bg-fd-accent',
            )}
          >
            {m === 'stack' ? 'Стек' : 'Собери пакет'}
          </button>
        ))}
      </div>

      <div className="p-4">
        {mode === 'stack' ? <StackView /> : <BuildView widgetId={widgetId} initialOrder={initialOrder} />}
      </div>

      {score && score.attempts > 0 && (
        <footer className="border-t border-fd-border px-4 py-2 text-xs text-fd-muted-foreground">
          Лучший результат: {score.best} · попыток: {score.attempts}
        </footer>
      )}
    </Panel>
  );
}

export default OsiPuzzle;
