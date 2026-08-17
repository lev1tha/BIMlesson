/**
 * Чистая логика тренажёра «конвейер процессора» — без React и без DOM.
 * Стадии, расписание и формулы тактов; всё покрыто тестами
 * (CLAUDE.md → «Главное правило тренажёров»).
 */

export interface PipelineStage {
  name: string;
  short: string;
  desc: string;
}

/** Классический 4-стадийный конвейер. */
export const STAGES: readonly PipelineStage[] = [
  { name: 'Выборка', short: 'IF', desc: 'достать инструкцию из памяти по адресу из счётчика команд (PC)' },
  { name: 'Декодирование', short: 'ID', desc: 'понять, что это за команда и какие нужны регистры и данные' },
  { name: 'Исполнение', short: 'EX', desc: 'выполнить операцию в АЛУ: сложить, сравнить, посчитать адрес' },
  { name: 'Запись', short: 'WB', desc: 'записать результат обратно в регистр' },
];

export const STAGE_COUNT = STAGES.length;

/**
 * На какой стадии находится инструкция `instruction` в такт `cycle` (нумерация с 0),
 * или null, если она ещё не вошла в конвейер или уже вышла.
 */
export function stageAt(instruction: number, cycle: number, stageCount: number = STAGE_COUNT): number | null {
  const stage = cycle - instruction;
  return stage >= 0 && stage < stageCount ? stage : null;
}

/** Тактов с конвейером: заполнение (stageCount) + по одной инструкции за такт. */
export function pipelinedCycles(n: number, stageCount: number = STAGE_COUNT): number {
  if (n <= 0) return 0;
  return stageCount + (n - 1);
}

/** Тактов без конвейера: каждая инструкция ждёт полного прохода предыдущей. */
export function sequentialCycles(n: number, stageCount: number = STAGE_COUNT): number {
  if (n <= 0) return 0;
  return n * stageCount;
}

/** Во сколько раз конвейер быстрее последовательного выполнения. */
export function speedup(n: number, stageCount: number = STAGE_COUNT): number {
  const pipelined = pipelinedCycles(n, stageCount);
  if (pipelined === 0) return 0;
  return sequentialCycles(n, stageCount) / pipelined;
}

export interface CycleTask {
  id: string;
  label: string;
  n: number;
  stages: number;
}

export interface CheckResult {
  correct: boolean;
  reason: string;
}

/** Проверяет ответ «сколько тактов с конвейером» и объясняет формулу. */
export function checkPipelinedAnswer(task: CycleTask, answer: number): CheckResult {
  const total = pipelinedCycles(task.n, task.stages);
  if (answer === total) {
    return {
      correct: true,
      reason: `Верно! ${task.stages} тактов на заполнение конвейера, дальше по одной инструкции за такт: ${task.stages} + (${task.n} − 1) = ${total}.`,
    };
  }
  const seq = sequentialCycles(task.n, task.stages);
  return {
    correct: false,
    reason: `Пока нет. Без конвейера: ${task.n} × ${task.stages} = ${seq} тактов. С конвейером первая инструкция проходит все ${task.stages} стадии, а каждая следующая готова уже через 1 такт: ${task.stages} + (${task.n} − 1) = ${total}.`,
  };
}
