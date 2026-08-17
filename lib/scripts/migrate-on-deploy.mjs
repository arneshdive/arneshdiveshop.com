import { execSync } from 'node:child_process';

if (process.env.VERCEL_ENV !== 'production') {
  console.log('[migrate-on-deploy] Bukan production build, skip db push.');
  process.exit(0);
}

console.log('[migrate-on-deploy] Production build, menjalankan drizzle-kit push...');
execSync('pnpm exec drizzle-kit push', { stdio: 'inherit' });
console.log('[migrate-on-deploy] Selesai.');
