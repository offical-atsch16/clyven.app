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

// Generate the Pooler URL (Strategy 1)
let poolerUrl = dbUrl;
if (dbUrl.includes("supabase") && !dbUrl.includes("pooler")) {
  try {
    const u = new URL(dbUrl);
    u.hostname = "aws-0-eu-central-1.pooler.supabase.com";
    u.port = "6543";
    poolerUrl = u.toString();
  } catch {
    // fallback
  }
}

// We will try both Connection Strategies (Pooler vs Direct) dynamically as fallbacks
export const pool = new Pool({
  connectionString: poolerUrl,
  ssl: poolerUrl.includes("supabase") ? { rejectUnauthorized: false } : undefined,
});

// Self-healing hot-swap connector
(async () => {
  try {
    // Attempt connecting with Strategy 1 (Pooler)
    const client = await pool.connect();
    client.release();
    console.log("✅ Supabase pooler connected successfully on port 6543.");
  } catch (err: any) {
    console.warn("⚠️ Pooler strategy failed. Hot-swapping to Strategy 2 (Direct connection)...", err.message);
    // Hot-swap connection settings to the original direct DB connection (Strategy 2)
    (pool as any).options.connectionString = dbUrl;
    (pool as any).options.ssl = dbUrl.includes("supabase") ? { rejectUnauthorized: false } : undefined;

    try {
      const client2 = await pool.connect();
      client2.release();
      console.log("✅ Direct database fallback connected successfully on port 5432.");
    } catch (err2: any) {
      console.error("❌ Both database connection strategies failed. Please verify SUPABASE_DATABASE_URL in secrets.", err2.message);
    }
  }
})();

export const db = drizzle(pool, { schema });

export * from "./schema";
