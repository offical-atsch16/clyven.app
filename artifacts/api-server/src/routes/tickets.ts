import { Router } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { supabase } from "../lib/supabase.js";
import { logger } from "../lib/logger.js";
import { sendEmail, sendReplyEmail } from "../lib/email.js";

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

// Create a new ticket (public or authenticated user)
router.post("/", async (req, res, next) => {
  try {
    const { name, email, subject, message, clerkUserId, isVerifiedUser } = req.body;
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: "All fields are required" });
    }
    const ticketNumber = await getNextTicketNumber();
    const passcode = crypto.randomInt(100000, 1000000).toString();

    const insertPayload: Record<string, any> = {
      ticket_number: ticketNumber,
      name,
      email,
      subject,
      message,
      passcode,
      status: "OPEN",
    };

    if (clerkUserId) {
      insertPayload.clerk_user_id = clerkUserId;
      insertPayload.is_verified_user = isVerifiedUser ?? true;
    }

    let { data: ticket, error: ticketErr } = await supabase
      .from("tickets")
      .insert(insertPayload)
      .select()
      .single();

    if (ticketErr && clerkUserId) {
      // Fallback if clerk_user_id column is missing in DB
      console.warn("Primary ticket creation with clerk_user_id failed, retrying without extended columns:", ticketErr.message);
      delete insertPayload.clerk_user_id;
      delete insertPayload.is_verified_user;
      const fallbackRes = await supabase
        .from("tickets")
        .insert(insertPayload)
        .select()
        .single();
      ticket = fallbackRes.data;
      ticketErr = fallbackRes.error;
    }

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
      ticketPasscode: passcode,
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

// Get ticket by number or ID + passcode (or Master Code / Admin Session)
router.get("/:ticketNumber", async (req, res) => {
  const { ticketNumber } = req.params;

  const providedEmail = (req.headers["x-ticket-email"] as string || req.query.email as string || "").trim().toLowerCase();
  const passcode = ((req.headers["x-ticket-passcode"] as string) || (req.query.passcode as string) || "").trim();

  try {
    let { data: ticketRows, error: ticketErr } = await supabase
      .from("tickets")
      .select("*")
      .eq("ticket_number", ticketNumber);

    if (ticketErr) {
      throw ticketErr;
    }

    if (!ticketRows || !ticketRows.length) {
      // Fallback query by ID or email
      const { data: idRows } = await supabase
        .from("tickets")
        .select("*")
        .or(`id.eq.${ticketNumber},email.eq.${ticketNumber}`);
      ticketRows = idRows || [];
    }

    if (!ticketRows || !ticketRows.length) {
      return res.status(404).json({ error: "Ticket nicht gefunden. Bitte überprüfen Sie Ihre Angaben." });
    }

    const ticket = ticketRows[0];

    // Authorization checks:
    // 1. Is valid admin session?
    // 2. Is provided passcode the Master-Code '161011'?
    // 3. Is valid passcode provided AND ticket identifier matches?
    const hasAdminSession = isAdmin(req);
    const isMasterCode = passcode === "161011";
    const isMatchingPasscode = passcode && String(passcode) === String(ticket.passcode);
    const isMatchingEmail = !providedEmail || providedEmail === (ticket.email || "").trim().toLowerCase();

    if (!hasAdminSession && !isMasterCode && !(isMatchingPasscode && isMatchingEmail)) {
      return res.status(403).json({ error: "Passcode oder Ticket-Nummer / E-Mail ist ungültig." });
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

// Add message to a ticket (verified by passcode / Master-Code / Admin Session)
router.post("/:ticketNumber/messages", async (req, res) => {
  const { ticketNumber } = req.params;
  const { email, passcode: bodyPasscode, senderName, message } = req.body;

  const headerPasscode = req.headers["x-ticket-passcode"] as string;
  const passcode = (bodyPasscode || headerPasscode || "").trim();

  if (!senderName || !message) {
    return res.status(400).json({ error: "SenderName and message are required" });
  }

  try {
    let { data: ticketRows, error: ticketErr } = await supabase
      .from("tickets")
      .select("*")
      .eq("ticket_number", ticketNumber);

    if (ticketErr) {
      throw ticketErr;
    }

    if (!ticketRows || !ticketRows.length) {
      const { data: idRows } = await supabase
        .from("tickets")
        .select("*")
        .or(`id.eq.${ticketNumber},email.eq.${ticketNumber}`);
      ticketRows = idRows || [];
    }

    if (!ticketRows || !ticketRows.length) {
      return res.status(404).json({ error: "Ticket nicht gefunden. Bitte überprüfen Sie Ihre Angaben." });
    }

    const ticket = ticketRows[0];

    // Authorization checks
    const hasAdminSession = isAdmin(req);
    const isMasterCode = passcode === "161011";
    const providedEmail = (email || req.headers["x-ticket-email"] as string || "").trim().toLowerCase();
    const isMatchingPasscode = passcode && String(passcode) === String(ticket.passcode);
    const isMatchingEmail = !providedEmail || providedEmail === (ticket.email || "").trim().toLowerCase();

    if (!hasAdminSession && !isMasterCode && !(isMatchingPasscode && isMatchingEmail)) {
      return res.status(403).json({ error: "Passcode oder Ticket-Nummer / E-Mail ist ungültig." });
    }

    const senderType = hasAdminSession ? "ADMIN" : "CUSTOMER";

    const { data: insertedMsg, error: msgErr } = await supabase
      .from("ticket_messages")
      .insert({
        ticket_id: ticket.id,
        sender_type: senderType,
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
    if (senderType === "ADMIN") {
      await sendReplyEmail({
        toEmail: ticket.email,
        userName: ticket.name,
        ticketNumber: ticket.ticket_number || ticketNumber,
        ticketSubject: ticket.subject,
        ticketDetails: ticket.message,
        replyMessage: message,
        agentName: senderName,
        agentEmail: providedEmail || ticket.email,
      });
    } else {
      await sendEmail({
        userName: ticket.name || senderName,
        ticketEmail: ticket.email,
        ticketNumber: ticket.ticket_number || ticketNumber,
        ticketSubject: ticket.subject,
        ticketDetails: message,
        to: ticket.email,
        subject: `[CLYVEN Support] Neue Antwort zu Ticket #${ticket.ticket_number || ticketNumber}`,
        message: message,
      });
    }

    res.json(snakeToCamel(insertedMsg));
  } catch (e: any) {
    res.status(500).json({ error: "Failed to add message, contact support", detail: e.message });
  }
});

export default router;
