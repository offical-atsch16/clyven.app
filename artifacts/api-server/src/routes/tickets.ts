import { Router } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { supabase } from "../lib/supabase.js";
import { logger } from "../lib/logger.js";
import { sendEmail } from "../lib/email.js";

const router = Router();

const JWT_SECRET = (process.env.ADMIN_JWT_SECRET || process.env.CLERK_SECRET_KEY) as string;
const COOKIE_NAME = "admin_session";

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
  const authHeader = req.headers.authorization;
  const headerToken = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null;
  const token = req.cookies?.[COOKIE_NAME] || headerToken;
  if (!token) return false;
  try {
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

// Robust self-healing ticket number sequence generator using Supabase client library
async function getNextTicketNumber(): Promise<string> {
  try {
    const { data, error } = await supabase
      .from("tickets")
      .select("ticket_number")
      .order("created_at", { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return "TICKET-000001";
    }

    const lastNumStr = data[0].ticket_number; // e.g. "TICKET-000005"
    const match = lastNumStr.match(/TICKET-(\d+)/);
    if (match) {
      const nextSeq = parseInt(match[1], 10) + 1;
      return `TICKET-${String(nextSeq).padStart(6, "0")}`;
    }
  } catch (err) {
    console.error("Error in getNextTicketNumber:", err);
  }
  return "TICKET-000001";
}

// Create a new ticket (public, no auth)
router.post("/", async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: "All fields are required" });
    }
    const ticketNumber = await getNextTicketNumber();
    const passcode = crypto.randomInt(100000, 1000000).toString();

    const { data: ticket, error: ticketErr } = await supabase
      .from("tickets")
      .insert({
        ticket_number: ticketNumber,
        name,
        email,
        subject,
        message,
        passcode,
        status: "OPEN"
      })
      .select()
      .single();

    if (ticketErr || !ticket) {
      throw new Error(`Failed to create ticket in database: ${ticketErr?.message}`);
    }

    const { error: msgErr } = await supabase
      .from("ticket_messages")
      .insert({
        ticket_id: ticket.id,
        sender_type: "CUSTOMER",
        sender_name: name,
        message: message
      });

    if (msgErr) {
      throw new Error(`Failed to insert ticket message in database: ${msgErr.message}`);
    }

    // Send confirmation email (non-blocking, graceful error handling)
    const escapedName = escapeHTML(name);
    const escapedSubject = escapeHTML(subject);
    const escapedMessage = escapeHTML(message);

    const emailSent = await sendEmail({
      to: email,
      subject: `[CLYVEN Support] Ticket Erstellt: ${ticketNumber}`,
      ticketNumber,
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
                <td style="padding: 12px; background-color: #1a1a1a; border-radius: 8px; border: 1px solid #222; text-align: center;">
                  <span style="font-size: 11px; color: #666; text-transform: uppercase; display: block; margin-bottom: 4px;">Ticketnummer</span>
                  <strong style="font-size: 20px; color: #ffffff; font-family: monospace;">${ticketNumber}</strong>
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
    });

    res.json({ ...snakeToCamel(ticket), emailSent });
  } catch (error) {
    console.error("TICKETS ROUTE FAILED:", error);
    next(error);
  }
});

// Get ticket by number + email (or Master Code / Admin Session)
router.get("/:ticketNumber", async (req, res) => {
  const { ticketNumber } = req.params;

  const providedEmail = (req.headers["x-ticket-email"] as string || req.query.email as string || "").trim().toLowerCase();
  const passcode = req.headers["x-ticket-passcode"] as string || req.query.passcode as string;

  try {
    const { data: ticketRows, error: ticketErr } = await supabase
      .from("tickets")
      .select("*")
      .eq("ticket_number", ticketNumber);

    if (ticketErr) {
      throw ticketErr;
    }

    if (!ticketRows || !ticketRows.length) {
      return res.status(404).json({ error: "Ticket not found, make sure you typed in everything right" });
    }

    const ticket = ticketRows[0];

    // Authorization checks:
    // 1. Is valid admin session?
    // 2. Is provided passcode the Master-Code '161011'?
    // 3. Does provided email match ticket email?
    // 4. (Legacy) Does passcode match ticket passcode?
    const hasAdminSession = isAdmin(req);
    const isMasterCode = passcode === "161011";
    const isMatchingEmail = providedEmail && providedEmail === (ticket.email || "").trim().toLowerCase();
    const isLegacyPasscode = passcode && String(passcode) === String(ticket.passcode);

    if (!hasAdminSession && !isMasterCode && !isMatchingEmail && !isLegacyPasscode) {
      return res.status(403).json({ error: "E-Mail-Adresse und Ticket-Nummer stimmen nicht überein." });
    }

    const { data: msgRows, error: msgErr } = await supabase
      .from("ticket_messages")
      .select("*")
      .eq("ticket_id", ticket.id)
      .order("created_at", { ascending: true });

    if (msgErr) {
      throw msgErr;
    }

    res.json({
      ticket: snakeToCamel(ticket),
      messages: (msgRows || []).map(snakeToCamel),
    });
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch ticket, contact support", detail: e.message });
  }
});

