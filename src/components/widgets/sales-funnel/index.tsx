'use client';

import * as React from 'react';
import { Check, Filter, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Panel } from '@/components/ui/card';
import { XpBadge } from '@/components/ui/xp-badge';
import { saveScore, useScore } from '@/lib/progress';
import { useGameStore } from '@/lib/store';
import {
  bottleneck,
  checkTask,
  formatPct,
  formatSom,
  planLeads,
  plural,
  summarize,
  type CheckResult,
  type FunnelInput,
  type FunnelTask,
} from './logic';
import { DEFAULT_INPUT, DEFAULT_PLAN, DEFAULT_TASKS } from './data';

const WIDGET_ID = 'sales-funnel';
type Mode = 'calc' | 'task';

const rangeClass =
  'mt-1 w-full accent-subject-bd focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring';

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-fd-border bg-fd-background p-2.5">
      <p className="text-xs text-fd-muted-foreground">{label}</p>
      <p className="font-mono text-sm font-bold">{value}</p>
    </div>
  );
}

function Slider({
  label,
  value,
  shown,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  shown: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-2 text-sm">
        <span>{label}</span>
        <b className="font-mono">{shown}</b>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={rangeClass}
      />
    </label>
  );
}

/** Воронка полосами: ширина — доля от обращений на входе. */
function FunnelBars({ input, highlight }: { input: FunnelInput; highlight?: string }) {
  const { counts } = summarize(input);
  const top = counts[0] || 1;
  const rows = [{ id: '__leads', name: 'Обращения', conversionPct: 100 }, ...input.stages];
  return (
    <ol className="space-y-1.5" aria-label="Воронка продаж">
      {rows.map((stage, i) => {
        const width = Math.max(4, (counts[i] / top) * 100);
        return (
          <li key={stage.id}>
            <div className="flex items-baseline justify-between gap-2 text-xs">
              <span className={cn('font-semibold', highlight === stage.id && 'text-subject-bd')}>{stage.name}</span>
              <span className="font-mono text-fd-muted-foreground">
                {Math.round(counts[i]).toLocaleString('ru-RU')}
                {i > 0 && ` · ${formatPct(stage.conversionPct)}`}
              </span>
            </div>
            <div className="mt-0.5 h-3 rounded-sm bg-fd-muted">
              <div
                className={cn(
                  'mx-auto h-3 rounded-sm transition-[width] duration-300 motion-reduce:transition-none',
                  highlight === stage.id ? 'bg-subject-bd' : 'bg-subject-bd/50',
                )}
                style={{ width: `${width}%` }}
              />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function CalcView() {
  const [input, setInput] = React.useState<FunnelInput>(DEFAULT_INPUT);
  const [plan, setPlan] = React.useState(DEFAULT_PLAN);
  const summary = summarize(input);
  const need = planLeads(plan, input.avgCheck, input.stages);
  const weak = bottleneck(input);
  const weakName = input.stages.find((s) => s.id === weak?.stageId)?.name;

  const setStage = (id: string, value: number) =>
    setInput((prev) => ({
      ...prev,
      stages: prev.stages.map((s) => (s.id === id ? { ...s, conversionPct: value } : s)),
    }));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2.5">
          <Slider
            label="Обращений в месяц"
            value={input.leads}
            shown={input.leads.toLocaleString('ru-RU')}
            min={0}
            max={2000}
            step={10}
            onChange={(v) => setInput((p) => ({ ...p, leads: v }))}
          />
          {input.stages.map((s) => (
            <Slider
              key={s.id}
              label={`→ ${s.name}`}
              value={s.conversionPct}
              shown={formatPct(s.conversionPct)}
              min={0}
              max={100}
              step={1}
              onChange={(v) => setStage(s.id, v)}
            />
          ))}
          <Slider
            label="Средний чек"
            value={input.avgCheck}
            shown={formatSom(input.avgCheck)}
            min={5000}
            max={300000}
            step={5000}
            onChange={(v) => setInput((p) => ({ ...p, avgCheck: v }))}
          />
        </div>
        <FunnelBars input={input} highlight={weak?.stageId} />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Tile label="Сделок" value={summary.deals.toLocaleString('ru-RU', { maximumFractionDigits: 1 })} />
        <Tile label="Сквозная конверсия" value={formatPct(summary.overallPct)} />
        <div className="col-span-2 sm:col-span-1">
          <Tile label="Выручка в месяц" value={formatSom(summary.revenue)} />
        </div>
      </div>

      {weak && weakName && weak.gain > 0 && (
        <p className="rounded-lg border border-subject-bd/30 bg-subject-bd/5 p-3 text-sm">
          <b>Узкое место — «{weakName}».</b> +5 п. п. на этом этапе дадут +{formatSom(weak.gain)} выручки в месяц —
          больше, чем на любом другом.
        </p>
      )}

      <div className="rounded-lg border border-fd-border bg-fd-muted/30 p-3">
        <Slider
          label="План выручки на месяц"
          value={plan}
          shown={formatSom(plan)}
          min={0}
          max={10000000}
          step={100000}
          onChange={setPlan}
        />
        <p role="status" className="mt-2 text-sm">
          {need === null
            ? 'План недостижим: на каком-то этапе конверсия 0% — никакая реклама не поможет.'
            : `Нужно ${need.dealsNeeded} ${plural(need.dealsNeeded, ['сделка', 'сделки', 'сделок'])} → ${need.leadsNeeded.toLocaleString('ru-RU')} ${plural(need.leadsNeeded, ['обращение', 'обращения', 'обращений'])} (сейчас ${input.leads.toLocaleString('ru-RU')}).`}
        </p>
      </div>
    </div>
  );
}

function choicesOf(task: FunnelTask): { id: string; label: string; hint?: string }[] {
  switch (task.kind) {
    case 'bottleneck':
      return task.input.stages.map((s) => ({ id: s.id, label: s.name, hint: `конверсия ${formatPct(s.conversionPct)}` }));
    case 'plan':
      return task.options.map((n) => ({
        id: String(n),
        label: `${n.toLocaleString('ru-RU')} ${plural(n, ['обращение', 'обращения', 'обращений'])}`,
      }));
    case 'compare':
      return task.changes.map((c) => ({ id: c.id, label: c.name }));
  }
}

function TaskView({ widgetId, tasks }: { widgetId: string; tasks: FunnelTask[] }) {
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
      awardXp(40, 'funnel-master');
    }
  }, [allDone, awardXp, widgetId]);

  const pick = (id: string) => {
    setChosen(id);
    const r = checkTask(task, id);
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
      {task.kind !== 'plan' && <FunnelBars input={task.input} />}

      <div className="grid gap-2 sm:grid-cols-2">
        {choicesOf(task).map((c) => {
          const isChosen = chosen === c.id;
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={isChosen}
              onClick={() => pick(c.id)}
              className={cn(
                'rounded-lg border p-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring',
                isChosen
                  ? result?.correct
                    ? 'border-edu-ok bg-edu-ok/10'
                    : 'border-edu-bad bg-edu-bad/10'
                  : 'border-fd-border hover:bg-fd-accent',
              )}
            >
              <span className="block font-semibold">{c.label}</span>
              {c.hint && <span className="mt-0.5 block text-xs text-fd-muted-foreground">{c.hint}</span>}
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
          <Check className="size-4" aria-hidden /> Все воронки разобраны! +40 XP
        </p>
      )}
    </div>
  );
}

export interface SalesFunnelProps {
  widgetId?: string;
  tasks?: FunnelTask[];
}

export function SalesFunnel({ widgetId = WIDGET_ID, tasks = DEFAULT_TASKS }: SalesFunnelProps) {
  const [mode, setMode] = React.useState<Mode>('calc');
  const score = useScore(widgetId);

  return (
    <Panel className="not-prose my-6 overflow-hidden">
      <header className="flex items-center justify-between gap-3 border-b border-fd-border bg-fd-muted/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-subject-bd/10 text-subject-bd">
            <Filter className="size-4" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-bold leading-tight">Воронка продаж</p>
            <p className="text-xs text-fd-muted-foreground">конверсии · план · узкое место</p>
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

export default SalesFunnel;
