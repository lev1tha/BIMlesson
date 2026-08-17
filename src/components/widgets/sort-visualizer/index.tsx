'use client';

import * as React from 'react';
import { BarChart3, Pause, Play, RotateCcw, Shuffle, StepForward } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Panel } from '@/components/ui/card';
import { bubbleSortSteps, countComparisons, countSwaps } from './logic';
import { DEFAULT_ARRAY } from './data';

export interface SortVisualizerProps {
  values?: number[];
}

export function SortVisualizer({ values = DEFAULT_ARRAY }: SortVisualizerProps) {
  const [array, setArray] = React.useState<number[]>(values);
  const steps = React.useMemo(() => bubbleSortSteps(array), [array]);
  const [current, setCurrent] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);

  const lastIndex = steps.length - 1;
  const active = playing && current < lastIndex;

  React.useEffect(() => {
    if (!playing || current >= lastIndex) return;
    const id = setInterval(() => setCurrent((c) => Math.min(lastIndex, c + 1)), 450);
    return () => clearInterval(id);
  }, [playing, current, lastIndex]);

  const step = steps[current];
  const max = Math.max(...step.array, 1);
  const comparisonsSoFar = countComparisons(steps.slice(0, current + 1));
  const swapsSoFar = countSwaps(steps.slice(0, current + 1));

  const play = () => {
    if (current >= lastIndex) setCurrent(0);
    setPlaying(true);
  };

  const shuffle = () => {
    const a = [...array];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
    }
    setArray(a);
    setCurrent(0);
    setPlaying(false);
  };

  return (
    <Panel className="not-prose my-6 overflow-hidden">
      <header className="flex items-center justify-between gap-3 border-b border-fd-border bg-fd-muted/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-subject-sp/10 text-subject-sp">
            <BarChart3 className="size-4" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-bold leading-tight">Сортировка пузырьком</p>
            <p className="text-xs text-fd-muted-foreground">шаг за шагом</p>
          </div>
        </div>
      </header>

      <div className="space-y-3 p-4">
        <div
          className="flex h-40 items-end gap-1.5"
          role="img"
          aria-label={`Сортировка: шаг ${current} из ${lastIndex}, массив ${step.array.join(', ')}`}
        >
          {step.array.map((v, idx) => {
            const isComparing = step.comparing !== null && (idx === step.comparing[0] || idx === step.comparing[1]);
            const isSortedTail = idx >= step.sortedFrom;
            return (
              <div key={idx} className="flex flex-1 flex-col items-center justify-end gap-1">
                <div
                  style={{ height: `${(v / max) * 100}%` }}
                  className={cn(
                    'w-full rounded-t transition-[height,background-color] duration-200 motion-reduce:transition-none',
                    isComparing ? 'bg-edu-warn' : isSortedTail ? 'bg-edu-ok' : 'bg-subject-sp',
                  )}
                />
                <span className="font-mono text-xs text-fd-muted-foreground">{v}</span>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setPlaying(false);
              setCurrent(0);
            }}
            className="inline-flex items-center gap-1.5 rounded-md border border-fd-border px-2.5 py-1.5 text-xs font-semibold hover:bg-fd-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
          >
            <RotateCcw className="size-3.5" aria-hidden /> Сброс
          </button>
          <button
            type="button"
            onClick={() => setCurrent((c) => Math.min(lastIndex, c + 1))}
            disabled={current >= lastIndex}
            className="inline-flex items-center gap-1.5 rounded-md border border-fd-border px-2.5 py-1.5 text-xs font-semibold hover:bg-fd-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring disabled:opacity-40"
          >
            <StepForward className="size-3.5" aria-hidden /> Шаг
          </button>
          <button
            type="button"
            onClick={() => (active ? setPlaying(false) : play())}
            className="inline-flex items-center gap-1.5 rounded-md bg-fd-primary px-2.5 py-1.5 text-xs font-semibold text-fd-primary-foreground hover:bg-fd-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
          >
            {active ? <Pause className="size-3.5" aria-hidden /> : <Play className="size-3.5" aria-hidden />}
            {active ? 'Пауза' : 'Прогнать'}
          </button>
          <button
            type="button"
            onClick={shuffle}
            className="inline-flex items-center gap-1.5 rounded-md border border-fd-border px-2.5 py-1.5 text-xs font-semibold hover:bg-fd-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
          >
            <Shuffle className="size-3.5" aria-hidden /> Перемешать
          </button>
          <span className="ml-auto font-mono text-xs text-fd-muted-foreground">
            шаг {current} / {lastIndex}
          </span>
        </div>

        <dl className="grid grid-cols-2 gap-2 text-center text-sm">
          <div className="rounded-lg border border-fd-border bg-fd-background p-2">
            <dt className="text-xs text-fd-muted-foreground">Сравнений</dt>
            <dd className="font-mono font-bold">{comparisonsSoFar}</dd>
          </div>
          <div className="rounded-lg border border-fd-border bg-fd-background p-2">
            <dt className="text-xs text-fd-muted-foreground">Перестановок</dt>
            <dd className="font-mono font-bold">{swapsSoFar}</dd>
          </div>
        </dl>
      </div>
    </Panel>
  );
}

export default SortVisualizer;
