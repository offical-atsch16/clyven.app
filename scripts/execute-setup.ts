import pg from "pg";

const { Pool } = pg;

async function executeSetup() {
  const rawUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;

  if (!rawUrl) {
    console.error("❌ ERROR: DATABASE_URL or SUPABASE_DATABASE_URL not set.");
    process.exit(1);
  }

  // Clean up spaces
  let dbUrl = rawUrl.replace(/:\s+/g, ":").trim();

  // Handle Supabase Connection Pooler
  if (dbUrl.includes("supabase") && !dbUrl.includes("pooler")) {
    try {
      const u = new URL(dbUrl);
      u.hostname = "aws-0-eu-central-1.pooler.supabase.com";
      u.port = "6543";
      dbUrl = u.toString();
    } catch {
      // fallback
    }
  }

  console.log("Connecting to:", dbUrl.replace(/:([^@]+)@/, ":***@"));

  const pool = new Pool({
    connectionString: dbUrl,
    ssl: dbUrl.includes("supabase") ? { rejectUnauthorized: false } : undefined,
  });

  try {
    const client = await pool.connect();
    console.log("Connected successfully to database. Running setup queries...");

    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    console.log("✓ Table 'admin_users' is ready.");

    await client.query(`
      CREATE TABLE IF NOT EXISTS tickets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_number TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        passcode TEXT,
        status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'CLOSED')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    console.log("✓ Table 'tickets' is ready.");

    await client.query(`
      ALTER TABLE tickets ADD COLUMN IF NOT EXISTS passcode TEXT;
    `);
    console.log("✓ Column 'passcode' has been added/verified.");

    await client.query(`
      CREATE TABLE IF NOT EXISTS ticket_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
        sender_type TEXT NOT NULL CHECK (sender_type IN ('CUSTOMER', 'ADMIN')),
        sender_name TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    console.log("✓ Table 'ticket_messages' is ready.");

    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'TODO' CHECK (status IN ('TODO', 'IN_PROGRESS', 'DONE')),
        priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
        tags TEXT[],
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    console.log("✓ Table 'tasks' is ready.");

    await client.query("CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_tickets_email ON tickets(email)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_tickets_number ON tickets(ticket_number)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON ticket_messages(ticket_id)");
    console.log("✓ Indexes created.");

    await client.query("CREATE SEQUENCE IF NOT EXISTS ticket_number_seq START 1");
    console.log("✓ Sequence 'ticket_number_seq' created.");

    client.release();
    await pool.end();
    console.log("✅ SETUP EXECUTED SUCCESSFULLY.");
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Setup failed:", error.message);
    process.exit(1);
  }
}

executeSetup();
