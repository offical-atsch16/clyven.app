import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import {
  Shield, Loader2, LogOut, Mail, MessageSquare, Clock, ChevronRight,
  Plus, Search, CheckCircle, AlertCircle, Filter, Trash2, X, User,
  Tag, AlertTriangle, Send, ShieldCheck, UserCheck, Activity, Users, BarChart3,
  CheckSquare, Square, ArrowUpRight, Zap
} from "lucide-react";
import { cn } from "../lib/utils";
import { api } from "../lib/api";

type StatusFilter = "ALL" | "OPEN" | "IN_PROGRESS" | "WAITING" | "CLOSED" | "RESOLVED";
type PriorityFilter = "ALL" | "LOW" | "MEDIUM" | "HIGH" | "URGENT";
type ViewFilter = "ALL" | "MY_TICKETS" | "UNASSIGNED";

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"tickets" | "audit" | "staff" | "analytics" | "banners" | "settings" | "users" | "flags">("tickets");

  // Current Staff Session
  const [currentStaff, setCurrentStaff] = useState<any>(null);

  // Tickets & Filters
  const [tickets, setTickets] = useState<any[]>([]);
  const [viewFilter, setViewFilter] = useState<ViewFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Bulk Selection
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState("");
  const [bulkValue, setBulkValue] = useState("");
  const [bulkUpdating, setBulkUpdating] = useState(false);

  // Support Staff List
  const [staffList, setStaffList] = useState<any[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [newStaffModalOpen, setNewStaffModalOpen] = useState(false);
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffRole, setNewStaffRole] = useState<"admin" | "agent">("agent");
  const [newStaffSaving, setNewStaffSaving] = useState(false);

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditStaffFilter, setAuditStaffFilter] = useState("");
  const [auditActionFilter, setAuditActionFilter] = useState("");

  // Analytics
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Banners & System Settings & Flags & Users
  const [featureFlags, setFeatureFlags] = useState<any[]>([]);
  const [flagsLoading, setFlagsLoading] = useState(false);
  const [flagModalOpen, setFlagModalOpen] = useState(false);
  const [flagKey, setFlagKey] = useState("");
  const [flagDesc, setFlagDesc] = useState("");
  const [flagGlobal, setFlagGlobal] = useState(false);
  const [flagUsers, setFlagUsers] = useState("");
  const [flagSaving, setFlagSaving] = useState(false);

  const [userSearch, setUserSearch] = useState("");
  const [searchedUsers, setSearchedUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [selectedAuditUser, setSelectedAuditUser] = useState<any>(null);
  const [userAuditData, setUserAuditData] = useState<any>(null);
  const [userAuditLoading, setUserAuditLoading] = useState(false);
  const [impersonatingToken, setImpersonatingToken] = useState<string | null>(null);

  const [readOnlyMode, setReadOnlyMode] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);

  const [banners, setBanners] = useState<any[]>([]);
  const [bannersLoading, setBannersLoading] = useState(false);

  // Create Ticket Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createEmail, setCreateEmail] = useState("");
  const [createName, setCreateName] = useState("");
  const [createSubject, setCreateSubject] = useState("");
  const [createPriority, setCreatePriority] = useState("medium");
  const [createCategory, setCreateCategory] = useState("Allgemein");
  const [createMessage, setCreateMessage] = useState("");
  const [createAssignedTo, setCreateAssignedTo] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  // Assign Ticket Modal State
  const [assignTicketTarget, setAssignTicketTarget] = useState<any>(null);
  const [assignStaffId, setAssignStaffId] = useState("");
  const [assigning, setAssigning] = useState(false);

  // Banner Modal state
  const [bannerModalOpen, setBannerModalOpen] = useState(false);
  const [bannerTitle, setBannerTitle] = useState("");
  const [bannerMessage, setBannerMessage] = useState("");
  const [bannerType, setBannerType] = useState("info");
  const [bannerTargetRoute, setBannerTargetRoute] = useState("*");
  const [bannerIsActive, setBannerIsActive] = useState(true);
  const [bannerSaving, setBannerSaving] = useState(false);

  const [, navigate] = useLocation();

  useEffect(() => {
    checkAuth();
    fetchTickets();
    fetchStaff();
    fetchBanners();
    fetchSettings();
    fetchFlags();
  }, []);

  useEffect(() => {
    if (activeTab === "audit" && isAdmin) {
      fetchAuditLogs();
    } else if (activeTab === "analytics" && isAdmin) {
      fetchAnalytics();
    }
  }, [activeTab, auditStaffFilter, auditActionFilter]);

  const isAdmin = currentStaff?.role === "admin" || currentStaff?.email?.toLowerCase() === "atschemeris@icloud.com";

  async function checkAuth() {
    try {
      const res = await api.adminMe();
      if (res) {
        setCurrentStaff({
          id: res.staffId || res.adminId,
          email: res.email,
          fullName: res.fullName || res.name || "Arien Tschemeris",
          role: res.role || (res.email?.toLowerCase() === "atschemeris@icloud.com" ? "admin" : "agent"),
        });
      }
    } catch {
      navigate("/admin/login");
    }
  }

  async function fetchTickets() {
    setLoading(true);
    try {
      const data = await api.getAdminTickets();
      setTickets(data || []);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function fetchStaff() {
    setStaffLoading(true);
    try {
      const data = await api.getSupportStaff();
      setStaffList(data || []);
    } catch (e: any) {
      console.error(e);
    } finally {
      setStaffLoading(false);
    }
  }

  async function fetchAuditLogs() {
    setAuditLoading(true);
    try {
      const params: any = {};
      if (auditStaffFilter) params.staffId = auditStaffFilter;
      if (auditActionFilter) params.action = auditActionFilter;
      const data = await api.getSupportAuditLogs(params);
      setAuditLogs(data || []);
    } catch (e: any) {
      console.error(e);
    } finally {
      setAuditLoading(false);
    }
  }

  async function fetchAnalytics() {
    setAnalyticsLoading(true);
    try {
      const data = await api.getSupportAnalytics();
      setAnalyticsData(data);
    } catch (e: any) {
      console.error(e);
    } finally {
      setAnalyticsLoading(false);
    }
  }

  async function fetchFlags() {
    setFlagsLoading(true);
    try {
      const data = await api.getAdminFeatureFlags();
      setFeatureFlags(data || []);
    } catch (e: any) {
      console.error(e);
    } finally {
      setFlagsLoading(false);
    }
  }

  async function fetchBanners() {
    setBannersLoading(true);
    try {
      const data = await api.getAdminBanners();
      setBanners(data || []);
    } catch (e: any) {
      console.error(e);
    } finally {
      setBannersLoading(false);
    }
  }

  async function fetchSettings() {
    setSettingsLoading(true);
    try {
      const data = await api.getAdminSettings();
      const ro = data.find((s: any) => s.key === "read_only_mode");
      if (ro) {
        setReadOnlyMode(ro.value?.enabled === true || ro.value === true);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setSettingsLoading(false);
    }
  }

  async function handleCreateStaff(e: React.FormEvent) {
    e.preventDefault();
    setNewStaffSaving(true);
    try {
      await api.createSupportStaff({
        email: newStaffEmail,
        fullName: newStaffName,
        role: newStaffRole,
      });
      setNewStaffModalOpen(false);
      setNewStaffEmail("");
      setNewStaffName("");
      setNewStaffRole("agent");
      await fetchStaff();
    } catch (e: any) {
      console.error(e);
    } finally {
      setNewStaffSaving(false);
    }
  }

  async function handleToggleStaffStatus(staff: any) {
    try {
      await api.updateSupportStaff(staff.id, { isActive: !staff.isActive });
      await fetchStaff();
    } catch (e: any) {
      console.error(e);
    }
  }

  async function handleToggleStaffRole(staff: any) {
    try {
      const nextRole = staff.role === "admin" ? "agent" : "admin";
      await api.updateSupportStaff(staff.id, { role: nextRole });
      await fetchStaff();
    } catch (e: any) {
      console.error(e);
    }
  }

  async function handleExecuteBulkAction() {
    if (selectedTicketIds.length === 0 || !bulkAction || !bulkValue) return;
    setBulkUpdating(true);
    try {
      await api.bulkUpdateTickets(selectedTicketIds, bulkAction as any, bulkValue);
      setSelectedTicketIds([]);
      setBulkAction("");
      setBulkValue("");
      await fetchTickets();
    } catch (e: any) {
      console.error(e);
    } finally {
      setBulkUpdating(false);
    }
  }

  function toggleSelectAllTickets() {
    if (selectedTicketIds.length === filtered.length) {
      setSelectedTicketIds([]);
    } else {
      setSelectedTicketIds(filtered.map((t) => t.id));
    }
  }

  function toggleSelectTicket(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setSelectedTicketIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  async function handleAssignTicketStaff(e: React.FormEvent) {
    e.preventDefault();
    if (!assignTicketTarget) return;
    setAssigning(true);
    try {
      await api.assignAdminTicketToStaff(assignTicketTarget.id, assignStaffId || null);
      await fetchTickets();
      setAssignTicketTarget(null);
      setAssignStaffId("");
    } catch (err: any) {
      console.error("Failed to assign ticket:", err);
    } finally {
      setAssigning(false);
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
        assignedTo: createAssignedTo || undefined,
      });
      setIsModalOpen(false);
      setCreateEmail("");
      setCreateName("");
      setCreateSubject("");
      setCreatePriority("medium");
      setCreateCategory("Allgemein");
      setCreateMessage("");
      setCreateAssignedTo("");
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

  async function handleStatusChange(ticketId: string, newStatus: string, e: React.MouseEvent | React.ChangeEvent) {
    e.stopPropagation();
    try {
      const updated = await api.updateTicketStatus(ticketId, newStatus);
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, status: updated.status } : t)));
    } catch (err: any) {
      console.error("Failed to update status:", err);
    }
  }

  async function handleSearchUsers(e: React.FormEvent) {
    e.preventDefault();
    if (!userSearch.trim()) return;
    setUsersLoading(true);
    try {
      const data = await api.searchAdminUsers(userSearch);
      setSearchedUsers(data || []);
    } catch (e: any) {
      console.error(e);
    } finally {
      setUsersLoading(false);
    }
  }

  async function inspectUserAudit(user: any) {
    setSelectedAuditUser(user);
    setUserAuditLoading(true);
    try {
      const data = await api.getAdminUserAudit(user.id || user.userId);
      setUserAuditData(data);
    } catch (e: any) {
      console.error(e);
    } finally {
      setUserAuditLoading(false);
    }
  }

  async function startImpersonation(user: any) {
    try {
      const res = await api.impersonateAdminUser(user.id || user.userId);
      if (res && res.token) {
        setImpersonatingToken(res.token);
      }
    } catch (e: any) {
      console.error(e);
    }
  }

  async function toggleReadOnlyMode() {
    const nextVal = !readOnlyMode;
    try {
      await api.updateAdminSetting("read_only_mode", { enabled: nextVal }, "Global Read-Only / Maintenance Mode");
      setReadOnlyMode(nextVal);
    } catch (e: any) {
      console.error(e);
    }
  }

  async function handleCreateBanner(e: React.FormEvent) {
    e.preventDefault();
    setBannerSaving(true);
    try {
      await api.createAdminBanner({
        title: bannerTitle,
        message: bannerMessage,
        type: bannerType,
        targetRoute: bannerTargetRoute,
        isActive: bannerIsActive,
      });
      setBannerModalOpen(false);
      setBannerTitle("");
      setBannerMessage("");
      setBannerType("info");
      setBannerTargetRoute("*");
      setBannerIsActive(true);
      await fetchBanners();
    } catch (e: any) {
      console.error(e);
    } finally {
      setBannerSaving(false);
    }
  }

  async function toggleBannerActive(banner: any) {
    try {
      const updated = await api.updateAdminBanner(banner.id, { isActive: !banner.isActive });
      setBanners((prev) => prev.map((b) => (b.id === banner.id ? updated : b)));
    } catch (e: any) {
      console.error(e);
    }
  }

  async function handleDeleteBanner(id: string) {
    try {
      await api.deleteAdminBanner(id);
      setBanners((prev) => prev.filter((b) => b.id !== id));
    } catch (e: any) {
      console.error(e);
    }
  }

  async function handleCreateFlag(e: React.FormEvent) {
    e.preventDefault();
    setFlagSaving(true);
    try {
      const allowed = flagUsers.split(",").map((s) => s.trim()).filter(Boolean);
      await api.createAdminFeatureFlag({
        flagKey,
        description: flagDesc,
        isEnabledGlobally: flagGlobal,
        allowedUserIds: allowed,
      });
      setFlagModalOpen(false);
      setFlagKey("");
      setFlagDesc("");
      setFlagGlobal(false);
      setFlagUsers("");
      await fetchFlags();
    } catch (e: any) {
      console.error(e);
    } finally {
      setFlagSaving(false);
    }
  }

  async function toggleFlagGlobal(flag: any) {
    try {
      const updated = await api.updateAdminFeatureFlag(flag.id, { isEnabledGlobally: !flag.isEnabledGlobally });
      setFeatureFlags((prev) => prev.map((f) => (f.id === flag.id ? updated : f)));
    } catch (e: any) {
      console.error(e);
    }
  }

  async function handleDeleteFlag(id: string) {
    try {
      await api.deleteAdminFeatureFlag(id);
      setFeatureFlags((prev) => prev.filter((f) => f.id !== id));
    } catch (e: any) {
      console.error(e);
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

  // Filtered tickets
  const filtered = tickets
    .filter((t) => {
      if (viewFilter === "MY_TICKETS") {
        return t.assignedTo === currentStaff?.id || !t.assignedTo;
      } else if (viewFilter === "UNASSIGNED") {
        return !t.assignedTo;
      }
      return true;
    })
    .filter((t) => statusFilter === "ALL" || t.status === statusFilter)
    .filter((t) => {
      if (priorityFilter === "ALL") return true;
      const tPri = (t.priority || "medium").toUpperCase();
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
    MY_TICKETS: tickets.filter((t) => t.assignedTo === currentStaff?.id || !t.assignedTo).length,
    UNASSIGNED: tickets.filter((t) => !t.assignedTo).length,
    OPEN: tickets.filter((t) => t.status === "OPEN").length,
    IN_PROGRESS: tickets.filter((t) => t.status === "IN_PROGRESS").length,
    WAITING: tickets.filter((t) => t.status === "WAITING").length,
    CLOSED: tickets.filter((t) => ["CLOSED", "RESOLVED"].includes(t.status)).length,
  };

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

  return (
    <div className="min-h-[100dvh] bg-[#000000] text-white font-sans antialiased">
      {/* Header with Branding & Logo */}
      <div className="border-b border-[#27272A] bg-[#090A0F]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-3.5">
          <div className="flex items-center gap-3">
            <img src="/logo-support.svg" alt="Clyven Support" className="h-8 w-8 rounded-lg" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold tracking-tight text-white font-mono">CLYVEN SUPPORT</h1>
                <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-mono tracking-widest text-white/50 uppercase">
                  Internal Dashboard
                </span>
              </div>
              <p className="text-[11px] text-white/40">{tickets.length} Tickets im System</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Current Staff Member & Role Badge */}
            <div className="flex items-center gap-2 rounded-lg bg-[#111218] border border-[#27272A] px-3 py-1.5 text-xs text-white/70">
              <User className="h-3.5 w-3.5 text-cyan-400" />
              <span className="font-mono">{currentStaff?.fullName || "Arien Tschemeris"}</span>
              <span
                className={cn(
                  "rounded px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase border",
                  isAdmin
                    ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                    : "bg-blue-500/20 text-blue-300 border-blue-500/40"
                )}
              >
                [{currentStaff?.role?.toUpperCase() || (isAdmin ? "ADMIN" : "SUPPORT")}]
              </span>
            </div>

            <button
              onClick={() => {
                if (activeTab === "tickets") setIsModalOpen(true);
                else if (activeTab === "staff") setNewStaffModalOpen(true);
                else if (activeTab === "banners") setBannerModalOpen(true);
                else if (activeTab === "flags") setFlagModalOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-lg bg-cyan-400 text-black px-3.5 py-1.5 text-xs font-semibold hover:bg-cyan-300 transition-all shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              {activeTab === "tickets" ? "Neues Ticket" : activeTab === "staff" ? "Staff Hinzufügen" : activeTab === "banners" ? "Neues Banner" : "Neuer Flag"}
            </button>

            <button
              onClick={logout}
              title="Abmelden"
              className="flex items-center gap-1.5 rounded-lg border border-[#27272A] bg-[#111218] px-3 py-1.5 text-xs text-white/60 hover:text-white hover:bg-white/10 transition-all"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Abmelden</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="border-b border-[#27272A] bg-[#090A0F] px-6">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab("tickets")}
            className={cn(
              "flex items-center gap-2 py-3 px-4 text-xs font-semibold font-mono transition-all border-b-2",
              activeTab === "tickets" ? "border-cyan-400 text-cyan-400 bg-white/[0.02]" : "border-transparent text-white/40 hover:text-white/80"
            )}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Tickets ({tickets.length})
          </button>

          {isAdmin && (
            <>
              <button
                onClick={() => setActiveTab("audit")}
                className={cn(
                  "flex items-center gap-2 py-3 px-4 text-xs font-semibold font-mono transition-all border-b-2",
                  activeTab === "audit" ? "border-cyan-400 text-cyan-400 bg-white/[0.02]" : "border-transparent text-white/40 hover:text-white/80"
                )}
              >
                <Activity className="h-3.5 w-3.5" />
                Audit Logs
              </button>

              <button
                onClick={() => setActiveTab("staff")}
                className={cn(
                  "flex items-center gap-2 py-3 px-4 text-xs font-semibold font-mono transition-all border-b-2",
                  activeTab === "staff" ? "border-cyan-400 text-cyan-400 bg-white/[0.02]" : "border-transparent text-white/40 hover:text-white/80"
                )}
              >
                <Users className="h-3.5 w-3.5" />
                Staff Management ({staffList.length})
              </button>

              <button
                onClick={() => setActiveTab("analytics")}
                className={cn(
                  "flex items-center gap-2 py-3 px-4 text-xs font-semibold font-mono transition-all border-b-2",
                  activeTab === "analytics" ? "border-cyan-400 text-cyan-400 bg-white/[0.02]" : "border-transparent text-white/40 hover:text-white/80"
                )}
              >
                <BarChart3 className="h-3.5 w-3.5" />
                Analytics Overview
              </button>
            </>
          )}

          <button
            onClick={() => setActiveTab("banners")}
            className={cn(
              "flex items-center gap-2 py-3 px-4 text-xs font-semibold font-mono transition-all border-b-2",
              activeTab === "banners" ? "border-cyan-400 text-cyan-400 bg-white/[0.02]" : "border-transparent text-white/40 hover:text-white/80"
            )}
          >
            Banners ({banners.length})
          </button>

          <button
            onClick={() => setActiveTab("users")}
            className={cn(
              "flex items-center gap-2 py-3 px-4 text-xs font-semibold font-mono transition-all border-b-2",
              activeTab === "users" ? "border-cyan-400 text-cyan-400 bg-white/[0.02]" : "border-transparent text-white/40 hover:text-white/80"
            )}
          >
            User Audit & Impersonation
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={cn(
              "flex items-center gap-2 py-3 px-4 text-xs font-semibold font-mono transition-all border-b-2",
              activeTab === "settings" ? "border-cyan-400 text-cyan-400 bg-white/[0.02]" : "border-transparent text-white/40 hover:text-white/80"
            )}
          >
            Service Controls
          </button>

          <button
            onClick={() => setActiveTab("flags")}
            className={cn(
              "flex items-center gap-2 py-3 px-4 text-xs font-semibold font-mono transition-all border-b-2",
              activeTab === "flags" ? "border-cyan-400 text-cyan-400 bg-white/[0.02]" : "border-transparent text-white/40 hover:text-white/80"
            )}
          >
            Feature Flags ({featureFlags.length})
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-6">
        {activeTab === "audit" && isAdmin ? (
          <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider">Support Audit Logs</h2>
                <p className="text-xs text-white/40">Echtzeit-Zeitleiste aller Mitarbeiter-Aktionen und Ticket-Veränderungen.</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={auditStaffFilter}
                  onChange={(e) => setAuditStaffFilter(e.target.value)}
                  className="rounded-lg border border-[#27272A] bg-[#090A0F] px-3 py-1.5 text-xs text-white outline-none focus:border-cyan-400 font-mono"
                >
                  <option value="">Alle Mitarbeiter</option>
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>{s.fullName}</option>
                  ))}
                </select>

                <select
                  value={auditActionFilter}
                  onChange={(e) => setAuditActionFilter(e.target.value)}
                  className="rounded-lg border border-[#27272A] bg-[#090A0F] px-3 py-1.5 text-xs text-white outline-none focus:border-cyan-400 font-mono"
                >
                  <option value="">Alle Aktionstypen</option>
                  <option value="REPLY_SENT">REPLY_SENT</option>
                  <option value="INTERNAL_NOTE_ADDED">INTERNAL_NOTE_ADDED</option>
                  <option value="STATUS_CHANGED">STATUS_CHANGED</option>
                  <option value="TICKET_ASSIGNED">TICKET_ASSIGNED</option>
                  <option value="TICKET_CREATED">TICKET_CREATED</option>
                  <option value="BULK_TICKET_UPDATE">BULK_TICKET_UPDATE</option>
                </select>
              </div>
            </div>

            {auditLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-cyan-400" /></div>
            ) : auditLogs.length === 0 ? (
              <div className="py-12 text-center rounded-2xl border border-dashed border-[#27272A] text-white/40 text-xs font-mono">
                Keine Audit-Einträge gefunden.
              </div>
            ) : (
              <div className="space-y-2">
                {auditLogs.map((log) => (
                  <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[#27272A] bg-[#090A0F] p-3.5 hover:bg-white/[0.02] transition-all">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shrink-0 font-mono text-xs">
                        <Activity className="h-3.5 w-3.5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-white font-mono">{log.staffName}</span>
                          <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-mono font-bold text-cyan-300">
                            {log.action}
                          </span>
                          {log.ticketId && (
                            <span className="text-[10px] font-mono text-white/40">Ticket ID: {log.ticketId}</span>
                          )}
                        </div>
                        {log.details && (
                          <p className="text-xs text-white/60 font-mono leading-relaxed">
                            {JSON.stringify(log.details)}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-white/30 shrink-0 self-end sm:self-center">
                      {new Date(log.createdAt).toLocaleString("de-DE")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === "staff" && isAdmin ? (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider">Mitarbeiter-Verwaltung (`support_staff`)</h2>
                <p className="text-xs text-white/40">Rollen verwalten, Zugriffsrechte erteilen und Accounts aktivieren oder deaktivieren.</p>
              </div>
              <button
                onClick={() => setNewStaffModalOpen(true)}
                className="flex items-center gap-1.5 rounded-lg bg-cyan-400 text-black px-3.5 py-1.5 text-xs font-semibold hover:bg-cyan-300 transition-all font-mono"
              >
                <Plus className="h-3.5 w-3.5" /> Staff Mitglied Hinzufügen
              </button>
            </div>

            {staffLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-cyan-400" /></div>
            ) : staffList.length === 0 ? (
              <div className="py-12 text-center rounded-2xl border border-dashed border-[#27272A] text-white/40 text-xs font-mono">
                Keine Support-Mitarbeiter angelegt.
              </div>
            ) : (
              <div className="space-y-2">
                {staffList.map((staff) => (
                  <div key={staff.id} className="flex items-center justify-between rounded-xl border border-[#27272A] bg-[#090A0F] p-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white font-mono">{staff.fullName}</span>
                        <span
                          className={cn(
                            "rounded px-2 py-0.5 text-[10px] font-mono font-bold uppercase border",
                            staff.role === "admin"
                              ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                              : "bg-blue-500/20 text-blue-300 border-blue-500/40"
                          )}
                        >
                          [{staff.role.toUpperCase()}]
                        </span>
                        <span
                          className={cn(
                            "rounded px-1.5 py-0.5 text-[9px] font-mono uppercase border",
                            staff.isActive
                              ? "bg-green-500/10 text-green-300 border-green-500/20"
                              : "bg-red-500/10 text-red-300 border-red-500/20"
                          )}
                        >
                          {staff.isActive ? "Aktiv" : "Deaktiviert"}
                        </span>
                      </div>
                      <p className="text-xs text-white/40 font-mono">{staff.email} · ID: {staff.id}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleStaffRole(staff)}
                        className="rounded-lg border border-[#27272A] bg-[#111218] px-3 py-1 text-xs text-white/70 hover:text-white font-mono"
                      >
                        Rolle: {staff.role === "admin" ? "Zu Agent ändern" : "Zu Admin befördern"}
                      </button>

                      <button
                        onClick={() => handleToggleStaffStatus(staff)}
                        className={cn(
                          "rounded-lg px-3 py-1 text-xs font-mono transition-all border",
                          staff.isActive
                            ? "border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                            : "border-green-500/30 bg-green-500/10 text-green-300 hover:bg-green-500/20"
                        )}
                      >
                        {staff.isActive ? "Deaktivieren" : "Aktivieren"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === "analytics" && isAdmin ? (
          <div>
            <div className="mb-6">
              <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider">Analytics & Support-Kennzahlen</h2>
              <p className="text-xs text-white/40">Metriken zu Antwortzeiten, Lösungsraten und Ticketverteilung.</p>
            </div>

            {analyticsLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-cyan-400" /></div>
            ) : analyticsData ? (
              <div className="space-y-6">
                {/* Metric Cards */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  <div className="rounded-2xl border border-[#27272A] bg-[#090A0F] p-4">
                    <span className="text-[10px] font-mono text-white/40 uppercase block">Durchschnittliche Antwortzeit</span>
                    <span className="text-2xl font-bold font-mono text-cyan-400 mt-1 block">{analyticsData.avgResponseTime}</span>
                  </div>

                  <div className="rounded-2xl border border-[#27272A] bg-[#090A0F] p-4">
                    <span className="text-[10px] font-mono text-white/40 uppercase block">Lösungsrate (Resolution Rate)</span>
                    <span className="text-2xl font-bold font-mono text-green-400 mt-1 block">{analyticsData.resolutionRate}</span>
                    <span className="text-[10px] font-mono text-white/30 mt-1 block">{analyticsData.resolvedTickets} von {analyticsData.totalTickets} gelöst</span>
                  </div>

                  <div className="rounded-2xl border border-[#27272A] bg-[#090A0F] p-4">
                    <span className="text-[10px] font-mono text-white/40 uppercase block">Tickets per Agent</span>
                    <span className="text-2xl font-bold font-mono text-purple-400 mt-1 block">
                      {analyticsData.ticketsPerAgent?.length || 0} Agents
                    </span>
                  </div>

                  <div className="rounded-2xl border border-[#27272A] bg-[#090A0F] p-4">
                    <span className="text-[10px] font-mono text-white/40 uppercase block">Gesamtes Volumen</span>
                    <span className="text-2xl font-bold font-mono text-white mt-1 block">{analyticsData.totalTickets}</span>
                  </div>
                </div>

                {/* Agent breakdown & Categories */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="rounded-2xl border border-[#27272A] bg-[#090A0F] p-5">
                    <h3 className="text-xs font-bold font-mono uppercase text-white/50 mb-3">Tickets nach Agent</h3>
                    <div className="space-y-2">
                      {analyticsData.ticketsPerAgent?.map((ag: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center rounded-lg border border-[#27272A] bg-[#111218] p-2.5 text-xs font-mono">
                          <span className="text-white font-semibold">{ag.name}</span>
                          <span className="rounded bg-cyan-500/20 text-cyan-300 px-2 py-0.5 text-[11px] font-bold">{ag.count} Tickets</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#27272A] bg-[#090A0F] p-5">
                    <h3 className="text-xs font-bold font-mono uppercase text-white/50 mb-3">Volumen nach Kategorie</h3>
                    <div className="space-y-2">
                      {analyticsData.volumeByCategory?.map((cat: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center rounded-lg border border-[#27272A] bg-[#111218] p-2.5 text-xs font-mono">
                          <span className="text-white font-semibold">{cat.category}</span>
                          <span className="rounded bg-purple-500/20 text-purple-300 px-2 py-0.5 text-[11px] font-bold">{cat.count} Tickets</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ) : activeTab === "tickets" ? (
          <>
            {/* Filter Toolbar & Quick Views */}
            <div className="mb-6 space-y-4">
              {/* Quick View Filter Pills */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 border-b border-[#27272A] pb-2">
                  <button
                    onClick={() => setViewFilter("ALL")}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-mono font-semibold transition-all",
                      viewFilter === "ALL" ? "bg-cyan-400 text-black" : "bg-[#111218] text-white/50 hover:text-white"
                    )}
                  >
                    Alle Tickets ({counts.ALL})
                  </button>
                  <button
                    onClick={() => setViewFilter("MY_TICKETS")}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-mono font-semibold transition-all",
                      viewFilter === "MY_TICKETS" ? "bg-cyan-400 text-black" : "bg-[#111218] text-white/50 hover:text-white"
                    )}
                  >
                    Meine / Unzugewiesene Tickets ({counts.MY_TICKETS})
                  </button>
                  <button
                    onClick={() => setViewFilter("UNASSIGNED")}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-mono font-semibold transition-all",
                      viewFilter === "UNASSIGNED" ? "bg-cyan-400 text-black" : "bg-[#111218] text-white/50 hover:text-white"
                    )}
                  >
                    Unzugewiesen ({counts.UNASSIGNED})
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Ticket-Nr, Subject, Customer E-Mail..."
                      className="w-full font-mono rounded-lg border border-[#27272A] bg-[#090A0F] py-1.5 pl-8 pr-3 text-xs text-white outline-none placeholder:text-white/20 focus:border-cyan-400 sm:w-64"
                    />
                  </div>
                </div>
              </div>

              {/* Status and Priority Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono text-white/30 mr-1 flex items-center gap-1">
                    <Filter className="h-3 w-3" /> Status:
                  </span>
                  {(["ALL", "OPEN", "IN_PROGRESS", "WAITING", "CLOSED"] as StatusFilter[]).map((s) => {
                    const active = statusFilter === s;
                    const labels: Record<StatusFilter, string> = {
                      ALL: "Alle",
                      OPEN: "Offen",
                      IN_PROGRESS: "In Bearbeitung",
                      WAITING: "Wartend",
                      CLOSED: "Geschlossen",
                      RESOLVED: "Gelöst",
                    };
                    return (
                      <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={cn(
                          "rounded-lg px-2.5 py-1 text-xs font-mono transition-all border",
                          active
                            ? "border-cyan-400/50 bg-cyan-400/10 text-cyan-300 font-bold"
                            : "border-[#27272A] text-white/40 hover:text-white hover:bg-white/[0.02]"
                        )}
                      >
                        {labels[s]}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-3 font-mono">
                  <div className="flex items-center gap-1.5 text-xs text-white/40">
                    <span>Priority:</span>
                    <select
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)}
                      className="rounded-lg border border-[#27272A] bg-[#090A0F] px-2.5 py-1 text-xs text-white outline-none focus:border-cyan-400"
                    >
                      <option value="ALL">Alle</option>
                      <option value="LOW">Niedrig</option>
                      <option value="MEDIUM">Mittel</option>
                      <option value="HIGH">Hoch</option>
                      <option value="URGENT">Dringend</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Bulk Actions Bar */}
              {selectedTicketIds.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3 text-xs font-mono text-cyan-300">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-cyan-400" />
                    <span>{selectedTicketIds.length} Ticket(s) ausgewählt</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={bulkAction}
                      onChange={(e) => {
                        setBulkAction(e.target.value);
                        setBulkValue("");
                      }}
                      className="rounded-lg border border-cyan-500/30 bg-[#090A0F] px-2.5 py-1 text-xs text-white outline-none"
                    >
                      <option value="">-- Aktion wählen --</option>
                      <option value="status">Status Ändern</option>
                      <option value="priority">Priorität Ändern</option>
                      <option value="assign">Agent Zuweisen</option>
                    </select>

                    {bulkAction === "status" && (
                      <select
                        value={bulkValue}
                        onChange={(e) => setBulkValue(e.target.value)}
                        className="rounded-lg border border-cyan-500/30 bg-[#090A0F] px-2.5 py-1 text-xs text-white outline-none"
                      >
                        <option value="">-- Status wählen --</option>
                        <option value="OPEN">Offen</option>
                        <option value="IN_PROGRESS">In Bearbeitung</option>
                        <option value="WAITING">Wartend</option>
                        <option value="CLOSED">Geschlossen</option>
                      </select>
                    )}

                    {bulkAction === "priority" && (
                      <select
                        value={bulkValue}
                        onChange={(e) => setBulkValue(e.target.value)}
                        className="rounded-lg border border-cyan-500/30 bg-[#090A0F] px-2.5 py-1 text-xs text-white outline-none"
                      >
                        <option value="">-- Priorität wählen --</option>
                        <option value="low">Niedrig</option>
                        <option value="medium">Mittel</option>
                        <option value="high">Hoch</option>
                        <option value="urgent">Dringend</option>
                      </select>
                    )}

                    {bulkAction === "assign" && (
                      <select
                        value={bulkValue}
                        onChange={(e) => setBulkValue(e.target.value)}
                        className="rounded-lg border border-cyan-500/30 bg-[#090A0F] px-2.5 py-1 text-xs text-white outline-none"
                      >
                        <option value="">-- Agent wählen --</option>
                        <option value="">Nicht zugewiesen</option>
                        {staffList.map((s) => (
                          <option key={s.id} value={s.id}>{s.fullName}</option>
                        ))}
                      </select>
                    )}

                    <button
                      onClick={handleExecuteBulkAction}
                      disabled={bulkUpdating || !bulkValue}
                      className="rounded-lg bg-cyan-400 text-black font-bold px-3 py-1 hover:bg-cyan-300 disabled:opacity-50"
                    >
                      {bulkUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : "Anwenden"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Ticket Table / List Header */}
            <div className="mb-2 flex items-center justify-between px-4 text-[11px] font-mono uppercase tracking-wider text-white/30">
              <div className="flex items-center gap-3">
                <button onClick={toggleSelectAllTickets} className="hover:text-white">
                  {selectedTicketIds.length === filtered.length && filtered.length > 0 ? (
                    <CheckSquare className="h-4 w-4 text-cyan-400" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </button>
                <span>Ticket Details</span>
              </div>
              <span>Zuweisung & Aktionen</span>
            </div>

            {/* Ticket List */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-20 text-center rounded-2xl border border-dashed border-[#27272A] bg-[#090A0F]">
                <MessageSquare className="mx-auto mb-3 h-8 w-8 text-white/10" />
                <p className="text-sm font-mono text-white/40">Keine Support-Tickets gefunden</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((t) => {
                  const cfg = statusConfig[t.status] || statusConfig.OPEN;
                  const priCfg = priorityConfig[(t.priority || "medium").toUpperCase()] || priorityConfig.MEDIUM;
                  const StatusIcon = cfg.icon;
                  const isSelected = selectedTicketIds.includes(t.id);

                  return (
                    <div
                      key={t.id}
                      onClick={() => navigate(`/admin/tickets/${t.id}`)}
                      className={cn(
                        "group relative flex cursor-pointer flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border p-4 text-left transition-all",
                        isSelected
                          ? "border-cyan-400/50 bg-cyan-400/[0.04]"
                          : "border-[#27272A] bg-[#090A0F] hover:border-white/20 hover:bg-white/[0.02]"
                      )}
                    >
                      <div className="flex items-start gap-3.5 min-w-0 flex-1">
                        {/* Checkbox */}
                        <div onClick={(e) => toggleSelectTicket(t.id, e)} className="mt-1">
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-cyan-400 shrink-0" />
                          ) : (
                            <Square className="h-4 w-4 text-white/20 hover:text-white shrink-0" />
                          )}
                        </div>

                        <div className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border font-mono", cfg.color)}>
                          <StatusIcon className="h-4 w-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[11px] font-mono font-bold text-white/40">{t.ticketNumber}</span>
                            <span className={cn("rounded border px-2 py-0.5 text-[10px] font-mono font-semibold", cfg.color)}>
                              {cfg.label}
                            </span>
                            <span className={cn("rounded border px-2 py-0.5 text-[10px] font-mono font-semibold", priCfg.color)}>
                              {priCfg.label}
                            </span>
                            {t.category && (
                              <span className="rounded border border-[#27272A] bg-[#111218] px-2 py-0.5 text-[10px] font-mono text-white/50">
                                {t.category}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-1.5">
                            <p className="truncate text-sm font-semibold text-white/90 group-hover:text-cyan-300 transition-colors">
                              {t.subject}
                            </p>
                          </div>

                          <p className="mt-1 truncate text-xs font-mono text-white/30">
                            Customer: <strong className="text-white/70">{t.name}</strong> ({t.email}) · Erstellt: {new Date(t.createdAt).toLocaleString("de-DE")}
                          </p>
                        </div>
                      </div>

                      {/* Right side: Staff assignment badge & quick actions */}
                      <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                        {/* Assigned Staff Badge */}
                        <div className="text-right font-mono text-xs">
                          {t.assignedStaff ? (
                            <span className="inline-flex items-center gap-1 rounded border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 text-[11px] text-purple-300">
                              <User className="h-3 w-3" /> {t.assignedStaff.fullName}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white/30">
                              Unzugewiesen
                            </span>
                          )}
                        </div>

                        {/* Inline Status Selector */}
                        <div onClick={(e) => e.stopPropagation()}>
                          <select
                            value={t.status}
                            onChange={(e) => handleStatusChange(t.id, e.target.value, e)}
                            className="rounded-lg border border-[#27272A] bg-[#111218] px-2.5 py-1 text-xs font-mono text-white/80 outline-none hover:border-cyan-400 cursor-pointer"
                          >
                            <option value="OPEN">Offen</option>
                            <option value="IN_PROGRESS">In Bearbeitung</option>
                            <option value="WAITING">Wartend</option>
                            <option value="CLOSED">Geschlossen</option>
                          </select>
                        </div>

                        {/* Assign Staff Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAssignTicketTarget(t);
                            setAssignStaffId(t.assignedTo || "");
                          }}
                          title="Ticket zuweisen"
                          className="rounded-lg border border-[#27272A] bg-[#111218] p-1.5 text-white/40 hover:text-cyan-400 hover:border-cyan-400/30 transition-all"
                        >
                          <UserCheck className="h-3.5 w-3.5" />
                        </button>

                        {/* Delete button (Admin) */}
                        {isAdmin && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(t);
                            }}
                            title="Ticket löschen"
                            className="rounded-lg border border-[#27272A] bg-[#111218] p-1.5 text-white/40 hover:text-red-400 hover:border-red-500/30 transition-all"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}

                        <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-cyan-400 transition-colors" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : activeTab === "banners" ? (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider">System-Banner Konfiguration</h2>
                <p className="text-xs text-white/40">Frontend Benachrichtigungsbanner steuern.</p>
              </div>
              <button
                onClick={() => setBannerModalOpen(true)}
                className="flex items-center gap-1.5 rounded-lg bg-cyan-400 text-black px-3.5 py-1.5 text-xs font-semibold hover:bg-cyan-300 transition-all font-mono"
              >
                <Plus className="h-3.5 w-3.5" /> Banner Hinzufügen
              </button>
            </div>

            {bannersLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-cyan-400" /></div>
            ) : banners.length === 0 ? (
              <div className="py-12 text-center rounded-2xl border border-dashed border-[#27272A] text-white/40 text-xs font-mono">
                Keine System-Banner vorhanden.
              </div>
            ) : (
              <div className="space-y-3">
                {banners.map((b) => (
                  <div key={b.id} className="flex items-center justify-between rounded-xl border border-[#27272A] bg-[#090A0F] p-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white font-mono">{b.title}</span>
                        <span className="rounded bg-white/[0.06] px-2 py-0.5 text-[10px] uppercase font-mono text-white/60">{b.type}</span>
                        <span className="rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 px-2 py-0.5 text-[10px] font-mono">
                          Route: {b.targetRoute}
                        </span>
                      </div>
                      <p className="text-xs text-white/70 font-mono">{b.message}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleBannerActive(b)}
                        className={cn(
                          "rounded-lg px-3 py-1 text-xs font-mono transition-all border",
                          b.isActive ? "border-green-500/30 bg-green-500/10 text-green-400" : "border-[#27272A] bg-[#111218] text-white/40"
                        )}
                      >
                        {b.isActive ? "Aktiv" : "Inaktiv"}
                      </button>
                      <button
                        onClick={() => handleDeleteBanner(b.id)}
                        className="rounded-lg border border-[#27272A] bg-[#111218] p-1.5 text-white/40 hover:text-red-400 hover:border-red-500/30"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === "users" ? (
          <div>
            <div className="mb-6">
              <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider">User Audit & Quick-Impersonation</h2>
              <p className="text-xs text-white/40">Nutzer nach E-Mail oder ID suchen, Profil- & Aktivitätsdaten einsehen.</p>
            </div>

            {impersonatingToken && (
              <div className="mb-6 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-xs font-mono text-yellow-300 flex items-center justify-between">
                <div>
                  <strong className="font-semibold block">Impersonation Mode Aktiv</strong>
                  <span className="opacity-90">Session-Token für {selectedAuditUser?.email || selectedAuditUser?.id} generiert.</span>
                </div>
                <button
                  onClick={() => setImpersonatingToken(null)}
                  className="rounded-lg bg-yellow-500/20 px-3 py-1.5 font-semibold text-yellow-200 hover:bg-yellow-500/30"
                >
                  Beenden
                </button>
              </div>
            )}

            <form onSubmit={handleSearchUsers} className="mb-6 flex gap-3 max-w-md">
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Nutzer E-Mail oder ID eingeben..."
                className="flex-1 rounded-xl border border-[#27272A] bg-[#090A0F] px-3.5 py-2 text-xs text-white font-mono outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                disabled={usersLoading}
                className="rounded-xl bg-cyan-400 px-4 py-2 text-xs font-mono font-bold text-black hover:bg-cyan-300"
              >
                {usersLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Suchen"}
              </button>
            </form>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white/40 font-mono mb-2">Ergebnisse ({searchedUsers.length})</h3>
                {searchedUsers.length === 0 ? (
                  <p className="text-xs text-white/30 italic font-mono">Keine Nutzer gefunden.</p>
                ) : (
                  searchedUsers.map((u) => (
                    <div
                      key={u.id}
                      onClick={() => inspectUserAudit(u)}
                      className="flex cursor-pointer items-center justify-between rounded-xl border border-[#27272A] bg-[#090A0F] p-3.5 hover:bg-white/[0.02] transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-white font-mono">{u.email || u.id}</p>
                          <span className="rounded border border-[#27272A] bg-[#111218] px-1.5 py-0.5 text-[9px] uppercase font-mono text-white/60">
                            {u.plan || "free"}
                          </span>
                        </div>
                        <p className="text-[10px] text-white/40 font-mono">ID: {u.id}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-white/30 shrink-0" />
                    </div>
                  ))
                )}
              </div>

              {selectedAuditUser && (
                <div className="rounded-2xl border border-[#27272A] bg-[#090A0F] p-5">
                  <div className="flex items-center justify-between border-b border-[#27272A] pb-3 mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-white font-mono">{selectedAuditUser.email || selectedAuditUser.id}</h3>
                      <span className="text-[10px] font-mono text-white/40">{selectedAuditUser.id}</span>
                    </div>

                    <button
                      onClick={() => startImpersonation(selectedAuditUser)}
                      className="rounded-lg bg-yellow-400 text-black px-3 py-1 text-xs font-bold font-mono hover:bg-yellow-300"
                    >
                      Impersonate Mode
                    </button>
                  </div>

                  {userAuditLoading ? (
                    <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-cyan-400" /></div>
                  ) : userAuditData ? (
                    <div className="space-y-4 text-xs font-mono">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="rounded-xl border border-[#27272A] bg-[#111218] p-2.5 text-center">
                          <span className="text-[10px] text-white/40 uppercase block">Notizen</span>
                          <span className="text-base font-bold text-white">{userAuditData.stats.notes}</span>
                        </div>
                        <div className="rounded-xl border border-[#27272A] bg-[#111218] p-2.5 text-center">
                          <span className="text-[10px] text-white/40 uppercase block">Tasks</span>
                          <span className="text-base font-bold text-white">{userAuditData.stats.tasks}</span>
                        </div>
                        <div className="rounded-xl border border-[#27272A] bg-[#111218] p-2.5 text-center">
                          <span className="text-[10px] text-white/40 uppercase block">Bookmarks</span>
                          <span className="text-base font-bold text-white">{userAuditData.stats.bookmarks}</span>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        ) : activeTab === "settings" ? (
          <div>
            <div className="mb-6">
              <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider">Service Controls & Read-Only Mode</h2>
              <p className="text-xs text-white/40">Systemweiter Wartungsmodus.</p>
            </div>

            <div className="rounded-2xl border border-[#27272A] bg-[#090A0F] p-6 max-w-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white font-mono">Read-Only / Maintenance Mode</h3>
                  <p className="text-xs text-white/50 mt-1 leading-relaxed">
                    Sperrt schreibende Operationen im User-Frontend.
                  </p>
                </div>

                <button
                  onClick={toggleReadOnlyMode}
                  disabled={settingsLoading}
                  className={cn(
                    "rounded-xl px-4 py-2 text-xs font-mono font-bold transition-all border shrink-0",
                    readOnlyMode
                      ? "border-red-500/40 bg-red-500/20 text-red-300 hover:bg-red-500/30"
                      : "border-[#27272A] bg-[#111218] text-white/60 hover:text-white"
                  )}
                >
                  {readOnlyMode ? "Wartungsmodus AKTIV" : "Wartungsmodus Inaktiv"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider">Feature Flags</h2>
                <p className="text-xs text-white/40">Funktionen global schalten oder gezielt testen.</p>
              </div>
              <button
                onClick={() => setFlagModalOpen(true)}
                className="flex items-center gap-1.5 rounded-lg bg-cyan-400 text-black px-3.5 py-1.5 text-xs font-mono font-bold hover:bg-cyan-300"
              >
                <Plus className="h-3.5 w-3.5" /> Feature Flag Erstellen
              </button>
            </div>

            {flagsLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-cyan-400" /></div>
            ) : (
              <div className="space-y-3">
                {featureFlags.map((f) => (
                  <div key={f.id} className="flex items-center justify-between rounded-xl border border-[#27272A] bg-[#090A0F] p-4 font-mono">
                    <div className="space-y-1">
                      <span className="font-bold text-sm text-white">{f.flagKey}</span>
                      {f.description && <p className="text-xs text-white/60">{f.description}</p>}
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleFlagGlobal(f)}
                        className={cn(
                          "rounded-lg px-3 py-1 text-xs font-bold transition-all border",
                          f.isEnabledGlobally ? "border-green-500/30 bg-green-500/10 text-green-400" : "border-[#27272A] bg-[#111218] text-white/40"
                        )}
                      >
                        {f.isEnabledGlobally ? "Aktiv" : "Inaktiv"}
                      </button>
                      <button
                        onClick={() => handleDeleteFlag(f.id)}
                        className="rounded-lg border border-[#27272A] bg-[#111218] p-1.5 text-white/40 hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* CREATE STAFF MODAL */}
      <AnimatePresence>
        {newStaffModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md rounded-2xl border border-[#27272A] bg-[#090A0F] p-6 shadow-2xl font-mono"
            >
              <div className="flex items-center justify-between border-b border-[#27272A] pb-4">
                <h2 className="text-base font-bold text-white">Support Mitarbeiter Hinzufügen</h2>
                <button onClick={() => setNewStaffModalOpen(false)} className="text-white/40 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreateStaff} className="mt-4 space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-white/60">Vollständiger Name *</label>
                  <input
                    type="text"
                    required
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    placeholder="Max Mustermann"
                    className="w-full rounded-xl border border-[#27272A] bg-[#111218] px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-white/60">E-Mail *</label>
                  <input
                    type="email"
                    required
                    value={newStaffEmail}
                    onChange={(e) => setNewStaffEmail(e.target.value)}
                    placeholder="mitarbeiter@clyven.app"
                    className="w-full rounded-xl border border-[#27272A] bg-[#111218] px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-white/60">Rolle</label>
                  <select
                    value={newStaffRole}
                    onChange={(e) => setNewStaffRole(e.target.value as "admin" | "agent")}
                    className="w-full rounded-xl border border-[#27272A] bg-[#111218] px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-400"
                  >
                    <option value="agent">Support Agent</option>
                    <option value="admin">Support Admin</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setNewStaffModalOpen(false)}
                    className="rounded-xl border border-[#27272A] px-4 py-2 text-xs font-medium text-white/60 hover:bg-white/[0.05]"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={newStaffSaving}
                    className="rounded-xl bg-cyan-400 px-5 py-2 text-xs font-bold text-black hover:bg-cyan-300 disabled:opacity-50"
                  >
                    {newStaffSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Hinzufügen"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE TICKET MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-xl rounded-2xl border border-[#27272A] bg-[#090A0F] p-6 shadow-2xl font-mono"
            >
              <div className="flex items-center justify-between border-b border-[#27272A] pb-4">
                <h2 className="text-base font-bold text-white">Neues Support-Ticket Erstellen</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-white/40 hover:text-white">
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
                      className="w-full rounded-xl border border-[#27272A] bg-[#111218] px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-white/60">Kunden-Name</label>
                    <input
                      type="text"
                      value={createName}
                      onChange={(e) => setCreateName(e.target.value)}
                      placeholder="Max Mustermann"
                      className="w-full rounded-xl border border-[#27272A] bg-[#111218] px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-400"
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
                    placeholder="Problem mit Account..."
                    className="w-full rounded-xl border border-[#27272A] bg-[#111218] px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-white/60">Priorität</label>
                    <select
                      value={createPriority}
                      onChange={(e) => setCreatePriority(e.target.value)}
                      className="w-full rounded-xl border border-[#27272A] bg-[#111218] px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-400"
                    >
                      <option value="low">Niedrig</option>
                      <option value="medium">Mittel</option>
                      <option value="high">Hoch</option>
                      <option value="urgent">Dringend</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-white/60">Agent Zuweisen</label>
                    <select
                      value={createAssignedTo}
                      onChange={(e) => setCreateAssignedTo(e.target.value)}
                      className="w-full rounded-xl border border-[#27272A] bg-[#111218] px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-400"
                    >
                      <option value="">Unzugewiesen</option>
                      {staffList.map((s) => (
                        <option key={s.id} value={s.id}>{s.fullName}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-white/60">Nachricht *</label>
                  <textarea
                    required
                    rows={4}
                    value={createMessage}
                    onChange={(e) => setCreateMessage(e.target.value)}
                    placeholder="Beschreibung der Anfrage..."
                    className="w-full resize-none rounded-xl border border-[#27272A] bg-[#111218] px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-xl border border-[#27272A] px-4 py-2 text-xs font-medium text-white/60 hover:bg-white/[0.05]"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-2 text-xs font-bold text-black hover:bg-cyan-300 disabled:opacity-50"
                  >
                    {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Ticket Erstellen"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ASSIGN TICKET STAFF MODAL */}
      <AnimatePresence>
        {assignTicketTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md rounded-2xl border border-cyan-500/20 bg-[#090A0F] p-6 shadow-2xl font-mono"
            >
              <div className="flex items-center gap-2.5 text-cyan-400 mb-3">
                <UserCheck className="h-5 w-5" />
                <h3 className="text-base font-bold text-white">Ticket Agent Zuweisen</h3>
              </div>

              <p className="text-xs text-white/60 mb-4">
                Weisen Sie das Ticket <strong className="text-white">{assignTicketTarget.ticketNumber}</strong> einem Support-Mitarbeiter zu.
              </p>

              <form onSubmit={handleAssignTicketStaff} className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-white/60">Mitarbeiter Wählen</label>
                  <select
                    value={assignStaffId}
                    onChange={(e) => setAssignStaffId(e.target.value)}
                    className="w-full rounded-xl border border-[#27272A] bg-[#111218] px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-400"
                  >
                    <option value="">Unzugewiesen</option>
                    {staffList.map((s) => (
                      <option key={s.id} value={s.id}>{s.fullName} ({s.role})</option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setAssignTicketTarget(null)}
                    className="rounded-xl border border-[#27272A] px-4 py-2 text-xs font-medium text-white/60 hover:bg-white/[0.05]"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={assigning}
                    className="flex items-center gap-1.5 rounded-xl bg-cyan-400 px-4 py-2 text-xs font-bold text-black hover:bg-cyan-300 disabled:opacity-50"
                  >
                    {assigning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Zuweisen"}
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
                Möchten Sie das Ticket <strong className="text-white">{deleteTarget.ticketNumber}</strong> und alle Verläufe dauerhaft löschen?
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
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
