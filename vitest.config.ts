import { defineConfig, defaultExclude } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['**/*.test.ts', '**/*.test.tsx'],
    // Agent git worktrees are checked out *inside* the repo (.claude/worktrees/
    // and .work/, both gitignored), and each one carries a full copy of the
    // suite. Without excluding them every test is collected twice and the run
    // reports double the real count — which reads as "more tests passing"
    // rather than as a mistake.
    //
    // Spread rather than replaced: `exclude` overrides Vitest's defaults
    // wholesale, and those defaults include `**/.git/**`. Listing our own
    // patterns on top means a future default cannot be silently dropped.
    exclude: [
      ...defaultExclude,
      '**/dist/**',
      '**/.next/**',
      '**/.claude/**',
      '**/.work/**',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
