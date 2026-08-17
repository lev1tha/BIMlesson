import type { Gate, GateTask } from './logic';

export interface GateInfo {
  label: string;
  desc: string;
  unary?: boolean;
}

export const GATE_INFO: Record<Gate, GateInfo> = {
  AND: { label: 'И (AND)', desc: '1, только если ОБА входа 1' },
  OR: { label: 'ИЛИ (OR)', desc: '1, если хотя бы один вход 1' },
  XOR: { label: 'исключающее ИЛИ (XOR)', desc: '1, если входы РАЗНЫЕ' },
  NAND: { label: 'И-НЕ (NAND)', desc: 'обратный AND: 0, только если оба 1' },
  NOT: { label: 'НЕ (NOT)', desc: 'переворачивает вход', unary: true },
};

export const GATE_ORDER: Gate[] = ['AND', 'OR', 'XOR', 'NAND', 'NOT'];

export const DEFAULT_TASKS: GateTask[] = [
  { gate: 'AND', a: true, b: false },
  { gate: 'OR', a: false, b: false },
  { gate: 'XOR', a: true, b: true },
  { gate: 'NAND', a: true, b: true },
  { gate: 'NOT', a: true, b: false },
  { gate: 'AND', a: true, b: true },
];
