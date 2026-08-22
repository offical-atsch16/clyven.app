import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import {
  Shield, Loader2, LogOut, Mail, MessageSquare, Clock, ChevronRight,
  Plus, Search, CheckCircle, AlertCircle, XCircle, Filter, Trash2, X, User,
  Tag, AlertTriangle, Send
} from "lucide-react";
import { cn } from "../lib/utils";
import { api } from "../lib/api";

type StatusFilter = "ALL" | "OPEN" | "IN_PROGRESS" | "WAITING" | "CLOSED";
type PriorityFilter = "ALL" | "LOW" | "MEDIUM" | "HIGH";

export function AdminDashboard() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState("");
  const [, navigate] = useLocation();

  // Create Ticket Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createEmail, setCreateEmail] = useState("");
  const [createName, setCreateName] = useState("");
  const [createSubject, setCreateSubject] = useState("");
  const [createPriority, setCreatePriority] = useState("MEDIUM");
  const [createCategory, setCreateCategory] = useState("Allgemein");
  const [createMessage, setCreateMessage] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchTickets();
  }, []);

  async function checkAuth() {
    try {
      const res = await api.adminMe();
      if (res.email) {
        setAdminEmail(res.email);
      }
    } catch {
      navigate("/admin/login");
    }
  }

  async function fetchTickets() {
    setLoading(true);
    try {
      const data = await api.getAdminTickets();
      setTickets(data);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    try {
      await api.adminLogout();
    } catch (e) {
      console.error(e);
    }
    navigate("/admin/login");
  }

  async function handleStatusChange(ticketId: string, newStatus: string, e: React.MouseEvent | React.ChangeEvent) {
    e.stopPropagation();
    try {
      const updated = await api.updateTicketStatus(ticketId, newStatus);
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, status: updated.status } : t)));
    } catch (err: any) {
      console.error("Failed to update status:", err);
    }
  }

  async function handleCreateTicket(e: React.FormEvent) {
    e.preventDefault();
    setCreateError("");
    setCreating(true);
    try {
      await api.adminCreateTicket({
        email: createEmail,
        name: createName,
        subject: createSubject,
        priority: createPriority,
        category: createCategory,
        message: createMessage,
      });
      setIsModalOpen(false);
      setCreateEmail("");
      setCreateName("");
      setCreateSubject("");
      setCreatePriority("MEDIUM");
      setCreateCategory("Allgemein");
      setCreateMessage("");
      await fetchTickets();
    } catch (err: any) {
      setCreateError(err.message || "Fehler beim Erstellen des Tickets.");
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteTicket() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteAdminTicket(deleteTarget.id);
      setTickets((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: any) {
      console.error("Failed to delete ticket:", err);
    } finally {
      setDeleting(false);
    }
  }

  const filtered = tickets
    .filter((t) => statusFilter === "ALL" || t.status === statusFilter)
    .filter((t) => {
      if (priorityFilter === "ALL") return true;
      const tPri = (t.priority || "MEDIUM").toUpperCase();
      return tPri === priorityFilter;
    })
    .filter((t) => {
      const q = search.toLowerCase();
      return (
        !q ||
        t.ticketNumber?.toLowerCase().includes(q) ||
        t.subject?.toLowerCase().includes(q) ||
        t.email?.toLowerCase().includes(q) ||
        t.name?.toLowerCase().includes(q)
      );
    });

  const counts = {
    ALL: tickets.length,
    OPEN: tickets.filter((t) => t.status === "OPEN").length,
    IN_PROGRESS: tickets.filter((t) => t.status === "IN_PROGRESS").length,
    WAITING: tickets.filter((t) => t.status === "WAITING").length,
    CLOSED: tickets.filter((t) => t.status === "CLOSED").length,
  };

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

  return (
    <div className="min-h-[100dvh] bg-[#080808] text-white">
      {/* Header */}
      <div className="border-b border-white/[0.06] bg-[#0a0a0a]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.05] border border-white/[0.08]">
              <Shield className="h-4 w-4 text-white/70" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight">CLYVEN Support Dashboard</h1>
              <p className="text-[11px] text-white/30">{tickets.length} Tickets insgesamt</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Logged in Admin Account Indicator */}
            <div className="hidden sm:flex items-center gap-2 rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-1.5 text-xs text-white/60">
              <User className="h-3.5 w-3.5 text-white/40" />
              <span>Eingeloggt als: <strong className="text-white font-medium">{adminEmail || "Admin"}</strong></span>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-white text-black px-3.5 py-1.5 text-xs font-semibold hover:bg-white/90 transition-all shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" /> Neues Ticket erstellen
            </button>

            <button
              onClick={logout}
              title="Abmelden"
              className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-white/60 hover:text-white hover:bg-white/[0.08] transition-all"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Abmelden</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-6">
        {/* Analytics / Stats Cards */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div
            onClick={() => setStatusFilter("ALL")}
            className={cn(
              "cursor-pointer rounded-xl border p-3.5 transition-all",
              statusFilter === "ALL" ? "border-white/20 bg-white/[0.06]" : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]"
            )}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-white/40">Gesamt</div>
            <div className="mt-1 text-2xl font-bold text-white">{counts.ALL}</div>
          </div>

          <div
            onClick={() => setStatusFilter("OPEN")}
            className={cn(
              "cursor-pointer rounded-xl border p-3.5 transition-all",
              statusFilter === "OPEN" ? "border-blue-400/40 bg-blue-400/10" : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]"
            )}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Offen</div>
            <div className="mt-1 text-2xl font-bold text-blue-300">{counts.OPEN}</div>
          </div>

          <div
            onClick={() => setStatusFilter("IN_PROGRESS")}
            className={cn(
              "cursor-pointer rounded-xl border p-3.5 transition-all",
              statusFilter === "IN_PROGRESS" ? "border-yellow-400/40 bg-yellow-400/10" : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]"
            )}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-yellow-400">In Bearbeitung</div>
            <div className="mt-1 text-2xl font-bold text-yellow-300">{counts.IN_PROGRESS}</div>
          </div>

          <div
            onClick={() => setStatusFilter("WAITING")}
            className={cn(
              "cursor-pointer rounded-xl border p-3.5 transition-all",
              statusFilter === "WAITING" ? "border-purple-400/40 bg-purple-400/10" : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]"
            )}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Wartend</div>
            <div className="mt-1 text-2xl font-bold text-purple-300">{counts.WAITING}</div>
          </div>

          <div
            onClick={() => setStatusFilter("CLOSED")}
            className={cn(
              "cursor-pointer rounded-xl border p-3.5 transition-all",
              statusFilter === "CLOSED" ? "border-green-400/40 bg-green-400/10" : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]"
            )}
          >
            <div className="text-[10px] font-bold uppercase tracking-wider text-green-400">Geschlossen</div>
            <div className="mt-1 text-2xl font-bold text-green-300">{counts.CLOSED}</div>
          </div>
        </div>

        {/* Controls: Status Filter Tabs, Priority Filter, Search */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-white/30 mr-1 flex items-center gap-1">
              <Filter className="h-3 w-3" /> Status:
            </span>
            {(["ALL", "OPEN", "IN_PROGRESS", "WAITING", "CLOSED"] as StatusFilter[]).map((s) => {
              const active = statusFilter === s;
              const labels: Record<StatusFilter, string> = {
                ALL: "Alle",
                OPEN: "Offen",
                IN_PROGRESS: "In Bearbeitung",
                WAITING: "Wartend auf Kunde",
                CLOSED: "Geschlossen",
              };
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    "rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all border",
                    active
                      ? "border-white/20 bg-white/[0.08] text-white"
                      : "border-transparent text-white/40 hover:text-white hover:bg-white/[0.03]"
                  )}
                >
                  {labels[s]}
                  <span
                    className={cn(
                      "ml-1.5 rounded-md px-1.5 py-0.5 text-[10px]",
                      active ? "bg-white/[0.12] text-white" : "bg-white/[0.04] text-white/30"
                    )}
                  >
                    {counts[s]}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Priority filter dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-white/30">Priorität:</span>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)}
                className="rounded-lg border border-white/[0.08] bg-[#111111] px-2.5 py-1.5 text-xs text-white outline-none focus:border-white/20"
              >
                <option value="ALL">Alle Prioritäten</option>
                <option value="LOW">Niedrig</option>
                <option value="MEDIUM">Mittel</option>
                <option value="HIGH">Hoch</option>
              </select>
            </div>

            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/20" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="E-Mail, Betreff, Ticket-Nr..."
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] py-1.5 pl-8 pr-3 text-xs text-white outline-none placeholder:text-white/20 focus:border-white/20 sm:w-60"
              />
            </div>
          </div>
        </div>

        {/* Ticket list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-white/20" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.01]">
            <MessageSquare className="mx-auto mb-3 h-8 w-8 text-white/10" />
            <p className="text-sm font-medium text-white/40">Keine Tickets gefunden</p>
            <p className="text-xs text-white/20 mt-1">Passen Sie Ihre Filter- oder Sucheinstellungen an.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((t) => {
              const cfg = statusConfig[t.status] || statusConfig.OPEN;
              const priCfg = priorityConfig[(t.priority || "MEDIUM").toUpperCase()] || priorityConfig.MEDIUM;
              const StatusIcon = cfg.icon;

              return (
                <div
                  key={t.id}
                  onClick={() => navigate(`/admin/tickets/${t.id}`)}
                  className="group relative flex cursor-pointer flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-left hover:border-white/[0.12] hover:bg-white/[0.03] transition-all"
                >
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <div className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border", cfg.color)}>
                      <StatusIcon className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-mono font-medium text-white/30">{t.ticketNumber}</span>
                        <span className={cn("rounded border px-2 py-0.5 text-[10px] font-medium", cfg.color)}>
                          {cfg.label}
                        </span>
                        <span className={cn("rounded border px-2 py-0.5 text-[10px] font-medium", priCfg.color)}>
                          {priCfg.label}
                        </span>
                        {t.category && (
                          <span className="rounded border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/50">
                            {t.category}
                          </span>
                        )}
                      </div>

                      <p className="mt-1.5 truncate text-sm font-semibold text-white/90 group-hover:text-white transition-colors">
                        {t.subject}
                      </p>

                      <p className="mt-1 truncate text-xs text-white/30">
                        {t.name} · <span className="text-white/50">{t.email}</span> · Erstellt: {new Date(t.createdAt).toLocaleString("de-DE")}
                      </p>
                    </div>
                  </div>

                  {/* Actions right side */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {/* Inline Status Selector */}
                    <div onClick={(e) => e.stopPropagation()} className="relative">
                      <select
                        value={t.status}
                        onChange={(e) => handleStatusChange(t.id, e.target.value, e)}
                        className="rounded-lg border border-white/[0.1] bg-[#111111] px-2.5 py-1 text-xs font-medium text-white/80 outline-none hover:border-white/30 transition-all cursor-pointer"
                      >
                        <option value="OPEN">Offen</option>
                        <option value="IN_PROGRESS">In Bearbeitung</option>
                        <option value="WAITING">Wartend auf Kunde</option>
                        <option value="CLOSED">Geschlossen</option>
                      </select>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(t);
                      }}
                      title="Ticket löschen"
                      className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-1.5 text-white/30 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>

                    <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-white/50 transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE TICKET MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-xl rounded-2xl border border-white/[0.1] bg-[#111111] p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.05]">
                    <Plus className="h-4 w-4 text-white/80" />
                  </div>
                  <h2 className="text-base font-bold text-white">Neues Support-Ticket erstellen</h2>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg p-1 text-white/40 hover:bg-white/[0.08] hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreateTicket} className="mt-4 space-y-4">
                {createError && (
                  <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
                    {createError}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-white/60">Kunden-E-Mail *</label>
                    <input
                      type="email"
                      required
                      value={createEmail}
                      onChange={(e) => setCreateEmail(e.target.value)}
                      placeholder="kunde@beispiel.de"
                      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-xs text-white outline-none focus:border-white/20"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-white/60">Kunden-Name (optional)</label>
                    <input
                      type="text"
                      value={createName}
                      onChange={(e) => setCreateName(e.target.value)}
                      placeholder="Max Mustermann"
                      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-xs text-white outline-none focus:border-white/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-white/60">Betreff *</label>
                  <input
                    type="text"
                    required
                    value={createSubject}
                    onChange={(e) => setCreateSubject(e.target.value)}
                    placeholder="Problem mit Login / Anfrage"
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-xs text-white outline-none focus:border-white/20"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-white/60">Priorität</label>
                    <select
                      value={createPriority}
                      onChange={(e) => setCreatePriority(e.target.value)}
                      className="w-full rounded-xl border border-white/[0.08] bg-[#181818] px-3.5 py-2.5 text-xs text-white outline-none focus:border-white/20"
                    >
                      <option value="LOW">Niedrig</option>
                      <option value="MEDIUM">Mittel</option>
                      <option value="HIGH">Hoch</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-white/60">Kategorie</label>
                    <select
                      value={createCategory}
                      onChange={(e) => setCreateCategory(e.target.value)}
                      className="w-full rounded-xl border border-white/[0.08] bg-[#181818] px-3.5 py-2.5 text-xs text-white outline-none focus:border-white/20"
                    >
                      <option value="Allgemein">Allgemein</option>
                      <option value="Technisch">Technisch</option>
                      <option value="Abrechnung">Abrechnung</option>
                      <option value="Feature Request">Feature Request</option>
                      <option value="Sonstiges">Sonstiges</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-white/60">Nachricht / Beschreibung *</label>
                  <textarea
                    required
                    rows={4}
                    value={createMessage}
                    onChange={(e) => setCreateMessage(e.target.value)}
                    placeholder="Detaillierte Beschreibung der Anfrage..."
                    className="w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-xs text-white outline-none focus:border-white/20"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-xl border border-white/[0.08] px-4 py-2 text-xs font-medium text-white/60 hover:bg-white/[0.05] transition-all"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex items-center gap-2 rounded-xl bg-white px-5 py-2 text-xs font-semibold text-black hover:bg-white/90 transition-all disabled:opacity-50"
                  >
                    {creating ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" /> Ticket Erstellen
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {deleteTarget && (
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
                Möchten Sie das Ticket <strong className="text-white font-mono">{deleteTarget.ticketNumber}</strong> ({deleteTarget.subject}) und alle zugehörigen Nachrichten wirklich dauerhaft löschen? Diese Aktion kann nicht rückgängig gemacht werden.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
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
