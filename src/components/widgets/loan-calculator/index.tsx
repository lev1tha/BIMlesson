'use client';

import * as React from 'react';
import { Calculator, Check, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Panel } from '@/components/ui/card';
import { XpBadge } from '@/components/ui/xp-badge';
import { saveScore, useScore } from '@/lib/progress';
import { useGameStore } from '@/lib/store';
import {
  checkOffer,
  formatSom,
  schedule,
  summarize,
  type CheckResult,
  type CompareTask,
  type LoanInput,
} from './logic';
import { DEFAULT_INPUT, DEFAULT_TASKS } from './data';

const WIDGET_ID = 'loan-calculator';
type Mode = 'calc' | 'task';

interface FieldSpec {
  key: keyof LoanInput;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
}

const FIELDS: FieldSpec[] = [
  { key: 'amount', label: 'Сумма кредита', min: 5000, max: 500000, step: 1000, unit: 'сом' },
  { key: 'annualRatePct', label: 'Ставка', min: 0, max: 60, step: 1, unit: '% годовых' },
  { key: 'months', label: 'Срок', min: 1, max: 60, step: 1, unit: 'мес' },
  { key: 'upfrontFee', label: 'Комиссия за оформление', min: 0, max: 20000, step: 500, unit: 'сом' },
  { key: 'monthlyFee', label: 'Комиссия в месяц', min: 0, max: 2000, step: 50, unit: 'сом' },
];

function Tile({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-fd-border bg-fd-background p-2.5">
      <p className="text-xs text-fd-muted-foreground">{label}</p>
      <p className={cn('font-mono text-sm font-bold', accent && 'text-edu-bad')}>{value}</p>
    </div>
  );
}

