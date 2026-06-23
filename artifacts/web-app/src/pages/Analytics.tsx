import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { api } from "../lib/api";
import { formatMinutes } from "../lib/utils";
import { TrendingUp, Timer, FileText, Bookmark, BookOpen } from "lucide-react";

const COLORS = ["rgba(255,255,255,0.6)", "rgba(255,255,255,0.35)", "rgba(255,255,255,0.2)"];

function ChartCard({ title, children, className }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      className={`rounded-2xl border border-white/[0.07] bg-[#111111] p-5 ${className || ""}`}>
      <p className="mb-4 text-sm font-medium text-white/60">{title}</p>
      {children}
    </motion.div>
  );
}

const customTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-[#1a1a1a] px-3 py-2 text-xs text-white/70 shadow-xl">
      <p className="mb-1 text-white/40">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i}>{p.name}: <span className="font-semibold text-white">{p.value}</span></p>
      ))}
    </div>
  );
};

export function Analytics() {
  const { data: stats } = useQuery({ queryKey: ["stats"], queryFn: api.getStats, retry: 1 });
  const { data: focusData } = useQuery({ queryKey: ["focus"], queryFn: api.getFocus, retry: 1 });
  const { data: journal } = useQuery({ queryKey: ["journal"], queryFn: api.getJournal, retry: 1 });
  const { data: notes } = useQuery({ queryKey: ["notes"], queryFn: api.getNotes, retry: 1 });

  // Build weekly focus data from sessions
  const weeklyFocus = (() => {
    const days = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
    const data = days.map((d) => ({ name: d, Fokus: 0 }));
    const sessions = focusData?.sessions ?? [];
    sessions.forEach((s: any) => {
      if (!s.completedAt) return;
      const d = new Date(s.completedAt);
      const idx = (d.getDay() + 6) % 7;
      data[idx].Fokus += s.duration;
    });
    return data;
  })();

  // Mood distribution
  const moodData = (() => {
    const moods: Record<string, number> = {};
    (journal ?? []).forEach((e: any) => { if (e.mood) moods[e.mood] = (moods[e.mood] || 0) + 1; });
    return Object.entries(moods).map(([name, value]) => ({ name, value }));
  })();

  // Monthly notes trend (simplified)
  const notesMonthly = (() => {
    const months: Record<string, number> = {};
    (notes ?? []).forEach((n: any) => {
      const m = new Date(n.createdAt).toLocaleDateString("de-DE", { month: "short" });
      months[m] = (months[m] || 0) + 1;
    });
    return Object.entries(months).slice(-6).map(([name, value]) => ({ name, Notizen: value }));
  })();

  return (
    <div className="min-h-full p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="mt-1 text-sm text-white/40">Deine Produktivitätsmuster auf einen Blick.</p>
        </div>

        {/* Summary cards */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: Timer, label: "Fokuszeit gesamt", value: formatMinutes(stats?.totalFocusMinutes ?? 0) },
            { icon: FileText, label: "Notizen erstellt", value: stats?.notesCount ?? 0 },
            { icon: Bookmark, label: "Bookmarks", value: stats?.bookmarksCount ?? 0 },
            { icon: BookOpen, label: "Journal-Einträge", value: stats?.journalCount ?? 0 },
          ].map(({ icon: Icon, label, value }, i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="rounded-2xl border border-white/[0.07] bg-[#111111] p-4">
              <Icon className="mb-2 h-4 w-4 text-white/30" />
              <div className="text-xl font-bold text-white">{value}</div>
              <div className="text-xs text-white/35">{label}</div>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="Fokuszeit diese Woche (Minuten)" className="lg:col-span-2">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyFocus} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={customTooltip} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                <Bar dataKey="Fokus" fill="rgba(255,255,255,0.15)" radius={[4, 4, 0, 0]}
                  activeBar={{ fill: "rgba(255,255,255,0.35)" }} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Notizen über Zeit">
            {notesMonthly.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-sm text-white/20">Noch keine Daten</div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={notesMonthly} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={customTooltip} />
                  <Area type="monotone" dataKey="Notizen" stroke="rgba(255,255,255,0.4)" fill="rgba(255,255,255,0.05)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Stimmungsverteilung">
            {moodData.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-sm text-white/20">Noch keine Journal-Einträge</div>
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={160}>
                  <PieChart>
                    <Pie data={moodData} cx="50%" cy="50%" innerRadius={40} outerRadius={65}
                      paddingAngle={3} dataKey="value">
                      {moodData.map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {moodData.map((m: any, i: number) => (
                    <div key={m.name} className="flex items-center gap-2 text-xs text-white/50">
                      <div className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span>{m.name}</span>
                      <span className="text-white/30">({m.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
