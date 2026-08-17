'use client';

import * as React from 'react';
import { Activity, Check, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Panel } from '@/components/ui/card';
import { XpBadge } from '@/components/ui/xp-badge';
import { saveScore, useScore } from '@/lib/progress';
import { useGameStore } from '@/lib/store';
import {
  checkSla,
  downtimeSeconds,
  evaluateChain,
  formatDuration,
  formatPercent,
  MONTH_SECONDS,
  PERIODS,
  SLA_LEVELS,
  type ChainItem,
  type ChainPart,
  type SlaTask,
} from './logic';
import { DEFAULT_PARTS, DEFAULT_TASKS } from './data';

const WIDGET_ID = 'uptime-calculator';
type Mode = 'levels' | 'chain' | 'task';

const MODE_LABEL: Record<Mode, string> = {
  levels: 'Девятки',
  chain: 'Цепочка',
  task: 'Задачи',
};

function LevelsView() {
  const [level, setLevel] = React.useState(99.9);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Уровень доступности">
        {SLA_LEVELS.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={level === value}
            onClick={() => setLevel(value)}
            className={cn(
              'rounded-md border px-2.5 py-1.5 font-mono text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring',
              level === value
                ? 'border-subject-cs bg-subject-cs/10 text-subject-cs'
                : 'border-fd-border hover:bg-fd-accent',
            )}
          >
            {formatPercent(value)}
          </button>
        ))}
      </div>

      <ul className="space-y-1.5">
        {PERIODS.map((period) => (
          <li
            key={period.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-fd-border bg-fd-background px-3 py-2"
          >
            <span className="text-sm text-fd-muted-foreground">{period.label}</span>
            <span className="font-mono text-sm font-bold">
              {formatDuration(downtimeSeconds(level, period.seconds))}
            </span>
          </li>
        ))}
      </ul>

      <p className="text-xs text-fd-muted-foreground">
        Это разрешённое время простоя — сколько сервис может не работать, не нарушив договор.
        Каждая новая девятка сокращает простой примерно в 10 раз и заметно повышает цену.
      </p>
    </div>
  );
}

function ChainView({ parts }: { parts: ChainPart[] }) {
  const [items, setItems] = React.useState<ChainItem[]>(() =>
    parts.map((part) => ({ part, enabled: true, redundant: false })),
  );

  const result = evaluateChain(items);
  const toggle = (id: string, key: 'enabled' | 'redundant') =>
    setItems((prev) =>
      prev.map((item) => (item.part.id === id ? { ...item, [key]: !item[key] } : item)),
    );

  return (
    <div className="space-y-3">
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li
            key={item.part.id}
            className={cn(
              'rounded-lg border px-3 py-2 transition-colors',
              item.enabled ? 'border-fd-border bg-fd-background' : 'border-fd-border/60 bg-fd-muted/30',
            )}
          >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <button
                type="button"
                aria-pressed={item.enabled}
                onClick={() => toggle(item.part.id, 'enabled')}
                className={cn(
                  'min-w-0 flex-1 text-left text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring',
                  item.enabled ? '' : 'text-fd-muted-foreground line-through',
                )}
              >
                {item.part.name}
              </button>
              <span className="font-mono text-xs text-fd-muted-foreground">
                {formatPercent(item.part.availability)}
              </span>
              <button
                type="button"
                aria-pressed={item.redundant}
                disabled={!item.enabled}
                onClick={() => toggle(item.part.id, 'redundant')}
                className={cn(
                  'rounded-md border px-2 py-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring disabled:opacity-40',
                  item.redundant
                    ? 'border-edu-ok bg-edu-ok/10 text-edu-ok'
                    : 'border-fd-border hover:bg-fd-accent',
                )}
              >
                резерв ×2
              </button>
            </div>
            <p className="mt-0.5 text-xs text-fd-muted-foreground">{item.part.hint}</p>
          </li>
        ))}
      </ul>

      <div
        role="status"
        className="rounded-lg border border-subject-cs/40 bg-subject-cs/5 p-3 text-sm"
      >
        <p className="font-semibold">
          Доступность всей системы: {formatPercent(result.availability)} —{' '}
          {formatDuration(result.downtimePerMonth)} простоя в месяц
        </p>
        <p className="mt-1 text-xs text-fd-muted-foreground">{result.explanation}</p>
      </div>
    </div>
  );
}

