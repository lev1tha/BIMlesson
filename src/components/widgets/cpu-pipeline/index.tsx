'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check, Cpu, Pause, Play, RotateCcw, StepForward } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Panel } from '@/components/ui/card';
import { XpBadge } from '@/components/ui/xp-badge';
import { saveScore, useScore } from '@/lib/progress';
import { useGameStore } from '@/lib/store';
import {
  checkPipelinedAnswer,
  pipelinedCycles,
  sequentialCycles,
  speedup,
  STAGES,
  STAGE_COUNT,
  stageAt,
  type CycleTask,
} from './logic';
import { DEFAULT_SIM, DEFAULT_TASKS } from './data';

const WIDGET_ID = 'cpu-pipeline';
type Mode = 'sim' | 'quiz';

/** Цвета стадий берём из токенов global.css (никакого hex в JSX). */
const STAGE_CLASS = [
  'bg-stage-if/15 text-stage-if',
  'bg-stage-id/15 text-stage-id',
  'bg-stage-ex/15 text-stage-ex',
  'bg-stage-wb/15 text-stage-wb',
];

export interface CpuPipelineProps {
  widgetId?: string;
  instructions?: number;
  stages?: number;
  tasks?: CycleTask[];
}

function clampInt(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

function Legend() {
  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
      {STAGES.map((stage, i) => (
        <li key={stage.short} className="flex items-center gap-1.5">
          <span className={cn('grid size-5 place-items-center rounded font-mono text-[10px] font-bold', STAGE_CLASS[i])}>
            {stage.short}
          </span>
          <span className="text-fd-muted-foreground">{stage.name}</span>
        </li>
      ))}
    </ul>
  );
}

