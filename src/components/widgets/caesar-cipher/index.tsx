'use client';

import * as React from 'react';
import { Check, Lock } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Panel } from '@/components/ui/card';
import { XpBadge } from '@/components/ui/xp-badge';
import { saveScore, useScore } from '@/lib/progress';
import { useGameStore } from '@/lib/store';
import { caesarDecode, caesarShift, MAX_SHIFT } from './logic';
import { DEFAULT_SHIFT, DEFAULT_TEXT, DEFAULT_TASK, type CrackTask } from './data';

const WIDGET_ID = 'caesar-cipher';
type Mode = 'cipher' | 'crack';

function CipherView() {
  const id = React.useId();
  const [text, setText] = React.useState(DEFAULT_TEXT);
  const [shift, setShift] = React.useState(DEFAULT_SHIFT);
  const [decode, setDecode] = React.useState(false);
  const result = decode ? caesarDecode(text, shift) : caesarShift(text, shift);

  return (
    <div className="space-y-3">
      <label htmlFor={`${id}-text`} className="flex flex-col gap-1 text-xs font-semibold">
        Текст
        <input
          id={`${id}-text`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="rounded-md border border-fd-border bg-fd-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
        />
      </label>

      <div className="flex items-center gap-3">
        <label htmlFor={`${id}-shift`} className="text-xs font-semibold">
          Сдвиг: <span className="font-mono">{shift}</span>
        </label>
        <input
          id={`${id}-shift`}
          type="range"
          min={0}
          max={MAX_SHIFT}
          value={shift}
          onChange={(e) => setShift(Number(e.target.value))}
          className="flex-1 accent-fd-primary"
        />
        <button
          type="button"
          onClick={() => setDecode((v) => !v)}
          aria-pressed={decode}
          className="rounded-md border border-fd-border px-2.5 py-1 text-xs font-semibold hover:bg-fd-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
        >
          {decode ? 'Дешифровать' : 'Шифровать'}
        </button>
      </div>

      <div className="rounded-lg border border-fd-border bg-fd-background p-3">
        <p className="text-xs text-fd-muted-foreground">Результат</p>
        <p className="mt-1 break-words font-mono text-sm font-semibold">{result || '—'}</p>
      </div>
    </div>
  );
}

function CrackView({ widgetId, task }: { widgetId: string; task: CrackTask }) {
  const awardXp = useGameStore((s) => s.awardXp);
  const encoded = React.useMemo(() => caesarShift(task.plaintext, task.shift), [task]);
  const [shift, setShift] = React.useState(0);
  const decoded = caesarShift(encoded, shift);
  const correct = decoded === task.plaintext;

  const awarded = React.useRef(false);
  React.useEffect(() => {
    if (correct && !awarded.current) {
      awarded.current = true;
      saveScore(widgetId, 100);
      awardXp(35, 'cipher-master');
    }
  }, [correct, awardXp, widgetId]);

  const id = React.useId();

  return (
    <div className="space-y-3">
      <p className="text-sm text-fd-muted-foreground">
        Перехвачено зашифрованное сообщение. Подбери сдвиг, чтобы прочитать его:
      </p>
      <div className="rounded-lg border border-fd-border bg-fd-muted/30 p-3 text-center font-mono text-sm">
        {encoded}
      </div>

      <div className="flex items-center gap-3">
        <label htmlFor={`${id}-s`} className="text-xs font-semibold">
          Сдвиг: <span className="font-mono">{shift}</span>
        </label>
        <input
          id={`${id}-s`}
          type="range"
          min={0}
          max={MAX_SHIFT}
          value={shift}
          onChange={(e) => setShift(Number(e.target.value))}
          className="flex-1 accent-fd-primary"
        />
      </div>

      <div
        className={cn(
          'rounded-lg border p-3 text-center font-mono text-sm font-semibold',
          correct ? 'border-edu-ok bg-edu-ok/10 text-edu-ok' : 'border-fd-border bg-fd-background',
        )}
      >
        {decoded}
      </div>

      {correct && (
        <p
          role="status"
          className="flex items-center justify-center gap-2 rounded-lg border border-edu-ok/40 bg-edu-ok/10 p-3 text-sm font-semibold text-edu-ok"
        >
          <Check className="size-4" aria-hidden /> Расшифровано! +35 XP
        </p>
      )}
    </div>
  );
}

export interface CaesarCipherProps {
  widgetId?: string;
  task?: CrackTask;
}

export function CaesarCipher({ widgetId = WIDGET_ID, task = DEFAULT_TASK }: CaesarCipherProps) {
  const [mode, setMode] = React.useState<Mode>('cipher');
  const score = useScore(widgetId);

  return (
    <Panel className="not-prose my-6 overflow-hidden">
      <header className="flex items-center justify-between gap-3 border-b border-fd-border bg-fd-muted/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-subject-cs/10 text-subject-cs">
            <Lock className="size-4" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-bold leading-tight">Шифр Цезаря</p>
            <p className="text-xs text-fd-muted-foreground">сдвиг по алфавиту</p>
          </div>
        </div>
        <XpBadge />
      </header>

      <div className="flex gap-1 border-b border-fd-border p-1.5" role="group" aria-label="Режим тренажёра">
        {(['cipher', 'crack'] as const).map((m) => (
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
            {m === 'cipher' ? 'Шифратор' : 'Взломай'}
          </button>
        ))}
      </div>

      <div className="p-4">{mode === 'cipher' ? <CipherView /> : <CrackView widgetId={widgetId} task={task} />}</div>

      {score && score.attempts > 0 && (
        <footer className="border-t border-fd-border px-4 py-2 text-xs text-fd-muted-foreground">
          Лучший результат: {score.best} · попыток: {score.attempts}
        </footer>
      )}
    </Panel>
  );
}

export default CaesarCipher;
