import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Search, Send, Ticket, CheckCircle, ArrowLeft, Mail, User, FileText, Loader2, ShieldAlert, KeyRound, ShieldCheck, Github, Activity } from "lucide-react";
import { useUser } from "@clerk/react";
import { API_BASE_URL } from "../lib/api";
import { cn } from "../lib/utils";
import { Link } from "wouter";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

async function safeFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, options);
  const text = await res.text();
  if (!res.ok) {
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      // not JSON
    }
    throw new Error(parsed?.error || text || `HTTP ${res.status}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    return { success: res.ok };
  }
}

export function Support() {
  const [tab, setTab] = useState<"create" | "view">("create");

  return (
    <div className="min-h-[100dvh] bg-[#090A0F] text-zinc-100 selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* Soft Ambient Background Glow */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="absolute -top-[15%] left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full opacity-[0.05] blur-[120px]"
          style={{ background: "radial-gradient(circle, #00F2FE 0%, #38BDF8 60%, transparent 100%)" }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-2xl px-6 pt-12 pb-24">
        {/* Navigation & Title Header */}
        <div className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-cyan-400 shadow-md">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Support Center</h1>
              <p className="text-xs text-zinc-400">Submit a ticket or check ticket status</p>
            </div>
          </div>
          <Link href="/">
            <button className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-xs font-semibold text-zinc-300 hover:border-zinc-700 hover:text-white transition-all cursor-pointer">
              <ArrowLeft className="h-4 w-4" /> Back to Home
            </button>
          </Link>
        </div>

        {/* Tab Selector */}
        <div className="mb-8 flex rounded-xl border border-zinc-800 bg-zinc-950/80 p-1 shadow-md">
          <button
            onClick={() => setTab("create")}
            className={cn(
              "flex-1 rounded-lg py-2.5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer",
              tab === "create" ? "bg-zinc-800 text-white shadow-sm border border-zinc-700/50" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            New Ticket
          </button>
          <button
            onClick={() => setTab("view")}
            className={cn(
              "flex-1 rounded-lg py-2.5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer",
              tab === "view" ? "bg-zinc-800 text-white shadow-sm border border-zinc-700/50" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            Check Ticket Status
          </button>
        </div>

        {/* Main Card Container */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/90 p-6 sm:p-8 shadow-2xl backdrop-blur-md">
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

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 bg-[#06070B] px-6 py-8 relative z-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2.5">
            <img src={`${basePath}/logo.svg`} alt="CLYVEN" className="h-4 w-4" />
            <span className="text-xs font-bold tracking-[0.2em] text-zinc-400">CLYVEN</span>
          </div>

          <div className="flex gap-6 text-xs text-zinc-400 items-center">
            <Link href="/privacy"><span className="hover:text-white cursor-pointer transition-colors">Privacy Policy</span></Link>
            <Link href="/impressum"><span className="hover:text-white cursor-pointer transition-colors">Imprint</span></Link>
            <Link href="/terms"><span className="hover:text-white cursor-pointer transition-colors">Terms of Use</span></Link>
            <a href="https://github.com/offical-atsch16/clyven.app" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer">
              <Github className="h-3.5 w-3.5" /> GitHub
            </a>
            <a href="https://stats.uptimerobot.com/rS9J6TmeMj" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer">
              <Activity className="h-3.5 w-3.5 text-cyan-400" /> Status Page
            </a>
          </div>

          <p className="text-xs text-zinc-500 font-mono">© 2026 CLYVEN</p>
        </div>
      </footer>
    </div>
  );
}

function CreateTicket() {
  const { user } = useUser();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ticketNumber: string } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      const userPrimaryEmail = user.emailAddresses?.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress || user.emailAddresses?.[0]?.emailAddress || "";
      const userFullName = user.fullName || user.firstName || userPrimaryEmail.split("@")[0] || "";
      if (userPrimaryEmail) setEmail(userPrimaryEmail);
      if (userFullName) setName(userFullName);
    }
  }, [user]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload: Record<string, any> = { name, email, subject, message };
      if (user) {
        payload.clerkUserId = user.id;
        payload.isVerifiedUser = true;
      }

      const data = await safeFetch(`${API_BASE_URL}/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
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
      <div className="text-center py-4">
        <CheckCircle className="mx-auto mb-4 h-12 w-12 text-emerald-400" />
        <h2 className="mb-2 text-xl font-bold text-white">Ticket Submitted Successfully</h2>
        <p className="mb-6 text-sm text-zinc-400">Your ticket has been registered. A confirmation email has been sent.</p>

        <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 text-center">
          <span className="text-[10px] text-zinc-400 uppercase font-semibold tracking-wider block mb-1">Your Ticket Reference Number</span>
          <div className="text-2xl font-mono font-bold tracking-widest text-cyan-400">
            {result.ticketNumber}
          </div>
        </div>

        <p className="mb-6 text-xs text-zinc-500 leading-relaxed">
          You can check the status of your ticket anytime under "Check Ticket Status" using your ticket number and the 6-digit passcode sent to your email.
        </p>

        <button
          onClick={() => setResult(null)}
          className="rounded-xl border border-zinc-700 bg-zinc-800 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white hover:bg-zinc-700 hover:text-white transition-all cursor-pointer"
        >
          Create Another Ticket
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {error && <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-400">{error}</p>}

      {user && (
        <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4 text-xs text-cyan-200 flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 shrink-0 text-cyan-400" />
          <div>
            <strong className="font-semibold block text-white">Authenticated User Verified</strong>
            <span className="opacity-90">Your verified email and user account ({user.id}) are associated with this ticket.</span>
          </div>
        </div>
      )}

      <div>
        <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
          <User className="h-3.5 w-3.5 text-zinc-400" /> Your Name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="e.g. Alex Morgan"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/40 transition-all"
        />
      </div>

      <div>
        <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
          <Mail className="h-3.5 w-3.5 text-zinc-400" /> Email Address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="name@example.com"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/40 transition-all"
        />
      </div>

      <div>
        <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
          <FileText className="h-3.5 w-3.5 text-zinc-400" /> Subject
        </label>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
          placeholder="What do you need help with?"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/40 transition-all"
        />
      </div>

      <div>
        <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
          <MessageSquare className="h-3.5 w-3.5 text-zinc-400" /> Message Details
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={5}
          placeholder="Please describe your issue or question in detail..."
          className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/40 transition-all"
        />
      </div>

      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-500/50 bg-gradient-to-r from-cyan-500 to-sky-500 py-3.5 text-sm font-bold text-black shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-sky-400 transition-all disabled:opacity-50 cursor-pointer"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4" /> Send Ticket</>}
      </motion.button>
    </form>
  );
}

