import * as React from 'react';
import { Briefcase } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Callout «зачем это бизнесу» — привязывает тему к работе аналитика/экономиста
 * (CLAUDE.md → «Контент», правило бизнес-контекста). Используется в MDX.
 */
export function BusinessNote({
  className,
  title = 'Зачем это бизнесу',
  children,
}: {
  className?: string;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <aside className={cn('my-6 flex gap-3 rounded-xl border border-fd-border bg-fd-primary/5 p-4', className)}>
      <Briefcase className="mt-0.5 size-5 shrink-0 text-fd-primary" aria-hidden />
      <div className="min-w-0">
        <p className="m-0 mb-1 text-sm font-bold text-fd-primary">{title}</p>
        <div className="text-sm text-fd-foreground [&>p]:m-0 [&>p]:leading-relaxed">{children}</div>
      </div>
    </aside>
  );
}
