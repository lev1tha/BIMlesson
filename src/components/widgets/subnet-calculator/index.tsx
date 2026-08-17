'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check, Network, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Panel } from '@/components/ui/card';
import { saveScore, useScore } from '@/lib/progress';
import { useGameStore } from '@/lib/store';
import { XpBadge } from '@/components/ui/xp-badge';
import { checkDepartmentPrefix, formatIp, parseIp, subnetInfo, type SubnetInfo } from './logic';
import { DEFAULT_EXPLORER, DEFAULT_SCENARIO, type SubnetScenario } from './data';

const WIDGET_ID = 'subnet-calculator';
type Mode = 'explore' | 'plan';

export interface SubnetCalculatorProps {
  widgetId?: string;
  explorer?: { ip: string; prefix: number };
  scenario?: SubnetScenario;
}

function clampPrefix(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.min(32, Math.max(0, Math.trunc(n)));
}

function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-fd-border/60 py-1.5 last:border-0">
      <dt className="text-sm text-fd-muted-foreground">{label}</dt>
      <dd className="font-mono text-sm font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

function Explorer({ initial }: { initial: { ip: string; prefix: number } }) {
  const reduce = useReducedMotion();
  const id = React.useId();
  const [ipInput, setIpInput] = React.useState(initial.ip);
  const [prefix, setPrefix] = React.useState(() => clampPrefix(initial.prefix));

  const parsed = parseIp(ipInput);
  const info: SubnetInfo | null = parsed.ok ? subnetInfo(parsed.value, prefix) : null;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor={`${id}-ip`} className="text-sm font-semibold">
            IP-адрес
          </label>
          <input
            id={`${id}-ip`}
            inputMode="numeric"
            value={ipInput}
            onChange={(e) => setIpInput(e.target.value)}
            placeholder="192.168.1.0"
            aria-invalid={!parsed.ok}
            className={cn(
              'w-full rounded-md border bg-fd-background px-3 py-2 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-fd-ring',
              parsed.ok ? 'border-fd-border' : 'border-edu-bad',
            )}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor={`${id}-prefix`} className="flex items-center justify-between text-sm font-semibold">
            <span>Длина маски</span>
            <span className="font-mono text-fd-muted-foreground">/{prefix}</span>
          </label>
          <div className="flex items-center gap-3">
            <input
              id={`${id}-prefix`}
              type="range"
              min={0}
              max={32}
              value={prefix}
              onChange={(e) => setPrefix(clampPrefix(Number(e.target.value)))}
              className="w-full accent-fd-primary"
            />
            <input
              aria-label="Длина маски в битах"
              type="number"
              min={0}
              max={32}
              value={prefix}
              onChange={(e) => setPrefix(clampPrefix(Number(e.target.value)))}
              className="w-16 rounded-md border border-fd-border bg-fd-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
            />
          </div>
        </div>
      </div>

      <div aria-live="polite">
        {info ? (
          <motion.dl
            key={`${formatIp(info.network)}/${info.prefix}`}
            initial={reduce ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="rounded-lg border border-fd-border bg-fd-background p-3"
          >
            <ResultRow label="Адрес сети" value={formatIp(info.network)} />
            <ResultRow label="Broadcast" value={formatIp(info.broadcast)} />
            <ResultRow
              label="Диапазон хостов"
              value={`${formatIp(info.firstHost)} — ${formatIp(info.lastHost)}`}
            />
            <ResultRow label="Маска" value={formatIp(info.mask)} />
            <ResultRow label="Адресов для хостов" value={info.usableHosts.toLocaleString('ru-RU')} />
          </motion.dl>
        ) : (
          <p className="flex items-start gap-2 rounded-lg border border-edu-bad/40 bg-edu-bad/5 p-3 text-sm text-edu-bad">
            <X className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>{parsed.ok ? '' : parsed.error}</span>
          </p>
        )}
      </div>
    </div>
  );
}

