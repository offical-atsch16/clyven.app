import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useParams } from "wouter";
import {
  ArrowLeft, Send, Loader2, CheckCircle, Clock, AlertCircle,
  Mail, User, Calendar, Lock, Trash2, Zap, MessageSquare, AlertTriangle,
  UserCheck, Shield, FileText, Bookmark, CheckSquare, Activity, ShieldCheck
} from "lucide-react";
import { cn } from "../lib/utils";
import { api } from "../lib/api";

const CANNED_RESPONSES = [
  {
    title: "Password Reset Procedure",
    text: "Please visit the sign-in page and click 'Forgot password' to receive a reset link directly to your email address.",
  },
  {
    title: "Refund Policy",
    text: "Under our Clyven Plus Terms, subscriptions are eligible for a full refund within 14 days of purchase. Please confirm if you wish to proceed.",
  },
  {
    title: "Confirmation Received",
    text: "Thank you for reaching out to Clyven Support. We have received your inquiry and are reviewing the details provided.",
  },
  {
    title: "Request More Information",
    text: "To help us resolve this issue quickly, could you please provide a screenshot or additional details regarding the error you encountered?",
  },
  {
    title: "Problem Resolved",
    text: "We have deployed a fix addressing your issue. Please refresh your browser or app and verify if everything is working as expected.",
  },
];

