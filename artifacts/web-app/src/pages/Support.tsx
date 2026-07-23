import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Search, Send, Ticket, CheckCircle, ArrowLeft, Mail, User, FileText, Loader2, Key, HelpCircle, ShieldAlert } from "lucide-react";
import { cn } from "../lib/utils";
import { Link } from "wouter";

const API = "/api";

export function Support() {
  const [tab, setTab] = useState<"create" | "view">("create");
  return (
    <div className="min-h-[100dvh] bg-[#080808] text-white">
      {/* Background Gradients */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-950/20 via-transparent to-transparent opacity-60" />

      <div className="relative mx-auto max-w-xl px-6 py-12">
        {/* Navigation & Title Row */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05] border border-white/[0.08]">
              <MessageSquare className="h-5 w-5 text-white/70" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Support-Center</h1>
              <p className="text-xs text-white/30">Erstellen Sie ein Ticket oder fragen Sie den Status ab</p>
            </div>
          </div>
          <Link href="/">
            <button className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-white/60 hover:border-white/15 hover:text-white transition-all cursor-pointer">
              <ArrowLeft className="h-3.5 w-3.5" /> Zurück
            </button>
          </Link>
        </div>

        <div className="mb-8 flex rounded-xl border border-white/[0.07] bg-white/[0.02] p-1">
          <button onClick={() => setTab("create")}
            className={cn("flex-1 rounded-lg py-2.5 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer",
              tab === "create" ? "bg-white/[0.08] text-white shadow-sm" : "text-white/30 hover:text-white/50")}>
            Neues Ticket
          </button>
          <button onClick={() => setTab("view")}
            className={cn("flex-1 rounded-lg py-2.5 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer",
              tab === "view" ? "bg-white/[0.08] text-white shadow-sm" : "text-white/30 hover:text-white/50")}>
            Ticket ansehen
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
  const [result, setResult] = useState<{ ticketNumber: string; passcode: string } | null>(null);
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
      setResult({ ticketNumber: data.ticketNumber, passcode: data.passcode });
      setName(""); setEmail(""); setSubject(""); setMessage("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-8 text-center shadow-xl">
        <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-400" />
        <h2 className="mb-2 text-xl font-bold">Ticket erfolgreich erstellt</h2>
        <p className="mb-6 text-sm text-white/40">Bitte speichern Sie Ihre Zugangsdaten sorgfältig ab. Wir haben Ihnen diese zusätzlich per E-Mail zugesendet.</p>

        <div className="mb-6 grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 text-left">
            <span className="text-[10px] text-white/30 uppercase font-semibold tracking-wider">Ticketnummer</span>
            <div className="text-base font-mono font-bold tracking-wider text-white mt-1">
              {result.ticketNumber}
            </div>
          </div>
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 text-left">
            <span className="text-[10px] text-white/30 uppercase font-semibold tracking-wider">Passcode (6-stellig)</span>
            <div className="text-base font-mono font-bold tracking-wider text-blue-400 mt-1">
              {result.passcode}
            </div>
          </div>
        </div>

        <p className="mb-6 text-xs text-white/20">Ohne Ticketnummer und Passcode können Sie den Status Ihres Tickets später nicht abrufen.</p>

        <button onClick={() => setResult(null)}
          className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white hover:border-white/20 hover:bg-white/[0.06] transition-all cursor-pointer">
          Neues Ticket erstellen
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
        <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Ihr vollständiger Name"
          className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/15 focus:bg-white/[0.05] transition-all" />
      </div>
      <div>
        <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-white/40">
          <Mail className="h-3 w-3" /> E-Mail-Adresse
        </label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="name@beispiel.de"
          className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/15 focus:bg-white/[0.05] transition-all" />
      </div>
      <div>
        <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-white/40">
          <FileText className="h-3 w-3" /> Betreff
        </label>
        <input value={subject} onChange={(e) => setSubject(e.target.value)} required placeholder="Wobei benötigen Sie Hilfe?"
          className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/15 focus:bg-white/[0.05] transition-all" />
      </div>
      <div>
        <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-white/40">
          <MessageSquare className="h-3 w-3" /> Nachricht
        </label>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} required rows={5} placeholder="Bitte beschreiben Sie Ihr Anliegen so detailliert wie möglich..."
          className="w-full resize-none rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/15 focus:bg-white/[0.05] transition-all" />
      </div>
      <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3.5 text-sm font-semibold text-black hover:bg-white/90 transition-all disabled:opacity-50 cursor-pointer">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4" /> Ticket absenden</>}
      </motion.button>
    </form>
  );
}

