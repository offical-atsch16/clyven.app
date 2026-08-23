import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { supabase } from "../lib/supabase.js";
import { sendEmail, sendReplyEmail } from "../lib/email.js";
import type { Request, Response, NextFunction } from "express";

const router = Router();
const JWT_SECRET = (process.env.ADMIN_JWT_SECRET || process.env.CLERK_SECRET_KEY) as string;
if (!JWT_SECRET) {
  throw new Error("ADMIN_JWT_SECRET or CLERK_SECRET_KEY must be set");
}
const COOKIE_NAME = "admin_session";

interface AdminRequest extends Request {
  adminId?: string;
  email?: string;
  name?: string;
}

function requireAdmin(req: AdminRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const headerToken = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null;
  const token = req.cookies?.[COOKIE_NAME] || headerToken;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as unknown as { adminId: string; email?: string; name?: string };
    req.adminId = decoded.adminId;
    req.email = decoded.email;
    req.name = decoded.name;
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

// Admin login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  try {
    const { data: adminRows, error } = await supabase
      .from("admin_users")
      .select("*")
      .eq("email", email);

    if (error) {
      throw error;
    }

    if (!adminRows || !adminRows.length) {
      return res.status(401).json({ error: "Invalid credentials", message: "E-Mail oder Passwort falsch." });
    }
    const admin = adminRows[0];
    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials", message: "E-Mail oder Passwort falsch." });
    }
    const name = admin.name || admin.email.split("@")[0];
    const token = jwt.sign({ adminId: admin.id, email: admin.email, name }, JWT_SECRET, { expiresIn: "24h" });
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.status(200).json({ success: true, token, admin: { id: admin.id, email: admin.email, name } });
  } catch (e: any) {
    res.status(500).json({ error: "Login failed", detail: e.message });
  }
});

// Admin logout
router.post("/logout", (_req, res) => {
  res.clearCookie(COOKIE_NAME, { path: "/" });
  res.json({ success: true });
});

// Check session
router.get("/me", requireAdmin, async (req: AdminRequest, res) => {
  try {
    if (req.email && req.name) {
      return res.json({ adminId: req.adminId, email: req.email, name: req.name });
    }
    const { data } = await supabase
      .from("admin_users")
      .select("email, name")
      .eq("id", req.adminId!)
      .single();

    const email = data?.email || req.email || "";
    const name = data?.name || req.name || (email ? email.split("@")[0] : "");

    res.json({ adminId: req.adminId, email, name });
  } catch {
    res.json({ adminId: req.adminId, email: req.email || "", name: req.name || (req.email ? req.email.split("@")[0] : "") });
  }
});

// List all tickets
router.get("/tickets", requireAdmin, async (_req, res) => {
  try {
    const { data: rows, error } = await supabase
      .from("tickets")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    res.json((rows || []).map(snakeToCamel));
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch tickets", detail: e.message });
  }
});

// Get ticket detail (with messages)
router.get("/tickets/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const { data: ticketRows, error: ticketErr } = await supabase
      .from("tickets")
      .select("*")
      .eq("id", id);

    if (ticketErr) {
      throw ticketErr;
    }

    if (!ticketRows || !ticketRows.length) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const { data: msgRows, error: msgErr } = await supabase
      .from("ticket_messages")
      .select("*")
      .eq("ticket_id", id)
      .order("created_at", { ascending: true });

    if (msgErr) {
      throw msgErr;
    }

    res.json({ ticket: snakeToCamel(ticketRows[0]), messages: (msgRows || []).map(snakeToCamel) });
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch ticket", detail: e.message });
  }
});

// Update ticket status
router.patch("/tickets/:id/status", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!["OPEN", "IN_PROGRESS", "WAITING", "CLOSED"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }
  try {
    const { data: updatedTicket, error } = await supabase
      .from("tickets")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error || !updatedTicket) {
      throw new Error(`Failed to update status: ${error?.message}`);
    }

    res.json(snakeToCamel(updatedTicket));
  } catch (e: any) {
    res.status(500).json({ error: "Failed to update status", detail: e.message });
  }
});

