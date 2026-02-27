import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

// Disable prefetch as it is not supported for "Transaction" pool mode
// Enforce SSL for Supabase and add a timeout
const client = postgres(connectionString, {
    prepare: false,
    ssl: 'require',
    connect_timeout: 10,
});

export const db = drizzle(client, { schema });
