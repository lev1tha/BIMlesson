import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/components/widgets/**/logic.ts'],
      // Логика тренажёров обязана быть покрыта тестами (CLAUDE.md → «Главное правило»).
      thresholds: {
        statements: 100,
        functions: 100,
        lines: 100,
        branches: 90,
      },
    },
  },
});
