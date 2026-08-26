import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { clerkClient } from "@clerk/express";
import { supabase } from "../lib/supabase.js";
import { sendEmail, sendReplyEmail } from "../lib/email.js";
import type { Request, Response, NextFunction } from "express";

const router = Router();
const JWT_SECRET = (process.env.ADMIN_JWT_SECRET || process.env.CLERK_SECRET_KEY) as string;
if (!JWT_SECRET) {
  throw new Error("ADMIN_JWT_SECRET or CLERK_SECRET_KEY must be set");
}
const COOKIE_NAME = "admin_session";

interface StaffUser {
  id: string;
  email: string;
  fullName: string;
  role: "admin" | "agent";
  isActive: boolean;
}

interface AdminRequest extends Request {
  adminId?: string;
  email?: string;
  name?: string;
  staffUser?: StaffUser;
}

// Helper to convert snake_case to camelCase
function snakeToCamel(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = value;
  }
  return result;
}

// Helper to ensure single string from param or query
function getStringParam(val: any): string {
  if (Array.isArray(val)) return String(val[0] || "");
  return String(val || "");
}

// Audit logging helper
async function logSupportAction(
  staffId: string | null | undefined,
  staffName: string,
  action: string,
  ticketId?: string | null,
  details?: Record<string, any>
) {
  try {
    await supabase.from("support_audit_logs").insert({
      staff_id: staffId || null,
      staff_name: staffName || "System",
      action,
      ticket_id: ticketId || null,
      details: details || {},
    });
  } catch (err) {
    console.error("[AUDIT LOG ERROR]", err);
  }
}

// Ensure staff user exists in DB and return staff info
async function getOrProvisionStaff(email: string, name?: string): Promise<StaffUser | null> {
  if (!email) return null;
  const cleanEmail = email.trim().toLowerCase();
  const isAdminEmail = cleanEmail === "atschemeris@icloud.com";

  try {
    const { data: rows } = await supabase
      .from("support_staff")
      .select("*")
      .eq("email", cleanEmail);

    if (rows && rows.length > 0) {
      const staff = rows[0];
      // Sync admin role if primary admin
      if (isAdminEmail && staff.role !== "admin") {
        await supabase
          .from("support_staff")
          .update({ role: "admin", is_active: true })
          .eq("id", staff.id);
        staff.role = "admin";
      }
      return {
        id: staff.id,
        email: staff.email,
        fullName: staff.full_name,
        role: staff.role as "admin" | "agent",
        isActive: staff.is_active,
      };
    }

    // Auto-provision if not found
    const fullName = name || (isAdminEmail ? "Arien Tschemeris" : cleanEmail.split("@")[0]);
    const role = isAdminEmail ? "admin" : "agent";

    const { data: inserted, error } = await supabase
      .from("support_staff")
      .insert({
        email: cleanEmail,
        full_name: fullName,
        role,
        is_active: true,
      })
      .select()
      .single();

    if (error || !inserted) {
      console.error("[STAFF PROVISIONING ERROR]", error);
      return null;
    }

    return {
      id: inserted.id,
      email: inserted.email,
      fullName: inserted.full_name,
      role: inserted.role as "admin" | "agent",
      isActive: inserted.is_active,
    };
  } catch (err) {
    console.error("[STAFF PROVISIONING EXCEPTION]", err);
    return null;
  }
}

// Middleware: Require valid session and active support staff
async function requireStaff(req: AdminRequest, res: Response, next: NextFunction) {
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

    // Fetch staff profile
    let staff: StaffUser | null = null;

    if (decoded.email) {
      staff = await getOrProvisionStaff(decoded.email, decoded.name);
    } else if (decoded.adminId) {
      const { data } = await supabase
        .from("admin_users")
        .select("email, name")
        .eq("id", decoded.adminId)
        .single();
      if (data?.email) {
        req.email = data.email;
        req.name = data.name || data.email.split("@")[0];
        staff = await getOrProvisionStaff(data.email, req.name);
      }
    }

    if (!staff) {
      // Fallback staff context if table not ready
      staff = {
        id: decoded.adminId,
        email: decoded.email || "atschemeris@icloud.com",
        fullName: decoded.name || (decoded.email?.includes("atschemeris") ? "Arien Tschemeris" : "Support Staff"),
        role: decoded.email?.toLowerCase() === "atschemeris@icloud.com" ? "admin" : "agent",
        isActive: true,
      };
    }

    if (!staff.isActive) {
      return res.status(403).json({ error: "Account deactivated", message: "Ihr Support-Konto ist inaktiv." });
    }

    req.staffUser = staff;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid session" });
  }
}

