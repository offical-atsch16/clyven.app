import app from "./app";
import { logger } from "./lib/logger";
import { pool } from "./lib/db.js";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Self-healing database schema verification on startup
async function verifyDatabaseSchema() {
  logger.info("Verifying database schemas on startup...");
  try {
    const client = await pool.connect();

    // Create admin_users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    // Create tickets table
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

    // Ensure passcode column exists (self-healing migration)
    await client.query(`
      ALTER TABLE tickets ADD COLUMN IF NOT EXISTS passcode TEXT;
    `);

    // Create ticket_messages table
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

    // Create tasks table
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

    // Create indexes
    await client.query("CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_tickets_email ON tickets(email)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_tickets_number ON tickets(ticket_number)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON ticket_messages(ticket_id)");

    // Create sequence
    await client.query("CREATE SEQUENCE IF NOT EXISTS ticket_number_seq START 1");

    client.release();
    logger.info("Database schemas verified and updated successfully on startup.");
  } catch (err: any) {
    logger.error({ err: err.message }, "Database schema verification failed on startup");
  }
}

verifyDatabaseSchema().then(() => {
  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }

    logger.info({ port }, "Server listening");
  });
});
