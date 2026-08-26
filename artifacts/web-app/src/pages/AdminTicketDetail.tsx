import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useParams } from "wouter";
import {
  ArrowLeft, Send, Loader2, CheckCircle, Clock, AlertCircle,
  Mail, User, Calendar, Lock, Unlock, Trash2, Zap, MessageSquare, AlertTriangle
} from "lucide-react";
import { cn } from "../lib/utils";
import { api } from "../lib/api";

const CANNED_RESPONSES = [
  {
    title: "Bestätigung",
    text: "Vielen Dank für Ihre Nachricht. Wir haben Ihr Anliegen erhalten und untersuchen die Details.",
  },
  {
    title: "Mehr Info anfordern",
    text: "Um Ihnen bestmöglich weiterhelfen zu können, benötigen wir bitte noch nähere Informationen oder relevante Screenshots von Ihnen.",
  },
  {
    title: "Problem gelöst",
    text: "Wir haben die erforderlichen Anpassungen vorgenommen. Bitte prüfen Sie, ob nun alles wie gewünscht funktioniert.",
  },
  {
    title: "Abrechnung / Konto",
    text: "Ihre Anfrage bezüglich Ihres Accounts bzw. Ihrer Abrechnung wurde geprüft und entsprechend aktualisiert.",
  },
];

