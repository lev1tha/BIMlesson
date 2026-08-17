'use client';

import * as React from 'react';
import { Check, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Panel } from '@/components/ui/card';
import { XpBadge } from '@/components/ui/xp-badge';
import { saveScore, useScore } from '@/lib/progress';
import { useGameStore } from '@/lib/store';
import { reviewPrompt, type PromptReview } from './logic';
import { MAX_LEN, PLACEHOLDER } from './data';

const WIDGET_ID = 'prompt-review';

export interface PromptReviewWidgetProps {
  widgetId?: string;
}

export function PromptReviewWidget({ widgetId = WIDGET_ID }: PromptReviewWidgetProps) {
  const awardXp = useGameStore((s) => s.awardXp);
  const score = useScore(widgetId);
  const [prompt, setPrompt] = React.useState('');
  const [review, setReview] = React.useState<PromptReview | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [offline, setOffline] = React.useState(false);
  const awarded = React.useRef(false);

  const applyReview = (r: PromptReview) => {
    setReview(r);
    if (r.score === r.max && !awarded.current) {
      awarded.current = true;
      saveScore(widgetId, 100);
      awardXp(30, 'prompt-master');
    }
  };

  const evaluate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setOffline(false);
    try {
      const res = await fetch('/api/prompt-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) throw new Error('bad status');
      const data = (await res.json()) as { review: PromptReview };
      applyReview(data.review);
    } catch {
      // Сервер недоступен — оцениваем локально теми же критериями (фолбэк по CLAUDE.md).
      applyReview(reviewPrompt(prompt));
      setOffline(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Panel className="not-prose my-6 overflow-hidden">
      <header className="flex items-center justify-between gap-3 border-b border-fd-border bg-fd-muted/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-subject-lit/10 text-subject-lit">
            <Sparkles className="size-4" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-bold leading-tight">Оценка промпта</p>
            <p className="text-xs text-fd-muted-foreground">насколько хорошо ты просишь ИИ</p>
          </div>
        </div>
        <XpBadge />
      </header>

      <div className="space-y-3 p-4">
        <div className="space-y-1.5">
          <label htmlFor={`${widgetId}-input`} className="text-sm font-semibold">
            Твой промпт
          </label>
          <textarea
            id={`${widgetId}-input`}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value.slice(0, MAX_LEN))}
            maxLength={MAX_LEN}
            rows={4}
            placeholder={PLACEHOLDER}
            className="w-full resize-y rounded-lg border border-fd-border bg-fd-background p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
          />
          <div className="flex items-center justify-between text-xs text-fd-muted-foreground">
            <span>
              {prompt.length} / {MAX_LEN}
            </span>
            <button
              type="button"
              onClick={evaluate}
              disabled={loading || !prompt.trim()}
              className="inline-flex items-center gap-1.5 rounded-md bg-fd-primary px-3 py-1.5 text-sm font-semibold text-fd-primary-foreground hover:bg-fd-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring disabled:opacity-60"
            >
              <Sparkles className="size-3.5" aria-hidden />
              {loading ? 'Оцениваю…' : 'Оценить промпт'}
            </button>
          </div>
        </div>

        <div aria-live="polite" className="space-y-2">
          {review && (
            <>
              <div className="flex items-center gap-3 rounded-lg border border-fd-border bg-fd-background p-3">
                <span className="font-mono text-2xl font-bold text-fd-primary">
                  {review.score}/{review.max}
                </span>
                <p className="text-sm">{review.summary}</p>
              </div>
              <ul className="space-y-1.5">
                {review.criteria.map((c) => (
                  <li
                    key={c.id}
                    className={cn(
                      'flex items-start gap-2 rounded-md border p-2 text-sm',
                      c.ok ? 'border-edu-ok/30 bg-edu-ok/5' : 'border-fd-border',
                    )}
                  >
                    {c.ok ? (
                      <Check className="mt-0.5 size-4 shrink-0 text-edu-ok" aria-hidden />
                    ) : (
                      <X className="mt-0.5 size-4 shrink-0 text-fd-muted-foreground" aria-hidden />
                    )}
                    <span>
                      <span className="font-semibold">{c.label}.</span>{' '}
                      {!c.ok && <span className="text-fd-muted-foreground">{c.tip}</span>}
                    </span>
                  </li>
                ))}
              </ul>
              {offline && (
                <p className="text-xs text-fd-muted-foreground">
                  Сервер недоступен — оценка посчитана локально по тому же чек-листу.
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {score && score.attempts > 0 && (
        <footer className="border-t border-fd-border px-4 py-2 text-xs text-fd-muted-foreground">
          Лучший результат: {score.best} · попыток: {score.attempts}
        </footer>
      )}
    </Panel>
  );
}

export default PromptReviewWidget;
