import type { Base, ConvTask } from './logic';

export const DEFAULT_CONVERTER: { value: number; base: Base } = { value: 42, base: 10 };

export const DEFAULT_TASKS: ConvTask[] = [
  { id: 't1', value: 5, from: 10, to: 2 }, // 101
  { id: 't2', value: 13, from: 10, to: 2 }, // 1101
  { id: 't3', value: 255, from: 10, to: 16 }, // FF
  { id: 't4', value: 10, from: 2, to: 10 }, // 1010 -> 10
  { id: 't5', value: 16, from: 10, to: 16 }, // 10
];