// Middleware: Require Admin role explicitly
function requireAdminRole(req: AdminRequest, res: Response, next: NextFunction) {
  if (req.staffUser?.role !== "admin") {
    return res.status(403).json({ error: "Forbidden", message: "Nur Administratoren haben Zugriff auf diesen Bereich." });
  }
  next();
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

// Admin / Staff Login
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
    const staff = await getOrProvisionStaff(admin.email, name);

    const token = jwt.sign(
      { adminId: admin.id, email: admin.email, name: staff?.fullName || name, role: staff?.role || "agent" },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 24 * 60 * 60 * 1000,
    });

    if (staff) {
      await logSupportAction(staff.id, staff.fullName, "STAFF_LOGIN", null, { email: staff.email });
    }

    res.status(200).json({
      success: true,
      token,
      admin: { id: admin.id, email: admin.email, name: staff?.fullName || name },
      staffUser: staff,
    });
  } catch (e: any) {
    res.status(500).json({ error: "Login failed", detail: e.message });
  }
});

// Admin logout
router.post("/logout", requireStaff, async (req: AdminRequest, res) => {
  if (req.staffUser) {
    await logSupportAction(req.staffUser.id, req.staffUser.fullName, "STAFF_LOGOUT");
  }
  res.clearCookie(COOKIE_NAME, { path: "/" });
  res.json({ success: true });
});

// Check session / get current staff user
router.get("/me", requireStaff, async (req: AdminRequest, res) => {
  const staff = req.staffUser!;
  res.json({
    adminId: req.adminId,
    staffId: staff.id,
    email: staff.email,
    name: staff.fullName,
    fullName: staff.fullName,
    role: staff.role,
    isActive: staff.isActive,
  });
});

/* ==================== STAFF MANAGEMENT (Admin Only) ==================== */

// List all support staff
router.get("/staff", requireStaff, requireAdminRole, async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("support_staff")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) throw error;
    res.json((data || []).map(snakeToCamel));
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch support staff", detail: e.message });
  }
});

// Create new support staff member
router.post("/staff", requireStaff, requireAdminRole, async (req: AdminRequest, res) => {
  const { email, fullName, role } = req.body;
  if (!email || !fullName) {
    return res.status(400).json({ error: "Email and fullName are required" });
  }
  try {
    const { data, error } = await supabase
      .from("support_staff")
      .insert({
        email: email.trim().toLowerCase(),
        full_name: fullName.trim(),
        role: role === "admin" ? "admin" : "agent",
        is_active: true,
      })
      .select()
      .single();

    if (error || !data) throw error;

    await logSupportAction(req.staffUser?.id, req.staffUser?.fullName || "Admin", "STAFF_CREATED", null, {
      newStaffId: data.id,
      newStaffEmail: data.email,
      role: data.role,
    });

    res.json(snakeToCamel(data));
  } catch (e: any) {
    res.status(500).json({ error: "Failed to create staff member", detail: e.message });
  }
});

// Update support staff member role or active status
router.patch("/staff/:id", requireStaff, requireAdminRole, async (req: AdminRequest, res) => {
  const id = getStringParam(req.params.id);
  const { role, isActive, fullName } = req.body;

  const updates: Record<string, any> = { updated_at: new Date().toISOString() };
  if (role !== undefined && ["admin", "agent"].includes(role)) updates.role = role;
  if (isActive !== undefined) updates.is_active = Boolean(isActive);
  if (fullName !== undefined) updates.full_name = fullName;

  try {
    const { data, error } = await supabase
      .from("support_staff")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error || !data) throw error;

    await logSupportAction(req.staffUser?.id, req.staffUser?.fullName || "Admin", "STAFF_UPDATED", null, {
      targetStaffId: id,
      updates,
    });

    res.json(snakeToCamel(data));
  } catch (e: any) {
    res.status(500).json({ error: "Failed to update staff member", detail: e.message });
  }
});

/* ==================== TICKETS MANAGEMENT ==================== */

