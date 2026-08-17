/**
 * Чистая логика тренажёра логических вентилей — без React и без DOM.
 * Значения вентилей и таблицы истинности. Покрыто тестами.
 */

export type Gate = 'AND' | 'OR' | 'XOR' | 'NAND' | 'NOT';

export function evalGate(gate: Gate, a: boolean, b: boolean): boolean {
  switch (gate) {
    case 'AND':
      return a && b;
    case 'OR':
      return a || b;
    case 'XOR':
      return a !== b;
    case 'NAND':
      return !(a && b);
    case 'NOT':
      return !a;
  }
}

export interface TruthRow {
  a: boolean;
  b?: boolean;
  out: boolean;
}

export function truthTable(gate: Gate): TruthRow[] {
  if (gate === 'NOT') {
    return [false, true].map((a) => ({ a, out: evalGate(gate, a, false) }));
  }
  const rows: TruthRow[] = [];
  for (const a of [false, true]) {
    for (const b of [false, true]) {
      rows.push({ a, b, out: evalGate(gate, a, b) });
    }
  }
  return rows;
}

export interface GateTask {
  gate: Gate;
  a: boolean;
  b: boolean;
}

export interface CheckResult {
  correct: boolean;
  reason: string;
}

export function checkGateAnswer(task: GateTask, answer: boolean): CheckResult {
  const expected = evalGate(task.gate, task.a, task.b);
  if (answer === expected) {
    return { correct: true, reason: 'Верно!' };
  }
  return { correct: false, reason: `Нет: ${task.gate} даёт ${expected ? '1' : '0'}.` };
}
