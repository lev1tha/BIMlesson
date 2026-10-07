'use client';

import * as React from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Panel } from '@/components/ui/card';
import { hashString, orderQuestions, seededRng } from './logic';

// Случайное зерно на загрузку страницы. Через useSyncExternalStore: на сервере
// и при гидратации — null (стабильный порядок), на клиенте — случайное.
let clientSeed: number | null = null;
const getClientSeed = () => (clientSeed ??= Math.floor(Math.random() * 2 ** 32));
const getServerSeed = () => null;
const subscribe = () => () => {};

export interface QuizQuestion {
  question: string;
  options: string[];
  /** Индекс правильного варианта в options. */
  answer: number;
  explanation?: string;
}

export interface QuizProps {
  questions?: QuizQuestion[];
}

const DEFAULT_QUESTIONS: QuizQuestion[] = [
  {
    question: 'Сколько адресов можно раздать хостам в сети /26?',
    options: ['64', '62', '30', '126'],
    answer: 1,
    explanation: '2⁶ = 64 адреса всего, минус адрес сети и broadcast → 62 хоста.',
  },
];

export function Quiz({ questions = DEFAULT_QUESTIONS }: QuizProps) {
  const id = React.useId();
  const [selected, setSelected] = React.useState<Record<number, number>>({});
  const pageSeed = React.useSyncExternalStore(subscribe, getClientSeed, getServerSeed);
  // «Пройти заново» сдвигает зерно — варианты перемешиваются ещё раз.
  const [round, setRound] = React.useState(0);
  const orders = React.useMemo(() => {
    if (pageSeed === null) return orderQuestions(questions);
    // Порядок выводится из зерна детерминированно: перерисовка родителя его не меняет,
    // а хеш первого вопроса развязывает несколько квизов на одной странице.
    const seed = (pageSeed ^ hashString(questions[0]?.question ?? '')) + round * 0x9e3779b9;
    return orderQuestions(questions, seededRng(seed));
  }, [questions, pageSeed, round]);

  const restart = () => {
    setSelected({});
    setRound((r) => r + 1);
  };

  const answeredCount = Object.keys(selected).length;
  const correctCount = questions.reduce((n, q, i) => (selected[i] === q.answer ? n + 1 : n), 0);

  return (
    <Panel className="not-prose my-6 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm font-bold">Проверь себя</p>
        <span className="text-xs text-fd-muted-foreground">
          {answeredCount > 0 ? `${correctCount} / ${questions.length}` : `${questions.length} вопр.`}
        </span>
      </div>
      <ol className="space-y-5">
        {questions.map((q, qi) => {
          const chosen = selected[qi];
          const answered = chosen !== undefined;
          return (
            <li key={qi}>
              <fieldset>
                <legend className="mb-2 text-sm font-semibold">{q.question}</legend>
                <div className="space-y-1.5">
                  {orders[qi].map((oi) => {
                    const opt = q.options[oi];
                    const isChosen = chosen === oi;
                    const isCorrect = oi === q.answer;
                    const state = !answered ? 'idle' : isCorrect ? 'ok' : isChosen ? 'bad' : 'idle';
                    return (
                      <label
                        key={oi}
                        className={cn(
                          'flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors',
                          state === 'idle' && 'border-fd-border hover:bg-fd-accent',
                          state === 'ok' && 'border-edu-ok bg-edu-ok/10 text-edu-ok',
                          state === 'bad' && 'border-edu-bad bg-edu-bad/10 text-edu-bad',
                        )}
                      >
                        <input
                          type="radio"
                          name={`${id}-q${qi}`}
                          checked={isChosen}
                          onChange={() => setSelected((s) => ({ ...s, [qi]: oi }))}
                          className="accent-fd-primary"
                        />
                        <span className="flex-1">{opt}</span>
                        {answered && isCorrect && <Check className="size-4 shrink-0" aria-hidden />}
                        {answered && isChosen && !isCorrect && <X className="size-4 shrink-0" aria-hidden />}
                      </label>
                    );
                  })}
                </div>
                {answered && q.explanation && (
                  <p className="mt-2 text-xs text-fd-muted-foreground">{q.explanation}</p>
                )}
              </fieldset>
            </li>
          );
        })}
      </ol>
      {answeredCount > 0 && (
        <button
          type="button"
          onClick={restart}
          className="mt-4 rounded-md border border-fd-border px-3 py-1.5 text-xs font-semibold hover:bg-fd-accent focus-visible:outline-2 focus-visible:outline-fd-ring"
        >
          Пройти заново (варианты перемешаются)
        </button>
      )}
    </Panel>
  );
}

export default Quiz;
