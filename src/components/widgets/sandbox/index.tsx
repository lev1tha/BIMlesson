'use client';

import dynamic from 'next/dynamic';
import type { SandboxInnerProps } from './sandpack';

/**
 * Sandpack — тяжёлая библиотека, поэтому грузим её только динамически и только на
 * клиенте (CLAUDE.md: «Sandpack — через next/dynamic с ssr:false и скелетоном»).
 * Так страница лекции не весит как приложение.
 */
const SandpackInner = dynamic(() => import('./sandpack'), {
  ssr: false,
  loading: () => <SandboxSkeleton />,
});

function SandboxSkeleton() {
  return (
    <div
      role="status"
      aria-label="Загрузка песочницы…"
      className="h-[380px] animate-pulse rounded-xl border border-fd-border bg-fd-muted/30 motion-reduce:animate-none"
    />
  );
}

export function Sandbox(props: SandboxInnerProps) {
  return (
    <div className="not-prose my-6">
      <SandpackInner {...props} />
    </div>
  );
}

export default Sandbox;
