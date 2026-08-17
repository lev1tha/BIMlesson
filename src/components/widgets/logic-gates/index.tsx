'use client';

import * as React from 'react';
import { Check, CircuitBoard, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Panel } from '@/components/ui/card';
import { XpBadge } from '@/components/ui/xp-badge';
import { saveScore, useScore } from '@/lib/progress';
import { useGameStore } from '@/lib/store';
import { checkGateAnswer, evalGate, type GateTask } from './logic';
import { DEFAULT_TASKS, GATE_INFO, GATE_ORDER } from './data';

const WIDGET_ID = 'logic-gates';
type Mode = 'explore' | 'guess';

function Bit({ value, on }: { value: boolean; on?: () => void }) {
  const cls = cn(
    'grid size-8 place-items-center rounded-md font-mono text-sm font-bold',
    value ? 'bg-edu-ok/15 text-edu-ok' : 'bg-fd-muted text-fd-muted-foreground',
  );
  if (on) {
    return (
      <button
        type="button"
        onClick={on}
        aria-pressed={value}
        aria-label={`Вход: ${value ? '1' : '0'}, переключить`}
        className={cn(cls, 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring')}
      >
        {value ? '1' : '0'}
      </button>
    );
  }
  return <span className={cls}>{value ? '1' : '0'}</span>;
}

function ExploreView() {
  const [a, setA] = React.useState(true);
  const [b, setB] = React.useState(false);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold">A</span>
          <Bit value={a} on={() => setA((v) => !v)} />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold">B</span>
          <Bit value={b} on={() => setB((v) => !v)} />
        </div>
        <span className="text-xs text-fd-muted-foreground">кликай входы</span>
      </div>

      <ul className="space-y-1.5">
        {GATE_ORDER.map((gate) => {
          const info = GATE_INFO[gate];
          const out = evalGate(gate, a, b);
          return (
            <li
              key={gate}
              className="flex items-center gap-3 rounded-lg border border-fd-border bg-fd-background px-3 py-2"
            >
              <span className="min-w-0 flex-1">
                <span className="font-mono text-sm font-bold">{gate}</span>
                <span className="ml-2 text-xs text-fd-muted-foreground">{info.desc}</span>
              </span>
              <span className="text-xs text-fd-muted-foreground">
                {info.unary ? `НЕ ${a ? '1' : '0'}` : `${a ? '1' : '0'} · ${b ? '1' : '0'}`}
              </span>
              <span className="text-fd-muted-foreground">=</span>
              <Bit value={out} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function GuessView({ widgetId, tasks }: { widgetId: string; tasks: GateTask[] }) {
  const awardXp = useGameStore((s) => s.awardXp);
  const [index, setIndex] = React.useState(0);
  const [done, setDone] = React.useState<ReadonlySet<number>>(() => new Set());
  const [chosen, setChosen] = React.useState<boolean | null>(null);

  const task = tasks[index];
  const info = GATE_INFO[task.gate];
  const result = chosen !== null ? checkGateAnswer(task, chosen) : null;
  const allDone = done.size === tasks.length;

  const awarded = React.useRef(false);
  React.useEffect(() => {
    if (allDone && !awarded.current) {
      awarded.current = true;
      saveScore(widgetId, 100);
      awardXp(30, 'gates-master');
    }
  }, [allDone, awardXp, widgetId]);

  const pick = (answer: boolean) => {
    setChosen(answer);
    if (checkGateAnswer(task, answer).correct && !done.has(index)) {
      setDone((prev) => new Set(prev).add(index));
    }
  };

  const next = () => {
    for (let step = 1; step <= tasks.length; step++) {
      const i = (index + step) % tasks.length;
      if (!done.has(i)) {
        setIndex(i);
        setChosen(null);
        return;
      }
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-fd-muted-foreground">
        решено {done.size} / {tasks.length}
      </p>
      <div className="rounded-lg border border-fd-border bg-fd-background p-4 text-center">
        <p className="font-mono text-lg font-bold">
          {info.unary ? `НЕ ${task.a ? '1' : '0'}` : `${task.a ? '1' : '0'} ${task.gate} ${task.b ? '1' : '0'}`} = ?
        </p>
        <p className="mt-1 text-xs text-fd-muted-foreground">{info.label}: {info.desc}</p>
      </div>

      <div className="flex justify-center gap-3">
        {[false, true].map((val) => (
          <button
            key={String(val)}
            type="button"
            onClick={() => pick(val)}
            className={cn(
              'grid size-12 place-items-center rounded-lg border font-mono text-lg font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring',
              chosen === val
                ? result?.correct
                  ? 'border-edu-ok bg-edu-ok/10 text-edu-ok'
                  : 'border-edu-bad bg-edu-bad/10 text-edu-bad'
                : 'border-fd-border hover:bg-fd-accent',
            )}
          >
            {val ? '1' : '0'}
          </button>
        ))}
      </div>

      {result && (
        <p
          role="status"
          className={cn('flex items-center justify-center gap-1.5 text-sm', result.correct ? 'font-semibold text-edu-ok' : 'text-edu-bad')}
        >
          {result.correct ? <Check className="size-4" aria-hidden /> : <X className="size-4" aria-hidden />}
          {result.reason}
        </p>
      )}

      {result?.correct && !allDone && (
        <div className="text-center">
          <button
            type="button"
            onClick={next}
            className="rounded-md bg-fd-primary px-3 py-1.5 text-sm font-semibold text-fd-primary-foreground hover:bg-fd-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
          >
            Дальше
          </button>
        </div>
      )}

      {allDone && (
        <p
          role="status"
          className="flex items-center justify-center gap-2 rounded-lg border border-edu-ok/40 bg-edu-ok/10 p-3 text-sm font-semibold text-edu-ok"
        >
          <Check className="size-4" aria-hidden /> Все вентили пройдены! +30 XP
        </p>
      )}
    </div>
  );
}

export interface LogicGatesProps {
  widgetId?: string;
  tasks?: GateTask[];
}

export function LogicGates({ widgetId = WIDGET_ID, tasks = DEFAULT_TASKS }: LogicGatesProps) {
  const [mode, setMode] = React.useState<Mode>('explore');
  const score = useScore(widgetId);

  return (
    <Panel className="not-prose my-6 overflow-hidden">
      <header className="flex items-center justify-between gap-3 border-b border-fd-border bg-fd-muted/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-subject-cs/10 text-subject-cs">
            <CircuitBoard className="size-4" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-bold leading-tight">Логические вентили</p>
            <p className="text-xs text-fd-muted-foreground">AND · OR · XOR · NOT</p>
          </div>
        </div>
        <XpBadge />
      </header>

      <div className="flex gap-1 border-b border-fd-border p-1.5" role="group" aria-label="Режим тренажёра">
        {(['explore', 'guess'] as const).map((m) => (
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
            {m === 'explore' ? 'Вентили' : 'Угадай'}
          </button>
        ))}
      </div>

      <div className="p-4">{mode === 'explore' ? <ExploreView /> : <GuessView widgetId={widgetId} tasks={tasks} />}</div>

      {score && score.attempts > 0 && (
        <footer className="border-t border-fd-border px-4 py-2 text-xs text-fd-muted-foreground">
          Лучший результат: {score.best} · попыток: {score.attempts}
        </footer>
      )}
    </Panel>
  );
}

export default LogicGates;
