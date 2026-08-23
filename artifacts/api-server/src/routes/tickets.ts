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
    const emailSent = await sendEmail({
      userName: name,
      ticketEmail: email,
      ticketNumber,
      ticketSubject: subject,
      ticketDetails: message,
      to: email,
      subject: `[CLYVEN Support] Ticket Erstellt: ${ticketNumber}`,
      message: message,
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
    await sendEmail({
      userName: ticket.name || senderName,
      ticketEmail: ticket.email,
      ticketNumber,
      ticketSubject: ticket.subject,
      ticketDetails: message,
      to: ticket.email,
      subject: `[CLYVEN Support] Neue Antwort zu Ticket #${ticketNumber}`,
      message: message,
    });

    res.json(snakeToCamel(insertedMsg));
  } catch (e: any) {
    res.status(500).json({ error: "Failed to add message, contact support", detail: e.message });
  }
});

export default router;