// Admin reply to ticket
router.post("/tickets/:id/messages", requireAdmin, async (req: AdminRequest, res) => {
  const { id } = req.params;
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }
  try {
    const { data: adminRows, error: adminErr } = await supabase
      .from("admin_users")
      .select("email, name")
      .eq("id", req.adminId!);

    if (adminErr) {
      throw adminErr;
    }

    if (!adminRows || !adminRows.length) {
      return res.status(404).json({ error: "Admin not found" });
    }

    const adminUser = adminRows[0];
    const agentEmail = adminUser.email || req.email || "";
    const agentName = adminUser.name || req.name || agentEmail.split("@")[0] || "Support";

    const { data: msgRow, error: msgErr } = await supabase
      .from("ticket_messages")
      .insert({
        ticket_id: id,
        sender_type: "ADMIN",
        sender_name: agentName,
        message: message
      })
      .select()
      .single();

    if (msgErr || !msgRow) {
      throw new Error(`Failed to insert message: ${msgErr?.message}`);
    }

    await supabase
      .from("tickets")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", id);

    // Send reply email notification to customer (non-blocking)
    const { data: ticketRows } = await supabase.from("tickets").select("*").eq("id", id);
    if (ticketRows && ticketRows.length > 0) {
      const ticket = ticketRows[0];
      await sendReplyEmail({
        toEmail: ticket.email,
        userName: ticket.name,
        ticketNumber: ticket.ticket_number,
        ticketSubject: ticket.subject,
        ticketDetails: ticket.message,
        replyMessage: message,
        agentName: agentName,
        agentEmail: agentEmail,
      });
    }

    res.json(snakeToCamel(msgRow));
  } catch (e: any) {
    res.status(500).json({ error: "Failed to send message", detail: e.message });
  }
});

// Admin create ticket manually
router.post("/tickets", requireAdmin, async (req, res) => {
  const { name, email, subject, message, priority, category } = req.body;
  if (!email || !subject || !message) {
    return res.status(400).json({ error: "E-Mail, Betreff und Nachricht sind erforderlich." });
  }
  const customerName = name || email.split("@")[0];

  try {
    let ticketNumber = "TICKET-000001";
    try {
      ticketNumber = await getNextTicketNumber();
    } catch (codeErr) {
      console.error("[ADMIN TICKET CODE GENERATION ERROR]", codeErr);
    }

    let passcode = "100000";
    try {
      passcode = crypto.randomInt(100000, 1000000).toString();
    } catch (passcodeErr) {
      console.error("[ADMIN PASSCODE GENERATION ERROR]", passcodeErr);
    }

    const insertData: Record<string, any> = {
      ticket_number: ticketNumber,
      name: customerName,
      email,
      subject,
      message,
      passcode,
      status: "OPEN",
      priority: priority || "MEDIUM",
      category: category || "Allgemein",
      created_by_admin: true
    };

    let ticket: any = null;
    let ticketErr: any = null;

    // Try primary insertion with all metadata fields
    const resInsert = await supabase
      .from("tickets")
      .insert(insertData)
      .select()
      .single();

    ticket = resInsert.data;
    ticketErr = resInsert.error;

    // Fallback: If insertion failed (e.g., due to missing database columns priority/category/created_by_admin), retry with core fields
    if (ticketErr || !ticket) {
      console.warn("Primary ticket insertion failed, attempting fallback insertion with core fields:", ticketErr?.message);
      const fallbackInsertData = {
        ticket_number: ticketNumber,
        name: customerName,
        email,
        subject,
        message,
        passcode,
        status: "OPEN"
      };

      const fallbackRes = await supabase
        .from("tickets")
        .insert(fallbackInsertData)
        .select()
        .single();

      ticket = fallbackRes.data;
      ticketErr = fallbackRes.error;
    }

    if (ticketErr || !ticket) {
      console.error("ADMIN CREATE TICKET DATABASE ERROR:", ticketErr);
      throw new Error(`Failed to create ticket in database: ${ticketErr?.message || "Unknown error"}`);
    }

    // Insert message into ticket_messages
    try {
      const { error: msgErr } = await supabase
        .from("ticket_messages")
        .insert({
          ticket_id: ticket.id,
          sender_type: "ADMIN",
          sender_name: "Support Team",
          message: message
        });

      if (msgErr) {
        console.error("Error inserting ticket message:", msgErr);
      }
    } catch (msgErrEx) {
      console.error("Exception when inserting ticket message:", msgErrEx);
    }

    // Trigger non-blocking email notification to customer
    try {
      sendEmail({
        userName: customerName,
        ticketEmail: email,
        ticketNumber,
        ticketSubject: subject,
        ticketDetails: message,
        ticketPasscode: passcode,
        to: email,
        subject: `[CLYVEN Support] Neues Ticket #${ticketNumber}: ${subject}`,
        message,
      }).catch((err) => console.error("[EMAIL ERROR] Versand fehlgeschlagen für admin erstelltes Ticket:", err));
    } catch (emailTryErr) {
      console.error("[EMAIL ERROR] Mailversand Exception abgefangen:", emailTryErr);
    }

    res.json(snakeToCamel(ticket));
  } catch (e: any) {
    console.error("ADMIN CREATE TICKET ERROR:", e);
    res.status(500).json({ error: "Failed to create ticket", detail: e.message || String(e) });
  }
});

// Delete ticket
router.delete("/tickets/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await supabase.from("ticket_messages").delete().eq("ticket_id", id);
    const { error } = await supabase.from("tickets").delete().eq("id", id);
    if (error) {
      throw error;
    }
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: "Failed to delete ticket", detail: e.message });
  }
});

export default router;
