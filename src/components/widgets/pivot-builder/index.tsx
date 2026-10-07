'use client';

import * as React from 'react';
import { Check, Table2, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Panel } from '@/components/ui/card';
import { XpBadge } from '@/components/ui/xp-badge';
import { saveScore, useScore } from '@/lib/progress';
import { useGameStore } from '@/lib/store';
import {
  AGG_FORMULA,
  AGG_LABEL,
  buildPivot,
  checkSpec,
  DIM_LABEL,
  formatNum,
  MEASURE_LABEL,
  type Agg,
  type CheckResult,
  type Dim,
  type Measure,
  type PivotSpec,
  type PivotTask,
  type SaleRow,
} from './logic';
import { DEFAULT_SALES, DEFAULT_SPEC, DEFAULT_TASKS } from './data';

const WIDGET_ID = 'pivot-builder';
type Mode = 'build' | 'task';

const DIMS: Dim[] = ['city', 'product', 'month'];
const MEASURES: Measure[] = ['revenue', 'qty'];
const AGGS: Agg[] = ['sum', 'count', 'avg'];

const chipCls = (active: boolean, disabled?: boolean) =>
  cn(
    'rounded-md border px-2.5 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring',
    active ? 'border-subject-lit bg-subject-lit/10 text-subject-lit' : 'border-fd-border hover:bg-fd-accent',
    disabled && 'cursor-not-allowed opacity-40 hover:bg-transparent',
  );

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-fd-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={label}>
        {children}
      </div>
    </div>
  );
}

function SpecEditor({ spec, onChange }: { spec: PivotSpec; onChange: (next: PivotSpec) => void }) {
  const setRows = (rows: Dim) => onChange({ ...spec, rows, cols: spec.cols === rows ? null : spec.cols });

  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      <Group label="Строки">
        {DIMS.map((d) => (
          <button key={d} type="button" aria-pressed={spec.rows === d} onClick={() => setRows(d)} className={chipCls(spec.rows === d)}>
            {DIM_LABEL[d]}
          </button>
        ))}
      </Group>
      <Group label="Столбцы">
        <button
          type="button"
          aria-pressed={spec.cols === null}
          onClick={() => onChange({ ...spec, cols: null })}
          className={chipCls(spec.cols === null)}
        >
          Нет
        </button>
        {DIMS.map((d) => (
          <button
            key={d}
            type="button"
            aria-pressed={spec.cols === d}
            disabled={d === spec.rows}
            onClick={() => onChange({ ...spec, cols: d })}
            className={chipCls(spec.cols === d, d === spec.rows)}
          >
            {DIM_LABEL[d]}
          </button>
        ))}
      </Group>
      <Group label="Значения">
        {MEASURES.map((m) => (
          <button key={m} type="button" aria-pressed={spec.value === m} onClick={() => onChange({ ...spec, value: m })} className={chipCls(spec.value === m)}>
            {MEASURE_LABEL[m]}
          </button>
        ))}
      </Group>
      <Group label="Как считать">
        {AGGS.map((a) => (
          <button key={a} type="button" aria-pressed={spec.agg === a} onClick={() => onChange({ ...spec, agg: a })} className={chipCls(spec.agg === a)}>
            {AGG_LABEL[a]}
          </button>
        ))}
      </Group>
    </div>
  );
}

