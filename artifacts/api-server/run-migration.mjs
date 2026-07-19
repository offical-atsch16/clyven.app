import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const stmts = [
  `CREATE TABLE IF NOT EXISTS admin_users (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`,
  `CREATE TABLE IF NOT EXISTS tickets (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), ticket_number TEXT NOT NULL UNIQUE, name TEXT NOT NULL, email TEXT NOT NULL, subject TEXT NOT NULL, message TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','IN_PROGRESS','CLOSED')), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`,
  `CREATE TABLE IF NOT EXISTS ticket_messages (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE, sender_type TEXT NOT NULL CHECK (sender_type IN ('CUSTOMER','ADMIN')), sender_name TEXT NOT NULL, message TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`,
  `CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status)`,
  `CREATE INDEX IF NOT EXISTS idx_tickets_email ON tickets(email)`,
  `CREATE INDEX IF NOT EXISTS idx_tickets_number ON tickets(ticket_number)`,
  `CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON ticket_messages(ticket_id)`,
];

async function run() {
  for (const stmt of stmts) {
    try {
      const { error } = await supabase.rpc("exec_sql", { sql: stmt + ";" });
      if (error) {
        const text = error.message.toLowerCase();
        if (text.includes("already exists") || text.includes("duplicate")) {
          console.log("OK (exists):", stmt.substring(0, 55));
        } else {
          console.log("FAIL:", stmt.substring(0, 55), "->", error.message.substring(0, 100));
        }
      } else {
        console.log("OK:", stmt.substring(0, 55));
      }
    } catch (e) {
      console.error("ERR:", stmt.substring(0, 55), e.message);
    }
  }
  console.log("Migration done.");
}

run();
