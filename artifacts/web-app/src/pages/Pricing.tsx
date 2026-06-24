import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Check, X, Zap, FileText, Bookmark, Timer, BarChart2,
  Download, Brain, Trophy, Shield, ArrowLeft, Crown,
} from "lucide-react";
import { usePremium } from "../hooks/usePremium";
import { useUser } from "@clerk/react";
import { cn } from "../lib/utils";

const FREE_FEATURES = [
  { label: "Bis zu 10 Notizen", ok: true },
  { label: "Bis zu 25 Bookmarks", ok: true },
  { label: "Focus Timer (alle Modi)", ok: true },
  { label: "Tägliches Journal", ok: true },
  { label: "Analytics (7 Tage)", ok: true },
  { label: "3 Achievements", ok: true },
  { label: "Unbegrenzte Notizen", ok: false },
  { label: "Unbegrenzte Bookmarks", ok: false },
  { label: "Notizen exportieren", ok: false },
  { label: "Analytics (30 Tage)", ok: false },
  { label: "Fokus-Streak Tracking", ok: false },
  { label: "Premium Profil-Badge", ok: false },
];

const PLUS_FEATURES = [
  { label: "Unbegrenzte Notizen", ok: true },
  { label: "Unbegrenzte Bookmarks", ok: true },
  { label: "Focus Timer (alle Modi)", ok: true },
  { label: "Tägliches Journal", ok: true },
  { label: "Analytics (30 Tage)", ok: true },
  { label: "Alle Achievements", ok: true },
  { label: "Notizen als Markdown exportieren", ok: true },
  { label: "Fokus-Streak Tracking", ok: true },
  { label: "Premium Profil-Badge", ok: true },
  { label: "Prioritäts-Support", ok: true },
  { label: "Früher Zugang zu neuen Features", ok: true },
  { label: "Alles aus dem Free-Plan", ok: true },
];

const FAQS = [
  { q: "Wann werde ich belastet?", a: "Du wirst sofort nach dem Upgrade belastet. Dein Zugang zu CLYVEN PLUS beginnt unmittelbar." },
  { q: "Kann ich jederzeit kündigen?", a: "Ja, du kannst jederzeit über dein Account-Dashboard kündigen. Du behältst den Zugriff bis Ende des Abrechnungszeitraums." },
  { q: "Was passiert mit meinen Daten wenn ich downgrade?", a: "Deine Daten bleiben erhalten. Du kannst aber keine neuen Notizen erstellen wenn du das Limit überschreitest." },
  { q: "Gibt es eine kostenlose Testphase?", a: "Der Free-Plan ist dauerhaft kostenlos und hat keine Zeitbeschränkung." },
];

