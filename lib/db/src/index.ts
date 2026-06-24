import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const rawDbUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;
// Clean up accidental spaces (e.g. "postgres: password" → "postgres:password")
const dbUrl = rawDbUrl?.replace(/:\s+/g, ":").trim();

if (!dbUrl) {
  throw new Error("DATABASE_URL or SUPABASE_DATABASE_URL must be set.");
}

export const pool = new Pool({
  connectionString: dbUrl,
  ssl: dbUrl.includes("supabase") ? { rejectUnauthorized: false } : undefined,
});

export const db = drizzle(pool, { schema });

export * from "./schema";
