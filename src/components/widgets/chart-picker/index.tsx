'use client';

import * as React from 'react';
import { BarChart3, Check, ChevronRight, LineChart, PieChart, ScatterChart } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Panel } from '@/components/ui/card';
import { XpBadge } from '@/components/ui/xp-badge';
import { saveScore, useScore } from '@/lib/progress';
import { useGameStore } from '@/lib/store';
import { CHART_LABEL, checkChart, type ChartScenario, type ChartType } from './logic';
import { DEFAULT_SCENARIOS } from './data';

const WIDGET_ID = 'chart-picker';
const TYPES: ChartType[] = ['bar', 'line', 'pie', 'scatter'];
const ICON: Record<ChartType, LucideIcon> = {
  bar: BarChart3,
  line: LineChart,
  pie: PieChart,
  scatter: ScatterChart,
};

export interface ChartPickerProps {
  widgetId?: string;
  scenarios?: ChartScenario[];
}

export function ChartPicker({ widgetId = WIDGET_ID, scenarios = DEFAULT_SCENARIOS }: ChartPickerProps) {
  const awardXp = useGameStore((s) => s.awardXp);
  const score = useScore(widgetId);
  const [index, setIndex] = React.useState(0);
  const [done, setDone] = React.useState<ReadonlySet<string>>(() => new Set());
  const [chosen, setChosen] = React.useState<ChartType | null>(null);

  const scenario = scenarios[index];
  const result = chosen ? checkChart(scenario, chosen) : null;
  const allDone = done.size === scenarios.length;

  const awarded = React.useRef(false);
  React.useEffect(() => {
    if (allDone && !awarded.current) {
      awarded.current = true;
      saveScore(widgetId, 100);
      awardXp(30, 'chart-master');
    }
  }, [allDone, awardXp, widgetId]);

  const pick = (type: ChartType) => {
    setChosen(type);
    if (checkChart(scenario, type).correct && !done.has(scenario.id)) {
      setDone((prev) => new Set(prev).add(scenario.id));
    }
  };

  const next = () => {
    for (let step = 1; step <= scenarios.length; step++) {
      const i = (index + step) % scenarios.length;
      if (!done.has(scenarios[i].id)) {
        setIndex(i);
        setChosen(null);
        return;
      }
    }
  };

  return (
    <Panel className="not-prose my-6 overflow-hidden">
      <header className="flex items-center justify-between gap-3 border-b border-fd-border bg-fd-muted/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-subject-lit/10 text-subject-lit">
            <BarChart3 className="size-4" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-bold leading-tight">Какой график выбрать</p>
            <p className="text-xs text-fd-muted-foreground">
              решено {done.size} / {scenarios.length}
            </p>
          </div>
        </div>
        <XpBadge />
      </header>

      <div className="space-y-3 p-4">
        <p className="rounded-lg border border-fd-border bg-fd-background p-3 text-sm">
          <span className="font-semibold">Задача:</span> {scenario.goal}
        </p>

        <div className="grid grid-cols-2 gap-2">
          {TYPES.map((type) => {
            const Icon = ICON[type];
            const isChosen = chosen === type;
            const state = !isChosen ? 'idle' : result?.correct ? 'ok' : 'bad';
            return (
              <button
                key={type}
                type="button"
                onClick={() => pick(type)}
                aria-pressed={isChosen}
                className={cn(
                  'flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring',
                  state === 'ok'
                    ? 'border-edu-ok bg-edu-ok/10 text-edu-ok'
                    : state === 'bad'
                      ? 'border-edu-bad bg-edu-bad/10 text-edu-bad'
                      : 'border-fd-border hover:bg-fd-accent',
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                {CHART_LABEL[type]}
              </button>
            );
          })}
        </div>

        {result && (
          <p role="status" className={cn('text-sm', result.correct ? 'font-semibold text-edu-ok' : 'text-fd-muted-foreground')}>
            {result.reason}
          </p>
        )}

        {result?.correct && !allDone && (
          <button
            type="button"
            onClick={next}
            className="inline-flex items-center gap-1 rounded-md bg-fd-primary px-3 py-1.5 text-sm font-semibold text-fd-primary-foreground hover:bg-fd-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
          >
            Дальше <ChevronRight className="size-4" aria-hidden />
          </button>
        )}

        {allDone && (
          <p
            role="status"
            className="flex items-center gap-2 rounded-lg border border-edu-ok/40 bg-edu-ok/10 p-3 text-sm font-semibold text-edu-ok"
          >
            <Check className="size-4" aria-hidden /> Все задачи решены! +30 XP
          </p>
        )}
      </div>

      {score && score.attempts > 0 && (
        <footer className="border-t border-fd-border px-4 py-2 text-xs text-fd-muted-foreground">
          Лучший результат: {score.best} · попыток: {score.attempts}
        </footer>
      )}
    </Panel>
  );
}

export default ChartPicker;
