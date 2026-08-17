'use client';

import * as React from 'react';
import { Check, Lightbulb, Play, RotateCcw, Terminal, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Panel } from '@/components/ui/card';
import { XpBadge } from '@/components/ui/xp-badge';
import { saveScore, useScore } from '@/lib/progress';
import { useGameStore } from '@/lib/store';
import { judgeCase, summarize, type CaseOutcome, type RawResult, type TestCase } from './logic';
import { DEFAULT_TASK } from './data';

/**
 * Код студента исполняется в отдельном Web Worker: так бесконечный цикл можно
 * прервать (worker.terminate) по таймауту, не подвесив вкладку. Воркер только
 * запускает функцию на аргументах и возвращает результаты; сравнение — в logic.ts.
 */
const WORKER_SOURCE = `
self.onmessage = function (e) {
  var code = e.data.code, fnName = e.data.fnName, argsList = e.data.argsList;
  var fn;
  try {
    fn = new Function(code + "\\n; return typeof " + fnName + " === 'function' ? " + fnName + " : undefined;")();
  } catch (err) {
    self.postMessage({ compileError: String(err) });
    return;
  }
  if (typeof fn !== 'function') {
    self.postMessage({ compileError: 'Функция ' + fnName + ' не найдена — проверь имя функции.' });
    return;
  }
  var results = [];
  for (var i = 0; i < argsList.length; i++) {
    try {
      results.push({ got: fn.apply(null, argsList[i]) });
    } catch (err) {
      results.push({ error: String(err) });
    }
  }
  self.postMessage({ results: results });
};
`;

let workerUrl: string | null = null;
function getWorkerUrl(): string {
  if (workerUrl) return workerUrl;
  const blob = new Blob([WORKER_SOURCE], { type: 'application/javascript' });
  workerUrl = URL.createObjectURL(blob);
  return workerUrl;
}

interface RunResponse {
  results?: RawResult[];
  error?: string;
}

function runInWorker(code: string, fnName: string, argsList: unknown[][], timeoutMs = 2000): Promise<RunResponse> {
  return new Promise((resolve) => {
    let worker: Worker;
    try {
      worker = new Worker(getWorkerUrl());
    } catch (err) {
      resolve({ error: 'Не удалось запустить исполнитель: ' + String(err) });
      return;
    }
    const timer = setTimeout(() => {
      worker.terminate();
      resolve({ error: 'Превышено время выполнения (2 c). Похоже на бесконечный цикл.' });
    }, timeoutMs);
    worker.onmessage = (e: MessageEvent) => {
      clearTimeout(timer);
      worker.terminate();
      const data = e.data as { compileError?: string; results?: RawResult[] };
      if (data.compileError) resolve({ error: data.compileError });
      else resolve({ results: data.results ?? [] });
    };
    worker.onerror = (e: ErrorEvent) => {
      clearTimeout(timer);
      worker.terminate();
      resolve({ error: e.message || 'Ошибка выполнения кода' });
    };
    worker.postMessage({ code, fnName, argsList });
  });
}

export interface CodeTaskProps {
  widgetId?: string;
  title?: string;
  functionName?: string;
  description?: string;
  starter?: string;
  cases?: TestCase[];
  hint?: string;
}

