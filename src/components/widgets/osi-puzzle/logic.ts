/**
 * Чистая логика тренажёра по модели OSI — без React и без DOM.
 * Данные об уровнях и проверка порядка инкапсуляции; всё покрыто тестами
 * (CLAUDE.md → «Главное правило тренажёров»).
 */

export type Pdu = 'Данные' | 'Сегмент' | 'Пакет' | 'Кадр' | 'Биты';

export interface OsiLayer {
  number: number; // 1..7
  ru: string;
  en: string;
  pdu: Pdu;
  /** Что уровень добавляет к сообщению при инкапсуляции. */
  adds: string;
  examples: string[];
  /** Зачем это бизнесу / где обычно ломается. */
  business: string;
}

/** Уровни заданы сверху вниз — в порядке инкапсуляции, от L7 к L1. */
export const OSI_LAYERS: readonly OsiLayer[] = [
  {
    number: 7,
    ru: 'Прикладной',
    en: 'Application',
    pdu: 'Данные',
    adds: 'сами данные приложения',
    examples: ['HTTP', 'DNS', 'SMTP'],
    business: 'Интерфейс, с которым работает пользователь: браузер, почта, клиент ERP.',
  },
  {
    number: 6,
    ru: 'Представления',
    en: 'Presentation',
    pdu: 'Данные',
    adds: 'шифрование и кодировку',
    examples: ['TLS/SSL', 'UTF-8', 'JPEG'],
    business: 'Здесь HTTPS шифрует платёжные данные — без L6 номер карты ушёл бы открытым текстом.',
  },
  {
    number: 5,
    ru: 'Сеансовый',
    en: 'Session',
    pdu: 'Данные',
    adds: 'управление сеансом',
    examples: ['Сессии', 'RPC', 'Сокеты'],
    business: 'Держит сессию входа в интернет-банк, пока вы переходите между страницами.',
  },
  {
    number: 4,
    ru: 'Транспортный',
    en: 'Transport',
    pdu: 'Сегмент',
    adds: 'TCP/UDP-заголовок с номерами портов',
    examples: ['TCP', 'UDP', 'Порты'],
    business: 'Гарантирует, что заказ дойдёт целиком, и указывает порт нужного сервиса.',
  },
  {
    number: 3,
    ru: 'Сетевой',
    en: 'Network',
    pdu: 'Пакет',
    adds: 'IP-заголовок с IP-адресами',
    examples: ['IP', 'ICMP', 'Маршрутизаторы'],
    business: 'Прокладывает маршрут между офисами и дата-центрами по IP.',
  },
  {
    number: 2,
    ru: 'Канальный',
    en: 'Data Link',
    pdu: 'Кадр',
    adds: 'MAC-заголовок с MAC-адресами',
    examples: ['Ethernet', 'MAC', 'Коммутаторы'],
    business: 'Доставляет кадр соседу в пределах офисной сети по MAC-адресу.',
  },
  {
    number: 1,
    ru: 'Физический',
    en: 'Physical',
    pdu: 'Биты',
    adds: 'передачу битов по среде',
    examples: ['Кабель', 'Wi-Fi', 'Оптоволокно'],
    business: 'Сам провод или радиоканал: сюда упирается реальная пропускная способность.',
  },
];

/** Эталонный порядок сверху вниз: [7, 6, 5, 4, 3, 2, 1]. */
export const CORRECT_ORDER: readonly number[] = OSI_LAYERS.map((l) => l.number);

export function layerByNumber(n: number): OsiLayer | undefined {
  return OSI_LAYERS.find((l) => l.number === n);
}

export interface OrderCheck {
  correct: boolean;
  /** Совпадение по каждому слоту сверху вниз. */
  correctSlots: boolean[];
  /** Объяснение первой ошибки или null, если всё верно. */
  firstError: string | null;
}

/** Проверяет расстановку уровней (сверху вниз) и объясняет первую ошибку. */
export function checkStackOrder(order: readonly number[]): OrderCheck {
  const correctSlots = order.map((num, i) => num === CORRECT_ORDER[i]);
  const correct = order.length === CORRECT_ORDER.length && correctSlots.every(Boolean);

  let firstError: string | null = null;
  const wrongIndex = correctSlots.findIndex((ok) => !ok);
  if (wrongIndex !== -1) {
    const expected = layerByNumber(CORRECT_ORDER[wrongIndex]);
    const actual = layerByNumber(order[wrongIndex]);
    if (expected && actual) {
      firstError = `Позиция ${wrongIndex + 1} сверху: должен быть «${expected.ru}» (L${expected.number}), а стоит «${actual.ru}» (L${actual.number}). Инкапсуляция идёт сверху вниз, от L7 к L1.`;
    } else {
      firstError = `Позиция ${wrongIndex + 1} заполнена неверно.`;
    }
  }

  return { correct, correctSlots, firstError };
}
