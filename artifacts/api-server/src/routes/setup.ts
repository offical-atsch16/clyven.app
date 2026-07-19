import { Router } from "express";
import { pool } from "../lib/db.js";
import bcrypt from "bcryptjs";

const router = Router();

router.post("/", async (_req, res) => {
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
        status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'CLOSED')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
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
    await client.query("CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_tickets_email ON tickets(email)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_tickets_number ON tickets(ticket_number)");
    await client.query("CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON ticket_messages(ticket_id)");

    // Seed default admin
    const { rows } = await client.query("SELECT id FROM admin_users WHERE email='admin@clyven.app'");
    if (!rows.length) {
      const hash = await bcrypt.hash("admin123", 12);
      await client.query(
        "INSERT INTO admin_users (email, password_hash) VALUES ($1, $2)",
        ["admin@clyven.app", hash]
      );
    }

    res.json({ success: true, message: "Setup complete. Default admin: admin@clyven.app / admin123" });
  } catch (e: any) {
    res.status(500).json({ error: "Setup failed", detail: e.message });
  } finally {
    client.release();
  }
});

export default router;
