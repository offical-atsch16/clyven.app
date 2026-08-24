import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BookOpen, ChevronLeft, ChevronRight, Save, Calendar, Sparkles, CreditCard as Edit3, Crown } from "lucide-react";
import { api } from "../lib/api";
import { cn, getTodayISO } from "../lib/utils";
import { usePremium } from "../hooks/usePremium";
import { UpgradeModal } from "../components/UpgradeModal";

const MOODS = [
  { key: "amazing", emoji: "🔥", label: "Amazing" },
  { key: "happy", emoji: "😀", label: "Good" },
  { key: "calm", emoji: "😌", label: "Calm" },
  { key: "neutral", emoji: "😐", label: "Neutral" },
  { key: "sad", emoji: "😔", label: "Down" },
  { key: "tired", emoji: "😴", label: "Tired" },
];

const SECTIONS = [
  { key: "wentWell", label: "What went well today?", placeholder: "Something you achieved or enjoyed..." },
  { key: "learned", label: "What did I learn?", placeholder: "An insight or new skill..." },
  { key: "grateful", label: "What am I grateful for?", placeholder: "Three things you appreciate..." },
  { key: "tomorrowGoals", label: "Goals for tomorrow", placeholder: "What do you want to achieve tomorrow..." },
  { key: "freeText", label: "Free space", placeholder: "Thoughts, feelings, notes..." },
];

function addDays(dateStr: string, days: number) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function formatDisplayDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  const today = getTodayISO();
  if (dateStr === today) return "Today";
  if (dateStr === addDays(today, -1)) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" });
}

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: (string | null)[] = [];
  const startPad = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  for (let i = 0; i < startPad; i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    days.push(dateStr);
  }
  return days;
}