export function CodeTask(props: CodeTaskProps) {
  const functionName = props.functionName ?? DEFAULT_TASK.functionName;
  const title = props.title ?? DEFAULT_TASK.title;
  const description = props.description ?? DEFAULT_TASK.description;
  const starter = props.starter ?? DEFAULT_TASK.starter;
  const cases = props.cases ?? DEFAULT_TASK.cases;
  const hint = props.hint ?? DEFAULT_TASK.hint;
  const widgetId = props.widgetId ?? `code-${functionName}`;

  const awardXp = useGameStore((s) => s.awardXp);
  const score = useScore(widgetId);
  const id = React.useId();

  const [code, setCode] = React.useState(starter);
  const [outcomes, setOutcomes] = React.useState<CaseOutcome[] | null>(null);
  const [runError, setRunError] = React.useState<string | null>(null);
  const [running, setRunning] = React.useState(false);
  const [showHint, setShowHint] = React.useState(false);
  const awarded = React.useRef(false);

  const summary = outcomes ? summarize(outcomes) : null;

  const run = async () => {
    setRunning(true);
    setRunError(null);
    const res = await runInWorker(code, functionName, cases.map((c) => c.args));
    setRunning(false);

    if (res.error && !res.results) {
      setRunError(res.error);
      setOutcomes(null);
      return;
    }
    const raw = res.results ?? [];
    const judged = cases.map((testCase, i) => judgeCase(testCase, raw[i] ?? { error: 'нет результата' }));
    setOutcomes(judged);

    if (summarize(judged).allPass && !awarded.current) {
      awarded.current = true;
      saveScore(widgetId, 100);
      awardXp(50, widgetId);
    }
  };

  return (
    <Panel className="not-prose my-6 overflow-hidden">
      <header className="flex items-center justify-between gap-3 border-b border-fd-border bg-fd-muted/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-subject-sp/10 text-subject-sp">
            <Terminal className="size-4" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-bold leading-tight">{title}</p>
            <p className="text-xs text-fd-muted-foreground">задача с автопроверкой</p>
          </div>
        </div>
        <XpBadge />
      </header>

      <div className="space-y-3 p-4">
        <p className="text-sm text-fd-muted-foreground">{description}</p>

        <div className="space-y-1.5">
          <label htmlFor={`${id}-code`} className="sr-only">
            Редактор кода
          </label>
          <textarea
            id={`${id}-code`}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            rows={8}
            className="w-full resize-y rounded-lg border border-fd-border bg-fd-background p-3 font-mono text-sm leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={run}
            disabled={running}
            className="inline-flex items-center gap-1.5 rounded-md bg-fd-primary px-3 py-1.5 text-sm font-semibold text-fd-primary-foreground hover:bg-fd-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring disabled:opacity-60"
          >
            <Play className="size-3.5" aria-hidden />
            {running ? 'Проверяю…' : 'Проверить'}
          </button>
          <button
            type="button"
            onClick={() => {
              setCode(starter);
              setOutcomes(null);
              setRunError(null);
            }}
            className="inline-flex items-center gap-1.5 rounded-md border border-fd-border px-3 py-1.5 text-sm font-semibold hover:bg-fd-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
          >
            <RotateCcw className="size-3.5" aria-hidden /> Сброс
          </button>
          {hint && (
            <button
              type="button"
              onClick={() => setShowHint((v) => !v)}
              aria-expanded={showHint}
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold text-fd-muted-foreground hover:bg-fd-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
            >
              <Lightbulb className="size-3.5" aria-hidden /> Подсказка
            </button>
          )}
        </div>

        {showHint && hint && (
          <p className="rounded-lg border border-edu-warn/30 bg-edu-warn/10 p-2.5 text-xs text-fd-foreground">
            {hint}
          </p>
        )}

        <div aria-live="polite" className="space-y-2">
          {runError && (
            <p className="flex items-start gap-2 rounded-lg border border-edu-bad/40 bg-edu-bad/5 p-3 text-sm text-edu-bad">
              <X className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span className="font-mono text-xs">{runError}</span>
            </p>
          )}

          {outcomes && (
            <>
              <div className="overflow-x-auto rounded-lg border border-fd-border">
                <table className="w-full text-left text-xs">
                  <thead className="bg-fd-muted/40 text-fd-muted-foreground">
                    <tr>
                      <th className="px-3 py-1.5 font-semibold">Аргументы</th>
                      <th className="px-3 py-1.5 font-semibold">Ожидалось</th>
                      <th className="px-3 py-1.5 font-semibold">Получили</th>
                      <th className="w-8 px-2 py-1.5" />
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    {outcomes.map((o, i) => (
                      <tr key={i} className="border-t border-fd-border/60">
                        <td className="px-3 py-1.5">{o.args}</td>
                        <td className="px-3 py-1.5">{o.expected}</td>
                        <td className={cn('px-3 py-1.5', o.pass ? '' : 'text-edu-bad')}>
                          {o.error ? <span className="text-edu-bad">{o.error}</span> : o.got}
                        </td>
                        <td className="px-2 py-1.5">
                          {o.pass ? (
                            <Check className="size-4 text-edu-ok" aria-label="верно" />
                          ) : (
                            <X className="size-4 text-edu-bad" aria-label="неверно" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {summary?.allPass ? (
                <p
                  role="status"
                  className="flex items-center gap-2 rounded-lg border border-edu-ok/40 bg-edu-ok/10 p-3 text-sm font-semibold text-edu-ok"
                >
                  <Check className="size-4" aria-hidden /> Все тесты пройдены ({summary.passed}/{summary.total}). +50 XP
                </p>
              ) : (
                <p className="text-sm text-fd-muted-foreground">
                  Пройдено {summary?.passed} из {summary?.total}. Посмотри, где «получили» разошлось с «ожидалось».
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

export default CodeTask;
