import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@clerk/react";
import { useLocation } from "wouter";
import {
  Timer, FileText, Bookmark, BookOpen, Zap, Target,
  ArrowRight, TrendingUp, Plus, Flame, Globe,
} from "lucide-react";
import { api } from "../lib/api";
import { cn, formatMinutes, getDailyQuote, getTodayISO } from "../lib/utils";

const fade = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };
const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

function StatCard({ icon: Icon, label, value, sub, onClick }: any) {
  return (
    <motion.div variants={fade} whileHover={{ y: -2 }} onClick={onClick}
      className={cn("group relative overflow-hidden rounded-2xl border border-white/10 bg-[#12141D]/50 p-5 backdrop-blur-md transition-all duration-300 hover:border-cyan-500/30 hover:bg-white/[0.03]", onClick && "cursor-pointer")}>
      <div className="mb-4 flex items-start justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] border border-white/10 text-cyan-400 group-hover:border-cyan-500/30 transition-colors">
          <Icon className="h-4 w-4" />
        </div>
        {onClick && <ArrowRight className="h-4 w-4 text-white/20 group-hover:text-cyan-400 transition-colors" />}
      </div>
      <div className="text-2xl font-bold text-white font-mono tracking-tight">{value}</div>
      <div className="mt-0.5 text-xs font-medium text-white/50">{label}</div>
      {sub && <div className="mt-2 text-[11px] font-mono text-cyan-400/70">{sub}</div>}
    </motion.div>
  );
}

function QuickAction({ icon: Icon, label, onClick }: any) {
  return (
    <motion.button variants={fade} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className="flex items-center gap-3 rounded-2xl glass-panel px-4 py-3 text-sm font-medium text-zinc-300 hover:text-zinc-100 cursor-pointer transition-all">
      <Icon className="h-4 w-4 text-zinc-400" />
      {label}
    </motion.button>
  );
}

