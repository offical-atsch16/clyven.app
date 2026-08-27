import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, FileText, Bookmark, Timer, BookOpen, ChartBar as BarChart2, Trophy, User, Settings, ChevronLeft, ChevronRight, Command, Menu, X, Zap, Crown, CheckSquare, Sparkles, Code2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useUser, useClerk } from "@clerk/react";
import { useAppStore } from "../stores/useAppStore";
import { usePremium } from "../hooks/usePremium";
import { usePlanSync } from "../hooks/usePlanSync";
import { PlanBadge } from "./PlanBadge";
import { SystemBanner } from "./SystemBanner";
import { ClyvenAISidebar } from "./ClyvenAISidebar";
import { cn } from "../lib/utils";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const NAV = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/notes", icon: FileText, label: "Notes" },
  { href: "/tasks", icon: CheckSquare, label: "Tasks" },
  { href: "/bookmarks", icon: Bookmark, label: "Bookmarks" },
  { href: "/focus", icon: Timer, label: "Focus" },
  { href: "/journal", icon: BookOpen, label: "Journal" },
  { href: "/dashboard/dev", icon: Code2, label: "Dev Hub" },
  { href: "/analytics", icon: BarChart2, label: "Analytics" },
  { href: "/achievements", icon: Trophy, label: "Achievements" },
];

const BOTTOM_NAV = [
  { href: "/profile", icon: User, label: "Profile" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

function NavItem({ href, icon: Icon, label, collapsed, mobile, onMobileClose }: any) {
  const [location] = useLocation();
  const active = location === href || (href !== "/dashboard" && location.startsWith(href));

  return (
    <Link href={href} onClick={mobile ? onMobileClose : undefined}>
      <motion.div whileHover={{ x: 2 }} whileTap={{ scale: 0.98 }}
        className={cn(
          "flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-xs min-h-[36px] transition-all duration-200 cursor-pointer border border-transparent",
          collapsed && !mobile ? "justify-center px-2" : "",
          active
            ? "bg-white/10 text-zinc-100 font-semibold border-white/10 shadow-xs backdrop-blur-md"
            : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200 hover:border-white/10",
        )}>
        <Icon className={cn("shrink-0 transition-colors", collapsed && !mobile ? "h-4.5 w-4.5" : "h-4 w-4", active ? "text-sky-400" : "text-zinc-400")} />
        {(!collapsed || mobile) && <span>{label}</span>}
        {active && (!collapsed || mobile) && (
          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8]" />
        )}
      </motion.div>
    </Link>
  );
}

function HeaderBuildWidget() {
  const { isPremium } = usePremium();
  const { data } = useQuery({
    queryKey: ["github-build-status"],
    queryFn: api.getGithubBuildStatus,
    enabled: isPremium,
    refetchInterval: 30000,
  });

  if (!isPremium || !data) return null;

  const isSuccess = data.status === "success";

  return (
    <div className="hidden lg:flex items-center justify-between border-b border-white/10 bg-black/40 backdrop-blur-md px-6 py-1.5 text-xs font-mono select-none">
      <div className="flex items-center gap-2">
        <span className="text-zinc-500 font-semibold">[MAIN:</span>
        <span className={cn("font-bold tracking-wide", isSuccess ? "text-emerald-400" : "text-rose-400")}>
          {isSuccess ? "SUCCESS" : "FAILED"}
        </span>
        <span className="text-zinc-500 font-semibold">]</span>
      </div>
      <div className="flex items-center gap-3 text-[11px] text-zinc-400">
        <span className="flex items-center gap-1.5">
          <span className={cn("h-1.5 w-1.5 rounded-full", isSuccess ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-rose-400 shadow-[0_0_8px_#f87171]")} />
          <span>clyven.pages.dev</span>
        </span>
      </div>
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  usePlanSync();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [aiSidebarOpen, setAiSidebarOpen] = useState(false);
  const { user } = useUser();
  const { signOut } = useClerk();
  const { openCommandPalette } = useAppStore();

  const displayName = user?.fullName || user?.firstName || user?.emailAddresses?.[0]?.emailAddress || "User";
  const avatarUrl = user?.imageUrl;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        openCommandPalette();
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === "A" || e.key === "a")) {
        e.preventDefault();
        setAiSidebarOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="flex h-[100dvh] w-full max-w-full overflow-x-hidden overflow-y-hidden bg-[#090A0F]">
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-md lg:hidden"
            onClick={() => setMobileOpen(false)} />
        )}
      </AnimatePresence>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ duration: 0.2 }}
            className="fixed left-0 top-0 z-50 h-full w-64 border-r border-white/10 bg-black/50 backdrop-blur-xl lg:hidden shadow-2xl">
            <SidebarContent collapsed={false} displayName={displayName} avatarUrl={avatarUrl}
              onToggle={() => setMobileOpen(false)} onCommandOpen={() => { setMobileOpen(false); openCommandPalette(); }}
              onSignOut={() => signOut()} mobile onMobileClose={() => setMobileOpen(false)} />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside className={cn("hidden shrink-0 flex-col border-r border-white/10 bg-black/50 backdrop-blur-xl shadow-2xl transition-all duration-300 lg:flex h-full", collapsed ? "w-16" : "w-56")}>
        <SidebarContent collapsed={collapsed} displayName={displayName} avatarUrl={avatarUrl}
          onToggle={() => setCollapsed(!collapsed)} onCommandOpen={openCommandPalette}
          onToggleAI={() => setAiSidebarOpen((prev) => !prev)}
          onSignOut={() => signOut()} />
      </aside>

      {/* Main content */}
      <main className="flex flex-1 flex-col min-w-0 max-w-full overflow-x-hidden overflow-y-hidden relative">
        <SystemBanner />
        {/* Top Header Widget: Build Status */}
        <HeaderBuildWidget />
        {/* Mobile top bar */}
        <div className="flex items-center justify-between border-b border-white/10 bg-black/50 backdrop-blur-xl px-4 py-2.5 lg:hidden shadow-lg min-h-[52px]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <img src={`${basePath}/logo.svg`} alt="CLYVEN" className="h-5 w-5" />
              <span className="text-sm font-bold tracking-[0.2em] text-zinc-100">CLYVEN</span>
            </div>
          </div>
          <button
            onClick={() => setAiSidebarOpen(true)}
            className="flex items-center justify-center gap-1.5 min-h-[44px] px-3.5 rounded-xl border border-sky-500/30 bg-sky-500/10 text-xs font-semibold text-sky-300 hover:border-sky-500/50 active:scale-95 transition-all backdrop-blur-md cursor-pointer"
          >
            <Sparkles className="h-4 w-4 text-sky-400" /> AI
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">{children}</div>
      </main>

      {/* AI Chatbot Right Sidebar */}
      <ClyvenAISidebar isOpen={aiSidebarOpen} onClose={() => setAiSidebarOpen(false)} />
    </div>
  );
}

