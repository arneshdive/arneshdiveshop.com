import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['**/*.test.ts', '**/*.test.tsx'],
    // Agent git worktrees live under .claude/worktrees/, inside the repo, and
    // each one carries a full copy of the suite. Without this, every test is
    // collected twice and the run reports double the real count — which reads
    // as "more tests passing" rather than as a mistake.
    exclude: ['**/node_modules/**', '**/dist/**', '.claude/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
