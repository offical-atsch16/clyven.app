import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../lib/db.js";
import type { Request, Response, NextFunction } from "express";

const router = Router();
const JWT_SECRET = process.env.ADMIN_JWT_SECRET || process.env.CLERK_SECRET_KEY || "fallback-secret-change-me";
const COOKIE_NAME = "admin_session";

interface AdminRequest extends Request {
  adminId?: string;
}

function requireAdmin(req: AdminRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { adminId: string };
    req.adminId = decoded.adminId;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid session" });
  }
}

function snakeToCamel(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = value;
  }
  return result;
}

// Admin login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  const client = await pool.connect();
  try {
    const { rows } = await client.query("SELECT * FROM admin_users WHERE email=$1", [email]);
    if (!rows.length) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const admin = rows[0];
    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ adminId: admin.id, email: admin.email }, JWT_SECRET, { expiresIn: "24h" });
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.json({ success: true, admin: { id: admin.id, email: admin.email } });
  } catch (e: any) {
    res.status(500).json({ error: "Login failed", detail: e.message });
  } finally {
    client.release();
  }
});

// Admin logout
router.post("/logout", (_req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.json({ success: true });
});

// Check session
router.get("/me", requireAdmin, (req: AdminRequest, res) => {
  res.json({ adminId: req.adminId });
});

// List all tickets
router.get("/tickets", requireAdmin, async (_req, res) => {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      "SELECT * FROM tickets ORDER BY created_at DESC"
    );
    res.json(rows.map(snakeToCamel));
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch tickets", detail: e.message });
  } finally {
    client.release();
  }
});

// Get ticket detail (with messages)
router.get("/tickets/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    const { rows: ticketRows } = await client.query("SELECT * FROM tickets WHERE id=$1", [id]);
    if (!ticketRows.length) {
      return res.status(404).json({ error: "Ticket not found" });
    }
    const { rows: msgRows } = await client.query(
      "SELECT * FROM ticket_messages WHERE ticket_id=$1 ORDER BY created_at ASC",
      [id]
    );
    res.json({ ticket: snakeToCamel(ticketRows[0]), messages: msgRows.map(snakeToCamel) });
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch ticket", detail: e.message });
  } finally {
    client.release();
  }
});

// Update ticket status
router.patch("/tickets/:id/status", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!["OPEN", "IN_PROGRESS", "CLOSED"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      "UPDATE tickets SET status=$1, updated_at=now() WHERE id=$2 RETURNING *",
      [status, id]
    );
    res.json(snakeToCamel(rows[0]));
  } catch (e: any) {
    res.status(500).json({ error: "Failed to update status", detail: e.message });
  } finally {
    client.release();
  }
});

// Admin reply to ticket
router.post("/tickets/:id/messages", requireAdmin, async (req: AdminRequest, res) => {
  const { id } = req.params;
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }
  const client = await pool.connect();
  try {
    const { rows: adminRows } = await client.query("SELECT email FROM admin_users WHERE id=$1", [req.adminId!]);
    if (!adminRows.length) {
      return res.status(404).json({ error: "Admin not found" });
    }
    const { rows: msgRows } = await client.query(
      `INSERT INTO ticket_messages (ticket_id, sender_type, sender_name, message)
       VALUES ($1,'ADMIN',$2,$3) RETURNING *`,
      [id, adminRows[0].email, message]
    );
    await client.query("UPDATE tickets SET updated_at=now() WHERE id=$1", [id]);
    res.json(snakeToCamel(msgRows[0]));
  } catch (e: any) {
    res.status(500).json({ error: "Failed to send message", detail: e.message });
  } finally {
    client.release();
  }
});

// Admin create ticket manually
router.post("/tickets", requireAdmin, async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: "All fields are required" });
  }
  const client = await pool.connect();
  try {
    const { rows: countRows } = await client.query("SELECT COUNT(*)::int AS c FROM tickets");
    const ticketNumber = `TICKET-${String(countRows[0].c + 1).padStart(6, "0")}`;

    const { rows: ticketRows } = await client.query(
      `INSERT INTO tickets (ticket_number, name, email, subject, message, status)
       VALUES ($1,$2,$3,$4,$5,'OPEN') RETURNING *`,
      [ticketNumber, name, email, subject, message]
    );
    const ticket = ticketRows[0];

    await client.query(
      `INSERT INTO ticket_messages (ticket_id, sender_type, sender_name, message)
       VALUES ($1,'CUSTOMER',$2,$3)`,
      [ticket.id, name, message]
    );

    res.json(snakeToCamel(ticket));
  } catch (e: any) {
    res.status(500).json({ error: "Failed to create ticket", detail: e.message });
  } finally {
    client.release();
  }
});

export default router;
