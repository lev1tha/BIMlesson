import type { TestCase } from './logic';

export interface CodeTaskDef {
  id: string;
  title: string;
  /** Имя функции, которую студент должен определить. */
  functionName: string;
  description: string;
  /** Стартовый код в редакторе. */
  starter: string;
  cases: TestCase[];
  hint?: string;
}

/** Дефолтная задача — виджет рендерится без пропсов. */
export const DEFAULT_TASK: CodeTaskDef = {
  id: 'sum-array',
  title: 'Сумма массива',
  functionName: 'sumArray',
  description: 'Напиши функцию sumArray(arr), которая возвращает сумму всех чисел массива.',
  starter: 'function sumArray(arr) {\n  // твой код здесь\n  \n}\n',
  cases: [
    { args: [[1, 2, 3]], expected: 6 },
    { args: [[]], expected: 0 },
    { args: [[-5, 5]], expected: 0 },
    { args: [[10]], expected: 10 },
    { args: [[100, 200, 300]], expected: 600 },
  ],
  hint: 'Заведи переменную-накопитель (sum = 0) и пройди по массиву циклом, прибавляя элементы. Или используй arr.reduce.',
};
