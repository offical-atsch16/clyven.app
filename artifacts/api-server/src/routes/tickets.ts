import { Router } from "express";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { supabase } from "../lib/supabase.js";

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
  const token = req.cookies?.[COOKIE_NAME];
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

// Create a new ticket (public, no auth) — generates a 6-digit passcode securely and sends Gmail SMTP email
router.post("/", async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const ticketNumber = await getNextTicketNumber();
    // Cryptographically secure passcode generation
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

    res.json(snakeToCamel(ticket));
  } catch (e: any) {
    res.status(500).json({ error: "Failed to create ticket or send notification email", detail: e.message });
  }
});

// Get ticket by number + passcode header (Securely avoiding sensitive query parameters)
router.get("/:ticketNumber", async (req, res) => {
  const { ticketNumber } = req.params;

  // Read passcode from headers to avoid leaking it in query logs (CodeQL safety)
  const passcode = req.headers["x-ticket-passcode"] as string;

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
    // 3. Is provided passcode matching the ticket's generated passcode?
    const hasAdminSession = isAdmin(req);
    const isMasterCode = passcode === "161011";
    const isTicketPasscode = passcode && String(passcode) === String(ticket.passcode);

    if (!hasAdminSession && !isMasterCode && !isTicketPasscode) {
      return res.status(403).json({ error: "Invalid access code. Access denied." });
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

// Add message to a ticket (public, verified by passcode in body, or Master-Code / Admin Session)
router.post("/:ticketNumber/messages", async (req, res) => {
  const { ticketNumber } = req.params;
  const { passcode, senderName, message } = req.body;

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
    const isTicketPasscode = passcode && String(passcode) === String(ticket.passcode);

    if (!hasAdminSession && !isMasterCode && !isTicketPasscode) {
      return res.status(403).json({ error: "Invalid access code. Access denied." });
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

    res.json(snakeToCamel(insertedMsg));
  } catch (e: any) {
    res.status(500).json({ error: "Failed to add message, contact support", detail: e.message });
  }
});

export default router;