// Add message to a ticket (verified by email or Master-Code / Admin Session)
router.post("/:ticketNumber/messages", async (req, res) => {
  const { ticketNumber } = req.params;
  const { email, passcode, senderName, message } = req.body;

  if (!senderName || !message) {
    return res.status(400).json({ error: "SenderName and message are required" });
  }

  try {
    const { data: ticketRows, error: ticketErr } = await supabase
      .from("tickets")
      .select("*")
      .eq("ticket_number", ticketNumber);

    if (ticketErr) {
      throw ticketErr;
    }

    if (!ticketRows || !ticketRows.length) {
      return res.status(404).json({ error: "Ticket not found, make sure you typed in everything right" });
    }

    const ticket = ticketRows[0];

    // Authorization checks
    const hasAdminSession = isAdmin(req);
    const isMasterCode = passcode === "161011";
    const providedEmail = (email || "").trim().toLowerCase();
    const isMatchingEmail = providedEmail && providedEmail === (ticket.email || "").trim().toLowerCase();
    const isLegacyPasscode = passcode && String(passcode) === String(ticket.passcode);

    if (!hasAdminSession && !isMasterCode && !isMatchingEmail && !isLegacyPasscode) {
      return res.status(403).json({ error: "E-Mail-Adresse und Ticket-Nummer stimmen nicht überein." });
    }

    const { data: insertedMsg, error: msgErr } = await supabase
      .from("ticket_messages")
      .insert({
        ticket_id: ticket.id,
        sender_type: "CUSTOMER",
        sender_name: senderName,
        message: message
      })
      .select()
      .single();

    if (msgErr || !insertedMsg) {
      throw new Error(`Failed to add message: ${msgErr?.message}`);
    }

    if (ticket.status === "CLOSED") {
      await supabase
        .from("tickets")
        .update({ status: "OPEN", updated_at: new Date().toISOString() })
        .eq("id", ticket.id);
    }

    // Send email notification on reply (non-blocking)
    const escapedSender = escapeHTML(senderName);
    const escapedMsg = escapeHTML(message);

    await sendEmail({
      to: ticket.email,
      subject: `[CLYVEN Support] Neue Antwort zu Ticket #${ticketNumber}`,
      ticketNumber,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0c0c0c; color: #ffffff; border-radius: 12px; border: 1px solid #222;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #ffffff; letter-spacing: 2px; margin: 0;">CLYVEN SUPPORT</h2>
            <p style="color: #666; margin: 4px 0 0;">Neue Antwort zu Ihrem Ticket #${ticketNumber}</p>
          </div>
          <div style="background-color: #111111; padding: 20px; border-radius: 8px; border: 1px solid #333;">
            <p style="margin: 0 0 10px; color: #aaa;"><strong>${escapedSender}:</strong></p>
            <div style="color: #ddd; font-size: 14px; line-height: 1.5; background-color: #080808; padding: 12px; border-radius: 6px; border: 1px solid #222; white-space: pre-wrap;">${escapedMsg}</div>
          </div>
        </div>
      `
    });

    res.json(snakeToCamel(insertedMsg));
  } catch (e: any) {
    res.status(500).json({ error: "Failed to add message, contact support", detail: e.message });
  }
});

export default router;
