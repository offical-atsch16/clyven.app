import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { cn } from "../lib/utils";
import { Lock } from "lucide-react";

const BADGES = [
  { id: "first_steps", emoji: "🥇", name: "First Steps", desc: "Created your first note", rarity: "Common", check: (s: any) => s.notesCount >= 1, goal: 1, getProgress: (s: any) => s.notesCount },
  { id: "brain_collector", emoji: "🧠", name: "Brain Collector", desc: "Created 50 notes", rarity: "Rare", check: (s: any) => s.notesCount >= 50, goal: 50, getProgress: (s: any) => s.notesCount },
  { id: "knowledge_hunter", emoji: "📚", name: "Knowledge Hunter", desc: "Saved 100 bookmarks", rarity: "Rare", check: (s: any) => s.bookmarksCount >= 100, goal: 100, getProgress: (s: any) => s.bookmarksCount },
  { id: "deep_worker", emoji: "⚡", name: "Deep Worker", desc: "10 hours of focus time", rarity: "Epic", check: (s: any) => s.totalFocusMinutes >= 600, goal: 600, getProgress: (s: any) => s.totalFocusMinutes },
  { id: "night_owl", emoji: "🌙", name: "Night Owl", desc: "Focused past midnight", rarity: "Rare", check: (_: any) => false, goal: 1, getProgress: () => 0 },
  { id: "on_fire", emoji: "🔥", name: "On Fire", desc: "7-day streak", rarity: "Epic", check: (_: any) => false, goal: 7, getProgress: () => 0 },
  { id: "productivity_machine", emoji: "🚀", name: "Productivity Machine", desc: "30-day streak", rarity: "Legendary", check: (_: any) => false, goal: 30, getProgress: () => 0 },
  { id: "the_answer", emoji: "🌌", name: "The Answer", desc: "42 focus sessions completed — reality unlocked", rarity: "Legendary", check: (s: any) => s.totalFocusSessions >= 42, goal: 42, getProgress: (s: any) => s.totalFocusSessions },
  { id: "developer_soul", emoji: "💾", name: "Developer Soul", desc: "Created a note titled 'hello world'", rarity: "Epic", check: (_: any) => false, goal: 1, getProgress: () => 0 },
  { id: "clyven_master", emoji: "👑", name: "Clyven Master", desc: "All main badges unlocked", rarity: "Legendary", check: (_: any) => false, goal: 6, getProgress: () => 0 },
];

const RARITY_STYLES: Record<string, string> = {
  Common: "border-white/10 bg-white/[0.03]",
  Rare: "border-blue-500/20 bg-blue-950/20",
  Epic: "border-purple-500/20 bg-purple-950/20",
  Legendary: "border-yellow-500/20 bg-yellow-950/10",
};

const RARITY_LABEL: Record<string, string> = {
  Common: "text-white/30",
  Rare: "text-blue-400/50",
  Epic: "text-purple-400/60",
  Legendary: "text-yellow-400/60",
};

export function Achievements() {
  const { data: stats } = useQuery({ queryKey: ["stats"], queryFn: api.getStats, retry: 1 });
  const unlockedIds: string[] = stats?.achievements ?? [];

  const unlocked = BADGES.filter((b) => unlockedIds.includes(b.id) || (stats && b.check(stats)));
  const locked = BADGES.filter((b) => !unlockedIds.includes(b.id) && !(stats && b.check(stats)));

  return (
    <div className="min-h-full p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Achievements</h1>
          <p className="mt-1 text-sm text-white/40">{unlocked.length} of {BADGES.length} badges unlocked</p>
        </div>

        {/* Progress bar */}
        <div className="mb-8 rounded-2xl border border-white/[0.07] bg-[#111111] p-5">
          <div className="mb-2 flex justify-between text-xs text-white/30">
            <span>Overall progress</span>
            <span>{unlocked.length}/{BADGES.length}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <motion.div initial={{ width: 0 }} animate={{ width: `${(unlocked.length / BADGES.length) * 100}%` }}
              transition={{ duration: 1, ease: "easeOut" }} className="h-full rounded-full bg-white/50" />
          </div>
        </div>

        {/* Unlocked */}
        {unlocked.length > 0 && (
          <div className="mb-8">
            <p className="mb-4 text-xs font-medium uppercase tracking-widest text-white/30">Unlocked</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {unlocked.map((b, i) => (
                <motion.div key={b.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }} whileHover={{ y: -2 }}
                  className={cn("rounded-2xl border p-5 transition-all", RARITY_STYLES[b.rarity])}>
                  <div className="mb-3 text-3xl">{b.emoji}</div>
                  <p className="font-semibold text-white">{b.name}</p>
                  <p className="mt-1 text-xs text-white/40 leading-relaxed">{b.desc}</p>
                  <p className={cn("mt-3 text-[10px] font-medium uppercase tracking-widest", RARITY_LABEL[b.rarity])}>
                    {b.rarity}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Locked */}
        <div>
          <p className="mb-4 text-xs font-medium uppercase tracking-widest text-white/30">Locked</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {locked.map((b, i) => {
              const progress = stats ? Math.min(b.getProgress(stats) / b.goal, 1) : 0;
              return (
                <motion.div key={b.id} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.04 }}
                  className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                  <div className="mb-3 flex items-center gap-3">
                    <span className="text-3xl opacity-30">{b.emoji}</span>
                    <Lock className="h-4 w-4 text-white/15" />
                  </div>
                  <p className="font-semibold text-white/40">{b.name}</p>
                  <p className="mt-1 text-xs text-white/25 leading-relaxed">{b.desc}</p>
                  <p className={cn("mt-3 text-[10px] font-medium uppercase tracking-widest", RARITY_LABEL[b.rarity])}>
                    {b.rarity}
                  </p>
                  {progress > 0 && (
                    <div className="mt-3">
                      <div className="h-1 overflow-hidden rounded-full bg-white/[0.06]">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${progress * 100}%` }}
                          transition={{ duration: 1 }} className="h-full rounded-full bg-white/25" />
                      </div>
                      <p className="mt-1 text-[10px] text-white/20">{Math.round(progress * 100)}%</p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