function ViewTicket() {
  const [ticketNumber, setTicketNumber] = useState("");
  const [passcode, setPasscode] = useState("");
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
      const headers: Record<string, string> = {
        "X-Ticket-Passcode": passcode.trim()
      };
      if (email.trim()) {
        headers["X-Ticket-Email"] = email.trim().toLowerCase();
      }
      const queryEmail = email.trim() ? `?email=${encodeURIComponent(email.trim().toLowerCase())}` : "";
      const data = await safeFetch(`${API_BASE_URL}/tickets/${encodeURIComponent(ticketNumber.trim())}${queryEmail}`, {
        headers
      });
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
      const data = await safeFetch(`${API_BASE_URL}/tickets/${encodeURIComponent(ticketNumber.trim())}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Ticket-Passcode": passcode.trim()
        },
        body: JSON.stringify({
          passcode: passcode.trim(),
          email: email.trim().toLowerCase() || ticket.email,
          senderName: ticket.name,
          message: reply
        }),
      });
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
    const statusColor = ticket.status === "OPEN" ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" :
      ticket.status === "IN_PROGRESS" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" :
      "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30";

    return (
      <div className="space-y-6">
        <button
          onClick={() => { setTicket(null); setMessages([]); }}
          className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Ticket Lookup
        </button>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-cyan-400 font-mono font-bold">{ticket.ticketNumber}</p>
              <h2 className="text-lg font-bold text-white mt-1">{ticket.subject}</h2>
            </div>
            <span className={cn("rounded-lg px-3 py-1 text-xs font-bold uppercase tracking-wider", statusColor)}>
              {ticket.status === "OPEN" ? "Open" : ticket.status === "IN_PROGRESS" ? "In Progress" : "Closed"}
            </span>
          </div>
          <div className="space-y-1 text-xs text-zinc-400 border-t border-zinc-800/80 pt-3">
            <p><span className="text-zinc-500">Created by:</span> {ticket.name} &lt;{ticket.email}&gt;</p>
            <p><span className="text-zinc-500">Date:</span> {new Date(ticket.createdAt).toLocaleString()}</p>
          </div>
        </div>

        <div className="space-y-3">
          {messages.map((m: any) => (
            <div
              key={m.id}
              className={cn(
                "rounded-xl border p-4 shadow-sm",
                m.senderType === "ADMIN" ? "border-cyan-500/30 bg-cyan-500/5" : "border-zinc-800 bg-zinc-900/40"
              )}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className={cn("text-[11px] font-bold uppercase tracking-wider", m.senderType === "ADMIN" ? "text-cyan-400" : "text-zinc-400")}>
                  {m.senderType === "ADMIN" ? "CLYVEN Support Agent" : "You"}
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">{new Date(m.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">{m.message}</p>
            </div>
          ))}
        </div>

        {ticket.status !== "CLOSED" ? (
          <form onSubmit={sendReply} className="space-y-3">
            {error && <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-400">{error}</p>}
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              required
              rows={3}
              placeholder="Write your response..."
              className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/40 transition-all"
            />
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/10 py-3 text-xs font-bold text-cyan-300 hover:bg-cyan-500/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4" /> Send Reply</>}
            </motion.button>
          </form>
        ) : (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 text-center">
            <p className="text-xs text-zinc-500">This support ticket is closed. Reply submission is disabled.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={search} className="space-y-5">
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 flex items-center gap-2.5 text-xs text-red-400">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
          <Ticket className="h-3.5 w-3.5 text-zinc-400" /> Ticket Number
        </label>
        <input
          value={ticketNumber}
          onChange={(e) => setTicketNumber(e.target.value)}
          required
          placeholder="TICKET-000001"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm font-mono text-white outline-none placeholder:text-zinc-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/40 transition-all"
        />
      </div>

      <div>
        <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
          <KeyRound className="h-3.5 w-3.5 text-zinc-400" /> 6-Digit Passcode / PIN
        </label>
        <input
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          required
          placeholder="123456"
          maxLength={6}
          className="w-full font-mono tracking-wider rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/40 transition-all"
        />
      </div>

      <div>
        <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-zinc-300">
          <Mail className="h-3.5 w-3.5 text-zinc-400" /> Email Address <span className="text-zinc-500 font-normal">(Optional)</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/40 transition-all"
        />
      </div>

      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-500/50 bg-gradient-to-r from-cyan-500 to-sky-500 py-3.5 text-sm font-bold text-black shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-sky-400 transition-all disabled:opacity-50 cursor-pointer"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Search className="h-4 w-4" /> Lookup Ticket</>}
      </motion.button>
    </form>
  );
}
