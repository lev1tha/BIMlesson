'use client';

import * as React from 'react';

/**
 * Диаграммы Mermaid в лекциях: <Mermaid chart={`flowchart TD ...`} />.
 * Библиотека тяжёлая, поэтому грузится динамически только там, где есть схема.
 * Тема следует за dark/light портала; при ошибке синтаксиса показываем текст схемы.
 */
export function Mermaid({ chart, title }: { chart: string; title?: string }) {
  const reactId = React.useId();
  const [svg, setSvg] = React.useState<string | null>(null);
  const [error, setError] = React.useState(false);
  const [dark, setDark] = React.useState(false);

  // Следим за переключением темы (Fumadocs ставит класс dark на html)
  React.useEffect(() => {
    const root = document.documentElement;
    const update = () => setDark(root.classList.contains('dark'));
    update();
    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: dark ? 'dark' : 'neutral',
          fontFamily: 'inherit',
        });
        const id = 'mmd' + reactId.replace(/[^a-zA-Z0-9]/g, '');
        const rendered = await mermaid.render(id, chart);
        if (alive) {
          setSvg(rendered.svg);
          setError(false);
        }
      } catch {
        if (alive) setError(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [chart, dark, reactId]);

  if (error) {
    // Схема не распарсилась — показываем исходник, лекция остаётся читаемой
    return (
      <pre className="not-prose my-4 overflow-x-auto rounded-lg border border-fd-border bg-fd-muted/30 p-3 text-xs">
        {chart}
      </pre>
    );
  }

  return (
    <figure className="not-prose my-4">
      {svg ? (
        <div
          className="overflow-x-auto rounded-lg border border-fd-border bg-fd-card p-3 [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full"
          role="img"
          aria-label={title ?? 'Диаграмма'}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : (
        <div
          className="h-40 animate-pulse rounded-lg border border-fd-border bg-fd-muted/40 motion-reduce:animate-none"
          aria-hidden
        />
      )}
      {title && (
        <figcaption className="mt-1.5 text-center text-xs text-fd-muted-foreground">{title}</figcaption>
      )}
    </figure>
  );
}
