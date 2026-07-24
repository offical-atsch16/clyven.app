import { Pool } from "pg";

const rawDbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;
// Clean up accidental spaces (e.g. "postgres: password" → "postgres:password")
let dbUrl = rawDbUrl?.replace(/:\s+/g, ":").trim();

// Use Supabase Connection Pooler (port 6543) instead of direct 5432
// Pooler works through Replit's network restrictions
if (dbUrl && dbUrl.includes("supabase") && !dbUrl.includes("pooler")) {
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
  ssl: dbUrl?.includes("supabase") ? { rejectUnauthorized: false } : undefined,
});
