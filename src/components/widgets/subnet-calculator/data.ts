import type { DepartmentTask } from './logic';

export interface SubnetScenario {
  /** Базовая сеть предприятия, которую делим на отделы. */
  baseIp: string;
  basePrefix: number;
  departments: DepartmentTask[];
}

/** Дефолтные значения режима «Калькулятор» — виджет рендерится без пропсов. */
export const DEFAULT_EXPLORER = { ip: '192.168.1.0', prefix: 26 } as const;

/** Дефолтный бизнес-сценарий режима «Спланируй сеть». */
export const DEFAULT_SCENARIO: SubnetScenario = {
  baseIp: '192.168.10.0',
  basePrefix: 24,
  departments: [
    { id: 'sales', name: 'Продажи', hosts: 70 },
    { id: 'support', name: 'Поддержка', hosts: 25 },
    { id: 'it', name: 'IT-отдел', hosts: 10 },
  ],
};
