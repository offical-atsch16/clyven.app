import { Router } from "express";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { pool } from "../lib/db.js";

const router = Router();

const JWT_SECRET = (process.env.ADMIN_JWT_SECRET || process.env.CLERK_SECRET_KEY) as string;
const COOKIE_NAME = "admin_session";

function generateTicketNumber(seq: number): string {
  return `TICKET-${String(seq).padStart(6, "0")}`;
}

function snakeToCamel(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = value;
  }
  return result;
}

// Helper to escape HTML characters to prevent HTML Injection
function escapeHTML(str: string): string {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Helper to check if a valid admin session exists
function isAdmin(req: any): boolean {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return false;
  try {
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

// Create a new ticket (public, no auth) — generates a 6-digit passcode securely and sends Gmail SMTP email
router.post("/", async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows: seqRows } = await client.query("SELECT nextval('ticket_number_seq') AS n");
    const ticketNumber = generateTicketNumber(seqRows[0].n);

    // Cryptographically secure passcode generation
    const passcode = crypto.randomInt(100000, 1000000).toString();

    const { rows: ticketRows } = await client.query(
      `INSERT INTO tickets (ticket_number, name, email, subject, message, passcode, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'OPEN') RETURNING *`,
      [ticketNumber, name, email, subject, message, passcode]
    );
    const ticket = ticketRows[0];

    await client.query(
      `INSERT INTO ticket_messages (ticket_id, sender_type, sender_name, message)
       VALUES ($1, 'CUSTOMER', $2, $3)`,
      [ticket.id, name, message]
    );

    // Gmail SMTP integration (mandatory, throws error if missing or fails)
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      throw new Error("Gmail SMTP configuration is missing. Please define GMAIL_USER and GMAIL_APP_PASSWORD environment variables.");
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    // Escape HTML values to mitigate HTML injection (CodeQL safety)
    const escapedName = escapeHTML(name);
    const escapedSubject = escapeHTML(subject);
    const escapedMessage = escapeHTML(message);

    const mailOptions = {
      from: `"CLYVEN Support" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `[CLYVEN Support] Ticket Erstellt: ${ticketNumber}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0c0c0c; color: #ffffff; border-radius: 12px; border: 1px solid #222;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h2 style="color: #ffffff; letter-spacing: 2px; margin: 0;">CLYVEN SUPPORT</h2>
            <p style="color: #666; margin: 4px 0 0;">Ihr Support-Ticket wurde erfolgreich erstellt</p>
          </div>

          <div style="background-color: #111111; padding: 20px; border-radius: 8px; border: 1px solid #333; margin-bottom: 24px;">
            <p style="margin: 0 0 10px; color: #aaa;">Hallo <strong>${escapedName}</strong>,</p>
            <p style="margin: 0 0 20px; color: #aaa; line-height: 1.5;">Vielen Dank für Ihre Anfrage. Unser Support-Team wird sich so schnell wie möglich bei Ihnen melden.</p>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <tr>
                <td style="padding: 10px; background-color: #1a1a1a; border-radius: 8px 0 0 8px; border: 1px solid #222;">
                  <span style="font-size: 11px; color: #666; text-transform: uppercase; display: block;">Ticketnummer</span>
                  <strong style="font-size: 18px; color: #ffffff; font-family: monospace;">${ticketNumber}</strong>
                </td>
                <td style="padding: 10px; background-color: #1a1a1a; border-radius: 0 8px 8px 0; border: 1px solid #222; border-left: none;">
                  <span style="font-size: 11px; color: #666; text-transform: uppercase; display: block;">Zugangscode</span>
                  <strong style="font-size: 18px; color: #3b82f6; font-family: monospace; letter-spacing: 1px;">${passcode}</strong>
                </td>
              </tr>
            </table>

            <div style="border-top: 1px solid #222; padding-top: 15px;">
              <span style="font-size: 11px; color: #666; text-transform: uppercase; display: block; margin-bottom: 8px;">Zusammenfassung Ihres Anliegens</span>
              <div style="color: #888; font-size: 13px; line-height: 1.5; background-color: #080808; padding: 12px; border-radius: 6px; border: 1px solid #222; white-space: pre-wrap;"><strong>Betreff:</strong> ${escapedSubject}\n\n${escapedMessage}</div>
            </div>
          </div>

          <p style="font-size: 11px; color: #444; text-align: center; margin: 0;">Diese E-Mail wurde automatisch von Clyven.app generiert.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    await client.query("COMMIT");
    res.json(snakeToCamel(ticket));
  } catch (e: any) {
    await client.query("ROLLBACK").catch(() => {});
    res.status(500).json({ error: "Failed to create ticket or send notification email", detail: e.message });
  } finally {
    client.release();
  }
});

// Get ticket by number + passcode header (Securely avoiding sensitive query parameters)
router.get("/:ticketNumber", async (req, res) => {
  const { ticketNumber } = req.params;

  // Read passcode from headers to avoid leaking it in query logs (CodeQL safety)
  const passcode = req.headers["x-ticket-passcode"] as string;

  const client = await pool.connect();
  try {
    const { rows: ticketRows } = await client.query(
      "SELECT * FROM tickets WHERE ticket_number=$1",
      [ticketNumber]
    );

    if (!ticketRows.length) {
      return res.status(404).json({ error: "Ticket not found, make sure you typed in everything right" });
    }

    const ticket = ticketRows[0];

    // Authorization checks:
    // 1. Is valid admin session?
    // 2. Is provided passcode the Master-Code '161011'?
    // 3. Is provided passcode matching the ticket's generated passcode?
    const hasAdminSession = isAdmin(req);
    const isMasterCode = passcode === "161011";
    const isTicketPasscode = passcode && String(passcode) === String(ticket.passcode);

    if (!hasAdminSession && !isMasterCode && !isTicketPasscode) {
      return res.status(403).json({ error: "Invalid access code. Access denied." });
    }

    const { rows: msgRows } = await client.query(
      "SELECT * FROM ticket_messages WHERE ticket_id=$1 ORDER BY created_at ASC",
      [ticket.id]
    );

    res.json({
      ticket: snakeToCamel(ticket),
      messages: msgRows.map(snakeToCamel),
    });
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch ticket, contact support", detail: e.message });
  } finally {
    client.release();
  }
});

// Add message to a ticket (public, verified by passcode in body, or Master-Code / Admin Session)
router.post("/:ticketNumber/messages", async (req, res) => {
  const { ticketNumber } = req.params;
  const { passcode, senderName, message } = req.body;

  if (!senderName || !message) {
    return res.status(400).json({ error: "SenderName and message are required" });
  }

  const client = await pool.connect();
  try {
    const { rows: ticketRows } = await client.query(
      "SELECT * FROM tickets WHERE ticket_number=$1",
      [ticketNumber]
    );

    if (!ticketRows.length) {
      return res.status(404).json({ error: "Ticket not found, make sure you typed in everything right" });
    }

    const ticket = ticketRows[0];

    // Authorization checks
    const hasAdminSession = isAdmin(req);
    const isMasterCode = passcode === "161011";
    const isTicketPasscode = passcode && String(passcode) === String(ticket.passcode);

    if (!hasAdminSession && !isMasterCode && !isTicketPasscode) {
      return res.status(403).json({ error: "Invalid access code. Access denied." });
    }

    const { rows: msgRows } = await client.query(
      `INSERT INTO ticket_messages (ticket_id, sender_type, sender_name, message)
       VALUES ($1, 'CUSTOMER', $2, $3) RETURNING *`,
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
    res.status(500).json({ error: "Failed to add message, contact support", detail: e.message });
  } finally {
    client.release();
  }
});

export default router;