function SidebarContent({ collapsed, displayName, avatarUrl, onToggle, onCommandOpen, onToggleAI, onSignOut, mobile, onMobileClose }: any) {
  const { isPremium, planTier, openUpgrade } = usePremium();

  return (
    <div className="flex h-full max-h-full flex-col p-2.5 overflow-hidden">
      {/* Header section (logo + expand/collapse) */}
      <div className="flex-shrink-0 mb-3">
        <div className={cn("flex items-center", collapsed && !mobile ? "justify-center" : "justify-between", "px-1 pt-0.5")}>
          {(!collapsed || mobile) && (
            <div className="flex items-center gap-2">
              <img src={`${basePath}/logo.svg`} alt="CLYVEN" className="h-5 w-5" />
              <span className="text-xs font-bold tracking-[0.25em] text-white">CLYVEN</span>
            </div>
          )}
          {collapsed && !mobile && (
            <img src={`${basePath}/logo.svg`} alt="CLYVEN" className="h-5 w-5" />
          )}
          <button
            onClick={onToggle}
            className={cn("flex items-center justify-center min-w-[32px] min-h-[32px] rounded-lg text-white/40 hover:bg-white/[0.05] hover:text-white/80 transition-colors cursor-pointer", mobile && "ml-auto")}
            aria-label={mobile ? "Close menu" : "Toggle sidebar"}
          >
            {mobile ? <X className="h-4 w-4" /> : collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* Premium badge OR upgrade prompt */}
        {(!collapsed || mobile) && (
          isPremium ? (
            <div className="mt-2.5">
              <PlanBadge tier={planTier} size="md" />
            </div>
          ) : (
            <button onClick={openUpgrade}
              className="mt-2.5 w-full flex items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.02] px-2.5 py-1.5 hover:border-yellow-400/20 hover:bg-yellow-400/[0.05] transition-all group cursor-pointer">
              <Zap className="h-3.5 w-3.5 text-white/25 group-hover:text-yellow-400/60 shrink-0 transition-colors" />
              <span className="text-xs text-white/30 group-hover:text-yellow-400/60 transition-colors">Upgrade to PLUS</span>
            </button>
          )
        )}
        {collapsed && !mobile && (
          isPremium ? (
            <div className="mt-2.5 flex justify-center">
              <PlanBadge tier={planTier} size="sm" />
            </div>
          ) : (
            <button onClick={openUpgrade} className="mt-2.5 flex justify-center rounded-lg p-1.5 hover:bg-yellow-400/[0.05] transition-colors group cursor-pointer">
              <Zap className="h-4 w-4 text-white/25 group-hover:text-yellow-400/60 transition-colors" />
            </button>
          )
        )}
      </div>

      {/* Scrollable Nav Area */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-0.5 space-y-3">
        {/* Search & AI Chat Buttons */}
        {(!collapsed || mobile) ? (
          <div className="space-y-1.5">
            <button onClick={onCommandOpen}
              className="w-full flex items-center gap-2 rounded-xl glass-input px-2.5 py-1.5 text-xs text-zinc-400 hover:border-white/20 hover:text-zinc-200 active:scale-95 transition-all cursor-pointer">
              <Command className="h-3.5 w-3.5 text-zinc-400" />
              <span className="flex-1 text-left">Search...</span>
              <span className="text-[10px] tracking-widest text-zinc-500 font-mono">⌘K</span>
            </button>

            <button onClick={onToggleAI}
              className="w-full flex items-center gap-2 rounded-xl border border-sky-500/30 bg-sky-500/10 backdrop-blur-md px-2.5 py-1.5 text-xs font-semibold text-sky-300 hover:bg-sky-500/20 hover:border-sky-500/50 active:scale-95 transition-all cursor-pointer shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-sky-400" />
              <span className="flex-1 text-left">CLYVEN AI</span>
              <span className="text-[9px] text-sky-300/70 font-mono">⌘⇧A</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <button onClick={onCommandOpen} title="Search (⌘K)" className="flex justify-center rounded-xl p-1.5 text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-100 active:scale-95 cursor-pointer transition-all">
              <Command className="h-4 w-4" />
            </button>
            <button onClick={onToggleAI} title="CLYVEN AI (⌘⇧A)" className="flex justify-center rounded-xl p-1.5 text-indigo-400 hover:bg-indigo-500/15 active:scale-95 cursor-pointer transition-all">
              <Sparkles className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Navigation list */}
        <nav className="flex flex-col gap-0.5">
          {NAV.map((item) => (
            <NavItem key={item.href} {...item} collapsed={collapsed} mobile={mobile} onMobileClose={onMobileClose} />
          ))}
        </nav>
      </div>

      {/* Pinned Bottom Footer Section */}
      <div className="flex-shrink-0 pt-2 mt-2 border-t border-white/10 flex flex-col gap-0.5">
        {BOTTOM_NAV.map((item) => (
          <NavItem key={item.href} {...item} collapsed={collapsed} mobile={mobile} onMobileClose={onMobileClose} />
        ))}
        {/* User profile / Sign Out */}
        <div className={cn("mt-1 flex items-center gap-2 rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-white/[0.04] transition-colors", collapsed && !mobile && "justify-center px-1")}
          onClick={onSignOut} title="Sign Out">
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="h-6 w-6 rounded-full object-cover shrink-0" />
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-white shrink-0">
              {displayName[0]?.toUpperCase()}
            </div>
          )}
          {(!collapsed || mobile) && (
            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="flex items-center gap-1">
                <span className="truncate text-xs font-medium text-white/70">{displayName}</span>
                {isPremium && <Crown className="h-2.5 w-2.5 text-yellow-400 shrink-0" />}
              </div>
              <span className="text-[10px] text-white/25">Sign Out</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
