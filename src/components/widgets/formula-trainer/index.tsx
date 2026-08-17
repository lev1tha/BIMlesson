'use client';

import * as React from 'react';
import { Check, Lightbulb, Table2, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Panel } from '@/components/ui/card';
import { XpBadge } from '@/components/ui/xp-badge';
import { saveScore, useScore } from '@/lib/progress';
import { useGameStore } from '@/lib/store';
import { checkFormula } from './logic';
import { DEFAULT_SPREADSHEET, type SpreadsheetData } from './data';

const WIDGET_ID = 'formula-trainer';

export interface FormulaTrainerProps {
  widgetId?: string;
  data?: SpreadsheetData;
}

export function FormulaTrainer({ widgetId = WIDGET_ID, data = DEFAULT_SPREADSHEET }: FormulaTrainerProps) {
  const awardXp = useGameStore((s) => s.awardXp);
  const score = useScore(widgetId);
  const id = React.useId();
  const [answers, setAnswers] = React.useState<Record<string, string>>(() =>
    Object.fromEntries(data.tasks.map((t) => [t.id, ''])),
  );
  const [hints, setHints] = React.useState<ReadonlySet<string>>(() => new Set());

  const results = data.tasks.map((task) => {
    const formula = answers[task.id] ?? '';
    return { task, formula, result: checkFormula(task, formula, data.grid) };
  });
  const allCorrect = results.every((r) => r.result.correct);

  const awarded = React.useRef(false);
  React.useEffect(() => {
    if (allCorrect && !awarded.current) {
      awarded.current = true;
      saveScore(widgetId, 100);
      awardXp(40, 'formula-master');
    }
  }, [allCorrect, awardXp, widgetId]);

  const toggleHint = (taskId: string) =>
    setHints((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });

  return (
    <Panel className="not-prose my-6 overflow-hidden">
      <header className="flex items-center justify-between gap-3 border-b border-fd-border bg-fd-muted/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-subject-lit/10 text-subject-lit">
            <Table2 className="size-4" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-bold leading-tight">Формулы в таблицах</p>
            <p className="text-xs text-fd-muted-foreground">SUM · AVERAGE · MAX · MIN</p>
          </div>
        </div>
        <XpBadge />
      </header>

      <div className="space-y-4 p-4">
        <div className="overflow-x-auto">
          <table className="border-collapse text-sm">
            <thead>
              <tr>
                <th className="w-8 border border-fd-border bg-fd-muted/50" aria-label="номер строки" />
                {data.columns.map((c) => (
                  <th key={c} className="border border-fd-border bg-fd-muted/50 px-3 py-1 text-center font-mono font-semibold">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.display.map((row, ri) => (
                <tr key={ri}>
                  <th scope="row" className="border border-fd-border bg-fd-muted/50 px-2 py-1 text-center font-mono text-fd-muted-foreground">
                    {ri + 1}
                  </th>
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className={cn(
                        'border border-fd-border px-3 py-1',
                        typeof cell === 'number' ? 'text-right font-mono' : '',
                        ri === 0 ? 'bg-fd-muted/20 font-semibold' : '',
                      )}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ul className="space-y-3">
          {results.map(({ task, formula, result }) => {
            const fbId = `${id}-${task.id}-fb`;
            const answered = formula.trim() !== '';
            return (
              <li key={task.id}>
                <label htmlFor={`${id}-${task.id}`} className="text-sm font-medium">
                  {task.prompt}
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    id={`${id}-${task.id}`}
                    value={formula}
                    onChange={(e) => setAnswers((a) => ({ ...a, [task.id]: e.target.value }))}
                    placeholder="=..."
                    spellCheck={false}
                    autoCapitalize="characters"
                    aria-describedby={fbId}
                    aria-invalid={answered ? !result.correct : undefined}
                    className={cn(
                      'flex-1 rounded-md border bg-fd-background px-2 py-1 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-fd-ring',
                      answered ? (result.correct ? 'border-edu-ok' : 'border-fd-border') : 'border-fd-border',
                    )}
                  />
                  {answered &&
                    (result.correct ? (
                      <Check className="size-4 shrink-0 text-edu-ok" aria-hidden />
                    ) : (
                      <X className="size-4 shrink-0 text-fd-muted-foreground" aria-hidden />
                    ))}
                  {task.hint && (
                    <button
                      type="button"
                      onClick={() => toggleHint(task.id)}
                      aria-expanded={hints.has(task.id)}
                      aria-label="Подсказка"
                      className="grid size-7 shrink-0 place-items-center rounded text-fd-muted-foreground hover:bg-fd-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
                    >
                      <Lightbulb className="size-4" aria-hidden />
                    </button>
                  )}
                </div>
                {answered && result.reason && (
                  <p id={fbId} className={cn('mt-1 text-xs', result.correct ? 'text-edu-ok' : 'text-fd-muted-foreground')}>
                    {result.reason}
                  </p>
                )}
                {hints.has(task.id) && task.hint && (
                  <p className="mt-1 text-xs text-fd-muted-foreground">
                    Подсказка: <code className="rounded bg-fd-muted px-1 font-mono">{task.hint}</code>
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
            <Check className="size-4" aria-hidden /> Все формулы верны! +40 XP
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

export default FormulaTrainer;