export function Journal() {
  const qc = useQueryClient();
  const { isPremium } = usePremium();
  const [date, setDate] = useState(getTodayISO());
  const [view, setView] = useState<"entry" | "calendar">("entry");
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const { data: entry, isLoading } = useQuery({ queryKey: ["journal", date], queryFn: () => api.getJournalEntry(date), retry: 1 });
  const { data: allEntries = [] } = useQuery({ queryKey: ["journal"], queryFn: api.getJournal, retry: 1 });
  const saveEntry = useMutation({ mutationFn: api.saveJournalEntry, onSuccess: () => qc.invalidateQueries({ queryKey: ["journal"] }) });

  const [form, setForm] = useState({ mood: "", wentWell: "", learned: "", grateful: "", tomorrowGoals: "", freeText: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Build a map of date -> entry for calendar
  const entryMap = new Map((allEntries as any[]).map((e: any) => [e.date, e]));
  const moodMap = new Map((allEntries as any[]).map((e: any) => [e.date, e.mood]));

  useEffect(() => {
    if (entry) {
      setForm({ mood: entry.mood || "", wentWell: entry.wentWell || "", learned: entry.learned || "", grateful: entry.grateful || "", tomorrowGoals: entry.tomorrowGoals || "", freeText: entry.freeText || "" });
    } else {
      setForm({ mood: "", wentWell: "", learned: "", grateful: "", tomorrowGoals: "", freeText: "" });
    }
  }, [entry, date]);

  const save = async () => {
    setSaving(true);
    await saveEntry.mutateAsync({ date, ...form });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  useEffect(() => {
    const t = setTimeout(() => { if (form.wentWell || form.learned || form.grateful || form.freeText || form.mood) save(); }, 2000);
    return () => clearTimeout(t);
  }, [form]);

  const handleGenerateAiSummary = async () => {
    if (!isPremium) {
      setUpgradeOpen(true);
      return;
    }

    try {
      setLoadingAi(true);
      const res = await api.getJournalAISummary(allEntries as any[]);
      setAiSummary(res.summary);
    } catch (e: any) {
      if (e.message?.includes("PREMIUM_REQUIRED")) {
        setUpgradeOpen(true);
      }
    } finally {
      setLoadingAi(false);
    }
  };

  const isToday = date === getTodayISO();
  const isFuture = date > getTodayISO();

  return (
    <div className="min-h-full p-4 sm:p-6 lg:p-8">
      {upgradeOpen && (
        <UpgradeModal
          onClose={() => setUpgradeOpen(false)}
          reason="Schalte CLYVEN AI mit CLYVEN PLUS frei, um wöchentliche Journal-Zusammenfassungen und Mood-Analysen zu nutzen."
        />
      )}

      <div className={cn("mx-auto", view === "calendar" ? "max-w-3xl" : "max-w-2xl")}>
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Journal</h1>
            <p className="mt-1 text-sm text-zinc-400 font-medium">Reflect daily and grow.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateAiSummary}
              disabled={loadingAi}
              className="flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/15 backdrop-blur-md px-3.5 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/25 active:scale-95 transition-all cursor-pointer shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5 text-sky-400" />
              {loadingAi ? "Analysiere..." : "KI Insights"}
              {!isPremium && <Crown className="h-3 w-3 text-amber-400 ml-1" />}
            </button>

            {view === "entry" && (
              <>
                <button onClick={() => setDate((d) => addDays(d, -1))}
                  className="rounded-xl p-2 text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-100 transition-colors active:scale-95">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="min-w-[120px] text-center text-sm font-semibold text-zinc-200">
                  {formatDisplayDate(date)}
                </span>
                <button onClick={() => setDate((d) => addDays(d, 1))} disabled={isToday}
                  className="rounded-xl p-2 text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-100 transition-colors disabled:opacity-30 active:scale-95">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}
            <button onClick={() => setView(view === "entry" ? "calendar" : "entry")}
              className={cn("rounded-xl p-2 transition-all active:scale-95 border border-white/[0.06]", view === "calendar" ? "text-zinc-100 bg-white/10" : "text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-100")}>
              {view === "calendar" ? <Edit3 className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* AI Summary Display */}
        {aiSummary && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 rounded-2xl glass-panel border-indigo-500/30 bg-indigo-950/20 p-5 backdrop-blur-md">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="h-4 w-4 text-sky-400" /> Clyven AI Journal Analysis
              </div>
              <button onClick={() => setAiSummary(null)} className="text-zinc-400 hover:text-zinc-100 text-xs">Schließen</button>
            </div>
            <div className="text-xs sm:text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">
              {aiSummary}
            </div>
          </motion.div>
        )}

        {/* Calendar View */}
        {view === "calendar" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Month navigation */}
            <div className="flex items-center justify-between">
              <button onClick={() => setCalendarMonth(({ year, month }) => month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 })}
                className="rounded-lg p-2 text-zinc-400 hover:bg-white/[0.06] hover:text-white transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium text-zinc-200">
                {new Date(calendarMonth.year, calendarMonth.month).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </span>
              <button onClick={() => setCalendarMonth(({ year, month }) => month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 })}
                className="rounded-lg p-2 text-zinc-400 hover:bg-white/[0.06] hover:text-white transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Calendar grid */}
            <div className="glass-panel rounded-3xl p-4">
              {/* Weekday headers */}
              <div className="mb-2 grid grid-cols-7 text-center">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                  <div key={d} className="py-2 text-[10px] font-semibold uppercase text-zinc-400">{d}</div>
                ))}
              </div>

              {/* Days */}
              <div className="grid grid-cols-7 gap-1.5" style={{ gridAutoRows: "minmax(44px, auto)" }}>
                {getMonthDays(calendarMonth.year, calendarMonth.month).map((d, i) => {
                  if (!d) return <div key={`empty-${i}`} />;
                  const mood = moodMap.get(d);
                  const today = getTodayISO();
                  const isToday = d === today;
                  const isFuture = d > today;
                  const hasEntry = entryMap.has(d);

                  return (
                    <button key={d} onClick={() => { if (!isFuture) { setDate(d); setView("entry"); } }}
                      disabled={isFuture}
                      className={cn("flex flex-col items-center justify-center rounded-xl transition-all relative border",
                        isToday ? "border-amber-400/40 bg-amber-400/10" : "border-transparent",
                        hasEntry && !isFuture ? "bg-white/[0.05] hover:bg-white/10 hover:border-white/15" : "",
                        isFuture ? "opacity-30 cursor-not-allowed" : "cursor-pointer hover:bg-white/[0.06]")}>
                      <span className={cn("text-xs font-medium", isToday ? "text-amber-300 font-bold" : "text-zinc-300")}>
                        {new Date(d + "T12:00:00").getDate()}
                      </span>
                      {mood && (
                        <span className="text-sm mt-0.5">
                          {MOODS.find((m) => m.key === mood)?.emoji || ""}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-panel rounded-2xl p-4">
                <p className="text-xs text-zinc-400 font-medium mb-1">Entries this month</p>
                <p className="text-2xl font-bold text-zinc-100">
                  {(allEntries as any[]).filter((e: any) => {
                    const d = new Date(e.date);
                    return d.getMonth() === calendarMonth.month && d.getFullYear() === calendarMonth.year;
                  }).length}
                </p>
              </div>
              <div className="glass-panel rounded-2xl p-4">
                <p className="text-xs text-zinc-400 font-medium mb-1">Most common mood</p>
                <p className="text-2xl">
                  {(() => {
                    const monthEntries = (allEntries as any[]).filter((e: any) => {
                      const d = new Date(e.date);
                      return d.getMonth() === calendarMonth.month && d.getFullYear() === calendarMonth.year && e.mood;
                    });
                    const moodCounts = new Map<string, number>();
                    monthEntries.forEach((e: any) => moodCounts.set(e.mood, (moodCounts.get(e.mood) || 0) + 1));
                    const topMood = [...moodCounts.entries()].sort((a, b) => b[1] - a[1])[0];
                    return topMood ? MOODS.find((m) => m.key === topMood[0])?.emoji || "–" : "–";
                  })()}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {view === "entry" && (
          isFuture ? (
            <div className="flex flex-col items-center py-20 text-center">
              <BookOpen className="mb-3 h-8 w-8 text-zinc-600" />
              <p className="text-sm text-zinc-500 font-medium">Future entries are not available</p>
            </div>
          ) : isLoading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-white/[0.03] border border-white/[0.04]" />)}
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} key={date} className="space-y-4">
              {/* Mood */}
              <div className="glass-panel rounded-3xl p-5">
                <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-400">How was your day?</p>
                <div className="flex gap-3 flex-wrap">
                  {MOODS.map((m) => (
                    <motion.button key={m.key} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.94 }}
                      onClick={() => setForm((f) => ({ ...f, mood: m.key }))}
                      className={cn("flex flex-col items-center gap-1 rounded-2xl border px-3.5 py-2.5 transition-all cursor-pointer",
                        form.mood === m.key ? "border-white/20 bg-white/10 shadow-sm backdrop-blur-md" : "border-white/[0.06] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.06]")}>
                      <span className="text-xl">{m.emoji}</span>
                      <span className="text-[10px] text-zinc-400 font-medium">{m.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Sections */}
              {SECTIONS.map((s) => (
                <div key={s.key} className="glass-panel rounded-3xl p-5">
                  <p className="mb-3 text-sm font-semibold text-zinc-200">{s.label}</p>
                  <textarea value={(form as any)[s.key]} onChange={(e) => setForm((f) => ({ ...f, [s.key]: e.target.value }))}
                    placeholder={s.placeholder}
                    rows={s.key === "freeText" ? 5 : 3}
                    className="w-full resize-none bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-500 leading-relaxed focus:ring-0" />
                </div>
              ))}

              {/* Save */}
              <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-400 font-medium">
                  {saved ? "✓ Saved" : saving ? "Saving..." : "Auto-saved after 2s"}
                </p>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }} onClick={save}
                  className="btn-liquid-primary flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-wider cursor-pointer shadow-md">
                  <Save className="h-3.5 w-3.5" />
                  Save
                </motion.button>
              </div>
            </motion.div>
          )
        )}
      </div>
    </div>
  );
}