function SimView({ instructions, stages }: { instructions: number; stages: number }) {
  const reduce = useReducedMotion();
  const total = pipelinedCycles(instructions, stages);
  const [revealed, setRevealed] = React.useState(total);
  const [playing, setPlaying] = React.useState(false);

  React.useEffect(() => {
    if (!playing || revealed >= total) return;
    const id = setInterval(() => setRevealed((r) => Math.min(total, r + 1)), 650);
    return () => clearInterval(id);
  }, [playing, revealed, total]);

  const rows = Array.from({ length: instructions }, (_, i) => i);
  const cols = Array.from({ length: total }, (_, c) => c);
  const seq = sequentialCycles(instructions, stages);

  const play = () => {
    if (revealed >= total) setRevealed(0);
    setPlaying(true);
  };
  const active = playing && revealed < total;

  return (
    <div className="space-y-3">
      <p className="text-sm text-fd-muted-foreground">
        Каждая инструкция проходит {stages} стадии. Пока первая на «Исполнении», вторая уже
        «Декодируется» — стадии работают <strong className="text-fd-foreground">параллельно</strong>, как
        конвейер на заводе. Прогони по тактам и посмотри, как заполняется лента.
      </p>

      <Legend />

      <div className="overflow-x-auto">
        <table className="border-separate border-spacing-1 text-center text-xs">
          <caption className="sr-only">Диаграмма конвейера: строки — инструкции, столбцы — такты</caption>
          <thead>
            <tr>
              <th className="px-1 py-0.5 text-fd-muted-foreground">такт →</th>
              {cols.map((c) => (
                <th key={c} className="w-8 px-1 py-0.5 font-mono font-normal text-fd-muted-foreground">
                  {c + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((i) => (
              <tr key={i}>
                <th scope="row" className="whitespace-nowrap px-1 py-0.5 text-right font-mono font-semibold">
                  И{i + 1}
                </th>
                {cols.map((c) => {
                  const st = stageAt(i, c, stages);
                  const show = c < revealed && st !== null;
                  return (
                    <td key={c} className="p-0">
                      {show ? (
                        <motion.span
                          initial={reduce ? false : { scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.15 }}
                          className={cn(
                            'grid size-7 place-items-center rounded font-mono text-[10px] font-bold',
                            STAGE_CLASS[st],
                          )}
                        >
                          {STAGES[st].short}
                        </motion.span>
                      ) : (
                        <span className="grid size-7 place-items-center rounded bg-fd-muted/40" aria-hidden />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setPlaying(false);
            setRevealed(0);
          }}
          className="inline-flex items-center gap-1.5 rounded-md border border-fd-border px-2.5 py-1.5 text-xs font-semibold hover:bg-fd-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
        >
          <RotateCcw className="size-3.5" aria-hidden /> Сброс
        </button>
        <button
          type="button"
          onClick={() => setRevealed((r) => Math.min(total, r + 1))}
          disabled={revealed >= total}
          className="inline-flex items-center gap-1.5 rounded-md border border-fd-border px-2.5 py-1.5 text-xs font-semibold hover:bg-fd-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring disabled:opacity-40"
        >
          <StepForward className="size-3.5" aria-hidden /> Шаг
        </button>
        <button
          type="button"
          onClick={() => (active ? setPlaying(false) : play())}
          className="inline-flex items-center gap-1.5 rounded-md bg-fd-primary px-2.5 py-1.5 text-xs font-semibold text-fd-primary-foreground hover:bg-fd-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
        >
          {active ? <Pause className="size-3.5" aria-hidden /> : <Play className="size-3.5" aria-hidden />}
          {active ? 'Пауза' : 'Прогнать'}
        </button>
        <span className="ml-auto font-mono text-xs text-fd-muted-foreground">
          такт {Math.min(revealed, total)} / {total}
        </span>
      </div>

      <dl className="grid grid-cols-3 gap-2 text-center" aria-live="polite">
        <div className="rounded-lg border border-fd-border bg-fd-background p-2">
          <dt className="text-xs text-fd-muted-foreground">Без конвейера</dt>
          <dd className="font-mono text-lg font-bold">{seq}</dd>
        </div>
        <div className="rounded-lg border border-fd-border bg-fd-background p-2">
          <dt className="text-xs text-fd-muted-foreground">С конвейером</dt>
          <dd className="font-mono text-lg font-bold text-fd-primary">{total}</dd>
        </div>
        <div className="rounded-lg border border-edu-ok/30 bg-edu-ok/10 p-2">
          <dt className="text-xs text-fd-muted-foreground">Ускорение</dt>
          <dd className="font-mono text-lg font-bold text-edu-ok">×{speedup(instructions, stages).toFixed(1)}</dd>
        </div>
      </dl>
    </div>
  );
}

function QuizView({ widgetId, tasks }: { widgetId: string; tasks: CycleTask[] }) {
  const awardXp = useGameStore((s) => s.awardXp);
  const id = React.useId();
  const [answers, setAnswers] = React.useState<Record<string, number | ''>>(() =>
    Object.fromEntries(tasks.map((t) => [t.id, ''])),
  );

  const rows = tasks.map((task) => {
    const raw = answers[task.id];
    const answered = raw !== '';
    return { task, answered, result: answered ? checkPipelinedAnswer(task, Number(raw)) : null };
  });
  const allCorrect = rows.every((r) => r.result?.correct);

  const awarded = React.useRef(false);
  React.useEffect(() => {
    if (allCorrect && !awarded.current) {
      awarded.current = true;
      saveScore(widgetId, 100);
      awardXp(40, 'pipeline-master');
    }
  }, [allCorrect, awardXp, widgetId]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-fd-muted-foreground">
        Сколько тактов займёт выполнение <strong className="text-fd-foreground">с конвейером</strong>? Подсказка:
        стадий на заполнение + по одной инструкции за такт.
      </p>
      <ul className="space-y-3">
        {rows.map(({ task, answered, result }) => {
          const fbId = `${id}-${task.id}-fb`;
          return (
            <li key={task.id}>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <label htmlFor={`${id}-${task.id}`} className="flex-1 text-sm font-semibold">
                  {task.label}
                </label>
                <input
                  id={`${id}-${task.id}`}
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={answers[task.id]}
                  aria-describedby={fbId}
                  aria-invalid={answered ? !result?.correct : undefined}
                  onChange={(e) =>
                    setAnswers((a) => ({
                      ...a,
                      [task.id]: e.target.value === '' ? '' : clampInt(Number(e.target.value), 0, 999),
                    }))
                  }
                  placeholder="?"
                  className={cn(
                    'w-20 rounded-md border bg-fd-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-fd-ring',
                    answered ? (result?.correct ? 'border-edu-ok' : 'border-edu-bad') : 'border-fd-border',
                  )}
                />
                <span className="text-xs text-fd-muted-foreground">тактов</span>
              </div>
              {result && (
                <p
                  id={fbId}
                  className={cn('mt-1 text-xs', result.correct ? 'text-edu-ok' : 'text-fd-muted-foreground')}
                >
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
          <Check className="size-4" aria-hidden /> Формула конвейера освоена. +40 XP
        </p>
      )}
    </div>
  );
}

export function CpuPipeline({
  widgetId = WIDGET_ID,
  instructions = DEFAULT_SIM.instructions,
  stages = DEFAULT_SIM.stages,
  tasks = DEFAULT_TASKS,
}: CpuPipelineProps) {
  const [mode, setMode] = React.useState<Mode>('sim');
  const score = useScore(widgetId);

  return (
    <Panel className="not-prose my-6 overflow-hidden">
      <header className="flex items-center justify-between gap-3 border-b border-fd-border bg-fd-muted/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-subject-cs/10 text-subject-cs">
            <Cpu className="size-4" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-bold leading-tight">Конвейер процессора</p>
            <p className="text-xs text-fd-muted-foreground">стадии · такты · параллелизм</p>
          </div>
        </div>
        <XpBadge />
      </header>

      <div className="flex gap-1 border-b border-fd-border p-1.5" role="group" aria-label="Режим тренажёра">
        {(['sim', 'quiz'] as const).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            onClick={() => setMode(m)}
            className={cn(
              'flex-1 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring',
              mode === m
                ? 'bg-fd-primary text-fd-primary-foreground'
                : 'text-fd-muted-foreground hover:bg-fd-accent',
            )}
          >
            {m === 'sim' ? 'Конвейер' : 'Посчитай такты'}
          </button>
        ))}
      </div>

      <div className="p-4">
        {mode === 'sim' ? (
          <SimView instructions={instructions} stages={stages} />
        ) : (
          <QuizView widgetId={widgetId} tasks={tasks} />
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

export default CpuPipeline;
