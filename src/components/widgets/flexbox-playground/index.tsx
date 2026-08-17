'use client';

import * as React from 'react';
import { Check, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Panel } from '@/components/ui/card';
import { XpBadge } from '@/components/ui/xp-badge';
import { saveScore, useScore } from '@/lib/progress';
import { useGameStore } from '@/lib/store';
import {
  ALIGN_OPTIONS,
  DIRECTION_OPTIONS,
  JUSTIFY_OPTIONS,
  checkFlexAnswer,
  toCss,
  type FlexState,
  type FlexTask,
} from './logic';
import { DEFAULT_STATE, DEFAULT_TASKS } from './data';

const WIDGET_ID = 'flexbox-playground';
type Mode = 'play' | 'task';

const BOXES = [
  { n: 1, cls: 'h-10' },
  { n: 2, cls: 'h-16' },
  { n: 3, cls: 'h-12' },
];

function Preview({ state, muted = false }: { state: FlexState; muted?: boolean }) {
  return (
    <div
      className={cn('flex h-36 gap-2 rounded-lg border border-fd-border p-2', muted ? 'bg-fd-muted/30' : 'bg-fd-muted/10')}
      style={{ flexDirection: state.direction, justifyContent: state.justify, alignItems: state.align }}
    >
      {BOXES.map((b) => (
        <div
          key={b.n}
          className={cn('grid w-10 shrink-0 place-items-center rounded bg-subject-web/70 text-sm font-bold text-white', b.cls)}
        >
          {b.n}
        </div>
      ))}
    </div>
  );
}

function Field({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
}) {
  const id = React.useId();
  return (
    <label htmlFor={id} className="flex flex-col gap-1 font-mono text-xs font-semibold">
      {label}
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-fd-border bg-fd-background px-2 py-1.5 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function Controls({ state, onChange }: { state: FlexState; onChange: (s: FlexState) => void }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      <Field
        label="flex-direction"
        value={state.direction}
        options={DIRECTION_OPTIONS}
        onChange={(v) => onChange({ ...state, direction: v as FlexState['direction'] })}
      />
      <Field
        label="justify-content"
        value={state.justify}
        options={JUSTIFY_OPTIONS}
        onChange={(v) => onChange({ ...state, justify: v as FlexState['justify'] })}
      />
      <Field
        label="align-items"
        value={state.align}
        options={ALIGN_OPTIONS}
        onChange={(v) => onChange({ ...state, align: v as FlexState['align'] })}
      />
    </div>
  );
}

function PlayView() {
  const [state, setState] = React.useState<FlexState>(DEFAULT_STATE);
  return (
    <div className="space-y-3">
      <Controls state={state} onChange={setState} />
      <Preview state={state} />
      <pre className="overflow-x-auto rounded-lg border border-fd-border bg-fd-muted/20 p-3 font-mono text-xs">
        {`.container {\n  ${toCss(state).split('\n').join('\n  ')}\n}`}
      </pre>
    </div>
  );
}

function TaskView({ widgetId, tasks }: { widgetId: string; tasks: FlexTask[] }) {
  const awardXp = useGameStore((s) => s.awardXp);
  const [index, setIndex] = React.useState(0);
  const [state, setState] = React.useState<FlexState>(DEFAULT_STATE);
  const [done, setDone] = React.useState<ReadonlySet<string>>(() => new Set());

  const task = tasks[index];
  const result = checkFlexAnswer(task.target, state);

  const onChange = (next: FlexState) => {
    setState(next);
    if (checkFlexAnswer(task.target, next).correct && !done.has(task.id)) {
      setDone((prev) => new Set(prev).add(task.id));
    }
  };

  const allDone = done.size === tasks.length;
  const awarded = React.useRef(false);
  React.useEffect(() => {
    if (allDone && !awarded.current) {
      awarded.current = true;
      saveScore(widgetId, 100);
      awardXp(40, 'flex-master');
    }
  }, [allDone, awardXp, widgetId]);

  const goto = (i: number) => {
    setIndex(i);
    setState(DEFAULT_STATE);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {tasks.map((t, i) => (
          <button
            key={t.id}
            type="button"
            onClick={() => goto(i)}
            aria-pressed={i === index}
            aria-label={`Задача ${i + 1}${done.has(t.id) ? ', решена' : ''}`}
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring',
              i === index
                ? 'bg-fd-primary text-fd-primary-foreground'
                : done.has(t.id)
                  ? 'bg-edu-ok/10 text-edu-ok'
                  : 'bg-fd-muted text-fd-muted-foreground',
            )}
          >
            {done.has(t.id) && <Check className="size-3" aria-hidden />} {i + 1}
          </button>
        ))}
      </div>

      <p className="text-sm font-semibold">Задача: {task.title}</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className="mb-1 text-xs text-fd-muted-foreground">Образец</p>
          <Preview state={task.target} muted />
        </div>
        <div>
          <p className="mb-1 text-xs text-fd-muted-foreground">Твой вариант</p>
          <Preview state={state} />
        </div>
      </div>

      <Controls state={state} onChange={onChange} />

      <p role="status" className={cn('text-xs', result.correct ? 'text-edu-ok' : 'text-fd-muted-foreground')}>
        {result.reason}
      </p>

      {allDone && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-lg border border-edu-ok/40 bg-edu-ok/10 p-3 text-sm font-semibold text-edu-ok"
        >
          <Check className="size-4" aria-hidden /> Все раскладки собраны! +40 XP
        </p>
      )}
    </div>
  );
}

export interface FlexboxPlaygroundProps {
  widgetId?: string;
  tasks?: FlexTask[];
}

export function FlexboxPlayground({ widgetId = WIDGET_ID, tasks = DEFAULT_TASKS }: FlexboxPlaygroundProps) {
  const [mode, setMode] = React.useState<Mode>('play');
  const score = useScore(widgetId);

  return (
    <Panel className="not-prose my-6 overflow-hidden">
      <header className="flex items-center justify-between gap-3 border-b border-fd-border bg-fd-muted/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-subject-web/10 text-subject-web">
            <LayoutGrid className="size-4" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-bold leading-tight">Flexbox</p>
            <p className="text-xs text-fd-muted-foreground">выравнивание по осям</p>
          </div>
        </div>
        <XpBadge />
      </header>

      <div className="flex gap-1 border-b border-fd-border p-1.5" role="group" aria-label="Режим тренажёра">
        {(['play', 'task'] as const).map((m) => (
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
            {m === 'play' ? 'Песочница' : 'Собери по образцу'}
          </button>
        ))}
      </div>

      <div className="p-4">{mode === 'play' ? <PlayView /> : <TaskView widgetId={widgetId} tasks={tasks} />}</div>

      {score && score.attempts > 0 && (
        <footer className="border-t border-fd-border px-4 py-2 text-xs text-fd-muted-foreground">
          Лучший результат: {score.best} · попыток: {score.attempts}
        </footer>
      )}
    </Panel>
  );
}

export default FlexboxPlayground;
