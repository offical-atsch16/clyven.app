import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BookOpen, ChevronLeft, ChevronRight, Save, Smile, Calendar, CreditCard as Edit3 } from "lucide-react";
import { api } from "../lib/api";
import { cn, getTodayISO } from "../lib/utils";

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
  const [date, setDate] = useState(getTodayISO());
  const [view, setView] = useState<"entry" | "calendar">("entry");
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const { data: entry, isLoading } = useQuery({ queryKey: ["journal", date], queryFn: () => api.getJournalEntry(date), retry: 1 });
  const { data: allEntries = [], isLoading: calendarLoading } = useQuery({ queryKey: ["journal"], queryFn: api.getJournal, retry: 1 });
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

  const isToday = date === getTodayISO();
  const isFuture = date > getTodayISO();

  return (
    <div className="min-h-full p-4 sm:p-6 lg:p-8">
      <div className={cn("mx-auto", view === "calendar" ? "max-w-3xl" : "max-w-2xl")}>
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Journal</h1>
            <p className="mt-1 text-sm text-white/40">Reflect daily and grow.</p>
          </div>
          <div className="flex items-center gap-2">
            {view === "entry" && (
              <>
                <button onClick={() => setDate((d) => addDays(d, -1))}
                  className="rounded-lg p-2 text-white/40 hover:bg-white/[0.06] hover:text-white transition-colors">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="min-w-[120px] text-center text-sm font-medium text-white/70">
                  {formatDisplayDate(date)}
                </span>
                <button onClick={() => setDate((d) => addDays(d, 1))} disabled={isToday}
                  className="rounded-lg p-2 text-white/40 hover:bg-white/[0.06] hover:text-white transition-colors disabled:opacity-30">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}
            <button onClick={() => setView(view === "entry" ? "calendar" : "entry")}
              className={cn("rounded-lg p-2 transition-colors", view === "calendar" ? "text-white bg-white/[0.08]" : "text-white/40 hover:bg-white/[0.06] hover:text-white")}>
              {view === "calendar" ? <Edit3 className="h-4 w-4" /> : <Calendar className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Calendar View */}
        {view === "calendar" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Month navigation */}
            <div className="flex items-center justify-between">
              <button onClick={() => setCalendarMonth(({ year, month }) => month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 })}
                className="rounded-lg p-2 text-white/40 hover:bg-white/[0.06] hover:text-white transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium text-white/70">
                {new Date(calendarMonth.year, calendarMonth.month).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </span>
              <button onClick={() => setCalendarMonth(({ year, month }) => month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 })}
                className="rounded-lg p-2 text-white/40 hover:bg-white/[0.06] hover:text-white transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Calendar grid */}
            <div className="rounded-2xl border border-white/[0.07] bg-[#111111] p-4">
              {/* Weekday headers */}
              <div className="mb-2 grid grid-cols-7 text-center">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                  <div key={d} className="py-2 text-[10px] font-medium uppercase text-white/30">{d}</div>
                ))}
              </div>

              {/* Days */}
              <div className="grid grid-cols-7 gap-1" style={{ gridAutoRows: "minmax(44px, auto)" }}>
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
                      className={cn("flex flex-col items-center justify-center rounded-lg transition-all relative",
                        isToday ? "border border-yellow-400/30" : "",
                        hasEntry && !isFuture ? "bg-white/[0.04] hover:bg-white/[0.08]" : "",
                        isFuture ? "opacity-30 cursor-not-allowed" : "cursor-pointer hover:bg-white/[0.04]")}>
                      <span className={cn("text-xs", isToday ? "text-yellow-400/70 font-bold" : "text-white/50")}>
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
              <div className="rounded-xl border border-white/[0.07] bg-[#111111] p-4">
                <p className="text-xs text-white/40 mb-1">Entries this month</p>
                <p className="text-2xl font-bold text-white">
                  {(allEntries as any[]).filter((e: any) => {
                    const d = new Date(e.date);
                    return d.getMonth() === calendarMonth.month && d.getFullYear() === calendarMonth.year;
                  }).length}
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.07] bg-[#111111] p-4">
                <p className="text-xs text-white/40 mb-1">Most common mood</p>
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
              <BookOpen className="mb-3 h-8 w-8 text-white/10" />
              <p className="text-sm text-white/25">Future entries are not available</p>
            </div>
          ) : isLoading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-white/[0.03]" />)}
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} key={date} className="space-y-4">
              {/* Mood */}
              <div className="rounded-2xl border border-white/[0.07] bg-[#111111] p-5">
                <p className="mb-4 text-xs font-medium uppercase tracking-widest text-white/30">How was your day?</p>
                <div className="flex gap-3 flex-wrap">
                  {MOODS.map((m) => (
                    <motion.button key={m.key} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
                      onClick={() => setForm((f) => ({ ...f, mood: m.key }))}
                      className={cn("flex flex-col items-center gap-1 rounded-xl border px-3 py-2.5 transition-all",
                        form.mood === m.key ? "border-white/20 bg-white/[0.08]" : "border-white/[0.06] bg-transparent hover:border-white/10")}>
                      <span className="text-xl">{m.emoji}</span>
                      <span className="text-[10px] text-white/40">{m.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Sections */}
              {SECTIONS.map((s) => (
                <div key={s.key} className="rounded-2xl border border-white/[0.07] bg-[#111111] p-5">
                  <p className="mb-3 text-sm font-medium text-white/60">{s.label}</p>
                  <textarea value={(form as any)[s.key]} onChange={(e) => setForm((f) => ({ ...f, [s.key]: e.target.value }))}
                    placeholder={s.placeholder}
                    rows={s.key === "freeText" ? 5 : 3}
                    className="w-full resize-none bg-transparent text-sm text-white/70 outline-none placeholder:text-white/20 leading-relaxed" />
                </div>
              ))}

              {/* Save */}
              <div className="flex items-center justify-between">
                <p className="text-xs text-white/25">
                  {saved ? "✓ Saved" : saving ? "Saving..." : "Auto-saved after 2s"}
                </p>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={save}
                  className="flex items-center gap-2 rounded-xl bg-white/[0.07] px-4 py-2 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all">
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
