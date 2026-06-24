import { defineConfig } from "drizzle-kit";
import path from "path";

const rawUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

if (!rawUrl) {
  throw new Error("DATABASE_URL or SUPABASE_DATABASE_URL must be set.");
}

// Clean up accidental spaces (e.g. "postgres: password" → "postgres:password")
const cleanUrl = rawUrl.replace(/:\s+/g, ":").trim();
const dbUrl = cleanUrl.includes("supabase") && !cleanUrl.includes("sslmode")
  ? `${cleanUrl}?sslmode=disable`
  : cleanUrl;

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: { url: dbUrl },
});
