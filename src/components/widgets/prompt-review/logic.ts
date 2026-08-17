/**
 * Чистая логика оценки промпта — без React и без DOM.
 * Детерминированная эвристика по критериям хорошего промпта. Используется и на
 * сервере (route handler), и как офлайн-фолбэк в виджете. Покрыто тестами.
 *
 * Критерии версионируются здесь, в репозитории (CLAUDE.md → «Модуль работы с ИИ»).
 */

export interface PromptCriterion {
  id: string;
  label: string;
  ok: boolean;
  tip: string;
}

export interface PromptReview {
  score: number;
  max: number;
  criteria: PromptCriterion[];
  summary: string;
}

export function reviewPrompt(prompt: string): PromptReview {
  const text = prompt.trim();
  const lower = text.toLowerCase();
  const words = text ? text.split(/\s+/).length : 0;

  const criteria: PromptCriterion[] = [
    {
      id: 'length',
      label: 'Достаточно деталей',
      ok: words >= 12,
      tip: 'Слишком коротко. Опиши задачу подробнее — модель не умеет читать мысли.',
    },
    {
      id: 'role',
      label: 'Задана роль модели',
      ok: /ты\s|выступи|представь|как эксперт|в роли|act as|you are/.test(lower),
      tip: 'Назначь роль: «Ты — опытный маркетолог…». Это задаёт тон и глубину ответа.',
    },
    {
      id: 'context',
      label: 'Есть контекст задачи',
      ok: /для|потому|чтобы|аудитори|цель|контекст|because|audience/.test(lower),
      tip: 'Добавь контекст: для кого, зачем, что уже известно.',
    },
    {
      id: 'format',
      label: 'Указан формат ответа',
      ok: /списк|пункт|таблиц|формат|json|markdown|абзац|шаг|bullet|table|step/.test(lower),
      tip: 'Уточни формат: список, таблица, N пунктов, JSON — иначе получишь «простыню».',
    },
    {
      id: 'constraints',
      label: 'Есть ограничения и критерии',
      ok: /не более|не менее|минимум|максимум|избегай|только|тон|стиль|длин|words?|avoid|limit/.test(lower),
      tip: 'Задай рамки: объём, стиль, чего избегать. Это резко повышает попадание.',
    },
  ];

  const score = criteria.filter((c) => c.ok).length;
  const max = criteria.length;

  let summary: string;
  if (words === 0) {
    summary = 'Пустой промпт. Напиши, что ты хочешь от модели.';
  } else if (score <= 1) {
    summary = 'Заготовка. Модель будет много додумывать — жди общего, «водянистого» ответа.';
  } else if (score <= 3) {
    summary = 'Неплохо, но есть куда расти. Добавь недостающее из списка ниже.';
  } else {
    summary = 'Сильный промпт! Роль, контекст и формат на месте.';
  }

  return { score, max, criteria, summary };
}
