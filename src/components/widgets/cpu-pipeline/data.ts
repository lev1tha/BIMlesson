import { STAGE_COUNT, type CycleTask } from './logic';

/** Дефолт для режима «Конвейер» — виджет рендерится без пропсов. */
export const DEFAULT_SIM = { instructions: 5, stages: STAGE_COUNT } as const;

/** Дефолтные задачи режима «Посчитай такты». */
export const DEFAULT_TASKS: CycleTask[] = [
  { id: 't1', label: '5 инструкций, конвейер из 4 стадий', n: 5, stages: 4 },
  { id: 't2', label: '10 инструкций, 4 стадии', n: 10, stages: 4 },
  { id: 't3', label: '4 инструкции, конвейер из 5 стадий', n: 4, stages: 5 },
];
