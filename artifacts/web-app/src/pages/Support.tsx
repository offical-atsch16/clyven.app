import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Search, Send, Ticket, CheckCircle, ArrowLeft, Mail, User, FileText, Loader2 } from "lucide-react";
import { cn } from "../lib/utils";

const API = "/api";

export function Support() {
  const [tab, setTab] = useState<"create" | "view">("create");
  return (
    <div className="min-h-[100dvh] bg-[#080808] text-white">
      <div className="mx-auto max-w-xl px-6 py-12">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05]">
            <MessageSquare className="h-5 w-5 text-white/60" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Support</h1>
            <p className="text-xs text-white/30">Create a ticket or check an existing one</p>
          </div>
        </div>

        <div className="mb-6 flex rounded-xl border border-white/[0.07] bg-white/[0.02] p-1">
          <button onClick={() => setTab("create")}
            className={cn("flex-1 rounded-lg py-2 text-sm font-medium transition-all",
              tab === "create" ? "bg-white/[0.06] text-white" : "text-white/30 hover:text-white/50")}>
            New Ticket
          </button>
          <button onClick={() => setTab("view")}
            className={cn("flex-1 rounded-lg py-2 text-sm font-medium transition-all",
              tab === "view" ? "bg-white/[0.06] text-white" : "text-white/30 hover:text-white/50")}>
            View Ticket
          </button>
        </div>

        <AnimatePresence mode="wait">
          {tab === "create" ? (
            <motion.div key="create" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <CreateTicket />
            </motion.div>
          ) : (
            <motion.div key="view" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <ViewTicket />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function CreateTicket() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ticketNumber: string } | null>(null);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setResult({ ticketNumber: data.ticketNumber });
      setName(""); setEmail(""); setSubject(""); setMessage("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-8 text-center">
        <CheckCircle className="mx-auto mb-4 h-10 w-10 text-green-400/70" />
        <h2 className="mb-2 text-lg font-bold">Ticket Created</h2>
        <p className="mb-4 text-sm text-white/40">Your ticket number:</p>
        <div className="mb-6 rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-lg font-mono font-bold tracking-wider text-white">
          {result.ticketNumber}
        </div>
        <p className="mb-6 text-xs text-white/25">Save this number to check your ticket status later.</p>
        <button onClick={() => setResult(null)}
          className="rounded-xl bg-white/[0.06] px-6 py-2.5 text-sm font-medium text-white hover:bg-white/[0.1] transition-all">
          Create Another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>}
      <div>
        <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-white/40">
          <User className="h-3 w-3" /> Name
        </label>
        <input value={name} onChange={(e) => setName(e.target.value)} required
          className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/15" />
      </div>
      <div>
        <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-white/40">
          <Mail className="h-3 w-3" /> Email
        </label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
          className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/15" />
      </div>
      <div>
        <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-white/40">
          <FileText className="h-3 w-3" /> Subject
        </label>
        <input value={subject} onChange={(e) => setSubject(e.target.value)} required
          className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/15" />
      </div>
      <div>
        <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-white/40">
          <MessageSquare className="h-3 w-3" /> Message
        </label>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} required rows={5}
          className="w-full resize-none rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/15" />
      </div>
      <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/[0.08] py-3.5 text-sm font-medium text-white hover:bg-white/[0.12] transition-all disabled:opacity-50">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4" /> Submit Ticket</>}
      </motion.button>
    </form>
  );
}

function ViewTicket() {
  const [ticketNumber, setTicketNumber] = useState("");
  const [email, setEmail] = useState("");
  const [ticket, setTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function search(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch(`${API}/tickets/${encodeURIComponent(ticketNumber)}?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Not found");
      setTicket(data.ticket);
      setMessages(data.messages || []);
    } catch (e: any) {
      setError(e.message);
      setTicket(null);
    } finally {
      setLoading(false);
    }
  }

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/tickets/${encodeURIComponent(ticketNumber)}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senderName: ticket.name, message: reply }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMessages((m) => [...m, data]);
      setReply("");
      setTicket((t: any) => ({ ...t, status: "OPEN" }));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (ticket) {
    const statusColor = ticket.status === "OPEN" ? "bg-blue-400/15 text-blue-300" :
      ticket.status === "IN_PROGRESS" ? "bg-yellow-400/15 text-yellow-300" :
      "bg-green-400/15 text-green-300";

    return (
      <div className="space-y-6">
        <button onClick={() => { setTicket(null); setMessages([]); }}
          className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to search
        </button>
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-white/25">{ticket.ticketNumber}</p>
              <h2 className="text-lg font-bold">{ticket.subject}</h2>
            </div>
            <span className={cn("rounded-lg px-3 py-1 text-xs font-medium", statusColor)}>
              {ticket.status.replace("_", " ")}
            </span>
          </div>
          <div className="space-y-0.5 text-xs text-white/30">
            <p><span className="text-white/20">From:</span> {ticket.name} &lt;{ticket.email}&gt;</p>
            <p><span className="text-white/20">Created:</span> {new Date(ticket.createdAt).toLocaleString()}</p>
          </div>
        </div>

        <div className="space-y-3">
          {messages.map((m: any) => (
            <div key={m.id} className={cn("rounded-xl border px-4 py-3",
              m.senderType === "ADMIN" ? "border-yellow-400/10 bg-yellow-400/[0.03]" : "border-white/[0.06] bg-white/[0.02]")}>
              <div className="mb-1.5 flex items-center gap-2">
                <span className={cn("text-[10px] font-bold uppercase tracking-wider",
                  m.senderType === "ADMIN" ? "text-yellow-400/60" : "text-white/30")}>
                  {m.senderType === "ADMIN" ? "Support" : "You"}
                </span>
                <span className="text-[10px] text-white/20">{new Date(m.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">{m.message}</p>
            </div>
          ))}
        </div>

        {ticket.status !== "CLOSED" && (
          <form onSubmit={sendReply} className="space-y-3">
            {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>}
            <textarea value={reply} onChange={(e) => setReply(e.target.value)} required rows={3} placeholder="Write a reply..."
              className="w-full resize-none rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/15" />
            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/[0.08] py-3 text-sm font-medium text-white hover:bg-white/[0.12] transition-all disabled:opacity-50">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4" /> Send Reply</>}
            </motion.button>
          </form>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={search} className="space-y-4">
      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>}
      <div>
        <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-white/40">
          <Ticket className="h-3 w-3" /> Ticket Number
        </label>
        <input value={ticketNumber} onChange={(e) => setTicketNumber(e.target.value)} required placeholder="TICKET-000001"
          className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/15" />
      </div>
      <div>
        <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-white/40">
          <Mail className="h-3 w-3" /> Email
        </label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
          className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/15" />
      </div>
      <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/[0.08] py-3.5 text-sm font-medium text-white hover:bg-white/[0.12] transition-all disabled:opacity-50">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Search className="h-4 w-4" /> Find Ticket</>}
      </motion.button>
    </form>
  );
}