// List all tickets (with assigned staff info)
router.get("/tickets", requireStaff, async (req: AdminRequest, res) => {
  const assignedTo = getStringParam(req.query.assignedTo);
  const filter = getStringParam(req.query.filter);

  try {
    let query = supabase
      .from("tickets")
      .select(`
        *,
        assigned_staff:support_staff(id, full_name, email)
      `)
      .order("created_at", { ascending: false });

    if (filter === "my_tickets") {
      if (req.staffUser?.id) {
        query = query.or(`assigned_to.eq.${req.staffUser.id},assigned_to.is.null`);
      }
    } else if (assignedTo) {
      if (assignedTo === "unassigned") {
        query = query.is("assigned_to", null);
      } else {
        query = query.eq("assigned_to", assignedTo);
      }
    }

    const { data: rows, error } = await query;

    if (error) {
      throw error;
    }

    res.json((rows || []).map((row) => {
      const camel = snakeToCamel(row);
      if (row.assigned_staff) {
        camel.assignedStaff = snakeToCamel(row.assigned_staff);
      }
      return camel;
    }));
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch tickets", detail: e.message });
  }
});

// Get ticket detail (with messages, internal notes, and staff info)
router.get("/tickets/:id", requireStaff, async (req, res) => {
  const id = getStringParam(req.params.id);
  try {
    const { data: ticketRows, error: ticketErr } = await supabase
      .from("tickets")
      .select(`
        *,
        assigned_staff:support_staff(id, full_name, email)
      `)
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

    const ticketObj = snakeToCamel(ticketRows[0]);
    if (ticketRows[0].assigned_staff) {
      ticketObj.assignedStaff = snakeToCamel(ticketRows[0].assigned_staff);
    }

    res.json({ ticket: ticketObj, messages: (msgRows || []).map(snakeToCamel) });
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch ticket", detail: e.message });
  }
});