function TaskView({ widgetId, tasks }: { widgetId: string; tasks: SlaTask[] }) {
  const awardXp = useGameStore((s) => s.awardXp);
  const [index, setIndex] = React.useState(0);
  const [solved, setSolved] = React.useState<ReadonlySet<number>>(() => new Set());
  const [chosen, setChosen] = React.useState<number | null>(null);

  const task = tasks[index];
  const result = chosen !== null ? checkSla(task, chosen) : null;
  const allDone = solved.size === tasks.length;

  const awarded = React.useRef(false);
  React.useEffect(() => {
    if (allDone && !awarded.current) {
      awarded.current = true;
      saveScore(widgetId, 100);
      awardXp(40, 'sla-master');
    }
  }, [allDone, awardXp, widgetId]);

  const pick = (value: number) => {
    setChosen(value);
    if (checkSla(task, value).correct) {
      setSolved((prev) => new Set(prev).add(index));
    }
  };

  const next = () => {
    for (let step = 1; step <= tasks.length; step++) {
      const i = (index + step) % tasks.length;
      if (!solved.has(i)) {
        setIndex(i);
        setChosen(null);
        return;
      }
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-fd-muted-foreground">
        решено {solved.size} / {tasks.length}
      </p>

      <div className="rounded-lg border border-fd-border bg-fd-background p-3">
        <p className="text-sm">{task.goal}</p>
        <p className="mt-1.5 text-xs text-fd-muted-foreground">
          Выберите минимальный уровень SLA, который укладывается в бюджет простоя
          ({task.budgetMinutes} мин в месяц).
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {task.options.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => pick(value)}
            className={cn(
              'rounded-md border px-3 py-2 font-mono text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring',
              chosen === value
                ? result?.correct
                  ? 'border-edu-ok bg-edu-ok/10 text-edu-ok'
                  : 'border-edu-bad bg-edu-bad/10 text-edu-bad'
                : 'border-fd-border hover:bg-fd-accent',
            )}
          >
            {formatPercent(value)}
            <span className="ml-2 text-xs font-normal text-fd-muted-foreground">
              {formatDuration(downtimeSeconds(value, MONTH_SECONDS))}
            </span>
          </button>
        ))}
      </div>

      {result && (
        <p
          role="status"
          className={cn(
            'flex items-start gap-1.5 rounded-lg border p-3 text-sm',
            result.correct
              ? 'border-edu-ok/40 bg-edu-ok/10 text-edu-ok'
              : 'border-edu-bad/40 bg-edu-bad/10 text-edu-bad',
          )}
        >
          {result.correct ? (
            <Check className="mt-0.5 size-4 shrink-0" aria-hidden />
          ) : (
            <X className="mt-0.5 size-4 shrink-0" aria-hidden />
          )}
          <span>{result.reason}</span>
        </p>
      )}

      {result?.correct && !allDone && (
        <button
          type="button"
          onClick={next}
          className="rounded-md bg-fd-primary px-3 py-1.5 text-sm font-semibold text-fd-primary-foreground hover:bg-fd-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
        >
          Следующая задача
        </button>
      )}

      {allDone && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-lg border border-edu-ok/40 bg-edu-ok/10 p-3 text-sm font-semibold text-edu-ok"
        >
          <Check className="size-4" aria-hidden /> Все задачи решены! +40 XP
        </p>
      )}
    </div>
  );
}

export interface UptimeCalculatorProps {
  widgetId?: string;
  parts?: ChainPart[];
  tasks?: SlaTask[];
}

export function UptimeCalculator({
  widgetId = WIDGET_ID,
  parts = DEFAULT_PARTS,
  tasks = DEFAULT_TASKS,
}: UptimeCalculatorProps) {
  const [mode, setMode] = React.useState<Mode>('levels');
  const score = useScore(widgetId);

  return (
    <Panel className="not-prose my-6 overflow-hidden">
      <header className="flex items-center justify-between gap-3 border-b border-fd-border bg-fd-muted/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-subject-cs/10 text-subject-cs">
            <Activity className="size-4" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-bold leading-tight">Калькулятор доступности</p>
            <p className="text-xs text-fd-muted-foreground">SLA · простой · резервирование</p>
          </div>
        </div>
        <XpBadge />
      </header>

      <div className="flex gap-1 border-b border-fd-border p-1.5" role="group" aria-label="Режим тренажёра">
        {(['levels', 'chain', 'task'] as const).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            onClick={() => setMode(m)}
            className={cn(
              'flex-1 rounded-md px-2 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring',
              mode === m ? 'bg-fd-primary text-fd-primary-foreground' : 'text-fd-muted-foreground hover:bg-fd-accent',
            )}
          >
            {MODE_LABEL[m]}
          </button>
        ))}
      </div>

      <div className="p-4">
        {mode === 'levels' && <LevelsView />}
        {mode === 'chain' && <ChainView parts={parts} />}
        {mode === 'task' && <TaskView widgetId={widgetId} tasks={tasks} />}
      </div>

      {score && score.attempts > 0 && (
        <footer className="border-t border-fd-border px-4 py-2 text-xs text-fd-muted-foreground">
          Лучший результат: {score.best} · попыток: {score.attempts}
        </footer>
      )}
    </Panel>
  );
}

export default UptimeCalculator;
