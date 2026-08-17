export const DEFAULT_TEXT = 'привет мир';
export const DEFAULT_SHIFT = 3;

export interface CrackTask {
  plaintext: string;
  shift: number;
}

/** Сообщение для взлома: зашифровано сдвигом, студент подбирает сдвиг для расшифровки. */
export const DEFAULT_TASK: CrackTask = {
  plaintext: 'криптография',
  shift: 7,
};
