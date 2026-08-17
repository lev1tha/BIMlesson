/**
 * Чистая логика тренажёра RAID-массивов — без React и без DOM.
 * Ёмкость, отказоустойчивость и проверка выбора уровня под бизнес-задачу.
 * Покрыто тестами.
 */

export type RaidLevel = 'RAID0' | 'RAID1' | 'RAID5' | 'RAID6' | 'RAID10';

export interface RaidInfo {
  label: string;
  minDisks: number;
  evenOnly?: boolean;
  desc: string;
}

export const RAID_INFO: Record<RaidLevel, RaidInfo> = {
  RAID0: { label: 'RAID 0 · чередование', minDisks: 2, desc: 'Максимум скорости и объёма, нулевая защита' },
  RAID1: { label: 'RAID 1 · зеркало', minDisks: 2, desc: 'Полная копия на каждом диске' },
  RAID5: { label: 'RAID 5 · чётность', minDisks: 3, desc: 'Переживает отказ одного диска, теряется один диск объёма' },
  RAID6: { label: 'RAID 6 · двойная чётность', minDisks: 4, desc: 'Переживает отказ двух дисков сразу' },
  RAID10: { label: 'RAID 10 · зеркало+чередование', minDisks: 4, evenOnly: true, desc: 'Скорость RAID 0 и защита RAID 1, дорого по дискам' },
};

export const RAID_ORDER: RaidLevel[] = ['RAID0', 'RAID1', 'RAID5', 'RAID6', 'RAID10'];

export interface RaidConfig {
  level: RaidLevel;
  disks: number;
  sizeTb: number;
}

export interface RaidResult {
  valid: boolean;
  error?: string;
  /** Полезная ёмкость массива. */
  capacityTb: number;
  /** Суммарный «сырой» объём всех дисков. */
  rawTb: number;
  /** Сколько объёма ушло на защиту. */
  overheadTb: number;
  /** Отказ скольких дисков массив переживает гарантированно. */
  tolerance: number;
  /** Для RAID 10: сколько может пережить в удачном случае (по одному из пары). */
  toleranceMax?: number;
  explanation: string;
}

const invalid = (error: string): RaidResult => ({
  valid: false,
  error,
  capacityTb: 0,
  rawTb: 0,
  overheadTb: 0,
  tolerance: 0,
  explanation: '',
});

export function evaluateRaid(config: RaidConfig): RaidResult {
  const { level } = config;
  const info = RAID_INFO[level];
  const disks = Math.floor(config.disks);
  const sizeTb = config.sizeTb;

  if (!Number.isFinite(sizeTb) || sizeTb <= 0) {
    return invalid('Объём диска должен быть больше нуля.');
  }
  if (!Number.isFinite(config.disks) || disks < info.minDisks) {
    return invalid(`${info.label.split(' · ')[0]} требует минимум ${info.minDisks} диска(ов).`);
  }
  if (info.evenOnly && disks % 2 !== 0) {
    return invalid('RAID 10 собирается из зеркальных пар — число дисков должно быть чётным.');
  }

  const rawTb = disks * sizeTb;
  let capacityTb = 0;
  let tolerance = 0;
  let toleranceMax: number | undefined;
  let explanation = '';

  switch (level) {
    case 'RAID0':
      capacityTb = rawTb;
      tolerance = 0;
      explanation = `Данные нарезаны на все ${disks} диска(ов): объём и скорость складываются, но отказ ЛЮБОГО диска уничтожает весь массив. Чем больше дисков, тем выше риск.`;
      break;
    case 'RAID1':
      capacityTb = sizeTb;
      tolerance = disks - 1;
      explanation = `Каждый диск хранит полную копию: полезен объём только одного диска, зато массив жив, пока цел хотя бы один из ${disks}.`;
      break;
    case 'RAID5':
      capacityTb = (disks - 1) * sizeTb;
      tolerance = 1;
      explanation = `Контрольные суммы (чётность) размазаны по всем дискам и занимают объём одного: потеряв любой один диск, массив пересчитает данные. Второй отказ до замены — потеря всего.`;
      break;
    case 'RAID6':
      capacityTb = (disks - 2) * sizeTb;
      tolerance = 2;
      explanation = `Двойная чётность занимает объём двух дисков, зато массив переживает отказ двух любых дисков — важно для больших дисков, где восстановление идёт сутками.`;
      break;
    case 'RAID10':
      capacityTb = (disks / 2) * sizeTb;
      tolerance = 1;
      toleranceMax = disks / 2;
      explanation = `${disks / 2} зеркальных пар, поверх — чередование: быстро читает и пишет, гарантированно держит отказ одного диска (в удачном раскладе — по одному из каждой пары, до ${disks / 2}).`;
      break;
  }

  return {
    valid: true,
    capacityTb,
    rawTb,
    overheadTb: rawTb - capacityTb,
    tolerance,
    toleranceMax,
    explanation,
  };
}

/** «6 ТБ», «1.5 ТБ» — без хвоста из нулей. */
export function formatTb(value: number): string {
  return `${Number(value.toFixed(1))} ТБ`;
}

export interface RaidTask {
  id: string;
  goal: string;
  options: RaidLevel[];
  correct: RaidLevel;
  why: string;
  /** Объяснения типичных неверных выборов; для остальных — общее объяснение. */
  wrongReasons?: Partial<Record<RaidLevel, string>>;
}

export interface CheckResult {
  correct: boolean;
  reason: string;
}

export function checkRaid(task: RaidTask, chosen: RaidLevel): CheckResult {
  if (chosen === task.correct) {
    return { correct: true, reason: `Верно! ${task.why}` };
  }
  const specific = task.wrongReasons?.[chosen];
  if (specific) {
    return { correct: false, reason: specific };
  }
  return {
    correct: false,
    reason: `${RAID_INFO[chosen].label.split(' · ')[0]} здесь не лучший выбор. Правильный ответ — ${RAID_INFO[task.correct].label.split(' · ')[0]}: ${task.why}`,
  };
}
