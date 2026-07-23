import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import {
  Shield, Loader2, LogOut, Mail, MessageSquare, Clock, ChevronRight,
  Plus, Search, CheckCircle, AlertCircle, XCircle, Filter
} from "lucide-react";
import { cn } from "../lib/utils";

const API = "/api";

type Status = "OPEN" | "IN_PROGRESS" | "CLOSED" | "ALL";

export function AdminDashboard() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [filter, setFilter] = useState<Status>("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState("");
  const [, navigate] = useLocation();

  useEffect(() => {
    checkAuth();
    fetchTickets();
  }, []);

  async function checkAuth() {
    try {
      const res = await fetch(`${API}/admin/me`, { credentials: "include" });
      if (!res.ok) throw new Error("Unauthorized");
    } catch {
      navigate("/admin/login");
    }
  }

  async function fetchTickets() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/tickets`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTickets(data);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await fetch(`${API}/admin/logout`, { method: "POST", credentials: "include" });
    navigate("/admin/login");
  }

  const filtered = tickets
    .filter((t) => filter === "ALL" || t.status === filter)
    .filter((t) => {
      const q = search.toLowerCase();
      return !q ||
        t.ticketNumber?.toLowerCase().includes(q) ||
        t.subject?.toLowerCase().includes(q) ||
        t.email?.toLowerCase().includes(q) ||
        t.name?.toLowerCase().includes(q);
    });

  const counts = {
    ALL: tickets.length,
    OPEN: tickets.filter((t) => t.status === "OPEN").length,
    IN_PROGRESS: tickets.filter((t) => t.status === "IN_PROGRESS").length,
    CLOSED: tickets.filter((t) => t.status === "CLOSED").length,
  };

  const statusConfig = {
    OPEN: { icon: AlertCircle, color: "bg-blue-400/15 text-blue-300", label: "Open" },
    IN_PROGRESS: { icon: Clock, color: "bg-yellow-400/15 text-yellow-300", label: "In Progress" },
    CLOSED: { icon: CheckCircle, color: "bg-green-400/15 text-green-300", label: "Closed" },
  };

  return (
    <div className="min-h-[100dvh] bg-[#080808] text-white">
      {/* Header */}
      <div className="border-b border-white/[0.06] bg-[#0a0a0a]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.05]">
              <Shield className="h-4 w-4 text-white/50" />
            </div>
            <div>
              <h1 className="text-sm font-bold">CLYVEN Support Dashboard</h1>
              <p className="text-[10px] text-white/25">{tickets.length} tickets total</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/admin/tickets/new")}
              className="flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-3 py-2 text-xs font-medium hover:bg-white/[0.1] transition-all">
              <Plus className="h-3.5 w-3.5" /> Create Ticket
            </button>
            <button onClick={logout}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-all">
              <LogOut className="h-3.5 w-3.5" /> Log Out
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-6">
        {/* Filters */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1.5">
            {(["ALL", "OPEN", "IN_PROGRESS", "CLOSED"] as Status[]).map((s) => {
              const active = filter === s;
              return (
                <button key={s} onClick={() => setFilter(s)}
                  className={cn("rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                    active ? "bg-white/[0.08] text-white" : "text-white/30 hover:text-white/50 hover:bg-white/[0.03]")}>
                  {s === "ALL" ? "All" : s === "IN_PROGRESS" ? "In Progress" : s}
                  <span className={cn("ml-1.5 rounded-md px-1.5 py-0.5 text-[10px]",
                    active ? "bg-white/[0.1] text-white/60" : "bg-white/[0.03] text-white/25")}>
                    {counts[s]}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/20" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tickets..."
              className="w-full rounded-lg border border-white/[0.07] bg-white/[0.02] py-2 pl-8 pr-3 text-xs text-white outline-none placeholder:text-white/15 focus:border-white/12 sm:w-64" />
          </div>
        </div>

        {/* Ticket list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-white/20" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <MessageSquare className="mx-auto mb-3 h-8 w-8 text-white/10" />
            <p className="text-sm text-white/30">No tickets found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((t) => {
              const cfg = statusConfig[t.status as keyof typeof statusConfig];
              const StatusIcon = cfg?.icon || AlertCircle;
              return (
                <motion.button key={t.id} onClick={() => navigate(`/admin/tickets/${t.id}`)}
                  whileHover={{ x: 2 }}
                  className="flex w-full items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 text-left hover:border-white/[0.1] hover:bg-white/[0.03] transition-all">
                  <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", cfg?.color)}>
                    <StatusIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-white/20">{t.ticketNumber}</span>
                      <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium", cfg?.color)}>
                        {cfg?.label}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-sm font-medium text-white/80">{t.subject}</p>
                    <p className="mt-0.5 truncate text-xs text-white/25">
                      {t.name} · {t.email} · {new Date(t.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-white/15" />
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