function CalcView() {
  const [input, setInput] = React.useState<LoanInput>(DEFAULT_INPUT);
  const summary = summarize(input);
  const rows = schedule(input.amount, input.annualRatePct, input.months);
  const first = rows[0];
  const interestShare = first && first.payment > 0 ? Math.round((first.interest / first.payment) * 100) : 0;

  return (
    <div className="space-y-3">
      <div className="space-y-2.5">
        {FIELDS.map((field) => (
          <label key={field.key} className="block">
            <span className="flex items-baseline justify-between gap-2 text-sm">
              <span>{field.label}</span>
              <b className="font-mono">
                {input[field.key].toLocaleString('ru-RU')} {field.unit}
              </b>
            </span>
            <input
              type="range"
              min={field.min}
              max={field.max}
              step={field.step}
              value={input[field.key]}
              onChange={(e) => setInput((prev) => ({ ...prev, [field.key]: Number(e.target.value) }))}
              className="mt-1 w-full accent-subject-lit focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
            />
          </label>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Tile label="Платёж в месяц" value={formatSom(summary.payment + input.monthlyFee)} />
        <Tile label="Всего отдадите" value={formatSom(summary.totalPaid)} />
        <div className="col-span-2 sm:col-span-1">
          <Tile
            label={`Переплата (${summary.overpaymentPct.toFixed(1).replace('.', ',')}% от суммы)`}
            value={formatSom(summary.overpayment)}
            accent
          />
        </div>
      </div>

      {first && (
        <p className="rounded-lg border border-fd-border bg-fd-muted/30 p-3 text-xs text-fd-muted-foreground">
          В первом месяце из платежа {formatSom(first.payment)} на проценты уходит {formatSom(first.interest)} —
          это {interestShare}%. Долг уменьшается только на {formatSom(first.principal)}.
        </p>
      )}

      {rows.length > 0 && (
        <details className="rounded-lg border border-fd-border bg-fd-background">
          <summary className="cursor-pointer px-3 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring">
            График платежей ({rows.length} мес)
          </summary>
          <div className="max-h-64 overflow-auto border-t border-fd-border">
            <table className="w-full min-w-max border-collapse text-xs">
              <thead className="sticky top-0 bg-fd-muted">
                <tr>
                  {['Месяц', 'Проценты', 'Погашение долга', 'Остаток'].map((h) => (
                    <th key={h} scope="col" className="px-2.5 py-1.5 text-right font-semibold text-fd-muted-foreground first:text-left">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.month} className="border-t border-fd-border">
                    <td className="px-2.5 py-1 font-mono">{row.month}</td>
                    <td className="px-2.5 py-1 text-right font-mono tabular-nums">{formatSom(row.interest)}</td>
                    <td className="px-2.5 py-1 text-right font-mono tabular-nums">{formatSom(row.principal)}</td>
                    <td className="px-2.5 py-1 text-right font-mono tabular-nums">{formatSom(row.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}

      <p className="text-xs text-fd-muted-foreground">
        Учебный расчёт аннуитетного платежа. Реальные условия — страховки, штрафы, порядок начисления —
        смотрите в договоре конкретного банка.
      </p>
    </div>
  );
}

function TaskView({ widgetId, tasks }: { widgetId: string; tasks: CompareTask[] }) {
  const awardXp = useGameStore((s) => s.awardXp);
  const [index, setIndex] = React.useState(0);
  const [solved, setSolved] = React.useState<ReadonlySet<number>>(() => new Set());
  const [chosen, setChosen] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<CheckResult | null>(null);

  const task = tasks[index];
  const allDone = solved.size === tasks.length;

  const awarded = React.useRef(false);
  React.useEffect(() => {
    if (allDone && !awarded.current) {
      awarded.current = true;
      saveScore(widgetId, 100);
      awardXp(40, 'loan-master');
    }
  }, [allDone, awardXp, widgetId]);

  const pick = (offerId: string) => {
    setChosen(offerId);
    const r = checkOffer(task, offerId);
    setResult(r);
    if (r.correct) setSolved((prev) => new Set(prev).add(index));
  };

  const next = () => {
    for (let step = 1; step <= tasks.length; step++) {
      const i = (index + step) % tasks.length;
      if (!solved.has(i)) {
        setIndex(i);
        break;
      }
    }
    setChosen(null);
    setResult(null);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-fd-muted-foreground">
        решено {solved.size} / {tasks.length}
      </p>
      <p className="rounded-lg border border-fd-border bg-fd-background p-3 text-sm font-semibold">{task.question}</p>

      <div className="grid gap-2 sm:grid-cols-2">
        {task.offers.map((offer) => {
          const s = summarize(offer.input);
          const isChosen = chosen === offer.id;
          return (
            <button
              key={offer.id}
              type="button"
              aria-pressed={isChosen}
              onClick={() => pick(offer.id)}
              className={cn(
                'rounded-lg border p-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring',
                isChosen
                  ? result?.correct
                    ? 'border-edu-ok bg-edu-ok/10'
                    : 'border-edu-bad bg-edu-bad/10'
                  : 'border-fd-border hover:bg-fd-accent',
              )}
            >
              <span className="block font-semibold">{offer.name}</span>
              <span className="mt-1 block text-xs text-fd-muted-foreground">
                Платёж: {formatSom(s.payment + offer.input.monthlyFee)} в месяц
              </span>
            </button>
          );
        })}
      </div>

      {result && (
        <p
          role="status"
          className={cn(
            'flex items-start gap-1.5 rounded-lg border p-3 text-sm',
            result.correct ? 'border-edu-ok/40 bg-edu-ok/10 text-edu-ok' : 'border-edu-bad/40 bg-edu-bad/10 text-edu-bad',
          )}
        >
          {result.correct ? <Check className="mt-0.5 size-4 shrink-0" aria-hidden /> : <X className="mt-0.5 size-4 shrink-0" aria-hidden />}
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
        <p role="status" className="flex items-center gap-2 rounded-lg border border-edu-ok/40 bg-edu-ok/10 p-3 text-sm font-semibold text-edu-ok">
          <Check className="size-4" aria-hidden /> Все предложения разобраны! +40 XP
        </p>
      )}
    </div>
  );
}

export interface LoanCalculatorProps {
  widgetId?: string;
  tasks?: CompareTask[];
}

export function LoanCalculator({ widgetId = WIDGET_ID, tasks = DEFAULT_TASKS }: LoanCalculatorProps) {
  const [mode, setMode] = React.useState<Mode>('calc');
  const score = useScore(widgetId);

  return (
    <Panel className="not-prose my-6 overflow-hidden">
      <header className="flex items-center justify-between gap-3 border-b border-fd-border bg-fd-muted/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-subject-lit/10 text-subject-lit">
            <Calculator className="size-4" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-bold leading-tight">Кредитный калькулятор</p>
            <p className="text-xs text-fd-muted-foreground">платёж · переплата · сравнение</p>
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
            {m === 'calc' ? 'Калькулятор' : 'Сравни предложения'}
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

export default LoanCalculator;
