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

function StatCard({ icon: Icon, label, value, sub, color, onClick }: any) {
  return (
    <motion.div variants={fade} whileHover={{ y: -2 }} onClick={onClick}
      className={cn("group relative cursor-pointer overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111111] p-5 transition-all hover:border-white/10", onClick && "cursor-pointer")}>
      <div className="mb-4 flex items-start justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.05] group-hover:bg-white/[0.08] transition-colors">
          <Icon className="h-4 w-4 text-white/60" />
        </div>
        {onClick && <ArrowRight className="h-4 w-4 text-white/20 group-hover:text-white/50 transition-colors" />}
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="mt-0.5 text-sm text-white/40">{label}</div>
      {sub && <div className="mt-2 text-xs text-white/25">{sub}</div>}
    </motion.div>
  );
}

function QuickAction({ icon: Icon, label, onClick }: any) {
  return (
    <motion.button variants={fade} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-[#111111] px-4 py-3 text-sm text-white/60 hover:border-white/10 hover:bg-white/[0.06] hover:text-white transition-all">
      <Icon className="h-4 w-4" />
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
          <p className="text-xs text-white/25 uppercase tracking-widest mb-1">{new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" })}</p>
          <h1 className="text-2xl font-bold text-white">Welcome back, {displayName} 👋</h1>
        </motion.div>

        {/* Daily Quote */}
        <motion.div variants={fade}
          className="rounded-2xl border border-white/[0.06] bg-gradient-to-r from-white/[0.03] to-white/[0.01] p-5">
          <p className="text-xs uppercase tracking-widest text-white/25 mb-2">Daily Inspiration</p>
          <p className="text-sm text-white/70 italic leading-relaxed">"{getDailyQuote()}"</p>
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
          className="rounded-2xl border border-white/[0.07] bg-[#111111] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-white/40" />
              <span className="text-sm font-medium text-white/70">Daily Focus Goal</span>
            </div>
            <span className="text-xs text-white/30">{formatMinutes(todayFocus)} / {formatMinutes(goalMinutes)}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1, ease: "easeOut" }}
              className="h-full rounded-full bg-white/60" />
          </div>
          <p className="mt-2 text-xs text-white/25">{progress.toFixed(0)}% reached</p>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={fade}>
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-white/25">Quick Actions</p>
          <motion.div variants={container} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <QuickAction icon={Plus} label="New Note" onClick={() => navigate("/notes?new=1")} />
            <QuickAction icon={Timer} label="Start Focus" onClick={() => navigate("/focus?start=1")} />
            <QuickAction icon={BookOpen} label="Open Journal" onClick={() => navigate("/journal")} />
            <QuickAction icon={Bookmark} label="Save Bookmark" onClick={() => navigate("/bookmarks?new=1")} />
          </motion.div>
        </motion.div>

        {/* Recent Notes + Bookmarks */}
        <div className="grid gap-4 lg:grid-cols-2">
          <motion.div variants={fade} className="rounded-2xl border border-white/[0.07] bg-[#111111] p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-white/40" />
                <span className="text-sm font-medium text-white/70">Recent Notes</span>
              </div>
              <button onClick={() => navigate("/notes")} className="text-xs text-white/30 hover:text-white/60 transition-colors">All →</button>
            </div>
            {recentNotes.length === 0 ? (
              <div className="py-6 text-center text-sm text-white/20">No notes yet</div>
            ) : (
              <div className="space-y-2">
                {recentNotes.map((n: any) => (
                  <div key={n.id} onClick={() => navigate("/notes")}
                    className="cursor-pointer rounded-lg px-3 py-2.5 hover:bg-white/[0.04] transition-colors">
                    <p className="truncate text-sm font-medium text-white/70">{n.title}</p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-white/30">{n.content || "No content"}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div variants={fade} className="rounded-2xl border border-white/[0.07] bg-[#111111] p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bookmark className="h-4 w-4 text-white/40" />
                <span className="text-sm font-medium text-white/70">Recent Bookmarks</span>
              </div>
              <button onClick={() => navigate("/bookmarks")} className="text-xs text-white/30 hover:text-white/60 transition-colors">All →</button>
            </div>
            {recentBookmarks.length === 0 ? (
              <div className="py-6 text-center text-sm text-white/20">No bookmarks yet</div>
            ) : (
              <div className="space-y-2">
                {recentBookmarks.map((b: any) => (
                  <a key={b.id} href={b.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-white/[0.04] transition-colors">
                    <Globe className="h-4 w-4 shrink-0 text-white/30" />
                    <div className="overflow-hidden">
                      <p className="truncate text-sm font-medium text-white/70">{b.title || b.url}</p>
                      <p className="truncate text-xs text-white/30">{b.siteName || new URL(b.url).hostname}</p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Streak + Total Focus */}
        <motion.div variants={container} className="grid grid-cols-2 gap-3">
          <motion.div variants={fade} className="rounded-2xl border border-white/[0.07] bg-[#111111] p-5">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="h-4 w-4 text-orange-400/60" />
              <span className="text-sm text-white/50">Focus Sessions</span>
            </div>
            <div className="text-3xl font-bold text-white">{stats?.totalFocusSessions ?? 0}</div>
            <p className="text-xs text-white/25 mt-1">Completed</p>
          </motion.div>
          <motion.div variants={fade} className="rounded-2xl border border-white/[0.07] bg-[#111111] p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-white/40" />
              <span className="text-sm text-white/50">Total Focus Time</span>
            </div>
            <div className="text-3xl font-bold text-white">{formatMinutes(stats?.totalFocusMinutes ?? 0)}</div>
            <p className="text-xs text-white/25 mt-1">Across all sessions</p>
          </motion.div>
        </motion.div>

      </motion.div>
    </div>
  );
}