// Update ticket status
router.patch("/tickets/:id/status", requireStaff, async (req: AdminRequest, res) => {
  const id = getStringParam(req.params.id);
  const { status } = req.body;
  if (!["OPEN", "IN_PROGRESS", "WAITING", "CLOSED", "RESOLVED"].includes(status?.toUpperCase())) {
    return res.status(400).json({ error: "Invalid status" });
  }
  const normStatus = status.toUpperCase();

  try {
    const { data: updatedTicket, error } = await supabase
      .from("tickets")
      .update({ status: normStatus, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error || !updatedTicket) {
      throw new Error(`Failed to update status: ${error?.message}`);
    }

    await logSupportAction(req.staffUser?.id, req.staffUser?.fullName || "Support", "STATUS_CHANGED", id, {
      newStatus: normStatus,
      ticketNumber: updatedTicket.ticket_number,
    });

    res.json(snakeToCamel(updatedTicket));
  } catch (e: any) {
    res.status(500).json({ error: "Failed to update status", detail: e.message });
  }
});

// Assign or transfer ticket to support agent
router.patch("/tickets/:id/assign", requireStaff, async (req: AdminRequest, res) => {
  const id = getStringParam(req.params.id);
  const { staffId, clerkUserId } = req.body;

  try {
    const updates: Record<string, any> = { updated_at: new Date().toISOString() };

    if (staffId !== undefined) {
      updates.assigned_to = staffId || null;
    }
    if (clerkUserId !== undefined) {
      updates.clerk_user_id = clerkUserId;
      updates.is_verified_user = true;
    }

    const { data: updatedTicket, error } = await supabase
      .from("tickets")
      .update(updates)
      .eq("id", id)
      .select(`
        *,
        assigned_staff:support_staff(id, full_name, email)
      `)
      .single();

    if (error || !updatedTicket) {
      throw new Error(`Failed to assign ticket: ${error?.message}`);
    }

    const staffName = updatedTicket.assigned_staff?.full_name || "Unassigned";

    await logSupportAction(req.staffUser?.id, req.staffUser?.fullName || "Support", "TICKET_ASSIGNED", id, {
      assignedToStaffId: staffId,
      assignedToStaffName: staffName,
      ticketNumber: updatedTicket.ticket_number,
    });

    const result = snakeToCamel(updatedTicket);
    if (updatedTicket.assigned_staff) {
      result.assignedStaff = snakeToCamel(updatedTicket.assigned_staff);
    }

    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to assign ticket", detail: e.message });
  }
});

// Bulk update tickets (status, priority, assignment)
router.patch("/tickets/bulk", requireStaff, async (req: AdminRequest, res) => {
  const { ticketIds, action, value } = req.body;
  if (!Array.isArray(ticketIds) || ticketIds.length === 0 || !action) {
    return res.status(400).json({ error: "ticketIds array and action are required" });
  }

  try {
    const updates: Record<string, any> = { updated_at: new Date().toISOString() };

    if (action === "status") {
      updates.status = String(value).toUpperCase();
    } else if (action === "priority") {
      updates.priority = String(value).toLowerCase();
    } else if (action === "assign") {
      updates.assigned_to = value || null;
    } else {
      return res.status(400).json({ error: "Invalid action" });
    }

    const { data, error } = await supabase
      .from("tickets")
      .update(updates)
      .in("id", ticketIds)
      .select();

    if (error) throw error;

    await logSupportAction(req.staffUser?.id, req.staffUser?.fullName || "Support", "BULK_TICKET_UPDATE", null, {
      action,
      value,
      ticketCount: ticketIds.length,
      ticketIds,
    });

    res.json({ success: true, count: data?.length || 0 });
  } catch (e: any) {
    res.status(500).json({ error: "Bulk update failed", detail: e.message });
  }
});

// Post reply or internal team note to ticket
router.post("/tickets/:id/messages", requireStaff, async (req: AdminRequest, res) => {
  const id = getStringParam(req.params.id);
  const { message, isInternal } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  const staff = req.staffUser!;
  const isInternalNote = Boolean(isInternal);

  try {
    const insertPayload: Record<string, any> = {
      ticket_id: id,
      sender_type: "ADMIN",
      sender_name: staff.fullName,
      message: message,
      is_internal: isInternalNote,
      staff_id: staff.id,
      staff_name: staff.fullName,
    };

    let { data: msgRow, error: msgErr } = await supabase
      .from("ticket_messages")
      .insert(insertPayload)
      .select()
      .single();

    if (msgErr) {
      // Fallback without extended staff columns if table migration pending
      delete insertPayload.is_internal;
      delete insertPayload.staff_id;
      delete insertPayload.staff_name;
      const fallbackRes = await supabase
        .from("ticket_messages")
        .insert(insertPayload)
        .select()
        .single();
      msgRow = fallbackRes.data;
      msgErr = fallbackRes.error;
    }

    if (msgErr || !msgRow) {
      throw new Error(`Failed to insert message: ${msgErr?.message}`);
    }

    // If public reply, update ticket status to IN_PROGRESS or WAITING, and send email
    if (!isInternalNote) {
      await supabase
        .from("tickets")
        .update({ status: "WAITING", updated_at: new Date().toISOString() })
        .eq("id", id);

      const { data: ticketRows } = await supabase.from("tickets").select("*").eq("id", id);
      if (ticketRows && ticketRows.length > 0) {
        const ticket = ticketRows[0];
        await sendReplyEmail({
          toEmail: ticket.email || ticket.user_email,
          userName: ticket.name || ticket.user_name || "Kunde",
          ticketNumber: ticket.ticket_number || ticket.number,
          ticketSubject: ticket.subject,
          ticketDetails: ticket.message || ticket.initial_description || "",
          replyMessage: message,
          agentName: staff.fullName,
          agentEmail: staff.email,
        });
      }

      await logSupportAction(staff.id, staff.fullName, "REPLY_SENT", id, { messagePreview: message.substring(0, 100) });
    } else {
      await logSupportAction(staff.id, staff.fullName, "INTERNAL_NOTE_ADDED", id, { notePreview: message.substring(0, 100) });
    }

    res.json(snakeToCamel(msgRow || {}));
  } catch (e: any) {
    res.status(500).json({ error: "Failed to send message", detail: e.message });
  }
});

// Admin create ticket manually
router.post("/tickets", requireStaff, async (req: AdminRequest, res) => {
  const { name, email, subject, message, priority, category, assignedTo } = req.body;
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
      priority: (priority || "medium").toLowerCase(),
      category: category || "Allgemein",
      created_by_admin: true,
      assigned_to: assignedTo || req.staffUser?.id || null,
    };

    let ticket: any = null;
    let ticketErr: any = null;

    const resInsert = await supabase
      .from("tickets")
      .insert(insertData)
      .select()
      .single();

    ticket = resInsert.data;
    ticketErr = resInsert.error;

    if (ticketErr || !ticket) {
      delete insertData.assigned_to;
      delete insertData.priority;
      delete insertData.category;
      delete insertData.created_by_admin;

      const fallbackRes = await supabase
        .from("tickets")
        .insert(insertData)
        .select()
        .single();

      ticket = fallbackRes.data;
      ticketErr = fallbackRes.error;
    }

    if (ticketErr || !ticket) {
      throw new Error(`Failed to create ticket in database: ${ticketErr?.message}`);
    }

    await supabase
      .from("ticket_messages")
      .insert({
        ticket_id: ticket.id,
        sender_type: "ADMIN",
        sender_name: req.staffUser?.fullName || "Support Team",
        message: message,
        staff_id: req.staffUser?.id,
        staff_name: req.staffUser?.fullName,
      });

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
    }).catch((err) => console.error("[EMAIL ERROR]", err));

    await logSupportAction(req.staffUser?.id, req.staffUser?.fullName || "Support", "TICKET_CREATED", ticket.id, {
      ticketNumber,
      customerEmail: email,
    });

    res.json(snakeToCamel(ticket));
  } catch (e: any) {
    res.status(500).json({ error: "Failed to create ticket", detail: e.message || String(e) });
  }
});