export function Pricing() {
  const { isPremium, openUpgrade, openManage } = usePremium();
  const { user } = useUser();
  const [, navigate] = useLocation();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-[#080808] text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b border-white/[0.05] bg-[#080808]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <button onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" /> Zurück
          </button>
          <div className="flex items-center gap-2.5">
            <img src={`${basePath}/logo.svg`} alt="CLYVEN" className="h-5 w-5" />
            <span className="text-sm font-bold tracking-[0.2em]">CLYVEN</span>
          </div>
          {user ? (
            <div className="flex items-center gap-2">
              {user.imageUrl ? (
                <img src={user.imageUrl} className="h-7 w-7 rounded-full" alt="" />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-bold">
                  {user.firstName?.[0]}
                </div>
              )}
            </div>
          ) : <div />}
        </div>
      </nav>

      <div className="px-6 pb-24 pt-16">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-16 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/5 px-4 py-1.5 text-xs text-yellow-400/70">
              <Zap className="h-3 w-3" /> CLYVEN PLUS
            </div>
            <h1 className="mb-4 text-5xl font-bold tracking-tight sm:text-6xl">
              Einfache, faire<br />
              <span className="bg-gradient-to-r from-yellow-300 to-yellow-500 bg-clip-text text-transparent">Preisgestaltung</span>
            </h1>
            <p className="text-lg text-white/40">
              Starte kostenlos. Upgrade wenn du bereit bist.
            </p>
          </motion.div>

          {/* Pricing Cards */}
          <div className="mb-16 grid gap-4 sm:grid-cols-2">
            {/* Free */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
              className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-8">
              <div className="mb-6">
                <p className="mb-1 text-sm font-medium uppercase tracking-widest text-white/30">Free</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">$0</span>
                  <span className="text-sm text-white/30">/ Monat</span>
                </div>
                <p className="mt-2 text-sm text-white/40">Für immer kostenlos</p>
              </div>

              <Link href={user ? "/dashboard" : "/sign-up"}>
                <button className="mb-8 w-full rounded-2xl border border-white/[0.1] py-3 text-sm font-medium text-white/60 hover:bg-white/[0.05] hover:text-white transition-all">
                  {user ? "Dein aktueller Plan" : "Kostenlos starten"}
                </button>
              </Link>

              <ul className="space-y-3">
                {FREE_FEATURES.map((f) => (
                  <li key={f.label} className="flex items-center gap-3 text-sm">
                    {f.ok
                      ? <Check className="h-4 w-4 shrink-0 text-white/40" />
                      : <X className="h-4 w-4 shrink-0 text-white/15" />}
                    <span className={f.ok ? "text-white/60" : "text-white/20"}>{f.label}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* PLUS */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
              className="relative overflow-hidden rounded-3xl border border-yellow-400/20 bg-gradient-to-b from-yellow-400/[0.06] to-transparent p-8">
              {/* Glow */}
              <div className="pointer-events-none absolute -top-16 left-1/2 h-40 w-60 -translate-x-1/2 rounded-full bg-yellow-400/10 blur-3xl" />

              <div className="relative mb-6">
                <div className="mb-3 flex items-center gap-2">
                  <Crown className="h-4 w-4 text-yellow-400" />
                  <span className="text-xs font-bold uppercase tracking-widest text-yellow-400">Empfohlen</span>
                </div>
                <p className="mb-1 text-sm font-medium uppercase tracking-widest text-white/40">CLYVEN PLUS</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">$2</span>
                  <span className="text-sm text-white/30">/ Monat</span>
                </div>
                <p className="mt-2 text-sm text-white/40">Alles unbegrenzt</p>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={isPremium ? openManage : openUpgrade}
                className="relative mb-8 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-yellow-400 to-yellow-500 py-3.5 text-sm font-bold text-black shadow-lg shadow-yellow-500/20 hover:from-yellow-300 hover:to-yellow-400 transition-all"
              >
                {isPremium ? "✓ Aktiver Plan – Verwalten" : "Jetzt upgraden"}
              </motion.button>

              <ul className="relative space-y-3">
                {PLUS_FEATURES.map((f) => (
                  <li key={f.label} className="flex items-center gap-3 text-sm">
                    <Check className="h-4 w-4 shrink-0 text-yellow-400/70" />
                    <span className="text-white/70">{f.label}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Feature comparison */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="mb-16 overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.02]">
            <div className="grid grid-cols-3 border-b border-white/[0.07] px-6 py-4">
              <p className="text-sm font-medium text-white/50">Feature</p>
              <p className="text-center text-sm font-medium text-white/50">Free</p>
              <p className="text-center text-sm font-medium text-yellow-400/70">PLUS</p>
            </div>
            {[
              { label: "Notizen", free: "10", plus: "Unbegrenzt" },
              { label: "Bookmarks", free: "25", plus: "Unbegrenzt" },
              { label: "Focus Timer", free: "✓", plus: "✓" },
              { label: "Journal", free: "✓", plus: "✓" },
              { label: "Analytics", free: "7 Tage", plus: "30 Tage" },
              { label: "Export (Markdown)", free: "—", plus: "✓" },
              { label: "Streak Tracking", free: "—", plus: "✓" },
              { label: "Premium Badge", free: "—", plus: "✓" },
              { label: "Alle Achievements", free: "Basis", plus: "✓" },
              { label: "Support", free: "Community", plus: "Priorität" },
            ].map((row, i) => (
              <div key={row.label} className={cn("grid grid-cols-3 px-6 py-3.5 text-sm", i % 2 === 0 && "bg-white/[0.01]")}>
                <span className="text-white/50">{row.label}</span>
                <span className="text-center text-white/30">{row.free}</span>
                <span className="text-center font-medium text-yellow-400/70">{row.plus}</span>
              </div>
            ))}
          </motion.div>

          {/* Why PLUS */}
          <div className="mb-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: FileText, title: "Kein Limit", desc: "Schreibe so viele Notizen wie du willst" },
              { icon: BarChart2, title: "Tiefe Insights", desc: "30-Tage Analyse deiner Produktivität" },
              { icon: Download, title: "Deine Daten", desc: "Export all deiner Notizen als Markdown" },
              { icon: Shield, title: "Premium Support", desc: "Schnelle Antworten vom CLYVEN Team" },
            ].map((item, i) => (
              <motion.div key={item.title}
                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-yellow-400/10">
                  <item.icon className="h-4 w-4 text-yellow-400/70" />
                </div>
                <p className="font-semibold text-white">{item.title}</p>
                <p className="mt-1 text-xs text-white/40 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* FAQ */}
          <div className="mb-16">
            <h2 className="mb-8 text-center text-2xl font-bold text-white">Häufige Fragen</h2>
            <div className="mx-auto max-w-2xl space-y-2">
              {FAQS.map((faq, i) => (
                <div key={i} className="overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.02]">
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium text-white/70 hover:text-white">
                    {faq.q}
                    <span className={cn("text-white/30 transition-transform text-lg", openFaq === i && "rotate-45")}>+</span>
                  </button>
                  {openFaq === i && (
                    <div className="border-t border-white/[0.05] px-5 pb-4 pt-3 text-sm text-white/40 leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Final CTA */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="rounded-3xl border border-yellow-400/10 bg-gradient-to-b from-yellow-400/[0.05] to-transparent p-12 text-center">
            <Crown className="mx-auto mb-4 h-8 w-8 text-yellow-400/60" />
            <h2 className="mb-3 text-2xl font-bold text-white">Bereit für CLYVEN PLUS?</h2>
            <p className="mb-8 text-white/40">Über 100% mehr Möglichkeiten. Jederzeit kündbar.</p>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={isPremium ? openManage : openUpgrade}
              className="rounded-2xl bg-gradient-to-r from-yellow-400 to-yellow-500 px-10 py-4 text-sm font-bold text-black shadow-xl shadow-yellow-500/20 hover:from-yellow-300 hover:to-yellow-400 transition-all">
              {isPremium ? "Plan verwalten" : "Jetzt upgraden →"}
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
