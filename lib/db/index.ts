import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

let db: PostgresJsDatabase<typeof schema>;

if (connectionString) {
  const client = postgres(connectionString, { prepare: false });
  db = drizzle(client, { schema });
} else {
  // Create a dummy db for build time type checking
  db = {} as PostgresJsDatabase<typeof schema>;
}

export { db };
export * from './schema';
