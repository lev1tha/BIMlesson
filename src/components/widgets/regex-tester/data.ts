import type { RegexCase } from './logic';

export interface RegexTask {
  id: string;
  title: string;
  prompt: string;
  flags: string;
  cases: RegexCase[];
  hint?: string;
}

export const DEFAULT_PLAYGROUND = {
  pattern: '\\d+',
  flags: 'g',
  text: 'Заказ 1024 на сумму 500 рублей, доставка 3 дня',
};

export const DEFAULT_TASK: RegexTask = {
  id: 'digits-only',
  title: 'Только цифры',
  prompt: 'Составь регулярку, которая совпадает со строкой ТОЛЬКО из цифр (и не с пустой).',
  flags: '',
  cases: [
    { text: '123', shouldMatch: true },
    { text: '42', shouldMatch: true },
    { text: '007', shouldMatch: true },
    { text: '12a', shouldMatch: false },
    { text: 'abc', shouldMatch: false },
    { text: '', shouldMatch: false },
  ],
  hint: 'Привяжись к началу ^ и концу $, а между ними — одна или больше цифр: ^\\d+$',
};
