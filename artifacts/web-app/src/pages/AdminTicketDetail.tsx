import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useLocation, useParams } from "wouter";
import {
  ArrowLeft, Send, Loader2, CheckCircle, Clock, AlertCircle,
  Mail, User, Calendar, XCircle, Lock, Unlock, Plus
} from "lucide-react";
import { cn } from "../lib/utils";

const API = "/api";

export function AdminTicketDetail() {
  const { id } = useParams() as { id: string };
  const [, navigate] = useLocation();
  const [ticket, setTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [statusChanging, setStatusChanging] = useState(false);
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
      const res = await fetch(`${API}/admin/me`, { credentials: "include" });
      if (!res.ok) throw new Error("Unauthorized");
    } catch {
      navigate("/admin/login");
    }
  }

  async function fetchDetail() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/tickets/${id}`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
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
      const res = await fetch(`${API}/admin/tickets/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: reply }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessages((m) => [...m, data]);
      setReply("");
      setTicket((t: any) => ({ ...t, status: "OPEN" }));
    } catch (e: any) {
      console.error(e);
    } finally {
      setSending(false);
    }
  }

  async function changeStatus(status: string) {
    setStatusChanging(true);
    try {
      const res = await fetch(`${API}/admin/tickets/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTicket(data);
    } catch (e: any) {
      console.error(e);
    } finally {
      setStatusChanging(false);
    }
  }

  const statusConfig = {
    OPEN: { icon: AlertCircle, color: "bg-blue-400/15 text-blue-300", label: "Open" },
    IN_PROGRESS: { icon: Clock, color: "bg-yellow-400/15 text-yellow-300", label: "In Progress" },
    CLOSED: { icon: CheckCircle, color: "bg-green-400/15 text-green-300", label: "Closed" },
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
        <p className="text-white/30">Ticket not found</p>
      </div>
    );
  }

  const cfg = statusConfig[ticket.status as keyof typeof statusConfig];
  const StatusIcon = cfg?.icon || AlertCircle;

  return (
    <div className="min-h-[100dvh] bg-[#080808] text-white">
      {/* Top bar */}
      <div className="border-b border-white/[0.06] bg-[#0a0a0a]">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <button onClick={() => navigate("/admin/dashboard")}
            className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
          <div className="flex items-center gap-3">
            <span className={cn("flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium", cfg?.color)}>
              <StatusIcon className="h-3 w-3" /> {cfg?.label}
            </span>
            {ticket.status !== "CLOSED" && (
              <button onClick={() => changeStatus("CLOSED")} disabled={statusChanging}
                className="flex items-center gap-1 rounded-lg bg-white/[0.05] px-2.5 py-1 text-xs text-white/40 hover:bg-white/[0.08] hover:text-white/60 transition-all disabled:opacity-50">
                <Lock className="h-3 w-3" /> Close
              </button>
            )}
            {ticket.status === "CLOSED" && (
              <button onClick={() => changeStatus("OPEN")} disabled={statusChanging}
                className="flex items-center gap-1 rounded-lg bg-white/[0.05] px-2.5 py-1 text-xs text-white/40 hover:bg-white/[0.08] hover:text-white/60 transition-all disabled:opacity-50">
                <Unlock className="h-3 w-3" /> Reopen
              </button>
            )}
            {ticket.status === "OPEN" && (
              <button onClick={() => changeStatus("IN_PROGRESS")} disabled={statusChanging}
                className="flex items-center gap-1 rounded-lg bg-yellow-400/10 px-2.5 py-1 text-xs text-yellow-400/60 hover:bg-yellow-400/15 transition-all disabled:opacity-50">
                <Clock className="h-3 w-3" /> Start
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-6">
        {/* Ticket info */}
        <div className="mb-6 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
          <p className="mb-1 text-[10px] font-mono text-white/20">{ticket.ticketNumber}</p>
          <h1 className="mb-3 text-lg font-bold">{ticket.subject}</h1>
          <div className="flex flex-wrap gap-4 text-xs text-white/30">
            <span className="flex items-center gap-1"><User className="h-3 w-3" /> {ticket.name}</span>
            <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {ticket.email}</span>
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(ticket.createdAt).toLocaleString()}</span>
            {ticket.passcode && (
              <span className="flex items-center gap-1 text-blue-400 font-mono"><Lock className="h-3 w-3" /> Passcode: {ticket.passcode}</span>
            )}
          </div>
          <div className="mt-4 rounded-xl border border-white/[0.05] bg-white/[0.01] p-4">
            <p className="text-sm text-white/60 leading-relaxed whitespace-pre-wrap">{ticket.message}</p>
          </div>
        </div>

        {/* Messages */}
        <div className="mb-6 space-y-3">
          {messages.map((m) => (
            <div key={m.id} className={cn("rounded-xl border px-4 py-3",
              m.senderType === "ADMIN" ? "border-yellow-400/10 bg-yellow-400/[0.03]" : "border-white/[0.06] bg-white/[0.02]")}>
              <div className="mb-1 flex items-center gap-2">
                <span className={cn("text-[10px] font-bold uppercase tracking-wider",
                  m.senderType === "ADMIN" ? "text-yellow-400/60" : "text-white/30")}>
                  {m.senderType === "ADMIN" ? "Support Team" : "Customer"}
                </span>
                <span className="text-[10px] text-white/20">{new Date(m.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">{m.message}</p>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Reply form */}
        {ticket.status !== "CLOSED" && (
          <form onSubmit={sendReply} className="sticky bottom-6">
            <div className="rounded-2xl border border-white/[0.07] bg-[#0f0f0f] p-4 shadow-2xl">
              <textarea value={reply} onChange={(e) => setReply(e.target.value)} required rows={3}
                placeholder="Write your reply..."
                className="w-full resize-none bg-transparent text-sm text-white outline-none placeholder:text-white/20" />
              <div className="mt-3 flex justify-end">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={sending}
                  className="flex items-center gap-2 rounded-xl bg-white/[0.08] px-5 py-2.5 text-xs font-medium text-white hover:bg-white/[0.12] transition-all disabled:opacity-50">
                  {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Send className="h-3.5 w-3.5" /> Send Reply</>}
                </motion.button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
