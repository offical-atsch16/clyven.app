import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { api } from "../lib/api";
import { formatMinutes } from "../lib/utils";
import { TrendingUp, Timer, FileText, Bookmark, BookOpen, Crown, Lock } from "lucide-react";
import { usePremium } from "../hooks/usePremium";
import { cn } from "../lib/utils";

const COLORS = ["rgba(255,255,255,0.6)", "rgba(255,255,255,0.35)", "rgba(255,255,255,0.2)", "rgba(255,255,255,0.12)"];

function ChartCard({ title, children, className, premium, locked }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      className={`relative overflow-hidden rounded-2xl border bg-[#111111] p-5 ${premium ? "border-yellow-400/20" : "border-white/[0.07]"} ${className || ""}`}>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-medium text-white/60">{title}</p>
        {premium && <Crown className="h-3.5 w-3.5 text-yellow-400/50" />}
      </div>
      {locked ? (
        <div className="flex h-40 flex-col items-center justify-center gap-3">
          <Lock className="h-6 w-6 text-white/15" />
          <p className="text-sm text-white/25">CLYVEN PLUS</p>
        </div>
      ) : children}
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
  const { isPremium, openUpgrade } = usePremium();
  const [, navigate] = useLocation();
  const { data: stats } = useQuery({ queryKey: ["stats"], queryFn: api.getStats, retry: 1 });
  const { data: focusData } = useQuery({ queryKey: ["focus"], queryFn: api.getFocus, retry: 1 });
  const { data: journal } = useQuery({ queryKey: ["journal"], queryFn: api.getJournal, retry: 1 });
  const { data: notes } = useQuery({ queryKey: ["notes"], queryFn: api.getNotes, retry: 1 });

  const DAYS_LIMIT = isPremium ? 30 : 7;

  // Weekly focus data
  const weeklyFocus = (() => {
    const days = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
    const data = days.map((d) => ({ name: d, Fokus: 0 }));
    (focusData?.sessions ?? []).forEach((s: any) => {
      if (!s.completedAt) return;
      const d = new Date(s.completedAt);
      const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7);
      if (d < cutoff) return;
      const idx = (d.getDay() + 6) % 7;
      data[idx].Fokus += s.duration;
    });
    return data;
  })();

  // 30-day focus trend (premium)
  const monthlyFocus = (() => {
    const data: { name: string; Fokus: number }[] = [];
    for (let i = DAYS_LIMIT - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString("de-DE", { day: "numeric", month: "short" });
      data.push({ name: label, Fokus: 0 });
    }
    (focusData?.sessions ?? []).forEach((s: any) => {
      if (!s.completedAt) return;
      const d = new Date(s.completedAt);
      const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - DAYS_LIMIT);
      if (d < cutoff) return;
      const label = d.toLocaleDateString("de-DE", { day: "numeric", month: "short" });
      const entry = data.find((x) => x.name === label);
      if (entry) entry.Fokus += s.duration;
    });
    return data;
  })();

  // Mood distribution
  const moodData = (() => {
    const moods: Record<string, number> = {};
    (journal ?? []).forEach((e: any) => { if (e.mood) moods[e.mood] = (moods[e.mood] || 0) + 1; });
    return Object.entries(moods).map(([name, value]) => ({ name, value }));
  })();

  // Notes per month
  const notesMonthly = (() => {
    const months: Record<string, number> = {};
    (notes ?? []).forEach((n: any) => {
      const m = new Date(n.createdAt).toLocaleDateString("de-DE", { month: "short" });
      months[m] = (months[m] || 0) + 1;
    });
    return Object.entries(months).slice(-6).map(([name, value]) => ({ name, Notizen: value }));
  })();

  // Focus session types (premium)
  const sessionTypes = (() => {
    const types: Record<string, number> = {};
    (focusData?.sessions ?? []).forEach((s: any) => {
      types[s.type] = (types[s.type] || 0) + s.duration;
    });
    return Object.entries(types).map(([name, value]) => ({ name, value }));
  })();

  return (
    <div className="min-h-full p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Analytics</h1>
            <p className="mt-1 text-sm text-white/40">
              {isPremium ? "Vollständige 30-Tage Analyse" : "7-Tage Übersicht · PLUS für 30 Tage"}
            </p>
          </div>
          {!isPremium && (
            <button onClick={openUpgrade}
              className="flex items-center gap-2 rounded-xl border border-yellow-400/20 bg-yellow-400/5 px-4 py-2 text-xs font-medium text-yellow-400/70 hover:bg-yellow-400/10 transition-all">
              <Crown className="h-3.5 w-3.5" /> Unlock PLUS
            </button>
          )}
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
          {/* Weekly focus - always visible */}
          <ChartCard title="Fokuszeit diese Woche (Min.)" className="lg:col-span-2">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyFocus} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={customTooltip} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                <Bar dataKey="Fokus" fill="rgba(255,255,255,0.15)" radius={[4, 4, 0, 0]} activeBar={{ fill: "rgba(255,255,255,0.35)" }} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* 30-day trend — premium */}
          <ChartCard title={`Fokus-Trend (${DAYS_LIMIT} Tage)`} premium locked={!isPremium}>
            {isPremium && (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={monthlyFocus} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 10 }} axisLine={false} tickLine={false}
                    interval={Math.floor(monthlyFocus.length / 5)} />
                  <YAxis tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={customTooltip} />
                  <Area type="monotone" dataKey="Fokus" stroke="rgba(255,255,255,0.5)" fill="rgba(255,255,255,0.05)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* Notes timeline */}
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

          {/* Focus session types — premium */}
          <ChartCard title="Fokus nach Typ" premium locked={!isPremium}>
            {isPremium && (
              sessionTypes.length === 0 ? (
                <div className="flex h-40 items-center justify-center text-sm text-white/20">Noch keine Sessions</div>
              ) : (
                <div className="flex items-center gap-4 h-40">
                  <ResponsiveContainer width="50%" height="100%">
                    <PieChart>
                      <Pie data={sessionTypes} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3} dataKey="value">
                        {sessionTypes.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2">
                    {sessionTypes.map((s: any, i: number) => (
                      <div key={s.name} className="flex items-center gap-2 text-xs text-white/50">
                        <div className="h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="capitalize">{s.name}</span>
                        <span className="text-white/30">{formatMinutes(s.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
          </ChartCard>

          {/* Mood distribution */}
          <ChartCard title="Stimmungsverteilung">
            {moodData.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-sm text-white/20">Noch keine Journal-Einträge</div>
            ) : (
              <div className="flex items-center gap-4 h-40">
                <ResponsiveContainer width="50%" height="100%">
                  <PieChart>
                    <Pie data={moodData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3} dataKey="value">
                      {moodData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
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

          {/* PLUS upgrade CTA if free */}
          {!isPremium && (
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              className="lg:col-span-2 rounded-2xl border border-yellow-400/10 bg-gradient-to-r from-yellow-400/[0.05] to-transparent p-6 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Crown className="h-4 w-4 text-yellow-400/60" />
                  <span className="text-sm font-semibold text-white">CLYVEN PLUS Analytics</span>
                </div>
                <p className="text-xs text-white/40">30-Tage Trend, Fokus-Typen und mehr Charts — nur mit PLUS.</p>
              </div>
              <button onClick={openUpgrade}
                className="shrink-0 rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-500 px-5 py-2.5 text-xs font-bold text-black hover:from-yellow-300 transition-all">
                Upgraden →
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
