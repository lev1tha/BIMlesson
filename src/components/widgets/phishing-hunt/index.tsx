'use client';

import * as React from 'react';
import { Check, Fish, Link2, Paperclip, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Panel } from '@/components/ui/card';
import { XpBadge } from '@/components/ui/xp-badge';
import { saveScore, useScore } from '@/lib/progress';
import { useGameStore } from '@/lib/store';
import {
  ALL_FLAGS,
  checkVerdict,
  evaluateFlags,
  FLAG_LABELS,
  type EmailTask,
  type FlagId,
  type FlagsResult,
  type Verdict,
  type VerdictResult,
} from './logic';
import { DEFAULT_EMAILS } from './data';

const WIDGET_ID = 'phishing-hunt';

export interface PhishingHuntProps {
  widgetId?: string;
  emails?: EmailTask[];
}

export function PhishingHunt({ widgetId = WIDGET_ID, emails = DEFAULT_EMAILS }: PhishingHuntProps) {
  const awardXp = useGameStore((s) => s.awardXp);
  const score = useScore(widgetId);

  const [index, setIndex] = React.useState(0);
  const [solved, setSolved] = React.useState<ReadonlySet<number>>(() => new Set());
  const [verdict, setVerdict] = React.useState<VerdictResult | null>(null);
  const [chosenFlags, setChosenFlags] = React.useState<ReadonlySet<FlagId>>(() => new Set());
  const [flagsResult, setFlagsResult] = React.useState<FlagsResult | null>(null);

  const email = emails[index];
  const allDone = solved.size === emails.length;
  const showFlagPicker = verdict?.correct && email.isPhishing;

  const awarded = React.useRef(false);
  React.useEffect(() => {
    if (allDone && !awarded.current) {
      awarded.current = true;
      saveScore(widgetId, 100);
      awardXp(40, 'phish-hunter');
    }
  }, [allDone, awardXp, widgetId]);

  const pick = (v: Verdict) => {
    const result = checkVerdict(email, v);
    setVerdict(result);
    if (result.correct) {
      setSolved((prev) => new Set(prev).add(index));
    }
  };

  const toggleFlag = (flag: FlagId) => {
    setFlagsResult(null);
    setChosenFlags((prev) => {
      const next = new Set(prev);
      if (next.has(flag)) next.delete(flag);
      else next.add(flag);
      return next;
    });
  };

  const next = () => {
    for (let step = 1; step <= emails.length; step++) {
      const i = (index + step) % emails.length;
      if (!solved.has(i)) {
        setIndex(i);
        break;
      }
    }
    setVerdict(null);
    setChosenFlags(new Set());
    setFlagsResult(null);
  };

  return (
    <Panel className="not-prose my-6 overflow-hidden">
      <header className="flex items-center justify-between gap-3 border-b border-fd-border bg-fd-muted/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-subject-sec/10 text-subject-sec">
            <Fish className="size-4" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-bold leading-tight">Поймай фишинг</p>
            <p className="text-xs text-fd-muted-foreground">
              решено {solved.size} / {emails.length}
            </p>
          </div>
        </div>
        <XpBadge />
      </header>

      <div className="space-y-3 p-4">
        <div className="rounded-lg border border-fd-border bg-fd-background text-sm">
          <div className="space-y-0.5 border-b border-fd-border px-3 py-2">
            <p className="break-words">
              <span className="text-xs text-fd-muted-foreground">От: </span>
              <span className="font-mono text-xs">{email.from}</span>
            </p>
            <p className="font-semibold">{email.subject}</p>
          </div>
          <p className="px-3 py-2.5 leading-relaxed">{email.body}</p>
          {(email.linkText || email.attachment) && (
            <div className="space-y-1 border-t border-fd-border px-3 py-2 text-xs">
              {email.linkText && (
                <p className="flex flex-wrap items-center gap-1.5 break-all">
                  <Link2 className="size-3.5 shrink-0 text-fd-muted-foreground" aria-hidden />
                  <span className="font-semibold text-subject-cs underline">{email.linkText}</span>
                  <span className="text-fd-muted-foreground">— ведёт на:</span>
                  <span className="font-mono">{email.linkHref}</span>
                </p>
              )}
              {email.attachment && (
                <p className="flex items-center gap-1.5">
                  <Paperclip className="size-3.5 shrink-0 text-fd-muted-foreground" aria-hidden />
                  <span className="font-mono">{email.attachment}</span>
                </p>
              )}
            </div>
          )}
        </div>

        {!verdict?.correct && (
          <div className="flex gap-2">
            {(
              [
                ['phish', 'Фишинг', 'border-edu-bad/50 text-edu-bad hover:bg-edu-bad/10'],
                ['legit', 'Настоящее', 'border-edu-ok/50 text-edu-ok hover:bg-edu-ok/10'],
              ] as const
            ).map(([v, label, cls]) => (
              <button
                key={v}
                type="button"
                onClick={() => pick(v)}
                className={cn(
                  'flex-1 rounded-lg border px-3 py-2 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring',
                  cls,
                )}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {verdict && (
          <p
            role="status"
            className={cn(
              'flex items-start gap-1.5 rounded-lg border p-3 text-sm',
              verdict.correct
                ? 'border-edu-ok/40 bg-edu-ok/10 text-edu-ok'
                : 'border-edu-bad/40 bg-edu-bad/10 text-edu-bad',
            )}
          >
            {verdict.correct ? (
              <Check className="mt-0.5 size-4 shrink-0" aria-hidden />
            ) : (
              <X className="mt-0.5 size-4 shrink-0" aria-hidden />
            )}
            <span>{verdict.reason}</span>
          </p>
        )}

        {showFlagPicker && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-fd-muted-foreground">
              Что именно выдаёт мошенника? Отметьте все признаки:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {ALL_FLAGS.map((flag) => (
                <button
                  key={flag}
                  type="button"
                  aria-pressed={chosenFlags.has(flag)}
                  onClick={() => toggleFlag(flag)}
                  className={cn(
                    'rounded-full border px-2.5 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring',
                    chosenFlags.has(flag)
                      ? 'border-subject-sec bg-subject-sec/10 text-subject-sec'
                      : 'border-fd-border hover:bg-fd-accent',
                  )}
                >
                  {FLAG_LABELS[flag]}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setFlagsResult(evaluateFlags(email, [...chosenFlags]))}
              className="rounded-md bg-fd-primary px-3 py-1.5 text-sm font-semibold text-fd-primary-foreground hover:bg-fd-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
            >
              Проверить признаки
            </button>
            {flagsResult && (
              <p
                role="status"
                className={cn(
                  'rounded-lg border p-3 text-sm',
                  flagsResult.perfect
                    ? 'border-edu-ok/40 bg-edu-ok/10 text-edu-ok'
                    : 'border-edu-warn/40 bg-edu-warn/10 text-edu-warn',
                )}
              >
                {flagsResult.reason}
              </p>
            )}
            {flagsResult && (
              <p className="rounded-lg border border-fd-border bg-fd-muted/30 p-3 text-xs text-fd-muted-foreground">
                {email.explanation}
              </p>
            )}
          </div>
        )}

        {verdict && !allDone && (!email.isPhishing || !verdict.correct || flagsResult) && (
          <button
            type="button"
            onClick={next}
            className="rounded-md bg-fd-primary px-3 py-1.5 text-sm font-semibold text-fd-primary-foreground hover:bg-fd-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
          >
            Следующее письмо
          </button>
        )}

        {allDone && (
          <p
            role="status"
            className="flex items-center gap-2 rounded-lg border border-edu-ok/40 bg-edu-ok/10 p-3 text-sm font-semibold text-edu-ok"
          >
            <Check className="size-4" aria-hidden /> Все письма разобраны! +40 XP. Теперь главное — та же внимательность в настоящей почте.
          </p>
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

export default PhishingHunt;
