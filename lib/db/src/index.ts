import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const rawDbUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;
// Clean up accidental spaces (e.g. "postgres: password" → "postgres:password")
let dbUrl = rawDbUrl?.replace(/:\s+/g, ":").trim();

if (!dbUrl) {
  throw new Error("DATABASE_URL or SUPABASE_DATABASE_URL must be set.");
}

// Use Supabase Connection Pooler (port 6543) instead of direct 5432
// Pooler works through Replit's network restrictions
if (dbUrl.includes("supabase") && !dbUrl.includes("pooler")) {
  try {
    const u = new URL(dbUrl);
    u.hostname = "aws-0-eu-central-1.pooler.supabase.com";
    u.port = "6543";
    dbUrl = u.toString();
  } catch {
    // fallback: keep original
  }
}

export const pool = new Pool({
  connectionString: dbUrl,
  ssl: dbUrl.includes("supabase") ? { rejectUnauthorized: false } : undefined,
});

export const db = drizzle(pool, { schema });

export * from "./schema";