export function Dashboard() {
  const { user } = useUser();
  const [, navigate] = useLocation();
  const { data: stats, isLoading: statsLoading } = useQuery({ queryKey: ["stats"], queryFn: api.getStats, retry: 1 });
  const { data: notes } = useQuery({ queryKey: ["notes"], queryFn: api.getNotes, retry: 1 });
  const { data: bookmarks } = useQuery({ queryKey: ["bookmarks"], queryFn: api.getBookmarks, retry: 1 });
  const { data: focus } = useQuery({ queryKey: ["focus"], queryFn: api.getFocus, retry: 1 });
  const { data: journalEntry } = useQuery({ queryKey: ["journal", getTodayISO()], queryFn: () => api.getJournalEntry(getTodayISO()), retry: 1 });

  const displayName = user?.firstName || user?.username || "User";
  const todayFocus = focus?.todayMinutes ?? 0;
  const goalMinutes = 120;
  const progress = Math.min((todayFocus / goalMinutes) * 100, 100);
  const recentNotes = (notes || []).slice(0, 3);
  const recentBookmarks = (bookmarks || []).slice(0, 3);

  return (
    <div className="min-h-full p-4 sm:p-6 lg:p-8">
      <motion.div variants={container} initial="hidden" animate="show" className="mx-auto max-w-5xl space-y-8">

        {/* Header */}
        <motion.div variants={fade}>
          <p className="text-xs text-zinc-400 uppercase tracking-widest mb-1 font-medium">{new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" })}</p>
          <h1 className="text-2xl font-bold text-zinc-100">Welcome back, {displayName} 👋</h1>
        </motion.div>

        {/* Daily Quote */}
        <motion.div variants={fade}
          className="glass-panel rounded-2xl p-5">
          <p className="text-xs uppercase tracking-widest text-zinc-400 font-semibold mb-2">Daily Inspiration</p>
          <p className="text-sm text-zinc-200 italic leading-relaxed">"{getDailyQuote()}"</p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={container} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard icon={Timer} label="Focus today" value={formatMinutes(todayFocus)}
            sub={`Goal: ${formatMinutes(goalMinutes)}`} onClick={() => navigate("/focus")} />
          <StatCard icon={FileText} label="Notes" value={stats?.notesCount ?? "—"}
            sub="Total created" onClick={() => navigate("/notes")} />
          <StatCard icon={Bookmark} label="Bookmarks" value={stats?.bookmarksCount ?? "—"}
            sub="Saved" onClick={() => navigate("/bookmarks")} />
          <StatCard icon={BookOpen} label="Journal" value={journalEntry ? "✓" : "—"}
            sub={journalEntry ? "Written today" : "Still open"} onClick={() => navigate("/journal")} />
        </motion.div>

        {/* Focus Progress */}
        <motion.div variants={fade}
          className="glass-panel rounded-2xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-zinc-400" />
              <span className="text-sm font-semibold text-zinc-200">Daily Focus Goal</span>
            </div>
            <span className="text-xs font-mono text-zinc-400">{formatMinutes(todayFocus)} / {formatMinutes(goalMinutes)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/[0.06] border border-white/[0.04]">
            <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-zinc-200 to-white shadow-sm" />
          </div>
          <p className="mt-2 text-xs text-zinc-400 font-medium">{progress.toFixed(0)}% reached</p>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={fade}>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-400">Quick Actions</p>
          <motion.div variants={container} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <QuickAction icon={Plus} label="New Note" onClick={() => navigate("/notes?new=1")} />
            <QuickAction icon={Timer} label="Start Focus" onClick={() => navigate("/focus?start=1")} />
            <QuickAction icon={BookOpen} label="Open Journal" onClick={() => navigate("/journal")} />
            <QuickAction icon={Bookmark} label="Save Bookmark" onClick={() => navigate("/bookmarks?new=1")} />
          </motion.div>
        </motion.div>

        {/* Recent Notes + Bookmarks */}
        <div className="grid gap-4 lg:grid-cols-2">
          <motion.div variants={fade} className="glass-panel rounded-2xl p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-zinc-400" />
                <span className="text-sm font-semibold text-zinc-200">Recent Notes</span>
              </div>
              <button onClick={() => navigate("/notes")} className="text-xs font-medium text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer">All →</button>
            </div>
            {recentNotes.length === 0 ? (
              <div className="py-6 text-center text-sm text-zinc-500">No notes yet</div>
            ) : (
              <div className="space-y-2">
                {recentNotes.map((n: any) => (
                  <div key={n.id} onClick={() => navigate("/notes")}
                    className="cursor-pointer rounded-xl p-3 hover:bg-white/[0.06] hover:border hover:border-white/10 transition-all border border-transparent">
                    <p className="truncate text-sm font-semibold text-zinc-200">{n.title}</p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-zinc-400">{n.content || "No content"}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div variants={fade} className="glass-panel rounded-2xl p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bookmark className="h-4 w-4 text-zinc-400" />
                <span className="text-sm font-semibold text-zinc-200">Recent Bookmarks</span>
              </div>
              <button onClick={() => navigate("/bookmarks")} className="text-xs font-medium text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer">All →</button>
            </div>
            {recentBookmarks.length === 0 ? (
              <div className="py-6 text-center text-sm text-zinc-500">No bookmarks yet</div>
            ) : (
              <div className="space-y-2">
                {recentBookmarks.map((b: any) => (
                  <a key={b.id} href={b.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl p-3 hover:bg-white/[0.06] hover:border hover:border-white/10 transition-all border border-transparent">
                    <Globe className="h-4 w-4 shrink-0 text-zinc-400" />
                    <div className="overflow-hidden">
                      <p className="truncate text-sm font-semibold text-zinc-200">{b.title || b.url}</p>
                      <p className="truncate text-xs text-zinc-400">{b.siteName || new URL(b.url).hostname}</p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Streak + Total Focus */}
        <motion.div variants={container} className="grid grid-cols-2 gap-4">
          <motion.div variants={fade} className="glass-panel rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-medium text-zinc-400">Focus Sessions</span>
            </div>
            <div className="text-3xl font-bold text-zinc-100">{stats?.totalFocusSessions ?? 0}</div>
            <p className="text-xs text-zinc-400 mt-1">Completed</p>
          </motion.div>
          <motion.div variants={fade} className="glass-panel rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-medium text-zinc-400">Total Focus Time</span>
            </div>
            <div className="text-3xl font-bold text-zinc-100">{formatMinutes(stats?.totalFocusMinutes ?? 0)}</div>
            <p className="text-xs text-zinc-400 mt-1">Across all sessions</p>
          </motion.div>
        </motion.div>

      </motion.div>
    </div>
  );
}
