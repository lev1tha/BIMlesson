'use client';

import * as React from 'react';
import { Check, RotateCcw, Route } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Panel } from '@/components/ui/card';
import { XpBadge } from '@/components/ui/xp-badge';
import { saveScore, useScore } from '@/lib/progress';
import { useGameStore } from '@/lib/store';
import { checkPath, edgeCost, neighbors, pathCost } from './logic';
import { DEFAULT_SCENARIO, type RoutingScenario } from './data';

const WIDGET_ID = 'routing-game';

export interface RoutingGameProps {
  widgetId?: string;
  scenario?: RoutingScenario;
}

function edgeKey(a: string, b: string): string {
  return [a, b].sort().join('-');
}

export function RoutingGame({ widgetId = WIDGET_ID, scenario = DEFAULT_SCENARIO }: RoutingGameProps) {
  const { graph, positions, from, to } = scenario;
  const awardXp = useGameStore((s) => s.awardXp);
  const score = useScore(widgetId);
  const [path, setPath] = React.useState<string[]>([from]);
  const [hint, setHint] = React.useState<string | null>(null);

  const result = checkPath(graph, from, to, path);
  const cost = pathCost(graph, path);
  const last = path[path.length - 1];

  const awarded = React.useRef(false);
  React.useEffect(() => {
    if (result.correct && !awarded.current) {
      awarded.current = true;
      saveScore(widgetId, 100);
      awardXp(40, 'routing-master');
    }
  }, [result.correct, awardXp, widgetId]);

  const pathEdges = new Set<string>();
  for (let i = 0; i < path.length - 1; i++) pathEdges.add(edgeKey(path[i], path[i + 1]));

  const extend = (node: string) => {
    setHint(null);
    if (node === from) {
      setPath([from]);
      return;
    }
    if (edgeCost(graph, last, node) === null) {
      setHint(`Нет прямого канала ${last}–${node}.`);
      return;
    }
    setPath([...path, node]);
  };

  const reset = () => {
    setPath([from]);
    setHint(null);
  };

  const edges: { a: string; b: string; cost: number }[] = [];
  const seen = new Set<string>();
  for (const a of Object.keys(graph)) {
    for (const [b, c] of Object.entries(graph[a])) {
      const k = edgeKey(a, b);
      if (!seen.has(k)) {
        seen.add(k);
        edges.push({ a, b, cost: c });
      }
    }
  }

  const nextOptions = last === to ? [] : neighbors(graph, last).slice().sort();

  return (
    <Panel className="not-prose my-6 overflow-hidden">
      <header className="flex items-center justify-between gap-3 border-b border-fd-border bg-fd-muted/30 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-subject-cs/10 text-subject-cs">
            <Route className="size-4" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-bold leading-tight">Маршрутизация</p>
            <p className="text-xs text-fd-muted-foreground">кратчайший путь по стоимости</p>
          </div>
        </div>
        <XpBadge />
      </header>

      <div className="space-y-3 p-4">
        <p className="text-sm text-fd-muted-foreground">
          Проведи пакет от <strong className="text-edu-ok">{from}</strong> к{' '}
          <strong className="text-fd-primary">{to}</strong> самым дешёвым путём. Числа на линиях — стоимость
          канала (задержка).
        </p>

        <div className="overflow-x-auto">
          <svg viewBox="0 0 340 230" className="h-auto w-full max-w-md" role="img" aria-label="Схема сети маршрутизаторов">
            {edges.map(({ a, b, cost: c }) => {
              const pa = positions[a];
              const pb = positions[b];
              const mx = (pa.x + pb.x) / 2;
              const my = (pa.y + pb.y) / 2;
              const active = pathEdges.has(edgeKey(a, b));
              return (
                <g key={edgeKey(a, b)}>
                  <line
                    x1={pa.x}
                    y1={pa.y}
                    x2={pb.x}
                    y2={pb.y}
                    strokeWidth={active ? 4 : 2}
                    className={active ? 'stroke-fd-primary' : 'stroke-fd-border'}
                  />
                  <rect x={mx - 9} y={my - 9} width={18} height={16} rx={4} className="fill-fd-background stroke-fd-border" />
                  <text x={mx} y={my + 3} textAnchor="middle" className="fill-fd-muted-foreground font-mono text-[11px]">
                    {c}
                  </text>
                </g>
              );
            })}
            {Object.entries(positions).map(([node, p]) => {
              const role = node === from ? 'from' : node === to ? 'to' : path.includes(node) ? 'on' : 'off';
              return (
                <g key={node} onClick={() => extend(node)} className="cursor-pointer">
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={16}
                    strokeWidth={2}
                    className={cn(
                      role === 'from'
                        ? 'fill-edu-ok/20 stroke-edu-ok'
                        : role === 'to'
                          ? 'fill-fd-primary/20 stroke-fd-primary'
                          : role === 'on'
                            ? 'fill-fd-primary/10 stroke-fd-primary'
                            : 'fill-fd-card stroke-fd-border',
                    )}
                  />
                  <text x={p.x} y={p.y + 4} textAnchor="middle" className="fill-fd-foreground text-sm font-bold">
                    {node}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {nextOptions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-fd-muted-foreground">Из {last} →</span>
            {nextOptions.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => extend(n)}
                className="inline-flex items-center gap-1 rounded-md border border-fd-border px-2.5 py-1 text-sm font-semibold hover:bg-fd-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
              >
                {n} <span className="font-mono text-xs text-fd-muted-foreground">{edgeCost(graph, last, n)}</span>
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span className="font-mono font-semibold">{path.join(' → ')}</span>
          {cost !== null && <span className="text-fd-muted-foreground">стоимость: {cost}</span>}
          <button
            type="button"
            onClick={reset}
            className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-fd-border px-2.5 py-1 text-xs font-semibold hover:bg-fd-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
          >
            <RotateCcw className="size-3.5" aria-hidden /> Сброс
          </button>
        </div>

        <p role="status" className={cn('text-sm', result.correct ? 'font-semibold text-edu-ok' : 'text-fd-muted-foreground')}>
          {hint ?? result.reason}
        </p>

        {result.correct && (
          <p
            role="status"
            className="flex items-center gap-2 rounded-lg border border-edu-ok/40 bg-edu-ok/10 p-3 text-sm font-semibold text-edu-ok"
          >
            <Check className="size-4" aria-hidden /> Кратчайший путь найден! +40 XP
          </p>
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

export default RoutingGame;