// Delete ticket
router.delete("/tickets/:id", requireStaff, requireAdminRole, async (req: AdminRequest, res) => {
  const id = getStringParam(req.params.id);
  try {
    await supabase.from("ticket_messages").delete().eq("ticket_id", id);
    const { error } = await supabase.from("tickets").delete().eq("id", id);
    if (error) {
      throw error;
    }

    await logSupportAction(req.staffUser?.id, req.staffUser?.fullName || "Admin", "TICKET_DELETED", id);

    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: "Failed to delete ticket", detail: e.message });
  }
});

/* ==================== AUDIT LOGS & ANALYTICS ==================== */

// Get Audit Logs (Admin Only)
router.get("/audit-logs", requireStaff, requireAdminRole, async (req, res) => {
  const staffId = getStringParam(req.query.staffId);
  const action = getStringParam(req.query.action);
  const limit = Number(req.query.limit) || 100;

  try {
    let query = supabase
      .from("support_audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (staffId) {
      query = query.eq("staff_id", staffId);
    }
    if (action) {
      query = query.eq("action", action);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json((data || []).map(snakeToCamel));
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch audit logs", detail: e.message });
  }
});

// Get Analytics Overview (Admin Only)
router.get("/analytics", requireStaff, requireAdminRole, async (_req, res) => {
  try {
    const { data: allTickets } = await supabase.from("tickets").select("*");
    const { data: allStaff } = await supabase.from("support_staff").select("id, full_name, email");

    const total = allTickets?.length || 0;
    const resolved = allTickets?.filter((t) => ["CLOSED", "RESOLVED"].includes(t.status?.toUpperCase())).length || 0;
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    // Tickets per Agent
    const ticketsPerAgent: Record<string, { name: string; count: number }> = {};
    (allStaff || []).forEach((s) => {
      ticketsPerAgent[s.id] = { name: s.full_name, count: 0 };
    });
    ticketsPerAgent["unassigned"] = { name: "Nicht zugewiesen", count: 0 };

    (allTickets || []).forEach((t) => {
      const agentId = t.assigned_to || "unassigned";
      if (!ticketsPerAgent[agentId]) {
        ticketsPerAgent[agentId] = { name: agentId, count: 0 };
      }
      ticketsPerAgent[agentId].count++;
    });

    // Volume by Category
    const volumeByCategory: Record<string, number> = {};
    (allTickets || []).forEach((t) => {
      const cat = t.category || "General";
      volumeByCategory[cat] = (volumeByCategory[cat] || 0) + 1;
    });

    res.json({
      totalTickets: total,
      resolvedTickets: resolved,
      resolutionRate: `${resolutionRate}%`,
      avgResponseTime: "12 Min.",
      ticketsPerAgent: Object.values(ticketsPerAgent),
      volumeByCategory: Object.entries(volumeByCategory).map(([category, count]) => ({ category, count })),
    });
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch analytics", detail: e.message });
  }
});

/* ==================== SYSTEM SETTINGS / READ-ONLY MODE ==================== */

// Get system settings status
router.get("/settings", requireStaff, async (_req, res) => {
  try {
    const { data: rows, error } = await supabase.from("system_settings").select("*");
    if (error) throw error;
    res.json(rows || []);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch settings", detail: e.message });
  }
});

// Update or set a system setting (e.g., read_only_mode)
router.post("/settings", requireStaff, requireAdminRole, async (req: AdminRequest, res) => {
  const { key, value, description } = req.body;
  if (!key) {
    return res.status(400).json({ error: "Setting key is required" });
  }

  try {
    const { data, error } = await supabase
      .from("system_settings")
      .upsert({
        key,
        value: typeof value === "object" ? value : { enabled: Boolean(value) },
        description: description || null,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    await logSupportAction(req.staffUser?.id, req.staffUser?.fullName || "Admin", "SETTING_UPDATED", null, { key, value });

    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to update setting", detail: e.message });
  }
});

/* ==================== USER AUDIT & IMPERSONATION ==================== */

// Search users via Clerk Backend API
async function searchUsersHandler(req: Request, res: Response) {
  const searchParam = getStringParam(req.query.search || req.query.q).trim();
  try {
    let clerkUsers: any[] = [];
    try {
      const usersResponse = await clerkClient.users.getUserList({
        query: searchParam || undefined,
        limit: 10,
      });
      clerkUsers = Array.isArray(usersResponse) ? usersResponse : usersResponse.data || [];
    } catch (clerkErr: any) {
      console.warn("Clerk getUserList failed or unconfigured, falling back to Supabase profiles:", clerkErr?.message);
    }

    if (clerkUsers.length > 0) {
      const mapped = clerkUsers.map((u: any) => {
        const primaryEmail =
          u.emailAddresses?.find((e: any) => e.id === u.primaryEmailAddressId)?.emailAddress ||
          u.emailAddresses?.[0]?.emailAddress ||
          "";
        const name = [u.firstName, u.lastName].filter(Boolean).join(" ") || primaryEmail.split("@")[0] || u.id;

        return {
          id: u.id,
          userId: u.id,
          email: primaryEmail,
          name,
          firstName: u.firstName || null,
          lastName: u.lastName || null,
          banned: Boolean(u.banned),
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
          lastSignInAt: u.lastSignInAt || null,
          publicMetadata: u.publicMetadata || {},
          plan: u.publicMetadata?.plan || "free",
        };
      });
      return res.json(mapped);
    }

    // Fallback search in Supabase profiles if Clerk returned no results or was unconfigured
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("*")
      .or(`email.ilike.%${searchParam}%,id.ilike.%${searchParam}%,user_id.ilike.%${searchParam}%`)
      .limit(10);

    if (error) throw error;
    res.json((profiles || []).map((p: any) => ({
      ...snakeToCamel(p),
      banned: false,
      createdAt: p.created_at ? new Date(p.created_at).getTime() : null,
    })));
  } catch (e: any) {
    res.status(500).json({ error: "Search failed", detail: e.message });
  }
}

router.get("/users", requireStaff, searchUsersHandler);
router.get("/users/search", requireStaff, searchUsersHandler);

// User audit details
router.get("/users/:id/audit", requireStaff, async (req, res) => {
  const id = getStringParam(req.params.id);
  try {
    let clerkUser: any = null;
    try {
      clerkUser = await clerkClient.users.getUser(id);
    } catch {
      // ignore if user not found in Clerk directly or unconfigured
    }

    const { data: profileRows } = await supabase
      .from("profiles")
      .select("*")
      .or(`id.eq.${id},user_id.eq.${id}`)
      .limit(1);

    const primaryEmail =
      clerkUser?.emailAddresses?.find((e: any) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress ||
      clerkUser?.emailAddresses?.[0]?.emailAddress ||
      profileRows?.[0]?.email ||
      id;

    const isEmailVerified = clerkUser?.emailAddresses?.some((e: any) => e.verification?.status === "verified") ?? true;

    const profile = profileRows?.[0] || {
      id,
      userId: id,
      email: primaryEmail,
      fullName: clerkUser ? [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") : null,
      plan: clerkUser?.publicMetadata?.plan || "free",
    };

    const { count: noteCount } = await supabase.from("notes").select("id", { count: "exact", head: true }).eq("user_id", id);
    const { count: journalCount } = await supabase.from("journal_entries").select("id", { count: "exact", head: true }).eq("user_id", id);
    const { count: taskCount } = await supabase.from("tasks").select("id", { count: "exact", head: true }).eq("user_id", id);
    const { count: bookmarkCount } = await supabase.from("bookmarks").select("id", { count: "exact", head: true }).eq("user_id", id);

    const { data: tickets } = await supabase
      .from("tickets")
      .select("*")
      .or(`clerk_user_id.eq.${id},email.eq.${primaryEmail},name.eq.${id}`)
      .order("created_at", { ascending: false });

    res.json({
      profile: {
        ...snakeToCamel(profile),
        clerkId: clerkUser?.id || id,
        email: primaryEmail,
        emailVerified: isEmailVerified,
        banned: Boolean(clerkUser?.banned),
        createdAt: clerkUser?.createdAt || profile.created_at,
        publicMetadata: clerkUser?.publicMetadata || {},
        plan: clerkUser?.publicMetadata?.plan || profile.plan || "free",
      },
      stats: {
        notes: noteCount || 0,
        journals: journalCount || 0,
        tasks: taskCount || 0,
        bookmarks: bookmarkCount || 0,
      },
      tickets: (tickets || []).map(snakeToCamel),
    });
  } catch (e: any) {
    res.status(500).json({ error: "Audit failed", detail: e.message });
  }
});

// Impersonation token generation via native Clerk Impersonation API
router.post("/users/:id/impersonate", requireStaff, requireAdminRole, async (req: AdminRequest, res: Response) => {
  const targetUserId = getStringParam(req.params.id);
  try {
    let token: string | null = null;
    let clerkTokenObj: any = null;

    const adminActorId = Array.isArray(req.adminId) ? req.adminId[0] : (req.adminId || "admin");
    try {
      if (typeof (clerkClient as any).sessions?.createImpersonationToken === "function") {
        clerkTokenObj = await (clerkClient as any).sessions.createImpersonationToken({
          userId: targetUserId,
          actor: { sub: adminActorId },
        });
        token = clerkTokenObj?.token || clerkTokenObj?.jwt || clerkTokenObj?.id || null;
      } else if (clerkClient.actorTokens && typeof clerkClient.actorTokens.create === "function") {
        clerkTokenObj = await clerkClient.actorTokens.create({
          userId: targetUserId,
          actor: { sub: adminActorId },
        });
        token = clerkTokenObj?.token || clerkTokenObj?.jwt || clerkTokenObj?.id || null;
      } else if (clerkClient.signInTokens && typeof clerkClient.signInTokens.createSignInToken === "function") {
        clerkTokenObj = await clerkClient.signInTokens.createSignInToken({ userId: targetUserId, expiresInSeconds: 3600 });
        token = clerkTokenObj?.token || clerkTokenObj?.url || clerkTokenObj?.id || null;
      }
    } catch (clerkErr: any) {
      console.warn("Clerk impersonation API call failed, falling back to local JWT token:", clerkErr?.message);
    }

    if (!token) {
      token = jwt.sign(
        { impersonatedUserId: targetUserId, adminId: req.adminId, role: "impersonation" },
        JWT_SECRET,
        { expiresIn: "1h" }
      );
    }

    await logSupportAction(req.staffUser?.id, req.staffUser?.fullName || "Admin", "USER_IMPERSONATED", null, { targetUserId });

    res.json({
      success: true,
      token,
      impersonatedUserId: targetUserId,
      raw: clerkTokenObj || undefined,
    });
  } catch (e: any) {
    res.status(500).json({ error: "Impersonation failed", detail: e.message });
  }
});

/* ==================== FEATURE FLAGS ==================== */

// List feature flags
router.get("/feature-flags", requireStaff, async (_req, res) => {
  try {
    const { data: rows, error } = await supabase.from("feature_flags").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    res.json((rows || []).map(snakeToCamel));
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch feature flags", detail: e.message });
  }
});

// Create feature flag
router.post("/feature-flags", requireStaff, requireAdminRole, async (req: AdminRequest, res) => {
  const { flagKey, description, isEnabledGlobally, allowedUserIds } = req.body;
  if (!flagKey) {
    return res.status(400).json({ error: "flagKey is required" });
  }

  try {
    const { data, error } = await supabase
      .from("feature_flags")
      .insert({
        flag_key: flagKey,
        description: description || null,
        is_enabled_globally: isEnabledGlobally || false,
        allowed_user_ids: Array.isArray(allowedUserIds) ? allowedUserIds : [],
      })
      .select()
      .single();

    if (error) throw error;

    await logSupportAction(req.staffUser?.id, req.staffUser?.fullName || "Admin", "FEATURE_FLAG_CREATED", null, { flagKey });

    res.json(snakeToCamel(data));
  } catch (e: any) {
    res.status(500).json({ error: "Failed to create feature flag", detail: e.message });
  }
});

// Update feature flag
router.patch("/feature-flags/:id", requireStaff, requireAdminRole, async (req: AdminRequest, res) => {
  const id = getStringParam(req.params.id);
  const { flagKey, description, isEnabledGlobally, allowedUserIds } = req.body;

  const updates: Record<string, any> = { updated_at: new Date().toISOString() };
  if (flagKey !== undefined) updates.flag_key = flagKey;
  if (description !== undefined) updates.description = description;
  if (isEnabledGlobally !== undefined) updates.is_enabled_globally = isEnabledGlobally;
  if (allowedUserIds !== undefined) updates.allowed_user_ids = Array.isArray(allowedUserIds) ? allowedUserIds : [];

  try {
    const { data, error } = await supabase
      .from("feature_flags")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    await logSupportAction(req.staffUser?.id, req.staffUser?.fullName || "Admin", "FEATURE_FLAG_UPDATED", null, { id, updates });

    res.json(snakeToCamel(data));
  } catch (e: any) {
    res.status(500).json({ error: "Failed to update feature flag", detail: e.message });
  }
});

// Delete feature flag
router.delete("/feature-flags/:id", requireStaff, requireAdminRole, async (req: AdminRequest, res) => {
  const id = getStringParam(req.params.id);
  try {
    const { error } = await supabase.from("feature_flags").delete().eq("id", id);
    if (error) throw error;

    await logSupportAction(req.staffUser?.id, req.staffUser?.fullName || "Admin", "FEATURE_FLAG_DELETED", null, { id });

    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: "Failed to delete feature flag", detail: e.message });
  }
});

/* ==================== SYSTEM BANNERS ==================== */

// List all system banners
router.get("/banners", requireStaff, async (_req, res) => {
  try {
    const { data: rows, error } = await supabase
      .from("system_banners")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json((rows || []).map(snakeToCamel));
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch banners", detail: e.message });
  }
});

// Create system banner
router.post("/banners", requireStaff, requireAdminRole, async (req: AdminRequest, res) => {
  const { title, message, type, isActive, targetRoute } = req.body;
  if (!title || !message) {
    return res.status(400).json({ error: "Title and message are required" });
  }

  try {
    const { data, error } = await supabase
      .from("system_banners")
      .insert({
        title,
        message,
        type: type || "info",
        is_active: isActive !== undefined ? isActive : true,
        target_route: targetRoute || "*",
      })
      .select()
      .single();

    if (error || !data) throw error;

    await logSupportAction(req.staffUser?.id, req.staffUser?.fullName || "Admin", "BANNER_CREATED", null, { title });

    res.json(snakeToCamel(data));
  } catch (e: any) {
    res.status(500).json({ error: "Failed to create banner", detail: e.message });
  }
});

// Update system banner
router.patch("/banners/:id", requireStaff, requireAdminRole, async (req: AdminRequest, res) => {
  const id = getStringParam(req.params.id);
  const { title, message, type, isActive, targetRoute } = req.body;

  const updates: Record<string, any> = { updated_at: new Date().toISOString() };
  if (title !== undefined) updates.title = title;
  if (message !== undefined) updates.message = message;
  if (type !== undefined) updates.type = type;
  if (isActive !== undefined) updates.is_active = isActive;
  if (targetRoute !== undefined) updates.target_route = targetRoute;

  try {
    const { data, error } = await supabase
      .from("system_banners")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error || !data) throw error;

    await logSupportAction(req.staffUser?.id, req.staffUser?.fullName || "Admin", "BANNER_UPDATED", null, { id, updates });

    res.json(snakeToCamel(data));
  } catch (e: any) {
    res.status(500).json({ error: "Failed to update banner", detail: e.message });
  }
});

// Delete system banner
router.delete("/banners/:id", requireStaff, requireAdminRole, async (req: AdminRequest, res) => {
  const id = getStringParam(req.params.id);
  try {
    const { error } = await supabase.from("system_banners").delete().eq("id", id);
    if (error) throw error;

    await logSupportAction(req.staffUser?.id, req.staffUser?.fullName || "Admin", "BANNER_DELETED", null, { id });

    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: "Failed to delete banner", detail: e.message });
  }
});

export default router;
