import { describe, expect, it } from 'vitest';
import {
  checkDepartmentPrefix,
  formatIp,
  isValidPrefix,
  maskFromPrefix,
  parseIp,
  requiredPrefixForHosts,
  subnetInfo,
  usableHostsForPrefix,
  type DepartmentTask,
} from './logic';

const ip = (s: string): number => {
  const r = parseIp(s);
  if (!r.ok) throw new Error(`невалидный IP в тесте: ${s}`);
  return r.value;
};

describe('parseIp', () => {
  it('парсит корректный адрес', () => {
    expect(parseIp('192.168.1.0')).toEqual({ ok: true, value: 0xc0a80100 });
  });
  it('парсит границы 0.0.0.0 и 255.255.255.255', () => {
    expect(parseIp('0.0.0.0')).toEqual({ ok: true, value: 0 });
    expect(parseIp('255.255.255.255')).toEqual({ ok: true, value: 0xffffffff });
  });
  it('обрезает пробелы по краям', () => {
    expect(parseIp('  10.0.0.1 ')).toEqual({ ok: true, value: 0x0a000001 });
  });
  it('пустой ввод — ошибка', () => {
    expect(parseIp('   ').ok).toBe(false);
  });
  it('не четыре октета — ошибка', () => {
    expect(parseIp('192.168.1').ok).toBe(false);
    expect(parseIp('192.168.1.0.5').ok).toBe(false);
  });
  it('октет больше 255 — ошибка с пояснением', () => {
    const r = parseIp('192.168.1.256');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('255');
  });
  it('нечисловой или пустой октет — ошибка', () => {
    expect(parseIp('192.168.a.1').ok).toBe(false);
    expect(parseIp('192.168..1').ok).toBe(false);
  });
});

describe('maskFromPrefix / formatIp', () => {
  it('/0 → 0.0.0.0', () => expect(formatIp(maskFromPrefix(0))).toBe('0.0.0.0'));
  it('/24 → 255.255.255.0', () => expect(formatIp(maskFromPrefix(24))).toBe('255.255.255.0'));
  it('/26 → 255.255.255.192', () => expect(formatIp(maskFromPrefix(26))).toBe('255.255.255.192'));
  it('/32 → 255.255.255.255', () => expect(formatIp(maskFromPrefix(32))).toBe('255.255.255.255'));
});

describe('isValidPrefix', () => {
  it('0..32 валидны', () => {
    expect(isValidPrefix(0)).toBe(true);
    expect(isValidPrefix(32)).toBe(true);
  });
  it('вне диапазона и дробные — нет', () => {
    expect(isValidPrefix(-1)).toBe(false);
    expect(isValidPrefix(33)).toBe(false);
    expect(isValidPrefix(24.5)).toBe(false);
  });
});

describe('usableHostsForPrefix', () => {
  it('обычная маска: минус адрес сети и broadcast', () => {
    expect(usableHostsForPrefix(24)).toBe(254);
    expect(usableHostsForPrefix(26)).toBe(62);
    expect(usableHostsForPrefix(30)).toBe(2);
  });
  it('/31 — 2 адреса (RFC 3021)', () => expect(usableHostsForPrefix(31)).toBe(2));
  it('/32 — один хостовый маршрут', () => expect(usableHostsForPrefix(32)).toBe(1));
});

