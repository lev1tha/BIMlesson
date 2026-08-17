'use client';

import * as React from 'react';
import { Binary, Check, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Panel } from '@/components/ui/card';
import { XpBadge } from '@/components/ui/xp-badge';
import { saveScore, useScore } from '@/lib/progress';
import { useGameStore } from '@/lib/store';
import { BASE_LABEL, checkConversion, parseInBase, toBase, type Base, type ConvTask } from './logic';
import { DEFAULT_CONVERTER, DEFAULT_TASKS } from './data';

const WIDGET_ID = 'base-converter';
type Mode = 'convert' | 'task';
const BASES: Base[] = [2, 10, 16];

function ConvertView() {
  const id = React.useId();
  const [input, setInput] = React.useState(String(DEFAULT_CONVERTER.value));
  const [base, setBase] = React.useState<Base>(DEFAULT_CONVERTER.base);
  const value = parseInBase(input, base);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <label htmlFor={`${id}-num`} className="flex flex-1 flex-col gap-1 text-xs font-semibold">
          Число
          <input
            id={`${id}-num`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            className={cn(
              'rounded-md border bg-fd-background px-3 py-2 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-fd-ring',
              value === null ? 'border-edu-bad' : 'border-fd-border',
            )}
          />
        </label>
        <label htmlFor={`${id}-base`} className="flex flex-col gap-1 text-xs font-semibold">
          Система
          <select
            id={`${id}-base`}
            value={base}
            onChange={(e) => setBase(Number(e.target.value) as Base)}
            className="rounded-md border border-fd-border bg-fd-background px-2 py-2 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
          >
            {BASES.map((b) => (
              <option key={b} value={b}>
                {BASE_LABEL[b]} ({b})
              </option>
            ))}
          </select>
        </label>
      </div>

      {value === null ? (
        <p className="flex items-center gap-2 rounded-lg border border-edu-bad/40 bg-edu-bad/5 p-3 text-sm text-edu-bad">
          <X className="size-4 shrink-0" aria-hidden />
          Это не число в {BASE_LABEL[base]} системе.
        </p>
      ) : (
        <dl className="rounded-lg border border-fd-border bg-fd-background p-3" aria-live="polite">
          {BASES.map((b) => (
            <div
              key={b}
              className="flex items-baseline justify-between gap-3 border-b border-fd-border/60 py-1.5 last:border-0"
            >
              <dt className="text-sm text-fd-muted-foreground">
                {BASE_LABEL[b]} ({b})
              </dt>
              <dd className="font-mono text-sm font-semibold tabular-nums">{toBase(value, b)}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

function TaskView({ widgetId, tasks }: { widgetId: string; tasks: ConvTask[] }) {
  const awardXp = useGameStore((s) => s.awardXp);
  const id = React.useId();
  const [answers, setAnswers] = React.useState<Record<string, string>>(() =>
    Object.fromEntries(tasks.map((t) => [t.id, ''])),
  );

  const rows = tasks.map((task) => {
    const answer = answers[task.id] ?? '';
    return { task, answer, answered: answer.trim() !== '', result: checkConversion(task, answer) };
  });
  const allCorrect = rows.every((r) => r.result.correct);

  const awarded = React.useRef(false);
  React.useEffect(() => {
    if (allCorrect && !awarded.current) {
      awarded.current = true;
      saveScore(widgetId, 100);
      awardXp(30, 'base-master');
    }
  }, [allCorrect, awardXp, widgetId]);

  return (
    <div className="space-y-3">
      <ul className="space-y-3">
        {rows.map(({ task, answer, answered, result }) => {
          const fbId = `${id}-${task.id}-fb`;
          return (
            <li key={task.id}>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <label htmlFor={`${id}-${task.id}`} className="flex-1 text-sm font-medium">
                  Переведи <span className="font-mono font-bold">{toBase(task.value, task.from)}</span> из{' '}
                  {BASE_LABEL[task.from]} в {BASE_LABEL[task.to]}
                </label>
                <input
                  id={`${id}-${task.id}`}
                  value={answer}
                  onChange={(e) => setAnswers((a) => ({ ...a, [task.id]: e.target.value }))}
                  spellCheck={false}
                  placeholder="?"
                  aria-describedby={fbId}
                  aria-invalid={answered ? !result.correct : undefined}
                  className={cn(
                    'w-24 rounded-md border bg-fd-background px-2 py-1 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-fd-ring',
                    answered ? (result.correct ? 'border-edu-ok' : 'border-fd-border') : 'border-fd-border',
                  )}
                />
                {answered &&
                  (result.correct ? (
                    <Check className="size-4 text-edu-ok" aria-hidden />
                  ) : (
                    <X className="size-4 text-fd-muted-foreground" aria-hidden />
                  ))}
              </div>
              {answered && (
                <p id={fbId} className={cn('mt-1 text-xs', result.correct ? 'text-edu-ok' : 'text-fd-muted-foreground')}>
                  {result.reason}
                </p>
              )}
            </li>
          );
        })}
      </ul>
      {allCorrect && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-lg border border-edu-ok/40 bg-edu-ok/10 p-3 text-sm font-semibold text-edu-ok"
        >
          <Check className="size-4" aria-hidden /> Все переводы верны! +30 XP
        </p>
      )}
    </div>
  );
}

export interface BaseConverterProps {
  widgetId?: string;
  tasks?: ConvTask[];
}

export function BaseConverter({ widgetId = WIDGET_ID, tasks = DEFAULT_TASKS }: BaseConverterProps) {
  const [mode, setMode] = React.useState<Mode>('convert');
  const score = useScore(widgetId);

  return (
    <Panel className="not-prose my-6 overflow-hidden">
      <header className="flex items-center justify-between gap-3 border-b border-fd-border bg-fd-muted/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-subject-cs/10 text-subject-cs">
            <Binary className="size-4" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-bold leading-tight">Системы счисления</p>
            <p className="text-xs text-fd-muted-foreground">двоичная · десятичная · hex</p>
          </div>
        </div>
        <XpBadge />
      </header>

      <div className="flex gap-1 border-b border-fd-border p-1.5" role="group" aria-label="Режим тренажёра">
        {(['convert', 'task'] as const).map((m) => (
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
            {m === 'convert' ? 'Конвертер' : 'Переведи сам'}
          </button>
        ))}
      </div>

      <div className="p-4">{mode === 'convert' ? <ConvertView /> : <TaskView widgetId={widgetId} tasks={tasks} />}</div>

      {score && score.attempts > 0 && (
        <footer className="border-t border-fd-border px-4 py-2 text-xs text-fd-muted-foreground">
          Лучший результат: {score.best} · попыток: {score.attempts}
        </footer>
      )}
    </Panel>
  );
}

export default BaseConverter;
