import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import * as schema from './schema';

// Ensure DATABASE_URL is available
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create a Neon connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create the Drizzle client with full schema
export const db = drizzle(pool, { schema });

// Re-export schema for convenience
export * from './schema';