export function AdminTicketDetail() {
  const { id } = useParams() as { id: string };
  const [, navigate] = useLocation();

  const [ticket, setTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [reply, setReply] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [statusChanging, setStatusChanging] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Staff and User Context
  const [staffList, setStaffList] = useState<any[]>([]);
  const [currentStaff, setCurrentStaff] = useState<any>(null);
  const [assigning, setAssigning] = useState(false);

  // Customer Profile & Audit Context
  const [customerAudit, setCustomerAudit] = useState<any>(null);
  const [customerAuditLoading, setCustomerAuditLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkAuth();
    fetchStaff();
    fetchDetail();
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function checkAuth() {
    try {
      const res = await api.adminMe();
      if (res) {
        setCurrentStaff({
          id: res.staffId || res.adminId,
          email: res.email,
          fullName: res.fullName || res.name || "Arien Tschemeris",
          role: res.role || "admin",
        });
      }
    } catch {
      navigate("/admin/login");
    }
  }

  async function fetchStaff() {
    try {
      const data = await api.getSupportStaff();
      setStaffList(data || []);
    } catch (e: any) {
      console.error(e);
    }
  }

  async function fetchDetail() {
    setLoading(true);
    try {
      const data = await api.getAdminTicket(id);
      setTicket(data.ticket);
      setMessages(data.messages || []);

      if (data.ticket?.clerkUserId || data.ticket?.email) {
        fetchCustomerContext(data.ticket.clerkUserId || data.ticket.email);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCustomerContext(userIdOrEmail: string) {
    setCustomerAuditLoading(true);
    try {
      const data = await api.getAdminUserAudit(userIdOrEmail);
      setCustomerAudit(data);
    } catch (e: any) {
      console.error(e);
    } finally {
      setCustomerAuditLoading(false);
    }
  }

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    try {
      const data = await api.adminReply(id, reply, isInternal);
      setMessages((m) => [...m, data]);
      setReply("");
      if (!isInternal && ticket.status === "CLOSED") {
        setTicket((t: any) => ({ ...t, status: "OPEN" }));
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setSending(false);
    }
  }

  async function changeStatus(status: string) {
    setStatusChanging(true);
    try {
      const data = await api.updateTicketStatus(id, status);
      setTicket(data);
    } catch (e: any) {
      console.error(e);
    } finally {
      setStatusChanging(false);
    }
  }

  async function assignStaff(staffId: string) {
    setAssigning(true);
    try {
      const updated = await api.assignAdminTicketToStaff(id, staffId || null);
      setTicket(updated);
    } catch (e: any) {
      console.error(e);
    } finally {
      setAssigning(false);
    }
  }

  async function handleDeleteTicket() {
    setDeleting(true);
    try {
      await api.deleteAdminTicket(id);
      navigate("/admin/dashboard");
    } catch (e: any) {
      console.error(e);
    } finally {
      setDeleting(false);
    }
  }

  function applyCannedResponse(text: string) {
    if (!reply.trim()) {
      setReply(text);
    } else {
      setReply((prev) => `${prev}\n\n${text}`);
    }
  }

  const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
    OPEN: { icon: AlertCircle, color: "bg-blue-400/15 text-blue-300 border-blue-400/20", label: "Offen" },
    IN_PROGRESS: { icon: Clock, color: "bg-yellow-400/15 text-yellow-300 border-yellow-400/20", label: "In Bearbeitung" },
    WAITING: { icon: Clock, color: "bg-purple-400/15 text-purple-300 border-purple-400/20", label: "Wartend" },
    CLOSED: { icon: CheckCircle, color: "bg-green-400/15 text-green-300 border-green-400/20", label: "Geschlossen" },
    RESOLVED: { icon: CheckCircle, color: "bg-emerald-400/15 text-emerald-300 border-emerald-400/20", label: "Gelöst" },
  };

  const priorityConfig: Record<string, { color: string; label: string }> = {
    LOW: { color: "bg-slate-400/10 text-slate-300 border-slate-400/20", label: "Niedrig" },
    MEDIUM: { color: "bg-amber-400/10 text-amber-300 border-amber-400/20", label: "Mittel" },
    HIGH: { color: "bg-orange-400/15 text-orange-300 border-orange-400/20", label: "Hoch" },
    URGENT: { color: "bg-red-400/20 text-red-300 border-red-500/30", label: "Dringend" },
  };

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#000000]">
        <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#000000] font-mono">
        <div className="text-center">
          <MessageSquare className="mx-auto mb-3 h-8 w-8 text-white/10" />
          <p className="text-sm text-white/40">Ticket nicht gefunden</p>
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="mt-4 rounded-lg bg-[#111218] border border-[#27272A] px-4 py-2 text-xs text-white hover:border-cyan-400"
          >
            Zurück zum Dashboard
          </button>
        </div>
      </div>
    );
  }

  const cfg = statusConfig[ticket.status] || statusConfig.OPEN;
  const priCfg = priorityConfig[(ticket.priority || "medium").toUpperCase()] || priorityConfig.MEDIUM;

  return (
    <div className="min-h-[100dvh] bg-[#000000] text-white font-sans antialiased">
      {/* Top Header */}
      <div className="border-b border-[#27272A] bg-[#090A0F]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-3.5 font-mono">
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Zurück zum Dashboard
          </button>

          <div className="flex flex-wrap items-center gap-3">
            {/* Staff Assignment Selector */}
            <div className="flex items-center gap-1.5 text-xs">
              <User className="h-3.5 w-3.5 text-cyan-400" />
              <span className="text-white/40">Agent:</span>
              <select
                value={ticket.assignedTo || ""}
                onChange={(e) => assignStaff(e.target.value)}
                disabled={assigning}
                className="rounded-lg border border-[#27272A] bg-[#111218] px-2.5 py-1 text-xs text-white outline-none hover:border-cyan-400"
              >
                <option value="">Unzugewiesen</option>
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>{s.fullName}</option>
                ))}
              </select>
            </div>

            {/* Status Select */}
            <select
              value={ticket.status}
              onChange={(e) => changeStatus(e.target.value)}
              disabled={statusChanging}
              className="rounded-lg border border-[#27272A] bg-[#111218] px-2.5 py-1 text-xs font-semibold text-white outline-none hover:border-cyan-400 cursor-pointer disabled:opacity-50"
            >
              <option value="OPEN">Offen</option>
              <option value="IN_PROGRESS">In Bearbeitung</option>
              <option value="WAITING">Wartend</option>
              <option value="CLOSED">Geschlossen</option>
            </select>

            {/* Delete button */}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1 rounded-lg border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-xs text-red-400 hover:bg-red-500/20 transition-all"
            >
              <Trash2 className="h-3.5 w-3.5" /> Löschen
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Conversation Column (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Header Card */}
          <div className="rounded-2xl border border-[#27272A] bg-[#090A0F] p-5">
            <div className="mb-2 flex flex-wrap items-center gap-2 font-mono">
              <span className="text-xs font-bold text-white/40">{ticket.ticketNumber}</span>
              <span className={cn("rounded border px-2 py-0.5 text-[10px] font-semibold", cfg.color)}>
                {cfg.label}
              </span>
              <span className={cn("rounded border px-2 py-0.5 text-[10px] font-semibold", priCfg.color)}>
                {priCfg.label}
              </span>
              {ticket.category && (
                <span className="rounded border border-[#27272A] bg-[#111218] px-2 py-0.5 text-[10px] text-white/50">
                  {ticket.category}
                </span>
              )}
            </div>

            <h1 className="mb-3 text-lg font-bold text-white">{ticket.subject}</h1>

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-white/40">
              <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-cyan-400" /> {ticket.name}</span>
              <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-white/30" /> {ticket.email}</span>
              <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-white/30" /> {new Date(ticket.createdAt).toLocaleString("de-DE")}</span>
              {ticket.passcode && (
                <span className="flex items-center gap-1.5 text-cyan-400"><Lock className="h-3.5 w-3.5" /> Passcode: {ticket.passcode}</span>
              )}
            </div>

            <div className="mt-4 rounded-xl border border-[#27272A] bg-[#111218] p-4">
              <p className="text-xs font-mono font-bold uppercase text-white/30 mb-2">Ursprüngliche Beschreibung</p>
              <p className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap">{ticket.message}</p>
            </div>
          </div>

          {/* Conversation Thread */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold font-mono uppercase text-white/40 mb-2">Verlauf ({messages.length})</h3>
            {messages.map((m) => {
              const isNote = m.isInternal;
              const isAdminSender = m.senderType === "ADMIN" || m.senderType === "agent";

              return (
                <div
                  key={m.id}
                  className={cn(
                    "rounded-xl border px-4 py-3.5 transition-all font-mono",
                    isNote
                      ? "border-amber-500/30 bg-amber-500/10"
                      : isAdminSender
                      ? "border-cyan-500/20 bg-cyan-500/[0.03]"
                      : "border-[#27272A] bg-[#090A0F]"
                  )}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-[10px] font-bold uppercase tracking-wider rounded px-1.5 py-0.5 border",
                          isNote
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                            : isAdminSender
                            ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
                            : "bg-white/10 text-white/60 border-white/10"
                        )}
                      >
                        {isNote ? "Internal Team Note" : isAdminSender ? "Support Staff" : "Customer"}
                      </span>
                      <strong className="text-xs text-white">{m.staffName || m.senderName || ticket.name}</strong>
                    </div>
                    <span className="text-[10px] text-white/30">{new Date(m.createdAt).toLocaleString("de-DE")}</span>
                  </div>
                  <p className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap">{m.message}</p>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Reply and Internal Note Composer */}
          <div className="sticky bottom-6 space-y-3 font-mono">
            {/* Canned Responses / Macros Quick Insert */}
            <div className="rounded-xl border border-[#27272A] bg-[#090A0F] p-3 shadow-xl">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white/50 mb-2">
                <Zap className="h-3.5 w-3.5 text-amber-400" />
                <span>Canned Responses / Macros:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {CANNED_RESPONSES.map((cr, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyCannedResponse(cr.text)}
                    className="rounded-lg border border-[#27272A] bg-[#111218] px-2.5 py-1 text-[11px] font-medium text-white/70 hover:border-cyan-400/40 hover:text-cyan-300 transition-all"
                  >
                    + {cr.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Composer Box */}
            <form onSubmit={sendReply} className="rounded-2xl border border-[#27272A] bg-[#090A0F] p-4 shadow-2xl">
              <div className="flex items-center gap-4 mb-3 border-b border-[#27272A] pb-3 text-xs">
                <button
                  type="button"
                  onClick={() => setIsInternal(false)}
                  className={cn(
                    "font-bold py-1 px-3 rounded-lg transition-all",
                    !isInternal ? "bg-cyan-400 text-black" : "text-white/40 hover:text-white"
                  )}
                >
                  Public Reply (Customer)
                </button>
                <button
                  type="button"
                  onClick={() => setIsInternal(true)}
                  className={cn(
                    "font-bold py-1 px-3 rounded-lg transition-all",
                    isInternal ? "bg-amber-400 text-black" : "text-white/40 hover:text-white"
                  )}
                >
                  🔒 Private Internal Note
                </button>
              </div>

              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                required
                rows={3}
                placeholder={isInternal ? "Internal note for support team only..." : "Write a public reply to the customer..."}
                className="w-full resize-none bg-transparent text-sm text-white outline-none placeholder:text-white/20"
              />

              <div className="mt-3 flex items-center justify-between border-t border-[#27272A] pt-3">
                <span className="text-[11px] text-white/30">
                  {isInternal ? "Not visible to end user" : "Triggers Courier email notification"}
                </span>
                <button
                  type="submit"
                  disabled={sending}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-bold text-black transition-all disabled:opacity-50",
                    isInternal ? "bg-amber-400 hover:bg-amber-300" : "bg-cyan-400 hover:bg-cyan-300"
                  )}
                >
                  {sending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" /> {isInternal ? "Add Note" : "Send Reply"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar Column: Customer Profile Context & History (1/3 width) */}
        <div className="space-y-6 font-mono">
          {/* Customer Profile Card */}
          <div className="rounded-2xl border border-[#27272A] bg-[#090A0F] p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-3 flex items-center gap-2">
              <User className="h-4 w-4 text-cyan-400" /> Customer Profile
            </h3>

            {customerAuditLoading ? (
              <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-cyan-400" /></div>
            ) : customerAudit ? (
              <div className="space-y-4 text-xs">
                <div>
                  <p className="font-bold text-sm text-white">{customerAudit.profile?.email || ticket.email}</p>
                  <p className="text-[10px] text-white/40">User ID: {customerAudit.profile?.id || "N/A"}</p>
                  <span className="mt-1 inline-block rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 text-[10px]">
                    Plan: {customerAudit.profile?.plan?.toUpperCase() || "FREE"}
                  </span>
                </div>

                {/* Account Usage Metrics */}
                <div className="grid grid-cols-2 gap-2 text-center pt-2 border-t border-[#27272A]">
                  <div className="rounded-lg border border-[#27272A] bg-[#111218] p-2">
                    <span className="text-[10px] text-white/40 block">Notes</span>
                    <span className="text-sm font-bold text-white">{customerAudit.stats?.notes || 0}</span>
                  </div>
                  <div className="rounded-lg border border-[#27272A] bg-[#111218] p-2">
                    <span className="text-[10px] text-white/40 block">Tasks</span>
                    <span className="text-sm font-bold text-white">{customerAudit.stats?.tasks || 0}</span>
                  </div>
                </div>

                {/* Past Tickets History */}
                <div className="pt-2 border-t border-[#27272A]">
                  <p className="text-white/40 block mb-2 text-[10px] uppercase">Past Tickets ({customerAudit.tickets?.length || 0}):</p>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {customerAudit.tickets?.map((t: any) => (
                      <div
                        key={t.id}
                        onClick={() => navigate(`/admin/tickets/${t.id}`)}
                        className="cursor-pointer rounded-lg border border-[#27272A] bg-[#111218] p-2 hover:border-cyan-400 transition-all flex justify-between items-center text-[11px]"
                      >
                        <span className="text-cyan-400 font-bold">{t.ticketNumber}</span>
                        <span className="text-white/70 truncate max-w-[120px]">{t.subject}</span>
                        <span className="text-white/40 text-[9px]">{t.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-white/30 italic">Gast-Ticket ohne Verknüpfung.</p>
            )}
          </div>
        </div>
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-mono">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md rounded-2xl border border-red-500/20 bg-[#090A0F] p-6 shadow-2xl"
            >
              <div className="flex items-center gap-3 text-red-400 mb-3">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="text-base font-bold text-white">Ticket dauerhaft löschen?</h3>
              </div>

              <p className="text-xs text-white/60 mb-4">
                Möchten Sie das Ticket <strong className="text-white">{ticket.ticketNumber}</strong> dauerhaft löschen?
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="rounded-xl border border-[#27272A] px-4 py-2 text-xs text-white/60 hover:bg-white/[0.05]"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleDeleteTicket}
                  disabled={deleting}
                  className="rounded-xl bg-red-500 px-4 py-2 text-xs font-bold text-white hover:bg-red-600 disabled:opacity-50"
                >
                  {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Dauerhaft Löschen"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
