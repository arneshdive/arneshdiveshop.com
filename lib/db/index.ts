import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return neon(process.env.DATABASE_URL);
}

// Lazy singleton — sql client is only created on first actual DB access.
// This prevents build-time crashes when DATABASE_URL is not connectable
// (e.g. during static generation or sitemap builds).
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

function getDb(): ReturnType<typeof drizzle<typeof schema>> {
  if (!_db) {
    _db = drizzle(getSql(), { schema });
  }
  return _db;
}

// Export a Proxy that preserves the full Drizzle type while deferring
// connection until the first actual query method is called.
export const db: ReturnType<typeof drizzle<typeof schema>> = new Proxy(
  {} as ReturnType<typeof drizzle<typeof schema>>,
  {
    get(_, prop) {
      const real = getDb();
      const value = (real as any)[prop];
      if (typeof value === 'function') {
        return value.bind(real);
      }
      return value;
    },
  },
);

// Re-export schema for convenience
export * from './schema';