describe('subnetInfo', () => {
  it('192.168.1.0/24', () => {
    const info = subnetInfo(ip('192.168.1.0'), 24);
    expect(formatIp(info.network)).toBe('192.168.1.0');
    expect(formatIp(info.broadcast)).toBe('192.168.1.255');
    expect(formatIp(info.firstHost)).toBe('192.168.1.1');
    expect(formatIp(info.lastHost)).toBe('192.168.1.254');
    expect(info.usableHosts).toBe(254);
    expect(info.totalAddresses).toBe(256);
  });
  it('192.168.1.130/26 → сеть .128, broadcast .191', () => {
    const info = subnetInfo(ip('192.168.1.130'), 26);
    expect(formatIp(info.network)).toBe('192.168.1.128');
    expect(formatIp(info.broadcast)).toBe('192.168.1.191');
    expect(formatIp(info.firstHost)).toBe('192.168.1.129');
    expect(formatIp(info.lastHost)).toBe('192.168.1.190');
    expect(info.usableHosts).toBe(62);
  });
  it('/30 — ровно два хоста', () => {
    const info = subnetInfo(ip('10.0.0.0'), 30);
    expect(formatIp(info.firstHost)).toBe('10.0.0.1');
    expect(formatIp(info.lastHost)).toBe('10.0.0.2');
    expect(info.usableHosts).toBe(2);
  });
  it('/31 — сеть и broadcast работают как хосты', () => {
    const info = subnetInfo(ip('10.0.0.0'), 31);
    expect(formatIp(info.firstHost)).toBe('10.0.0.0');
    expect(formatIp(info.lastHost)).toBe('10.0.0.1');
    expect(info.usableHosts).toBe(2);
    expect(info.totalAddresses).toBe(2);
  });
  it('/32 — единственный адрес', () => {
    const info = subnetInfo(ip('10.1.2.3'), 32);
    expect(formatIp(info.network)).toBe('10.1.2.3');
    expect(formatIp(info.broadcast)).toBe('10.1.2.3');
    expect(info.firstHost).toBe(info.lastHost);
    expect(info.usableHosts).toBe(1);
    expect(info.totalAddresses).toBe(1);
  });
  it('10.0.0.0/8 — большой блок', () => {
    const info = subnetInfo(ip('10.55.55.55'), 8);
    expect(formatIp(info.network)).toBe('10.0.0.0');
    expect(formatIp(info.broadcast)).toBe('10.255.255.255');
    expect(info.usableHosts).toBe(2 ** 24 - 2);
  });
  it('/0 — весь диапазон', () => {
    const info = subnetInfo(ip('8.8.8.8'), 0);
    expect(formatIp(info.network)).toBe('0.0.0.0');
    expect(formatIp(info.broadcast)).toBe('255.255.255.255');
    expect(info.totalAddresses).toBe(2 ** 32);
  });
});

describe('requiredPrefixForHosts', () => {
  it('подбирает минимально достаточную маску', () => {
    expect(requiredPrefixForHosts(2)).toBe(30);
    expect(requiredPrefixForHosts(10)).toBe(28); // 14 хостов
    expect(requiredPrefixForHosts(20)).toBe(27); // 30 хостов
    expect(requiredPrefixForHosts(50)).toBe(26); // 62 хоста
    expect(requiredPrefixForHosts(70)).toBe(25); // 126 хостов
    expect(requiredPrefixForHosts(126)).toBe(25);
    expect(requiredPrefixForHosts(127)).toBe(24); // 254 хоста
    expect(requiredPrefixForHosts(254)).toBe(24);
  });
  it('ноль и отрицательное → /30 (минимальная реальная подсеть)', () => {
    expect(requiredPrefixForHosts(0)).toBe(30);
    expect(requiredPrefixForHosts(-5)).toBe(30);
  });
  it('огромное число хостов → /0', () => {
    expect(requiredPrefixForHosts(2 ** 31)).toBe(0);
  });
});

describe('checkDepartmentPrefix', () => {
  const sales: DepartmentTask = { id: 'sales', name: 'Продажи', hosts: 70 };

  it('переполнение объясняет причину числами', () => {
    const r = checkDepartmentPrefix(sales, 26); // 62 < 70
    expect(r.correct).toBe(false);
    expect(r.reason).toContain('62');
    expect(r.reason).toContain('70');
  });
  it('оптимальная маска — верно', () => {
    expect(checkDepartmentPrefix(sales, 25).correct).toBe(true); // 126 >= 70
  });
  it('слишком широкая маска — расточительно', () => {
    const r = checkDepartmentPrefix(sales, 24); // 254 хватает, но не оптимум
    expect(r.correct).toBe(false);
    expect(r.reason).toContain('расточительно');
  });
  it('невалидный префикс отклоняется', () => {
    expect(checkDepartmentPrefix(sales, 40).correct).toBe(false);
  });
});
