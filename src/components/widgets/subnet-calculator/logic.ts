/**
 * Чистая логика калькулятора подсетей IPv4 — без React и без DOM.
 * Вся математика, валидация и проверка ответов живут здесь и покрыты тестами
 * (CLAUDE.md → «Главное правило тренажёров»).
 */

const U32 = 0xffffffff;

export interface SubnetInfo {
  prefix: number;
  mask: number;
  wildcard: number;
  network: number;
  broadcast: number;
  firstHost: number;
  lastHost: number;
  usableHosts: number;
  totalAddresses: number;
}

export type ParseResult = { ok: true; value: number } | { ok: false; error: string };

/** Разбирает строку IPv4 в беззнаковое 32-битное число. */
export function parseIp(input: string): ParseResult {
  const trimmed = input.trim();
  if (trimmed === '') return { ok: false, error: 'Введите IP-адрес, например 192.168.1.0.' };

  const parts = trimmed.split('.');
  if (parts.length !== 4) {
    return { ok: false, error: 'IPv4 состоит из четырёх октетов через точку: например, 192.168.1.0.' };
  }

  let value = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) {
      return { ok: false, error: `«${part}» — не октет. Октет это целое число от 0 до 255.` };
    }
    const octet = Number(part);
    if (octet > 255) {
      return { ok: false, error: `Октет ${octet} больше 255 — в IPv4 столько не бывает.` };
    }
    value = value * 256 + octet;
  }
  return { ok: true, value: value >>> 0 };
}

export function isValidPrefix(prefix: number): boolean {
  return Number.isInteger(prefix) && prefix >= 0 && prefix <= 32;
}

export function maskFromPrefix(prefix: number): number {
  if (prefix <= 0) return 0;
  if (prefix >= 32) return U32;
  return (U32 << (32 - prefix)) >>> 0;
}

export function formatIp(value: number): string {
  const v = value >>> 0;
  return [(v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255].join('.');
}

/** Сколько адресов реально можно раздать хостам при данной длине маски. */
export function usableHostsForPrefix(prefix: number): number {
  if (prefix >= 32) return 1; // хостовый маршрут /32
  if (prefix === 31) return 2; // point-to-point, RFC 3021 — без резерва
  return 2 ** (32 - prefix) - 2; // минус адрес сети и broadcast
}

export function subnetInfo(ip: number, prefix: number): SubnetInfo {
  const mask = maskFromPrefix(prefix);
  const wildcard = ~mask >>> 0;
  const network = (ip & mask) >>> 0;
  const broadcast = (network | wildcard) >>> 0;
  const totalAddresses = prefix >= 32 ? 1 : 2 ** (32 - prefix);

  let firstHost: number;
  let lastHost: number;
  if (prefix >= 32) {
    firstHost = network;
    lastHost = network;
  } else if (prefix === 31) {
    firstHost = network;
    lastHost = broadcast;
  } else {
    firstHost = (network + 1) >>> 0;
    lastHost = (broadcast - 1) >>> 0;
  }

  return {
    prefix,
    mask,
    wildcard,
    network,
    broadcast,
    firstHost,
    lastHost,
    usableHosts: usableHostsForPrefix(prefix),
    totalAddresses,
  };
}

/** Наименьшая подсеть (самый большой префикс), вмещающая нужное число хостов + сеть + broadcast. */
export function requiredPrefixForHosts(hosts: number): number {
  if (hosts <= 0) return 30;
  const needed = hosts + 2; // адрес сети и broadcast зарезервированы
  let hostBits = 1;
  while (2 ** hostBits < needed) hostBits++;
  return Math.max(0, 32 - hostBits);
}

export interface DepartmentTask {
  id: string;
  name: string;
  hosts: number;
}

export interface CheckResult {
  correct: boolean;
  reason: string;
}

/** Проверяет выбранную студентом маску для отдела и объясняет причину ошибки. */
export function checkDepartmentPrefix(task: DepartmentTask, chosenPrefix: number): CheckResult {
  if (!isValidPrefix(chosenPrefix)) {
    return { correct: false, reason: 'Префикс — целое число от /0 до /32.' };
  }
  const usable = usableHostsForPrefix(chosenPrefix);
  const optimal = requiredPrefixForHosts(task.hosts);

  if (usable < task.hosts) {
    return {
      correct: false,
      reason: `Маска /${chosenPrefix} даёт ${usable} адресов для хостов, а отделу «${task.name}» нужно ${task.hosts} — сеть переполнена. Возьми /${optimal} (${usableHostsForPrefix(optimal)} хостов).`,
    };
  }
  if (chosenPrefix < optimal) {
    return {
      correct: false,
      reason: `/${chosenPrefix} вмещает ${usable} хостов — хватает, но расточительно: адресов уйдёт заметно больше нужного. Оптимально /${optimal} на ${task.hosts} хостов.`,
    };
  }
  return {
    correct: true,
    reason: `Верно: /${chosenPrefix} даёт ${usable} хостов — минимально достаточно для ${task.hosts}.`,
  };
}
