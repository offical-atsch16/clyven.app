import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, FileText, Bookmark, Timer, BookOpen, ChartBar as BarChart2, Trophy, User, Settings, ChevronLeft, ChevronRight, Command, Menu, X, Zap, Crown, Terminal, CheckSquare, Sparkles } from "lucide-react";
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
  { href: "/analytics", icon: BarChart2, label: "Analytics" },
  { href: "/achievements", icon: Trophy, label: "Achievements" },
];

const BOTTOM_NAV = [
  { href: "/profile", icon: User, label: "Profile" },
  { href: "/settings", icon: Settings, label: "Settings" },
  { href: "/documentation", icon: Terminal, label: "Docs" },
];

function NavItem({ href, icon: Icon, label, collapsed, mobile, onMobileClose }: any) {
  const [location] = useLocation();
  const active = location === href || (href !== "/dashboard" && location.startsWith(href));

  return (
    <Link href={href} onClick={mobile ? onMobileClose : undefined}>
      <motion.div whileHover={{ x: 2 }}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all cursor-pointer",
          collapsed && !mobile ? "justify-center px-2" : "",
          active
            ? "bg-white/[0.08] text-white font-medium"
            : "text-white/40 hover:bg-white/[0.04] hover:text-white/70",
        )}>
        <Icon className={cn("shrink-0", collapsed && !mobile ? "h-5 w-5" : "h-4 w-4")} />
        {(!collapsed || mobile) && <span>{label}</span>}
      </motion.div>
    </Link>
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
    <div className="flex h-[100dvh] overflow-hidden bg-[#090A0F]">
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
            className="fixed left-0 top-0 z-50 h-full w-64 border-r border-white/10 bg-[#12141D]/90 backdrop-blur-md lg:hidden shadow-2xl">
            <SidebarContent collapsed={false} displayName={displayName} avatarUrl={avatarUrl}
              onToggle={() => setMobileOpen(false)} onCommandOpen={() => { setMobileOpen(false); openCommandPalette(); }}
              onSignOut={() => signOut()} mobile onMobileClose={() => setMobileOpen(false)} />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop sidebar - Liquid Glass Floating Panel */}
      <aside className={cn("hidden shrink-0 flex-col border-r border-white/10 bg-[#12141D]/50 backdrop-blur-md transition-all duration-300 lg:flex", collapsed ? "w-16" : "w-56")}>
        <SidebarContent collapsed={collapsed} displayName={displayName} avatarUrl={avatarUrl}
          onToggle={() => setCollapsed(!collapsed)} onCommandOpen={openCommandPalette}
          onToggleAI={() => setAiSidebarOpen((prev) => !prev)}
          onSignOut={() => signOut()} />
      </aside>

      {/* Main content */}
      <main className="flex flex-1 flex-col overflow-hidden relative">
        <SystemBanner />
        {/* Mobile top bar */}
        <div className="flex items-center justify-between border-b border-white/10 bg-[#12141D]/60 backdrop-blur-md px-4 py-3 lg:hidden">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="text-white/50 hover:text-white">
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <img src={`${basePath}/logo.svg`} alt="CLYVEN" className="h-5 w-5" />
              <span className="text-sm font-bold tracking-[0.2em] text-white">CLYVEN</span>
            </div>
          </div>
          <button
            onClick={() => setAiSidebarOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-xs text-cyan-300 hover:bg-cyan-500/20 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" /> AI
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
    <div className="flex h-full flex-col p-3">
      {/* Logo */}
      <div className={cn("mb-6 flex items-center", collapsed && !mobile ? "justify-center" : "justify-between", "px-1 pt-1")}>
        {(!collapsed || mobile) && (
          <div className="flex items-center gap-2.5">
            <img src={`${basePath}/logo.svg`} alt="CLYVEN" className="h-6 w-6" />
            <span className="text-sm font-bold tracking-[0.25em] text-white">CLYVEN</span>
          </div>
        )}
        {collapsed && !mobile && (
          <img src={`${basePath}/logo.svg`} alt="CLYVEN" className="h-6 w-6" />
        )}
        <button
          onClick={onToggle}
          className={cn("rounded-md p-1 text-white/30 hover:bg-white/[0.05] hover:text-white/70 transition-colors", mobile && "ml-auto")}
        >
          {mobile ? <X className="h-4 w-4" /> : collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Premium badge OR upgrade prompt */}
      {(!collapsed || mobile) && (
        isPremium ? (
          <div className="mb-4">
            <PlanBadge tier={planTier} size="md" />
          </div>
        ) : (
          <button onClick={openUpgrade}
            className="mb-4 flex items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.02] px-3 py-2 hover:border-yellow-400/20 hover:bg-yellow-400/[0.05] transition-all group cursor-pointer">
            <Zap className="h-3.5 w-3.5 text-white/25 group-hover:text-yellow-400/60 shrink-0 transition-colors" />
            <span className="text-xs text-white/30 group-hover:text-yellow-400/60 transition-colors">Upgrade to PLUS</span>
          </button>
        )
      )}
      {collapsed && !mobile && (
        isPremium ? (
          <div className="mb-4 flex justify-center">
            <PlanBadge tier={planTier} size="sm" />
          </div>
        ) : (
          <button onClick={openUpgrade} className="mb-4 flex justify-center rounded-lg p-2 hover:bg-yellow-400/[0.05] transition-colors group cursor-pointer">
            <Zap className="h-4 w-4 text-white/25 group-hover:text-yellow-400/60 transition-colors" />
          </button>
        )
      )}

      {/* Search & AI Chat Buttons */}
      {(!collapsed || mobile) && (
        <div className="mb-4 space-y-1.5">
          <button onClick={onCommandOpen}
            className="w-full flex items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-sm text-white/30 hover:border-white/10 hover:text-white/50 transition-all cursor-pointer">
            <Command className="h-3.5 w-3.5" />
            <span className="flex-1 text-left text-xs">Search...</span>
            <span className="text-[10px] tracking-widest text-white/20">⌘K</span>
          </button>

          <button onClick={onToggleAI}
            className="w-full flex items-center gap-2 rounded-lg border border-indigo-500/25 bg-indigo-500/10 px-3 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition-all cursor-pointer">
            <Sparkles className="h-3.5 w-3.5 text-sky-400" />
            <span className="flex-1 text-left">CLYVEN AI</span>
            <span className="text-[9px] text-indigo-300/60 font-mono">⌘⇧A</span>
          </button>
        </div>
      )}
      {collapsed && !mobile && (
        <div className="mb-4 flex flex-col items-center gap-1">
          <button onClick={onCommandOpen} title="Search (⌘K)" className="flex justify-center rounded-lg p-2 text-white/30 hover:bg-white/[0.04] hover:text-white/70 cursor-pointer">
            <Command className="h-4 w-4" />
          </button>
          <button onClick={onToggleAI} title="CLYVEN AI (⌘⇧A)" className="flex justify-center rounded-lg p-2 text-indigo-400 hover:bg-indigo-500/10 cursor-pointer">
            <Sparkles className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5">
        {NAV.map((item) => (
          <NavItem key={item.href} {...item} collapsed={collapsed} mobile={mobile} onMobileClose={onMobileClose} />
        ))}
      </nav>

      {/* Bottom */}
      <div className="mt-4 flex flex-col gap-0.5 border-t border-white/[0.06] pt-4">
        {BOTTOM_NAV.map((item) => (
          <NavItem key={item.href} {...item} collapsed={collapsed} mobile={mobile} onMobileClose={onMobileClose} />
        ))}
        {/* User info */}
        <div className={cn("mt-2 flex items-center gap-2.5 rounded-lg px-3 py-2.5 cursor-pointer hover:bg-white/[0.04] transition-colors", collapsed && !mobile && "justify-center px-2")}
          onClick={onSignOut} title="Sign Out">
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="h-6 w-6 rounded-full object-cover" />
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-white">
              {displayName[0]?.toUpperCase()}
            </div>
          )}
          {(!collapsed || mobile) && (
            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="flex items-center gap-1.5">
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
