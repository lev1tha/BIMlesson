'use client';

import * as React from 'react';
import { Check, LayoutGrid, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Panel } from '@/components/ui/card';
import { XpBadge } from '@/components/ui/xp-badge';
import { saveScore, useScore } from '@/lib/progress';
import { useGameStore } from '@/lib/store';
import {
  analyze,
  CELLS,
  checkTask,
  DEFAULT_THRESHOLDS,
  formatPct,
  formatSom,
  matrix,
  policyFor,
  POLICY_TEXT,
  type AbcTask,
  type Cell,
  type CheckResult,
  type Product,
  type Row,
  type Thresholds,
} from './logic';
import { DEFAULT_PRODUCTS, DEFAULT_TASKS } from './data';

const WIDGET_ID = 'abc-analysis';
type Mode = 'table' | 'task';

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring';

function Slider({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-2 text-xs">
        <span>{label}</span>
        <b className="font-mono">{value}%</b>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn('mt-1 w-full accent-subject-bd', focusRing)}
      />
    </label>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-grid min-w-6 place-items-center rounded bg-subject-bd/10 px-1 font-mono text-xs font-bold text-subject-bd">
      {children}
    </span>
  );
}

function Table({ rows }: { rows: Row[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-fd-border">
      <table className="w-full min-w-max border-collapse text-xs">
        <caption className="sr-only">ABC/XYZ-анализ ассортимента по выручке за полгода</caption>
        <thead className="bg-fd-muted">
          <tr>
            {['Товар', 'Выручка', 'Доля', 'Накопл.', 'ABC', 'CV', 'XYZ'].map((h) => (
              <th key={h} scope="col" className="px-2 py-1.5 text-right font-semibold text-fd-muted-foreground first:text-left">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-fd-border">
              <th scope="row" className="px-2 py-1 text-left font-medium">
                {r.name}
              </th>
              <td className="px-2 py-1 text-right font-mono tabular-nums">{formatSom(r.total)}</td>
              <td className="px-2 py-1 text-right font-mono tabular-nums">{formatPct(r.sharePct)}</td>
              <td className="px-2 py-1 text-right font-mono tabular-nums">{formatPct(r.cumPct)}</td>
              <td className="px-2 py-1 text-right">
                <Badge>{r.abc}</Badge>
              </td>
              <td className="px-2 py-1 text-right font-mono tabular-nums">{r.cv === null ? '—' : formatPct(r.cv)}</td>
              <td className="px-2 py-1 text-right">
                <Badge>{r.xyz}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Matrix({ rows }: { rows: Row[] }) {
  const m = matrix(rows);
  const [cell, setCell] = React.useState<Cell>('AX');
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[auto_repeat(3,minmax(0,1fr))] gap-1 text-xs" role="group" aria-label="Матрица ABC×XYZ">
        <span />
        {(['X', 'Y', 'Z'] as const).map((x) => (
          <span key={x} className="text-center font-bold text-fd-muted-foreground">
            {x}
          </span>
        ))}
        {(['A', 'B', 'C'] as const).map((a) => (
          <React.Fragment key={a}>
            <span className="grid place-items-center pr-1 font-bold text-fd-muted-foreground">{a}</span>
            {(['X', 'Y', 'Z'] as const).map((x) => {
              const c = `${a}${x}` as Cell;
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={cell === c}
                  onClick={() => setCell(c)}
                  className={cn(
                    'min-h-14 rounded-md border p-1.5 text-left transition-colors',
                    focusRing,
                    cell === c ? 'border-subject-bd bg-subject-bd/10' : 'border-fd-border hover:bg-fd-accent',
                  )}
                >
                  <span className="block font-mono font-bold">{c}</span>
                  <span className="block leading-tight text-fd-muted-foreground">
                    {m[c].length ? m[c].map((n) => n.split(',')[0]).join(', ') : '—'}
                  </span>
                </button>
              );
            })}
          </React.Fragment>
        ))}
      </div>
      <p role="status" className="rounded-lg border border-fd-border bg-fd-muted/30 p-2.5 text-xs">
        <b className="font-mono">{cell}:</b> {POLICY_TEXT[policyFor(cell)]}.
      </p>
    </div>
  );
}

function TableView({ products }: { products: Product[] }) {
  const [t, setT] = React.useState<Thresholds>(DEFAULT_THRESHOLDS);
  const rows = analyze(products, t);
  const changed = (Object.keys(t) as (keyof Thresholds)[]).some((k) => t[k] !== DEFAULT_THRESHOLDS[k]);

  // Верхний порог всегда выше нижнего: двигаем его следом.
  const setA = (aMax: number) => setT((p) => ({ ...p, aMax, bMax: Math.max(p.bMax, aMax + 1) }));
  const setX = (xMax: number) => setT((p) => ({ ...p, xMax, yMax: Math.max(p.yMax, xMax + 1) }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        <Slider label="A, если до товара меньше" value={t.aMax} min={50} max={90} onChange={setA} />
        <Slider label="B, если меньше" value={t.bMax} min={t.aMax + 1} max={99} onChange={(bMax) => setT((p) => ({ ...p, bMax }))} />
        <Slider label="X, если CV не больше" value={t.xMax} min={5} max={20} onChange={setX} />
        <Slider label="Y, если CV не больше" value={t.yMax} min={t.xMax + 1} max={60} onChange={(yMax) => setT((p) => ({ ...p, yMax }))} />
      </div>
      {changed && (
        <button
          type="button"
          onClick={() => setT(DEFAULT_THRESHOLDS)}
          className={cn('rounded-md border border-fd-border px-2.5 py-1 text-xs font-semibold hover:bg-fd-accent', focusRing)}
        >
          Вернуть 80/95 и 10/25
        </button>
      )}
      <Table rows={rows} />
      <Matrix rows={rows} />
      <p className="text-xs text-fd-muted-foreground">
        Класс ABC решает накопленная доля до товара; CV — стандартное отклонение по шести месяцам, делённое на среднее.
      </p>
    </div>
  );
}

function TaskView({ widgetId, tasks, products }: { widgetId: string; tasks: AbcTask[]; products: Product[] }) {
  const rows = React.useMemo(() => analyze(products), [products]);
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
      awardXp(40, 'abc-master');
    }
  }, [allDone, awardXp, widgetId]);

  const pick = (answer: string) => {
    setChosen(answer);
    const r = checkTask(task, answer, rows);
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

  const choiceClass = (id: string) =>
    cn(
      'rounded-lg border text-sm transition-colors',
      focusRing,
      chosen === id
        ? result?.correct
          ? 'border-edu-ok bg-edu-ok/10'
          : 'border-edu-bad bg-edu-bad/10'
        : 'border-fd-border hover:bg-fd-accent',
    );

  return (
    <div className="space-y-3">
      <p className="text-xs text-fd-muted-foreground">
        решено {solved.size} / {tasks.length} · подсмотреть цифры можно на вкладке «Таблица»
      </p>
      <p className="rounded-lg border border-fd-border bg-fd-background p-3 text-sm font-semibold">{task.question}</p>

      {task.kind === 'cell' ? (
        <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="Клетки матрицы">
          {CELLS.map((c) => (
            <button key={c} type="button" aria-pressed={chosen === c} onClick={() => pick(c)} className={cn(choiceClass(c), 'py-2 font-mono font-bold')}>
              {c}
            </button>
          ))}
        </div>
      ) : (
        <div className="grid gap-2">
          {task.options.map((p) => (
            <button key={p} type="button" aria-pressed={chosen === p} onClick={() => pick(p)} className={cn(choiceClass(p), 'p-3 text-left')}>
              {POLICY_TEXT[p]}
            </button>
          ))}
        </div>
      )}

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
          className={cn('rounded-md bg-fd-primary px-3 py-1.5 text-sm font-semibold text-fd-primary-foreground hover:bg-fd-primary/90', focusRing)}
        >
          Следующая задача
        </button>
      )}

      {allDone && (
        <p role="status" className="flex items-center gap-2 rounded-lg border border-edu-ok/40 bg-edu-ok/10 p-3 text-sm font-semibold text-edu-ok">
          <Check className="size-4" aria-hidden /> Ассортимент разобран! +40 XP
        </p>
      )}
    </div>
  );
}

export interface AbcAnalysisProps {
  widgetId?: string;
  products?: Product[];
  tasks?: AbcTask[];
}

export function AbcAnalysis({ widgetId = WIDGET_ID, products = DEFAULT_PRODUCTS, tasks = DEFAULT_TASKS }: AbcAnalysisProps) {
  const [mode, setMode] = React.useState<Mode>('table');
  const score = useScore(widgetId);

  return (
    <Panel className="not-prose my-6 overflow-hidden">
      <header className="flex items-center justify-between gap-3 border-b border-fd-border bg-fd-muted/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-subject-bd/10 text-subject-bd">
            <LayoutGrid className="size-4" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-bold leading-tight">ABC/XYZ-анализ</p>
            <p className="text-xs text-fd-muted-foreground">выручка · стабильность · запасы</p>
          </div>
        </div>
        <XpBadge />
      </header>

      <div className="flex gap-1 border-b border-fd-border p-1.5" role="group" aria-label="Режим тренажёра">
        {(['table', 'task'] as const).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            onClick={() => setMode(m)}
            className={cn(
              'flex-1 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors',
              focusRing,
              mode === m ? 'bg-fd-primary text-fd-primary-foreground' : 'text-fd-muted-foreground hover:bg-fd-accent',
            )}
          >
            {m === 'table' ? 'Таблица' : 'Задачи'}
          </button>
        ))}
      </div>

      <div className="p-4">
        {mode === 'table' ? <TableView products={products} /> : <TaskView widgetId={widgetId} tasks={tasks} products={products} />}
      </div>

      {score && score.attempts > 0 && (
        <footer className="border-t border-fd-border px-4 py-2 text-xs text-fd-muted-foreground">
          Лучший результат: {score.best} · попыток: {score.attempts}
        </footer>
      )}
    </Panel>
  );
}

export default AbcAnalysis;
