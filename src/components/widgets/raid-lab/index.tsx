'use client';

import * as React from 'react';
import { Check, HardDrive, Minus, Plus, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Panel } from '@/components/ui/card';
import { XpBadge } from '@/components/ui/xp-badge';
import { saveScore, useScore } from '@/lib/progress';
import { useGameStore } from '@/lib/store';
import {
  checkRaid,
  evaluateRaid,
  formatTb,
  RAID_INFO,
  RAID_ORDER,
  type RaidLevel,
  type RaidTask,
} from './logic';
import { DEFAULT_TASKS, DISK_SIZES_TB } from './data';

const WIDGET_ID = 'raid-lab';
type Mode = 'build' | 'task';

function BuildView() {
  const [level, setLevel] = React.useState<RaidLevel>('RAID5');
  const [disks, setDisks] = React.useState(4);
  const [sizeTb, setSizeTb] = React.useState(4);

  const result = evaluateRaid({ level, disks, sizeTb });
  const info = RAID_INFO[level];
  const usableShare = result.valid && result.rawTb > 0 ? result.capacityTb / result.rawTb : 0;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Уровень RAID">
        {RAID_ORDER.map((l) => (
          <button
            key={l}
            type="button"
            aria-pressed={level === l}
            onClick={() => setLevel(l)}
            className={cn(
              'rounded-md border px-2.5 py-1.5 font-mono text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring',
              level === l
                ? 'border-subject-cs bg-subject-cs/10 text-subject-cs'
                : 'border-fd-border hover:bg-fd-accent',
            )}
          >
            {l.replace('RAID', 'RAID ')}
          </button>
        ))}
      </div>
      <p className="text-xs text-fd-muted-foreground">{info.desc}</p>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm">Дисков:</span>
          <button
            type="button"
            aria-label="Меньше дисков"
            onClick={() => setDisks((n) => Math.max(2, n - 1))}
            className="grid size-8 place-items-center rounded-md border border-fd-border hover:bg-fd-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
          >
            <Minus className="size-4" aria-hidden />
          </button>
          <span className="w-6 text-center font-mono text-sm font-bold">{disks}</span>
          <button
            type="button"
            aria-label="Больше дисков"
            onClick={() => setDisks((n) => Math.min(12, n + 1))}
            className="grid size-8 place-items-center rounded-md border border-fd-border hover:bg-fd-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
          >
            <Plus className="size-4" aria-hidden />
          </button>
        </div>

        <div className="flex items-center gap-1.5" role="group" aria-label="Объём одного диска">
          <span className="text-sm">По:</span>
          {DISK_SIZES_TB.map((size) => (
            <button
              key={size}
              type="button"
              aria-pressed={sizeTb === size}
              onClick={() => setSizeTb(size)}
              className={cn(
                'rounded-md border px-2 py-1 font-mono text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring',
                sizeTb === size
                  ? 'border-subject-cs bg-subject-cs/10 text-subject-cs'
                  : 'border-fd-border hover:bg-fd-accent',
              )}
            >
              {size} ТБ
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5" aria-hidden>
        {Array.from({ length: Math.max(2, Math.min(12, Math.floor(disks))) }, (_, i) => (
          <span
            key={i}
            className="grid h-10 w-8 place-items-center rounded-md border border-fd-border bg-fd-muted/40"
          >
            <HardDrive className="size-4 text-fd-muted-foreground" />
          </span>
        ))}
      </div>

      {result.valid ? (
        <div role="status" className="space-y-2 rounded-lg border border-subject-cs/40 bg-subject-cs/5 p-3">
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <span>
              Полезно: <b className="font-mono">{formatTb(result.capacityTb)}</b>
              <span className="text-fd-muted-foreground"> из {formatTb(result.rawTb)}</span>
            </span>
            <span>
              На защиту: <b className="font-mono">{formatTb(result.overheadTb)}</b>
            </span>
            <span>
              Переживёт отказ:{' '}
              <b className="font-mono">
                {result.tolerance}
                {result.toleranceMax ? `–${result.toleranceMax}` : ''} диск(ов)
              </b>
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-fd-muted" aria-hidden>
            <div
              className="h-full rounded-full bg-subject-cs motion-reduce:transition-none transition-[width]"
              style={{ width: `${Math.round(usableShare * 100)}%` }}
            />
          </div>
          <p className="text-xs text-fd-muted-foreground">{result.explanation}</p>
        </div>
      ) : (
        <p role="status" className="rounded-lg border border-edu-warn/40 bg-edu-warn/10 p-3 text-sm text-edu-warn">
          {result.error}
        </p>
      )}
    </div>
  );
}

function TaskView({ widgetId, tasks }: { widgetId: string; tasks: RaidTask[] }) {
  const awardXp = useGameStore((s) => s.awardXp);
  const [index, setIndex] = React.useState(0);
  const [solved, setSolved] = React.useState<ReadonlySet<number>>(() => new Set());
  const [chosen, setChosen] = React.useState<RaidLevel | null>(null);

  const task = tasks[index];
  const result = chosen !== null ? checkRaid(task, chosen) : null;
  const allDone = solved.size === tasks.length;

  const awarded = React.useRef(false);
  React.useEffect(() => {
    if (allDone && !awarded.current) {
      awarded.current = true;
      saveScore(widgetId, 100);
      awardXp(40, 'raid-master');
    }
  }, [allDone, awardXp, widgetId]);

  const pick = (value: RaidLevel) => {
    setChosen(value);
    if (checkRaid(task, value).correct) {
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
            {value.replace('RAID', 'RAID ')}
          </button>
        ))}
      </div>

      {result && (
        <p
          role="status"
          className={cn(
            'flex items-start gap-1.5 rounded-lg border p-3 text-sm',
            result.correct
              ? 'border-edu-ok/40 bg-edu-ok/10 text-edu-ok'
              : 'border-edu-bad/40 bg-edu-bad/10 text-edu-bad',
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
          <Check className="size-4" aria-hidden /> Все массивы собраны правильно! +40 XP
        </p>
      )}
    </div>
  );
}

export interface RaidLabProps {
  widgetId?: string;
  tasks?: RaidTask[];
}

export function RaidLab({ widgetId = WIDGET_ID, tasks = DEFAULT_TASKS }: RaidLabProps) {
  const [mode, setMode] = React.useState<Mode>('build');
  const score = useScore(widgetId);

  return (
    <Panel className="not-prose my-6 overflow-hidden">
      <header className="flex items-center justify-between gap-3 border-b border-fd-border bg-fd-muted/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-subject-cs/10 text-subject-cs">
            <HardDrive className="size-4" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-bold leading-tight">Конструктор RAID</p>
            <p className="text-xs text-fd-muted-foreground">ёмкость · защита · скорость</p>
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
            {m === 'build' ? 'Собери' : 'Задачи'}
          </button>
        ))}
      </div>

      <div className="p-4">{mode === 'build' ? <BuildView /> : <TaskView widgetId={widgetId} tasks={tasks} />}</div>

      {score && score.attempts > 0 && (
        <footer className="border-t border-fd-border px-4 py-2 text-xs text-fd-muted-foreground">
          Лучший результат: {score.best} · попыток: {score.attempts}
        </footer>
      )}
    </Panel>
  );
}

export default RaidLab;
