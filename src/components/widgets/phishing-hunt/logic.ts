/**
 * Чистая логика тренажёра «Поймай фишинг» — без React и без DOM.
 * Вердикт по письму (фишинг/настоящее) и разбор красных флагов. Покрыто тестами.
 */

export type FlagId = 'domain' | 'urgency' | 'link' | 'creds' | 'generic' | 'attachment';

export const FLAG_LABELS: Record<FlagId, string> = {
  domain: 'Подозрительный отправитель или домен-двойник',
  urgency: 'Давит срочностью или страхом',
  link: 'Ссылка ведёт не туда, куда написано',
  creds: 'Просит пароль, код или реквизиты',
  generic: 'Безличное обращение и общие слова',
  attachment: 'Неожиданное вложение',
};

export const ALL_FLAGS: FlagId[] = ['domain', 'urgency', 'link', 'creds', 'generic', 'attachment'];

export interface EmailTask {
  id: string;
  from: string;
  subject: string;
  body: string;
  linkText?: string;
  linkHref?: string;
  attachment?: string;
  isPhishing: boolean;
  /** Красные флаги, которые реально есть в письме (пусто для настоящих). */
  flags: FlagId[];
  explanation: string;
}

export type Verdict = 'phish' | 'legit';

export interface VerdictResult {
  correct: boolean;
  reason: string;
}

export function checkVerdict(task: EmailTask, verdict: Verdict): VerdictResult {
  const truth: Verdict = task.isPhishing ? 'phish' : 'legit';
  if (verdict === truth) {
    return {
      correct: true,
      reason: task.isPhishing
        ? 'Верно, это фишинг. Теперь отметьте признаки, которые вас насторожили.'
        : `Верно, письмо настоящее. ${task.explanation}`,
    };
  }
  if (task.isPhishing) {
    return {
      correct: false,
      reason: `Это фишинг. ${task.explanation}`,
    };
  }
  return {
    correct: false,
    reason: `Перестраховка: письмо настоящее. ${task.explanation} Осторожность — хорошо, но подозревать всё подряд тоже мешает работе.`,
  };
}

export interface FlagsResult {
  hit: FlagId[];
  missed: FlagId[];
  extra: FlagId[];
  perfect: boolean;
  reason: string;
}

/** Разбор выбранных признаков: что найдено, что упущено, что лишнее. */
export function evaluateFlags(task: EmailTask, chosen: FlagId[]): FlagsResult {
  const chosenSet = new Set(chosen);
  const truth = new Set(task.flags);
  const hit = task.flags.filter((f) => chosenSet.has(f));
  const missed = task.flags.filter((f) => !chosenSet.has(f));
  const extra = chosen.filter((f) => !truth.has(f));
  const perfect = missed.length === 0 && extra.length === 0 && task.flags.length > 0;

  if (perfect) {
    return { hit, missed, extra, perfect, reason: 'Все признаки найдены точно — так и разбирают письма в службах безопасности.' };
  }
  const parts: string[] = [];
  if (missed.length > 0) {
    parts.push(`Упущено: ${missed.map((f) => FLAG_LABELS[f].toLowerCase()).join('; ')}`);
  }
  if (extra.length > 0) {
    parts.push(`Лишнее: ${extra.map((f) => FLAG_LABELS[f].toLowerCase()).join('; ')} — в этом письме такого признака нет`);
  }
  if (chosen.length === 0) {
    parts.push('Вы не отметили ни одного признака — вернитесь к письму и присмотритесь к отправителю, ссылке и тону');
  }
  return { hit, missed, extra, perfect, reason: parts.join('. ') + '.' };
}

/** Прогресс: письмо считается решённым при верном вердикте. */
export function countSolved(verdicts: ReadonlyMap<string, boolean>): number {
  let n = 0;
  for (const ok of verdicts.values()) if (ok) n++;
  return n;
}
