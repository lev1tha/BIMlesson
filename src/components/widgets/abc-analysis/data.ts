import type { AbcTask, Product } from './logic';

/** Магазин стройматериалов «Курулуш Маркет» (Ош), выручка январь–июнь, сом — те же данные, что в лекции. */
export const DEFAULT_PRODUCTS: Product[] = [
  { id: 'cement', name: 'Цемент М400, мешок', monthly: [182000, 176000, 190000, 185000, 179000, 188000] },
  { id: 'paint', name: 'Краска фасадная 10 л', monthly: [60000, 95000, 140000, 150000, 120000, 70000] },
  { id: 'screws', name: 'Саморезы, коробка', monthly: [41000, 43000, 40000, 42000, 44000, 41000] },
  { id: 'wallpaper', name: 'Обои флизелиновые', monthly: [38000, 30000, 45000, 34000, 42000, 31000] },
  { id: 'putty', name: 'Шпаклёвка 25 кг', monthly: [30000, 29000, 31000, 32000, 30000, 28000] },
  { id: 'laminate', name: 'Ламинат 33 класс', monthly: [0, 45000, 20000, 0, 60000, 10000] },
  { id: 'gloves', name: 'Перчатки рабочие', monthly: [9000, 9500, 8800, 9200, 9100, 9400] },
  { id: 'roller', name: 'Валик малярный', monthly: [7000, 5000, 9000, 6000, 8000, 5000] },
  { id: 'glue', name: 'Клей для плитки', monthly: [6000, 6200, 5900, 6100, 6000, 6100] },
  { id: 'garland', name: 'Новогодняя гирлянда', monthly: [0, 0, 0, 0, 0, 30000] },
];

export const MONTHS = ['янв', 'фев', 'мар', 'апр', 'май', 'июн'];

/** Ответы сверены с расчётом в тестах. */
export const DEFAULT_TASKS: AbcTask[] = [
  {
    kind: 'cell',
    id: 'wallpaper',
    question: 'Обои флизелиновые: с ними накопленная доля уже 82,24%. В какую клетку матрицы они попадают?',
    productId: 'wallpaper',
  },
  {
    kind: 'cell',
    id: 'laminate',
    question: 'Ламинат продаётся то густо, то пусто: в двух месяцах из шести — ноль. Его клетка?',
    productId: 'laminate',
  },
  {
    kind: 'cell',
    id: 'gloves',
    question: 'Перчатки рабочие — мелочь, но продаются как часы. Какая у них клетка?',
    productId: 'gloves',
  },
  {
    kind: 'policy',
    id: 'policy-az',
    question: 'Краска фасадная попала в AZ: много денег, но спрос скачет по сезону. Как ей управлять?',
    cell: 'AZ',
    options: ['never-out', 'to-order', 'periodic', 'cut'],
  },
  {
    kind: 'policy',
    id: 'policy-cz',
    question: 'Новогодняя гирлянда — CZ. Что с ней делать в обычном магазине стройматериалов?',
    cell: 'CZ',
    options: ['never-out', 'buffer', 'regular', 'cut'],
  },
];
