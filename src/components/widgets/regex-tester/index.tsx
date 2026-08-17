'use client';

import * as React from 'react';
import { Check, Regex, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Panel } from '@/components/ui/card';
import { XpBadge } from '@/components/ui/xp-badge';
import { saveScore, useScore } from '@/lib/progress';
import { useGameStore } from '@/lib/store';
import { countMatches, evaluateRegex } from './logic';
import { DEFAULT_PLAYGROUND, DEFAULT_TASK, type RegexTask } from './data';

const WIDGET_ID = 'regex-tester';
type Mode = 'play' | 'task';

function PlayView() {
  const id = React.useId();
  const [pattern, setPattern] = React.useState(DEFAULT_PLAYGROUND.pattern);
  const [flags, setFlags] = React.useState(DEFAULT_PLAYGROUND.flags);
  const [text, setText] = React.useState(DEFAULT_PLAYGROUND.text);
  const count = countMatches(pattern, flags, text);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <label htmlFor={`${id}-pat`} className="flex flex-1 flex-col gap-1 text-xs font-semibold">
          Паттерн
          <div className="flex items-center rounded-md border border-fd-border bg-fd-background font-mono text-sm">
            <span className="pl-2 text-fd-muted-foreground">/</span>
            <input
              id={`${id}-pat`}
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              spellCheck={false}
              className="min-w-0 flex-1 bg-transparent px-1 py-2 outline-none"
            />
            <span className="text-fd-muted-foreground">/</span>
            <input
              aria-label="Флаги"
              value={flags}
              onChange={(e) => setFlags(e.target.value.replace(/[^gimsuy]/g, ''))}
              spellCheck={false}
              className="w-12 bg-transparent px-1 py-2 outline-none"
            />
          </div>
        </label>
      </div>
      <label htmlFor={`${id}-text`} className="flex flex-col gap-1 text-xs font-semibold">
        Текст
        <textarea
          id={`${id}-text`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          className="w-full resize-y rounded-md border border-fd-border bg-fd-background p-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
        />
      </label>
      <p className={cn('text-sm font-semibold', count === null ? 'text-edu-bad' : 'text-fd-foreground')}>
        {count === null ? 'Ошибка в паттерне' : `Найдено совпадений: ${count}`}
      </p>
    </div>
  );
}

function TaskView({ widgetId, task }: { widgetId: string; task: RegexTask }) {
  const awardXp = useGameStore((s) => s.awardXp);
  const [pattern, setPattern] = React.useState('');
  const result = evaluateRegex(pattern, task.flags, task.cases);
  const [showHint, setShowHint] = React.useState(false);

  const awarded = React.useRef(false);
  React.useEffect(() => {
    if (result.allCorrect && !awarded.current) {
      awarded.current = true;
      saveScore(widgetId, 100);
      awardXp(40, 'regex-master');
    }
  }, [result.allCorrect, awardXp, widgetId]);

  return (
    <div className="space-y-3">
      <p className="text-sm text-fd-muted-foreground">{task.prompt}</p>

      <div className="flex items-center rounded-md border border-fd-border bg-fd-background font-mono text-sm">
        <span className="pl-2 text-fd-muted-foreground">/</span>
        <input
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
          spellCheck={false}
          placeholder="твой паттерн"
          aria-label="Регулярное выражение"
          aria-invalid={pattern !== '' && !result.allCorrect}
          className="min-w-0 flex-1 bg-transparent px-1 py-2 outline-none"
        />
        <span className="pr-2 text-fd-muted-foreground">/{task.flags}</span>
      </div>

      {pattern !== '' && !result.valid && (
        <p className="text-xs text-edu-bad">{result.error}</p>
      )}

      <ul className="space-y-1" aria-live="polite">
        {task.cases.map((c) => {
          const res = result.results.find((r) => r.text === c.text && r.shouldMatch === c.shouldMatch);
          const state = pattern === '' || !result.valid ? 'idle' : res?.correct ? 'ok' : 'bad';
          return (
            <li
              key={`${c.text}-${c.shouldMatch}`}
              className={cn(
                'flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm',
                state === 'ok' ? 'border-edu-ok/40 bg-edu-ok/5' : state === 'bad' ? 'border-edu-bad/40 bg-edu-bad/5' : 'border-fd-border',
              )}
            >
              {state === 'ok' && <Check className="size-4 shrink-0 text-edu-ok" aria-hidden />}
              {state === 'bad' && <X className="size-4 shrink-0 text-edu-bad" aria-hidden />}
              {state === 'idle' && <span className="size-4 shrink-0" />}
              <code className="font-mono">{c.text === '' ? '(пустая строка)' : c.text}</code>
              <span className="ml-auto text-xs text-fd-muted-foreground">
                {c.shouldMatch ? 'должна совпасть' : 'не должна'}
              </span>
            </li>
          );
        })}
      </ul>

      {result.allCorrect && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-lg border border-edu-ok/40 bg-edu-ok/10 p-3 text-sm font-semibold text-edu-ok"
        >
          <Check className="size-4" aria-hidden /> Все кейсы прошли! +40 XP
        </p>
      )}

      {task.hint && (
        <div>
          <button
            type="button"
            onClick={() => setShowHint((v) => !v)}
            aria-expanded={showHint}
            className="text-xs font-semibold text-fd-muted-foreground underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
          >
            Подсказка
          </button>
          {showHint && <p className="mt-1 text-xs text-fd-muted-foreground">{task.hint}</p>}
        </div>
      )}
    </div>
  );
}

export interface RegexTesterProps {
  widgetId?: string;
  task?: RegexTask;
}

export function RegexTester({ widgetId = WIDGET_ID, task = DEFAULT_TASK }: RegexTesterProps) {
  const [mode, setMode] = React.useState<Mode>('play');
  const score = useScore(widgetId);

  return (
    <Panel className="not-prose my-6 overflow-hidden">
      <header className="flex items-center justify-between gap-3 border-b border-fd-border bg-fd-muted/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-subject-sp/10 text-subject-sp">
            <Regex className="size-4" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-bold leading-tight">Регулярные выражения</p>
            <p className="text-xs text-fd-muted-foreground">поиск по шаблону</p>
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
            {m === 'play' ? 'Песочница' : 'Задача'}
          </button>
        ))}
      </div>

      <div className="p-4">{mode === 'play' ? <PlayView /> : <TaskView widgetId={widgetId} task={task} />}</div>

      {score && score.attempts > 0 && (
        <footer className="border-t border-fd-border px-4 py-2 text-xs text-fd-muted-foreground">
          Лучший результат: {score.best} · попыток: {score.attempts}
        </footer>
      )}
    </Panel>
  );
}

export default RegexTester;