export function AdminTicketDetail() {
  const { id } = useParams() as { id: string };
  const [, navigate] = useLocation();
  const [ticket, setTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [statusChanging, setStatusChanging] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkAuth();
    fetchDetail();
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function checkAuth() {
    try {
      await api.adminMe();
    } catch {
      navigate("/admin/login");
    }
  }

  async function fetchDetail() {
    setLoading(true);
    try {
      const data = await api.getAdminTicket(id);
      setTicket(data.ticket);
      setMessages(data.messages || []);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    try {
      const data = await api.adminReply(id, reply);
      setMessages((m) => [...m, data]);
      setReply("");
      if (ticket.status === "CLOSED") {
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
    WAITING: { icon: Clock, color: "bg-purple-400/15 text-purple-300 border-purple-400/20", label: "Wartend auf Kunde" },
    CLOSED: { icon: CheckCircle, color: "bg-green-400/15 text-green-300 border-green-400/20", label: "Geschlossen" },
  };

  const priorityConfig: Record<string, { color: string; label: string }> = {
    LOW: { color: "bg-slate-400/10 text-slate-300 border-slate-400/20", label: "Niedrig" },
    MEDIUM: { color: "bg-amber-400/10 text-amber-300 border-amber-400/20", label: "Mittel" },
    HIGH: { color: "bg-red-400/15 text-red-300 border-red-400/20", label: "Hoch" },
  };

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#080808]">
        <Loader2 className="h-6 w-6 animate-spin text-white/20" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#080808]">
        <div className="text-center">
          <MessageSquare className="mx-auto mb-3 h-8 w-8 text-white/10" />
          <p className="text-sm text-white/40">Ticket nicht gefunden</p>
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="mt-4 rounded-lg bg-white/[0.08] px-4 py-2 text-xs text-white hover:bg-white/[0.12]"
          >
            Zurück zum Dashboard
          </button>
        </div>
      </div>
    );
  }

  const cfg = statusConfig[ticket.status] || statusConfig.OPEN;
  const priCfg = priorityConfig[(ticket.priority || "MEDIUM").toUpperCase()] || priorityConfig.MEDIUM;
  const StatusIcon = cfg.icon;

  return (
    <div className="min-h-[100dvh] bg-[#080808] text-white">
      {/* Top bar */}
      <div className="border-b border-white/[0.06] bg-[#0a0a0a]">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Zurück zum Dashboard
          </button>

          <div className="flex items-center gap-2">
            {/* Status Select */}
            <select
              value={ticket.status}
              onChange={(e) => changeStatus(e.target.value)}
              disabled={statusChanging}
              className="rounded-lg border border-white/[0.1] bg-[#111111] px-2.5 py-1 text-xs font-medium text-white outline-none hover:border-white/30 transition-all cursor-pointer disabled:opacity-50"
            >
              <option value="OPEN">Offen</option>
              <option value="IN_PROGRESS">In Bearbeitung</option>
              <option value="WAITING">Wartend auf Kunde</option>
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

      <div className="mx-auto max-w-3xl px-6 py-6">
        {/* Ticket info card */}
        <div className="mb-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono font-medium text-white/30">{ticket.ticketNumber}</span>
            <span className={cn("rounded border px-2 py-0.5 text-[10px] font-medium", cfg.color)}>
              {cfg.label}
            </span>
            <span className={cn("rounded border px-2 py-0.5 text-[10px] font-medium", priCfg.color)}>
              {priCfg.label}
            </span>
            {ticket.category && (
              <span className="rounded border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/50">
                {ticket.category}
              </span>
            )}
          </div>

          <h1 className="mb-3 text-lg font-bold text-white">{ticket.subject}</h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-white/40">
            <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-white/30" /> {ticket.name}</span>
            <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-white/30" /> {ticket.email}</span>
            <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-white/30" /> {new Date(ticket.createdAt).toLocaleString("de-DE")}</span>
            {ticket.passcode && (
              <span className="flex items-center gap-1.5 font-mono text-blue-400"><Lock className="h-3.5 w-3.5" /> Code: {ticket.passcode}</span>
            )}
          </div>

          <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.01] p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-white/30 mb-2">Ursprüngliche Beschreibung</p>
            <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">{ticket.message}</p>
          </div>
        </div>

        {/* Message Thread */}
        <div className="mb-6 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-2">Verlauf ({messages.length})</h3>
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "rounded-xl border px-4 py-3.5 transition-all",
                m.senderType === "ADMIN"
                  ? "border-yellow-400/20 bg-yellow-400/[0.03]"
                  : "border-white/[0.06] bg-white/[0.02]"
              )}
            >
              <div className="mb-1.5 flex items-center justify-between">
                <span
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-wider",
                    m.senderType === "ADMIN" ? "text-yellow-400/80" : "text-white/40"
                  )}
                >
                  {m.senderType === "ADMIN" ? `Support Team (${m.senderName || "Admin"})` : `Kunde (${m.senderName || ticket.name})`}
                </span>
                <span className="text-[10px] text-white/30">{new Date(m.createdAt).toLocaleString("de-DE")}</span>
              </div>
              <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">{m.message}</p>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Canned Responses & Reply Form */}
        {ticket.status !== "CLOSED" && (
          <div className="sticky bottom-6 space-y-3">
            {/* Schnell-Antworten (Canned Responses) */}
            <div className="rounded-xl border border-white/[0.08] bg-[#0d0d0d] p-3 shadow-xl">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white/50 mb-2">
                <Zap className="h-3.5 w-3.5 text-amber-400" />
                <span>Schnell-Antworten (Canned Responses):</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {CANNED_RESPONSES.map((cr, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyCannedResponse(cr.text)}
                    className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-white/70 hover:border-amber-400/30 hover:bg-amber-400/10 hover:text-amber-300 transition-all"
                  >
                    + {cr.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Reply Textarea */}
            <form onSubmit={sendReply} className="rounded-2xl border border-white/[0.1] bg-[#111111] p-4 shadow-2xl">
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                required
                rows={3}
                placeholder="Antwort verfassen..."
                className="w-full resize-none bg-transparent text-sm text-white outline-none placeholder:text-white/20"
              />
              <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-3">
                <span className="text-[11px] text-white/30">Kunde wird per E-Mail benachrichtigt</span>
                <button
                  type="submit"
                  disabled={sending}
                  className="flex items-center gap-2 rounded-xl bg-white px-5 py-2 text-xs font-semibold text-black hover:bg-white/90 transition-all disabled:opacity-50"
                >
                  {sending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" /> Antwort Senden
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* DELETE CONFIRM MODAL */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md rounded-2xl border border-red-500/20 bg-[#111111] p-6 shadow-2xl"
            >
              <div className="flex items-center gap-3 text-red-400 mb-3">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="text-base font-bold text-white">Ticket dauerhaft löschen?</h3>
              </div>

              <p className="text-xs text-white/60 leading-relaxed mb-4">
                Möchten Sie das Ticket <strong className="text-white font-mono">{ticket.ticketNumber}</strong> ({ticket.subject}) und alle Nachrichten unwiderruflich löschen?
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="rounded-xl border border-white/[0.08] px-4 py-2 text-xs font-medium text-white/60 hover:bg-white/[0.05] transition-all"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleDeleteTicket}
                  disabled={deleting}
                  className="flex items-center gap-1.5 rounded-xl bg-red-500 px-4 py-2 text-xs font-semibold text-white hover:bg-red-600 transition-all disabled:opacity-50"
                >
                  {deleting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="h-3.5 w-3.5" /> Dauerhaft Löschen
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
