import { defineConfig } from "drizzle-kit";
import path from "path";

const rawUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

if (!rawUrl) {
  throw new Error("DATABASE_URL or SUPABASE_DATABASE_URL must be set.");
}

// Clean up accidental spaces (e.g. "postgres: password" → "postgres:password")
let cleanUrl = rawUrl.replace(/:\s+/g, ":").trim();

// Use Supabase Connection Pooler (port 6543) instead of direct 5432
if (cleanUrl.includes("supabase") && !cleanUrl.includes("pooler")) {
  try {
    const u = new URL(cleanUrl);
    u.hostname = "aws-0-eu-central-1.pooler.supabase.com";
    u.port = "6543";
    cleanUrl = u.toString();
  } catch {
    // fallback
  }
}

const dbUrl = cleanUrl;

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: { url: dbUrl },
});
