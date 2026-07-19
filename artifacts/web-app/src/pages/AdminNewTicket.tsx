import { useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { ArrowLeft, Send, Loader2, Mail, User, FileText, MessageSquare } from "lucide-react";

const API = "/api";

export function AdminNewTicket() {
  const [, navigate] = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, email, subject, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      navigate("/admin/dashboard");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-[#080808] text-white">
      <div className="border-b border-white/[0.06] bg-[#0a0a0a]">
        <div className="mx-auto flex max-w-xl items-center gap-3 px-6 py-4">
          <button onClick={() => navigate("/admin/dashboard")}
            className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
          <h1 className="text-sm font-bold">New Ticket</h1>
        </div>
      </div>

      <form onSubmit={submit} className="mx-auto max-w-xl px-6 py-8 space-y-4">
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
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4" /> Create Ticket</>}
        </motion.button>
      </form>
    </div>
  );
}
