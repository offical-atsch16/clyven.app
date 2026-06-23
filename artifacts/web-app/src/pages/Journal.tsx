import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BookOpen, ChevronLeft, ChevronRight, Save, Smile } from "lucide-react";
import { api } from "../lib/api";
import { cn, getTodayISO } from "../lib/utils";

const MOODS = [
  { key: "amazing", emoji: "🔥", label: "Fantastisch" },
  { key: "happy", emoji: "😀", label: "Gut" },
  { key: "calm", emoji: "😌", label: "Ruhig" },
  { key: "neutral", emoji: "😐", label: "Neutral" },
  { key: "sad", emoji: "😔", label: "Schlecht" },
  { key: "tired", emoji: "😴", label: "Müde" },
];

const SECTIONS = [
  { key: "wentWell", label: "Was lief gut heute?", placeholder: "Etwas das du erreicht oder genossen hast..." },
  { key: "learned", label: "Was habe ich gelernt?", placeholder: "Eine Erkenntnis oder neue Fähigkeit..." },
  { key: "grateful", label: "Wofür bin ich dankbar?", placeholder: "Drei Dinge, die du schätzt..." },
  { key: "tomorrowGoals", label: "Ziele für morgen", placeholder: "Was möchtest du morgen erreichen..." },
  { key: "freeText", label: "Freier Bereich", placeholder: "Gedanken, Gefühle, Notizen..." },
];

function addDays(dateStr: string, days: number) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function formatDisplayDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  const today = getTodayISO();
  if (dateStr === today) return "Heute";
  if (dateStr === addDays(today, -1)) return "Gestern";
  return d.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" });
}

export function Journal() {
  const qc = useQueryClient();
  const [date, setDate] = useState(getTodayISO());
  const { data: entry, isLoading } = useQuery({ queryKey: ["journal", date], queryFn: () => api.getJournalEntry(date), retry: 1 });
  const saveEntry = useMutation({ mutationFn: api.saveJournalEntry, onSuccess: () => qc.invalidateQueries({ queryKey: ["journal"] }) });

  const [form, setForm] = useState({ mood: "", wentWell: "", learned: "", grateful: "", tomorrowGoals: "", freeText: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
    <div className="min-h-full p-6 lg:p-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Journal</h1>
            <p className="mt-1 text-sm text-white/40">Täglich reflektieren und wachsen.</p>
          </div>
          <div className="flex items-center gap-2">
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
          </div>
        </div>

        {isFuture ? (
          <div className="flex flex-col items-center py-20 text-center">
            <BookOpen className="mb-3 h-8 w-8 text-white/10" />
            <p className="text-sm text-white/25">Zukünftige Einträge nicht verfügbar</p>
          </div>
        ) : isLoading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-white/[0.03]" />)}
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} key={date} className="space-y-4">
            {/* Mood */}
            <div className="rounded-2xl border border-white/[0.07] bg-[#111111] p-5">
              <p className="mb-4 text-xs font-medium uppercase tracking-widest text-white/30">Wie war dein Tag?</p>
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
                {saved ? "✓ Gespeichert" : saving ? "Speichern..." : "Auto-speichert nach 2 Sek."}
              </p>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={save}
                className="flex items-center gap-2 rounded-xl bg-white/[0.07] px-4 py-2 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all">
                <Save className="h-3.5 w-3.5" />
                Speichern
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
