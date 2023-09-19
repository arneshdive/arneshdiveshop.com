import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

export type Database = NeonHttpDatabase<typeof schema>;

let db: Database;

if (connectionString) {
  const sql = neon(connectionString);
  db = drizzle(sql, { schema });
} else {
  // Create a dummy db for build time type checking
  db = undefined as unknown as Database;
}

export { db };
export * from './schema';