function Planner({ scenario, widgetId }: { scenario: SubnetScenario; widgetId: string }) {
  const awardXp = useGameStore((s) => s.awardXp);
  const id = React.useId();
  const [choices, setChoices] = React.useState<Record<string, number>>(() =>
    Object.fromEntries(scenario.departments.map((d) => [d.id, scenario.basePrefix])),
  );

  const rows = scenario.departments.map((dept) => {
    const prefix = choices[dept.id] ?? scenario.basePrefix;
    return { dept, prefix, result: checkDepartmentPrefix(dept, prefix) };
  });
  const allCorrect = rows.every((r) => r.result.correct);

  const awarded = React.useRef(false);
  React.useEffect(() => {
    if (allCorrect && !awarded.current) {
      awarded.current = true;
      saveScore(widgetId, 100);
      awardXp(50, 'subnet-master');
    }
  }, [allCorrect, awardXp, widgetId]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-fd-muted-foreground">
        База:{' '}
        <span className="font-mono font-semibold text-fd-foreground">
          {scenario.baseIp}/{scenario.basePrefix}
        </span>
        . Подбери каждому отделу <strong className="text-fd-foreground">наименьшую</strong> маску, в
        которую влезут все ПК.
      </p>
      <ul className="space-y-3">
        {rows.map(({ dept, prefix, result }) => {
          const fbId = `${id}-${dept.id}-fb`;
          return (
            <li key={dept.id}>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <label htmlFor={`${id}-${dept.id}`} className="flex-1 text-sm font-semibold">
                  {dept.name}
                  <span className="ml-2 font-normal text-fd-muted-foreground">{dept.hosts} ПК</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-sm text-fd-muted-foreground">/</span>
                  <input
                    id={`${id}-${dept.id}`}
                    type="number"
                    min={0}
                    max={32}
                    value={prefix}
                    aria-invalid={!result.correct}
                    aria-describedby={fbId}
                    onChange={(e) =>
                      setChoices((c) => ({ ...c, [dept.id]: clampPrefix(Number(e.target.value)) }))
                    }
                    className={cn(
                      'w-16 rounded-md border bg-fd-background px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-fd-ring',
                      result.correct ? 'border-edu-ok' : 'border-fd-border',
                    )}
                  />
                  {result.correct ? (
                    <Check className="size-4 text-edu-ok" aria-hidden />
                  ) : (
                    <X className="size-4 text-fd-muted-foreground" aria-hidden />
                  )}
                </div>
              </div>
              <p id={fbId} className={cn('mt-1 text-xs', result.correct ? 'text-edu-ok' : 'text-fd-muted-foreground')}>
                {result.reason}
              </p>
            </li>
          );
        })}
      </ul>
      {allCorrect && (
        <p
          role="status"
          className="flex items-center gap-2 rounded-lg border border-edu-ok/40 bg-edu-ok/10 p-3 text-sm font-semibold text-edu-ok"
        >
          <Check className="size-4" aria-hidden /> Сеть спланирована оптимально. +50 XP
        </p>
      )}
    </div>
  );
}

export function SubnetCalculator({
  widgetId = WIDGET_ID,
  explorer = DEFAULT_EXPLORER,
  scenario = DEFAULT_SCENARIO,
}: SubnetCalculatorProps) {
  const [mode, setMode] = React.useState<Mode>('explore');
  const score = useScore(widgetId);

  return (
    <Panel className="not-prose my-6 overflow-hidden">
      <header className="flex items-center justify-between gap-3 border-b border-fd-border bg-fd-muted/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-subject-cs/10 text-subject-cs">
            <Network className="size-4" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-bold leading-tight">Калькулятор подсетей</p>
            <p className="text-xs text-fd-muted-foreground">IPv4 · маски · планирование VLSM</p>
          </div>
        </div>
        <XpBadge />
      </header>

      <div className="flex gap-1 border-b border-fd-border p-1.5" role="group" aria-label="Режим тренажёра">
        {(['explore', 'plan'] as const).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            onClick={() => setMode(m)}
            className={cn(
              'flex-1 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring',
              mode === m
                ? 'bg-fd-primary text-fd-primary-foreground'
                : 'text-fd-muted-foreground hover:bg-fd-accent',
            )}
          >
            {m === 'explore' ? 'Калькулятор' : 'Спланируй сеть'}
          </button>
        ))}
      </div>

      <div className="p-4">
        {mode === 'explore' ? (
          <Explorer initial={explorer} />
        ) : (
          <Planner scenario={scenario} widgetId={widgetId} />
        )}
      </div>

      {score && score.attempts > 0 && (
        <footer className="border-t border-fd-border px-4 py-2 text-xs text-fd-muted-foreground">
          Лучший результат: {score.best} · попыток: {score.attempts}
        </footer>
      )}
    </Panel>
  );
}

export default SubnetCalculator;