function PivotView({ data, spec }: { data: SaleRow[]; spec: PivotSpec }) {
  const table = buildPivot(data, spec);
  const hasCols = table.colKeys.length > 0;
  const th = 'border-b border-fd-border px-2.5 py-1.5 text-left text-xs font-semibold text-fd-muted-foreground';
  const td = 'border-b border-fd-border px-2.5 py-1.5 text-right font-mono text-xs tabular-nums';

  return (
    <div className="space-y-1.5">
      <div className="overflow-x-auto rounded-lg border border-fd-border bg-fd-background">
        <table className="w-full min-w-max border-collapse">
          <thead className="bg-fd-muted/40">
            <tr>
              <th scope="col" className={th}>
                {DIM_LABEL[spec.rows]}
              </th>
              {hasCols ? (
                <>
                  {table.colKeys.map((ck) => (
                    <th key={ck} scope="col" className={cn(th, 'text-right')}>
                      {ck}
                    </th>
                  ))}
                  <th scope="col" className={cn(th, 'text-right')}>
                    Итого
                  </th>
                </>
              ) : (
                <th scope="col" className={cn(th, 'text-right')}>
                  {AGG_LABEL[spec.agg]}
                  {spec.agg !== 'count' && `: ${MEASURE_LABEL[spec.value].toLowerCase()}`}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {table.rowKeys.map((rk, i) => (
              <tr key={rk}>
                <th scope="row" className="border-b border-fd-border px-2.5 py-1.5 text-left text-xs font-semibold">
                  {rk}
                </th>
                {table.cells[i].map((v, j) => (
                  <td key={table.colKeys[j]} className={td}>
                    {formatNum(v)}
                  </td>
                ))}
                <td className={cn(td, hasCols && 'font-bold')}>{formatNum(table.rowTotals[i])}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-fd-muted/40">
            <tr>
              <th scope="row" className="px-2.5 py-1.5 text-left text-xs font-bold">
                Общий итог
              </th>
              {table.colTotals.map((v, j) => (
                <td key={table.colKeys[j]} className="px-2.5 py-1.5 text-right font-mono text-xs font-bold tabular-nums">
                  {formatNum(v)}
                </td>
              ))}
              <td className="px-2.5 py-1.5 text-right font-mono text-xs font-bold tabular-nums">{formatNum(table.grandTotal)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="text-xs text-fd-muted-foreground">
        В Excel и Google Таблицах эта агрегация — функция {AGG_FORMULA[spec.agg]}.
      </p>
    </div>
  );
}

function TaskView({ widgetId, data, tasks }: { widgetId: string; data: SaleRow[]; tasks: PivotTask[] }) {
  const awardXp = useGameStore((s) => s.awardXp);
  const [index, setIndex] = React.useState(0);
  const [solved, setSolved] = React.useState<ReadonlySet<number>>(() => new Set());
  const [spec, setSpec] = React.useState<PivotSpec>(DEFAULT_SPEC);
  const [result, setResult] = React.useState<CheckResult | null>(null);

  const task = tasks[index];
  const allDone = solved.size === tasks.length;

  const awarded = React.useRef(false);
  React.useEffect(() => {
    if (allDone && !awarded.current) {
      awarded.current = true;
      saveScore(widgetId, 100);
      awardXp(40, 'pivot-master');
    }
  }, [allDone, awardXp, widgetId]);

  const check = () => {
    const r = checkSpec(task, spec);
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
    setSpec(DEFAULT_SPEC);
    setResult(null);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-fd-muted-foreground">
        решено {solved.size} / {tasks.length}
      </p>
      <p className="rounded-lg border border-fd-border bg-fd-background p-3 text-sm font-semibold">{task.question}</p>
      <SpecEditor
        spec={spec}
        onChange={(next) => {
          setSpec(next);
          setResult(null);
        }}
      />
      <PivotView data={data} spec={spec} />
      {!result?.correct && (
        <button
          type="button"
          onClick={check}
          className="rounded-md bg-fd-primary px-3 py-1.5 text-sm font-semibold text-fd-primary-foreground hover:bg-fd-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
        >
          Проверить сводную
        </button>
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
          className="rounded-md bg-fd-primary px-3 py-1.5 text-sm font-semibold text-fd-primary-foreground hover:bg-fd-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
        >
          Следующая задача
        </button>
      )}
      {allDone && (
        <p role="status" className="flex items-center gap-2 rounded-lg border border-edu-ok/40 bg-edu-ok/10 p-3 text-sm font-semibold text-edu-ok">
          <Check className="size-4" aria-hidden /> Все сводные собраны! +40 XP
        </p>
      )}
    </div>
  );
}

export interface PivotBuilderProps {
  widgetId?: string;
  data?: SaleRow[];
  tasks?: PivotTask[];
}

export function PivotBuilder({ widgetId = WIDGET_ID, data = DEFAULT_SALES, tasks = DEFAULT_TASKS }: PivotBuilderProps) {
  const [mode, setMode] = React.useState<Mode>('build');
  const [spec, setSpec] = React.useState<PivotSpec>(DEFAULT_SPEC);
  const score = useScore(widgetId);

  return (
    <Panel className="not-prose my-6 overflow-hidden">
      <header className="flex items-center justify-between gap-3 border-b border-fd-border bg-fd-muted/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-subject-lit/10 text-subject-lit">
            <Table2 className="size-4" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-bold leading-tight">Сводная таблица</p>
            <p className="text-xs text-fd-muted-foreground">строки · столбцы · значения</p>
          </div>
        </div>
        <XpBadge />
      </header>

      <div className="flex gap-1 border-b border-fd-border p-1.5" role="group" aria-label="Режим тренажёра">
        {(['build', 'task'] as const).map((m) => (
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
            {m === 'build' ? 'Конструктор' : 'Задачи'}
          </button>
        ))}
      </div>

      <div className="space-y-3 p-4">
        {mode === 'build' ? (
          <>
            <p className="text-xs text-fd-muted-foreground">
              Исходные данные — {data.length} строк выгрузки продаж. Выбирайте разрез и смотрите, как меняется таблица.
            </p>
            <SpecEditor spec={spec} onChange={setSpec} />
            <PivotView data={data} spec={spec} />
          </>
        ) : (
          <TaskView widgetId={widgetId} data={data} tasks={tasks} />
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

export default PivotBuilder;
