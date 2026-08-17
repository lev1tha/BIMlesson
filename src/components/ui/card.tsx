import * as React from 'react';
import { cn } from '@/lib/cn';

/** Плоская карточка-контейнер: тонкая граница вместо тяжёлой тени (CLAUDE.md → «Дизайн-система»). */
export function Panel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-xl border border-fd-border bg-fd-card text-fd-card-foreground', className)}
      {...props}
    />
  );
}
