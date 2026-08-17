/**
 * Чистая логика тренажёра регулярных выражений — без React и без DOM.
 * Проверяет пользовательский паттерн против набора строк «должно/не должно совпадать».
 * Покрыто тестами (RegExp работает и в Node, так что логика полностью проверяема).
 */

export interface RegexCase {
  text: string;
  shouldMatch: boolean;
}

export interface CaseResult {
  text: string;
  shouldMatch: boolean;
  matches: boolean;
  correct: boolean;
}

export interface RegexEval {
  valid: boolean;
  error: string | null;
  results: CaseResult[];
  allCorrect: boolean;
}

/** Компилирует паттерн и проверяет его на всех кейсах. Невалидный паттерн → valid:false. */
export function evaluateRegex(pattern: string, flags: string, cases: readonly RegexCase[]): RegexEval {
  if (pattern === '') {
    return { valid: false, error: 'Пустой паттерн.', results: [], allCorrect: false };
  }
  let re: RegExp;
  try {
    re = new RegExp(pattern, flags);
  } catch (e) {
    return { valid: false, error: e instanceof Error ? e.message : String(e), results: [], allCorrect: false };
  }

  const results = cases.map((c) => {
    re.lastIndex = 0; // на случай флага g/y — .test() иначе «двигает» позицию
    const matches = re.test(c.text);
    return { text: c.text, shouldMatch: c.shouldMatch, matches, correct: matches === c.shouldMatch };
  });

  return {
    valid: true,
    error: null,
    results,
    allCorrect: results.length > 0 && results.every((r) => r.correct),
  };
}

/** Число совпадений паттерна в тексте (для режима песочницы). null при ошибке. */
export function countMatches(pattern: string, flags: string, text: string): number | null {
  if (pattern === '') return null;
  try {
    const re = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g');
    const found = text.match(re);
    return found ? found.length : 0;
  } catch {
    return null;
  }
}