function ViewTicket() {
  const [ticketNumber, setTicketNumber] = useState("");
  const [passcode, setPasscode] = useState("");
  const [ticket, setTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function search(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await fetch(`${API}/tickets/${encodeURIComponent(ticketNumber)}`, {
        headers: {
          "X-Ticket-Passcode": passcode
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ticket nicht gefunden.");
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
        body: JSON.stringify({ passcode, senderName: ticket.name, message: reply }),
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
          className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors cursor-pointer">
          <ArrowLeft className="h-3.5 w-3.5" /> Zurück zur Suche
        </button>
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-white/25 font-mono">{ticket.ticketNumber}</p>
              <h2 className="text-lg font-bold mt-0.5">{ticket.subject}</h2>
            </div>
            <span className={cn("rounded-lg px-3 py-1 text-xs font-semibold uppercase tracking-wider", statusColor)}>
              {ticket.status === "OPEN" ? "Offen" : ticket.status === "IN_PROGRESS" ? "In Bearbeitung" : "Geschlossen"}
            </span>
          </div>
          <div className="space-y-1 text-xs text-white/30 border-t border-white/[0.05] pt-3">
            <p><span className="text-white/20">Ersteller:</span> {ticket.name} &lt;{ticket.email}&gt;</p>
            <p><span className="text-white/20">Erstellt am:</span> {new Date(ticket.createdAt).toLocaleString()}</p>
          </div>
        </div>

        <div className="space-y-3">
          {messages.map((m: any) => (
            <div key={m.id} className={cn("rounded-xl border px-4 py-3 shadow-sm",
              m.senderType === "ADMIN" ? "border-blue-500/20 bg-blue-500/[0.03]" : "border-white/[0.06] bg-white/[0.02]")}>
              <div className="mb-1.5 flex items-center gap-2">
                <span className={cn("text-[10px] font-bold uppercase tracking-wider",
                  m.senderType === "ADMIN" ? "text-blue-400" : "text-white/30")}>
                  {m.senderType === "ADMIN" ? "Clyven Support" : "Sie"}
                </span>
                <span className="text-[10px] text-white/20">{new Date(m.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">{m.message}</p>
            </div>
          ))}
        </div>

        {ticket.status !== "CLOSED" ? (
          <form onSubmit={sendReply} className="space-y-3">
            {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-400">{error}</p>}
            <textarea value={reply} onChange={(e) => setReply(e.target.value)} required rows={3} placeholder="Ihre Antwort schreiben..."
              className="w-full resize-none rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/15" />
            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/[0.08] py-3 text-sm font-semibold text-white hover:bg-white/[0.12] transition-all disabled:opacity-50 cursor-pointer">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4" /> Antwort senden</>}
            </motion.button>
          </form>
        ) : (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-4 text-center">
            <p className="text-xs text-white/20">Dieses Ticket ist geschlossen. Sie können keine weiteren Antworten senden.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={search} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-500/10 px-3 py-2.5 flex items-center gap-2 text-xs text-red-400 border border-red-500/15">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      <div>
        <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-white/40">
          <Ticket className="h-3 w-3" /> Ticketnummer
        </label>
        <input value={ticketNumber} onChange={(e) => setTicketNumber(e.target.value)} required placeholder="TICKET-000001"
          className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-white/15 focus:border-white/15 focus:bg-white/[0.05] transition-all" />
      </div>
      <div>
        <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-white/40">
          <Key className="h-3 w-3" /> 6-stelliger Passcode
        </label>
        <input type="text" maxLength={6} value={passcode} onChange={(e) => setPasscode(e.target.value)} required placeholder="z. B. 482915 oder Master-Code"
          className="w-full rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-sm text-white outline-none placeholder:text-white/15 focus:border-white/15 focus:bg-white/[0.05] transition-all" />
      </div>
      <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3.5 text-sm font-semibold text-black hover:bg-white/90 transition-all disabled:opacity-50 cursor-pointer">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Search className="h-4 w-4" /> Ticket suchen</>}
      </motion.button>
    </form>
  );
}
