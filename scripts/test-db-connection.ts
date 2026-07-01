import pg from "pg";

const { Pool } = pg;

async function testDatabaseConnection() {
  const rawUrl =
    process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

  console.log("🔍 Database Connection Test");
  console.log("===========================\n");

  // Check if URL exists
  if (!rawUrl) {
    console.error(
      "❌ ERROR: DATABASE_URL or SUPABASE_DATABASE_URL not set\n"
    );
    console.log("Set one of these environment variables:");
    console.log("  - SUPABASE_DATABASE_URL (preferred)");
    console.log("  - DATABASE_URL (fallback)\n");
    process.exit(1);
  }

  // Sanitize URL for display (hide password)
  const sanitizedUrl = rawUrl.replace(
    /postgres:\/\/[^:]+:([^@]+)@/,
    "postgres://user:***@"
  );
  console.log("📌 Database URL (sanitized):");
  console.log(`   ${sanitizedUrl}\n`);

  // Clean up spaces
  const cleanUrl = rawUrl.replace(/:\s+/g, ":").trim();
  const isSupabase = cleanUrl.includes("supabase");

  console.log(`✓ Using ${isSupabase ? "Supabase" : "standard PostgreSQL"}`);
  console.log(`✓ SSL: ${isSupabase ? "enabled (rejectUnauthorized: false)" : "default"}\n`);

  const pool = new Pool({
    connectionString: cleanUrl,
    ssl: isSupabase ? { rejectUnauthorized: false } : undefined,
  });

  try {
    console.log("⏳ Attempting connection...\n");
    const client = await pool.connect();

    // Test basic query
    const result = await client.query("SELECT NOW() as current_time");
    console.log("✅ CONNECTION SUCCESSFUL\n");
    console.log("Server time:", result.rows[0].current_time);

    // Check if tables exist
    console.log("\n📊 Checking tables...");
    const tablesQuery = await client.query(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`
    );

    if (tablesQuery.rows.length === 0) {
      console.log("⚠️  No tables found (schema may not be pushed)");
      console.log("   Run: pnpm run push (from lib/db directory)\n");
    } else {
      console.log(`✓ Found ${tablesQuery.rows.length} tables:\n`);
      tablesQuery.rows.forEach((row) => {
        console.log(`   • ${row.tablename}`);
      });
      console.log();
    }

    client.release();
    await pool.end();

    console.log("✅ All tests passed!\n");
    process.exit(0);
  } catch (error) {
    console.error("❌ CONNECTION FAILED\n");
    if (error instanceof Error) {
      console.error("Error:", error.message);
      console.error("\nTroubleshooting:");
      if (error.message.includes("ECONNREFUSED")) {
        console.error("  • Database server is not reachable");
        console.error("  • Check if Supabase is running");
        console.error("  • Verify your network connection");
      } else if (error.message.includes("authentication")) {
        console.error("  • Invalid credentials in database URL");
        console.error("  • Check SUPABASE_DATABASE_URL format");
      } else if (error.message.includes("TIMEOUT")) {
        console.error("  • Connection timeout (port 5432 may be blocked)");
        console.error("  • If on Replit: run this locally instead");
      }
    }
    console.error("\n");
    process.exit(1);
  }
}

testDatabaseConnection();
