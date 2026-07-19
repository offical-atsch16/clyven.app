import pg from "pg";
const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const sql = `
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'CLOSED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('CUSTOMER', 'ADMIN')),
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_email ON tickets(email);
CREATE INDEX IF NOT EXISTS idx_tickets_number ON tickets(ticket_number);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);
CREATE SEQUENCE IF NOT EXISTS ticket_number_seq START 1;
`;

async function run() {
  await client.connect();
  console.log("Connected to database");
  try {
    await client.query(sql);
    console.log("Migration executed successfully");

    // Optional seed from env vars (never hardcoded)
    const seedEmail = process.env.ADMIN_INITIAL_EMAIL;
    const seedPassword = process.env.ADMIN_INITIAL_PASSWORD;
    if (seedEmail && seedPassword) {
      const { rows } = await client.query("SELECT id FROM admin_users WHERE email = $1", [seedEmail]);
      if (rows.length === 0) {
        const bcrypt = await import("bcryptjs");
        const hash = await bcrypt.default.hash(seedPassword, 12);
        await client.query(
          "INSERT INTO admin_users (email, password_hash) VALUES ($1, $2)",
          [seedEmail, hash]
        );
        console.log("Initial admin created from env vars");
      } else {
        console.log("Admin already exists");
      }
    } else {
      console.log("No ADMIN_INITIAL_EMAIL/PASSWORD set — skipping admin seed");
    }
  } catch (e: any) {
    console.error("Migration error:", e.message);
  } finally {
    await client.end();
  }
}

run();
