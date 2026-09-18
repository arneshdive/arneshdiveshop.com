import { execSync } from 'node:child_process';

// Runs on Vercel Production and Preview builds — each targets its own Neon
// branch (Production's own branch, or a per-preview branch provisioned by the
// Neon Vercel integration), so pushing schema on both is safe. Local builds
// have no VERCEL_ENV and are skipped.
if (!process.env.VERCEL_ENV) {
  console.log('[migrate-on-deploy] Bukan Vercel build, skip db push.');
  process.exit(0);
}

// The Neon integration can still be provisioning a brand-new preview branch's
// DATABASE_URL when this runs — degrade gracefully instead of failing the build.
if (!process.env.DATABASE_URL) {
  console.log('[migrate-on-deploy] DATABASE_URL belum tersedia, skip db push.');
  process.exit(0);
}

console.log(`[migrate-on-deploy] ${process.env.VERCEL_ENV} build, menjalankan drizzle-kit push...`);
execSync('pnpm exec drizzle-kit push', { stdio: 'inherit' });
console.log('[migrate-on-deploy] Selesai.');
