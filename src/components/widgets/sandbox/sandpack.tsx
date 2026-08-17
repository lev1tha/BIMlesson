'use client';

import { Sandpack } from '@codesandbox/sandpack-react';

export interface SandboxInnerProps {
  /** Короткая запись: один файл (JS для vanilla, HTML для static). */
  code?: string;
  template?: 'vanilla' | 'static';
  /** Полный набор файлов (перекрывает code). */
  files?: Record<string, string>;
}

const DEFAULT_JS = `// Песочница: меняй код и жми Run
const nums = [3, 1, 4, 1, 5, 9, 2, 6];

const max = Math.max(...nums);
const sum = nums.reduce((a, b) => a + b, 0);

console.log('Числа:', nums.join(', '));
console.log('Максимум:', max);
console.log('Сумма:', sum);
console.log('Среднее:', sum / nums.length);
`;

const DEFAULT_HTML = `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <style>
      body { font-family: sans-serif; padding: 16px; }
      .badge { display: inline-block; padding: 6px 12px; border-radius: 999px;
               background: #2563eb; color: white; }
    </style>
  </head>
  <body>
    <h1>Привет!</h1>
    <p class="badge">Меняй код слева — страница обновится справа</p>
  </body>
</html>
`;

/** Собственно Sandpack. Грузится только на клиенте (см. sandbox/index.tsx). */
export default function SandpackInner({ code, template = 'vanilla', files }: SandboxInnerProps) {
  const entry = template === 'static' ? '/index.html' : '/index.js';
  const fallback = template === 'static' ? DEFAULT_HTML : DEFAULT_JS;
  const resolvedFiles = files ?? { [entry]: code ?? fallback };

  return (
    <Sandpack
      template={template}
      theme="auto"
      files={resolvedFiles}
      options={{
        editorHeight: 320,
        showLineNumbers: true,
        showConsoleButton: true,
        showTabs: false,
      }}
    />
  );
}
