'use client';

import * as React from 'react';
import { Check, TrendingUp, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Panel } from '@/components/ui/card';
import { XpBadge } from '@/components/ui/xp-badge';
import { saveScore, useScore } from '@/lib/progress';
import { useGameStore } from '@/lib/store';
import {
  checkTask,
  formatSom,
  ltv,
  monthlyContribution,
  paybackMonths,
  verdict,
  type UnitInput,
  type UnitTask,
} from './logic';
import { DEFAULT_INPUT, DEFAULT_TASKS } from './data';

const WIDGET_ID = 'unit-economics';
type Mode = 'calc' | 'task';

interface FieldSpec {
  key: keyof UnitInput;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
}

const FIELDS: FieldSpec[] = [
  { key: 'cac', label: 'Привлечение клиента (CAC)', min: 0, max: 10000, step: 100, unit: 'сом' },
  { key: 'aov', label: 'Средний чек', min: 100, max: 10000, step: 100, unit: 'сом' },
  { key: 'marginPct', label: 'Маржинальность', min: 5, max: 90, step: 5, unit: '%' },
  { key: 'purchasesPerMonth', label: 'Покупок в месяц', min: 1, max: 30, step: 1, unit: '' },
  { key: 'lifetimeMonths', label: 'Месяцев с компанией', min: 1, max: 36, step: 1, unit: 'мес' },
];

const LEVEL_CLS = {
  bad: 'border-edu-bad/40 bg-edu-bad/10 text-edu-bad',
  warning: 'border-edu-warn/40 bg-edu-warn/10 text-edu-warn',
  good: 'border-edu-ok/40 bg-edu-ok/10 text-edu-ok',
} as const;

function CalcView() {
  const [input, setInput] = React.useState<UnitInput>(DEFAULT_INPUT);

  const value = ltv(input);
  const monthly = monthlyContribution(input);
  const payback = paybackMonths(input);
  const health = verdict(input);

  return (
    <div className="space-y-3">
      <div className="space-y-2.5">
        {FIELDS.map((field) => (
          <label key={field.key} className="block">
            <span className="flex items-baseline justify-between text-sm">
              <span>{field.label}</span>
              <b className="font-mono">
                {input[field.key]} {field.unit}
              </b>
            </span>
            <input
              type="range"
              min={field.min}
              max={field.max}
              step={field.step}
              value={input[field.key]}
              onChange={(e) => setInput((prev) => ({ ...prev, [field.key]: Number(e.target.value) }))}
              className="mt-1 w-full accent-subject-bd focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
            />
          </label>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <div className="rounded-lg border border-fd-border bg-fd-background p-2.5">
          <p className="text-xs text-fd-muted-foreground">Маржа в месяц</p>
          <p className="font-mono text-sm font-bold">{formatSom(monthly)}</p>
        </div>
        <div className="rounded-lg border border-fd-border bg-fd-background p-2.5">
          <p className="text-xs text-fd-muted-foreground">LTV</p>
          <p className="font-mono text-sm font-bold">{formatSom(value)}</p>
        </div>
        <div className="col-span-2 rounded-lg border border-fd-border bg-fd-background p-2.5 sm:col-span-1">
          <p className="text-xs text-fd-muted-foreground">Окупаемость CAC</p>
          <p className="font-mono text-sm font-bold">
            {payback === null ? 'никогда' : payback === 0 ? 'сразу' : `${Number(payback.toFixed(1))} мес`}
          </p>
        </div>
      </div>

      <p role="status" className={cn('rounded-lg border p-3 text-sm', LEVEL_CLS[health.level])}>
        {health.text}
      </p>
    </div>
  );
}

function TaskView({ widgetId, tasks }: { widgetId: string; tasks: UnitTask[] }) {
  const awardXp = useGameStore((s) => s.awardXp);
  const [index, setIndex] = React.useState(0);
  const [solved, setSolved] = React.useState<ReadonlySet<number>>(() => new Set());
  const [chosen, setChosen] = React.useState<number | null>(null);

  const task = tasks[index];
  const result = chosen !== null ? checkTask(task, chosen) : null;
  const allDone = solved.size === tasks.length;

  const awarded = React.useRef(false);
  React.useEffect(() => {
    if (allDone && !awarded.current) {
      awarded.current = true;
      saveScore(widgetId, 100);
      awardXp(40, 'unit-master');
    }
  }, [allDone, awardXp, widgetId]);

  const pick = (value: number) => {
    setChosen(value);
    if (checkTask(task, value).correct) {
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
            {formatSom(value).replace(' сом', '')}
          </button>
        ))}
      </div>

      {result && (
        <p
          role="status"
          className={cn(
            'flex items-start gap-1.5 rounded-lg border p-3 text-sm',
            result.correct ? LEVEL_CLS.good : LEVEL_CLS.bad,
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
          <Check className="size-4" aria-hidden /> Юнит-экономика посчитана! +40 XP
        </p>
      )}
    </div>
  );
}

export interface UnitEconomicsProps {
  widgetId?: string;
  tasks?: UnitTask[];
}

export function UnitEconomics({ widgetId = WIDGET_ID, tasks = DEFAULT_TASKS }: UnitEconomicsProps) {
  const [mode, setMode] = React.useState<Mode>('calc');
  const score = useScore(widgetId);

  return (
    <Panel className="not-prose my-6 overflow-hidden">
      <header className="flex items-center justify-between gap-3 border-b border-fd-border bg-fd-muted/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-subject-bd/10 text-subject-bd">
            <TrendingUp className="size-4" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-bold leading-tight">Юнит-экономика</p>
            <p className="text-xs text-fd-muted-foreground">LTV · CAC · окупаемость</p>
          </div>
        </div>
        <XpBadge />
      </header>

      <div className="flex gap-1 border-b border-fd-border p-1.5" role="group" aria-label="Режим тренажёра">
        {(['calc', 'task'] as const).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            onClick={() => setMode(m)}
            className={cn(
              'flex-1 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring',
              mode === m ? 'bg-fd-primary text-fd-primary-foreground' : 'text-fd-muted-foreground hover:bg-fd-accent',
            )}
          >
            {m === 'calc' ? 'Калькулятор' : 'Задачи'}
          </button>
        ))}
      </div>

      <div className="p-4">{mode === 'calc' ? <CalcView /> : <TaskView widgetId={widgetId} tasks={tasks} />}</div>

      {score && score.attempts > 0 && (
        <footer className="border-t border-fd-border px-4 py-2 text-xs text-fd-muted-foreground">
          Лучший результат: {score.best} · попыток: {score.attempts}
        </footer>
      )}
    </Panel>
  );
}

export default UnitEconomics;
