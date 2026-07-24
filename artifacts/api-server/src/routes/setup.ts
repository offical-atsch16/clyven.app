import { Router } from "express";
import { pool } from "../lib/db.js";
import bcrypt from "bcryptjs";
import { rateLimit } from "express-rate-limit";

const router = Router();

const setupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5, // limit each IP to 5 requests per window
  message: { error: "Too many setup requests, please try again later." },
});

router.post("/", setupLimiter, async (_req, res) => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
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
    await client.query(`
      ALTER TABLE tickets ADD COLUMN IF NOT EXISTS passcode TEXT;
    `);
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
    await client.query("CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_tickets_email ON tickets(email)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_tickets_number ON tickets(ticket_number)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON ticket_messages(ticket_id)");

    await client.query("CREATE SEQUENCE IF NOT EXISTS ticket_number_seq START 1");

    // Optional seed from env (never hardcoded)
    const seedEmail = process.env.ADMIN_INITIAL_EMAIL;
    const seedPassword = process.env.ADMIN_INITIAL_PASSWORD;
    if (seedEmail && seedPassword) {
      const { rows } = await client.query("SELECT id FROM admin_users WHERE email=$1", [seedEmail]);
      if (!rows.length) {
        const hash = await bcrypt.hash(seedPassword, 12);
        await client.query(
          "INSERT INTO admin_users (email, password_hash) VALUES ($1, $2)",
          [seedEmail, hash]
        );
      }
    }

    res.json({ success: true, message: "Setup complete" });
  } catch (e: any) {
    res.status(500).json({ error: "Setup failed", detail: e.message });
  } finally {
    client.release();
  }
});

export default router;
