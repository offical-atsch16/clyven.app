import { Router } from "express";
import { pool } from "../lib/db.js";

const router = Router();

function generateTicketNumber(count: number): string {
  return `TICKET-${String(count + 1).padStart(6, "0")}`;
}

function snakeToCamel(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = value;
  }
  return result;
}

// Create a new ticket (public, no auth)
router.post("/", async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: "All fields are required" });
  }
  const client = await pool.connect();
  try {
    const { rows: countRows } = await client.query("SELECT COUNT(*)::int AS c FROM tickets");
    const ticketNumber = generateTicketNumber(countRows[0].c);

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

// Get ticket by number + email (public, lightweight auth)
router.get("/:ticketNumber", async (req, res) => {
  const { ticketNumber } = req.params;
  const { email } = req.query;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }
  const client = await pool.connect();
  try {
    const { rows: ticketRows } = await client.query(
      "SELECT * FROM tickets WHERE ticket_number=$1 AND email=$2",
      [ticketNumber, email]
    );
    if (!ticketRows.length) {
      return res.status(404).json({ error: "Ticket not found" });
    }
    const { rows: msgRows } = await client.query(
      "SELECT * FROM ticket_messages WHERE ticket_id=$1 ORDER BY created_at ASC",
      [ticketRows[0].id]
    );
    res.json({
      ticket: snakeToCamel(ticketRows[0]),
      messages: msgRows.map(snakeToCamel),
    });
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch ticket", detail: e.message });
  } finally {
    client.release();
  }
});

// Add message to a ticket (public, verified by email)
router.post("/:ticketNumber/messages", async (req, res) => {
  const { ticketNumber } = req.params;
  const { email, senderName, message } = req.body;
  if (!email || !senderName || !message) {
    return res.status(400).json({ error: "Email, senderName, and message are required" });
  }
  const client = await pool.connect();
  try {
    const { rows: ticketRows } = await client.query(
      "SELECT id, status FROM tickets WHERE ticket_number=$1 AND email=$2",
      [ticketNumber, email]
    );
    if (!ticketRows.length) {
      return res.status(404).json({ error: "Ticket not found" });
    }
    const ticket = ticketRows[0];

    const { rows: msgRows } = await client.query(
      `INSERT INTO ticket_messages (ticket_id, sender_type, sender_name, message)
       VALUES ($1,'CUSTOMER',$2,$3) RETURNING *`,
      [ticket.id, senderName, message]
    );

    if (ticket.status === "CLOSED") {
      await client.query(
        "UPDATE tickets SET status='OPEN', updated_at=now() WHERE id=$1",
        [ticket.id]
      );
    }

    res.json(snakeToCamel(msgRows[0]));
  } catch (e: any) {
    res.status(500).json({ error: "Failed to add message", detail: e.message });
  } finally {
    client.release();
  }
});

export default router;
