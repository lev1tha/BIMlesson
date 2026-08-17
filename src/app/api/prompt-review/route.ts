import { reviewPrompt } from '@/components/widgets/prompt-review/logic';

/**
 * Оценка промпта. Единственный виджет с сетью (CLAUDE.md → «Модуль работы с ИИ»).
 *
 * Правила соблюдены:
 * - жёсткий лимит длины входа (MAX_LEN);
 * - примитивный rate-limit по IP (в памяти инстанса — для v1 достаточно);
 * - критерии оценки версионируются в репозитории (logic.ts).
 *
 * Сейчас используется детерминированная эвристика — работает без ключа и без утечки
 * данных наружу. Чтобы подключить настоящую модель: вызвать LLM ЗДЕСЬ, читая ключ
 * ТОЛЬКО из process.env на сервере (никаких NEXT_PUBLIC_*), а критерии положить в
 * системный промпт. При ошибке/отсутствии ключа — возвращать эвристику (фолбэк).
 */

const MAX_LEN = 1000;
const WINDOW_MS = 60_000;
const MAX_REQ = 20;

const hits = new Map<string, { count: number; reset: number }>();

function allow(ip: string): boolean {
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || now > rec.reset) {
    hits.set(ip, { count: 1, reset: now + WINDOW_MS });
    return true;
  }
  if (rec.count >= MAX_REQ) return false;
  rec.count += 1;
  return true;
}

export async function POST(req: Request): Promise<Response> {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  if (!allow(ip)) {
    return Response.json({ error: 'Слишком много запросов. Подожди минуту.' }, { status: 429 });
  }

  let prompt = '';
  try {
    const body = (await req.json()) as { prompt?: unknown };
    if (typeof body.prompt === 'string') prompt = body.prompt;
  } catch {
    return Response.json({ error: 'Некорректный запрос.' }, { status: 400 });
  }

  if (prompt.length > MAX_LEN) {
    return Response.json({ error: `Промпт длиннее ${MAX_LEN} символов.` }, { status: 413 });
  }

  const review = reviewPrompt(prompt);
  return Response.json({ review });
}
