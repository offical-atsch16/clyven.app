import { Pool } from "pg";

// Use local Replit DB for development; in production use DATABASE_URL
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
