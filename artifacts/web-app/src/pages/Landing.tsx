import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import { Link } from "wouter";
import {
  FileText, Timer, BookOpen, Bookmark, BarChart2,
  ArrowRight, ChevronDown, Check, Sparkles, Menu, X, Github, Activity,
  Play, Pause, Headphones, MessageSquare, Layers, ShieldCheck, Zap
} from "lucide-react";
import { useUser } from "@clerk/react";
import { useCookieBanner } from "../hooks/useCookieBanner";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const MAIN_PILLARS = [
  {
    icon: FileText,
    badge: "Kategorie 01",
    title: "Smart Notes",
    tagline: "Markdown & Bidirektionale Verlinkung",
    description: "Organisiere deine Gedanken blitzschnell mit modernem Markdown-Support, Vorlagen und bidirektionalen [[Verknüpfungen]]. Dein persönlicher Second Brain.",
    highlights: ["Markdown & Syntax-Highlighting", "Bidirektionale Backlinks", "Unbegrenzte Ordner & Tags", "Kostenloser Export"],
    color: "from-indigo-500/20 to-sky-500/10",
    borderColor: "border-indigo-500/30",
  },
  {
    icon: BookOpen,
    badge: "Kategorie 02",
    title: "Journaling",
    tagline: "Geführte Reflexion & AI Insights",
    description: "Reflektiere deinen Tag mit geführten Fragen, Stimmungstracking und intelligenten KI-Zusammenfassungen für tiefere Einblicke in deinen Fortschritt.",
    highlights: ["Stimmungs- & Mood-Analytics", "Wöchentliche KI-Zusammenfassungen", "Prompt-Vorlagen", "100% Ende-zu-Ende vertraulich"],
    color: "from-sky-500/20 to-indigo-500/10",
    borderColor: "border-sky-500/30",
  },
  {
    icon: Timer,
    badge: "Kategorie 03",
    title: "Focus Timer",
    tagline: "Pomodoro & Ambient Soundscapes",
    description: "Booste deine Konzentration mit flexiblen Fokus-Sessions, integriertem Session-Counter und entspannenden binauralen Ambient Sounds.",
    highlights: ["Custom Pomodoro Timer", "Ambient Sounds (Regen, Lofi, White Noise)", "Streak-Tracking & Analytics", "Nahtlose Notiz-Kopplung"],
    color: "from-indigo-600/20 to-blue-500/10",
    borderColor: "border-indigo-400/30",
  },
];

const COMPARISON = [
  { feature: "Anzahl Notizen", free: "10 Notizen", plus: "Unbegrenzt" },
  { feature: "Anzahl Bookmarks", free: "10 Bookmarks", plus: "Unbegrenzt" },
  { feature: "Focus Timer & Ambience", free: "Standard Sounds", plus: "Alle Ambient Soundscapes" },
  { feature: "KI-Assistent & Journal AI", free: "—", plus: "Inklusive (Gemini / Llama 3)" },
  { feature: "Bidirektionale Links", free: "Inklusive", plus: "Inklusive" },
  { feature: "Markdown-Export", free: "Inklusive", plus: "Inklusive + Priority Support" },
];

const FAQS = [
  { q: "Ist Clyven kostenlos?", a: "Ja! Mit dem Free-Plan kannst du Clyven dauerhaft kostenlos mit bis zu 10 Notizen, 10 Bookmarks und allen Kernfunktionen nutzen." },
  { q: "Wie funktioniert Clyven AI?", a: "Clyven AI unterstützt dich bei der Notizbearbeitung (Rechtschreibung, Zusammenfassungen, To-Do-Generierung) und erstellt wöchentliche Mood- & Journal-Analysen im Plus-Tarif." },
  { q: "Sind meine Daten sicher?", a: "Deine Daten werden verschlüsselt in europäischen Cloud-Rechenzentren gespeichert. Wir verkaufen niemals Nutzerdaten und garantieren höchste Datenschutzstandards." },
  { q: "Kann ich jederzeit kündigen?", a: "Ja. CLYVEN PLUS lässt sich jederzeit mit einem Klick in deinen Profileinstellungen monatlich kündigen – ohne Fristen oder versteckte Kosten." },
];

export function Landing() {
  const { user } = useUser();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Live preview state for interactive Hero component
  const [activeTab, setActiveTab] = useState<"note" | "timer">("note");
  const [demoTimerRunning, setDemoTimerRunning] = useState(false);
  const [demoTimeLeft, setDemoTimeLeft] = useState(25 * 60);

  useCookieBanner();

  const toggleDemoTimer = () => setDemoTimerRunning(!demoTimerRunning);
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className="min-h-[100dvh] overflow-x-hidden bg-[#080808] text-white selection:bg-indigo-500/30 selection:text-white"
      onMouseMove={(e) => setPos({ x: (e.clientX / window.innerWidth) * 100, y: (e.clientY / window.innerHeight) * 100 })}
    >
      {/* Background glow effects */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div
          className="absolute -top-[20%] left-1/2 h-[600px] w-[800px] -translate-x-1/2 rounded-full opacity-20 blur-[120px]"
          style={{ background: "radial-gradient(circle, #6366f1 0%, #38bdf8 50%, transparent 100%)" }}
        />
        <div
          className="absolute top-[40%] -left-[10%] h-[500px] w-[500px] rounded-full opacity-10 blur-[100px]"
          style={{ background: "radial-gradient(circle, #6366f1 0%, transparent 70%)" }}
        />
      </div>

      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/[0.08] bg-[#080808]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/">
            <div className="flex items-center gap-2.5 cursor-pointer">
              <img src={`${basePath}/logo.svg`} alt="CLYVEN" className="h-6 w-6" />
              <span className="text-sm font-bold tracking-[0.25em]">CLYVEN</span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6 text-sm text-white/60 font-medium">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#comparison" className="hover:text-white transition-colors">Vergleich</a>
            <Link href="/pricing">
              <span className="hover:text-white transition-colors cursor-pointer">Pricing</span>
            </Link>
            <Link href="/support">
              <span className="hover:text-white transition-colors cursor-pointer">Support</span>
            </Link>
            <Link href="/documentation">
              <span className="hover:text-white transition-colors cursor-pointer">Docs</span>
            </Link>
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/support">
              <button className="px-3.5 py-2 text-xs font-medium text-white/60 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 border border-white/10 rounded-lg bg-white/[0.02] hover:bg-white/[0.06]">
                <MessageSquare className="h-3.5 w-3.5" /> Support kontaktieren
              </button>
            </Link>
            {user ? (
              <Link href="/dashboard">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="rounded-lg bg-gradient-to-r from-indigo-500 to-sky-400 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 hover:opacity-90 transition-all cursor-pointer">
                  Dashboard →
                </motion.button>
              </Link>
            ) : (
              <>
                <Link href="/sign-in">
                  <button className="px-3 py-2 text-xs font-medium text-white/70 hover:text-white transition-colors cursor-pointer">Login</button>
                </Link>
                <Link href="/sign-up">
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="rounded-lg bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-white/90 transition-all cursor-pointer shadow-md">
                    Kostenlos starten
                  </motion.button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-md p-1.5 text-white/60 hover:bg-white/[0.05] hover:text-white transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden border-t border-white/[0.08] bg-[#0c0c0c] px-6 py-6 space-y-4"
            >
              <div className="flex flex-col gap-3 text-sm text-white/60">
                <a href="#features" onClick={() => setMobileMenuOpen(false)} className="hover:text-white py-1">Features</a>
                <a href="#comparison" onClick={() => setMobileMenuOpen(false)} className="hover:text-white py-1">Vergleich</a>
                <Link href="/pricing"><span onClick={() => setMobileMenuOpen(false)} className="hover:text-white py-1 block cursor-pointer">Pricing</span></Link>
                <Link href="/support"><span onClick={() => setMobileMenuOpen(false)} className="hover:text-white py-1 block cursor-pointer">Support</span></Link>
                <Link href="/documentation"><span onClick={() => setMobileMenuOpen(false)} className="hover:text-white py-1 block cursor-pointer">Dokumentation</span></Link>
              </div>

              <div className="pt-4 border-t border-white/[0.08] flex flex-col gap-2">
                {user ? (
                  <Link href="/dashboard">
                    <button className="w-full text-center rounded-xl bg-gradient-to-r from-indigo-500 to-sky-400 py-3 text-sm font-semibold text-white">
                      Dashboard →
                    </button>
                  </Link>
                ) : (
                  <>
                    <Link href="/sign-up">
                      <button className="w-full text-center rounded-xl bg-white py-3 text-sm font-semibold text-black">
                        Kostenlos starten
                      </button>
                    </Link>
                    <Link href="/sign-in">
                      <button className="w-full text-center rounded-xl border border-white/10 py-3 text-sm font-medium text-white/80">
                        Login
                      </button>
                    </Link>
                  </>
                )}
                <Link href="/support">
                  <button className="w-full text-center rounded-xl border border-indigo-500/30 bg-indigo-500/10 py-2.5 text-xs font-medium text-indigo-200">
                    Support kontaktieren
                  </button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-6 pt-28 pb-16">
        <div className="pointer-events-none absolute inset-0 z-0"
          style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

        <motion.div style={{ y, opacity }} className="relative z-10 flex flex-col items-center text-center max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-medium text-indigo-300 backdrop-blur-md"
          >
            <Sparkles className="h-3.5 w-3.5 text-sky-400 animate-pulse" />
            Das All-in-One Workspace System für Fokus & Wissen
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-6 text-4xl font-extrabold leading-[1.15] tracking-tight sm:text-6xl lg:text-7xl"
          >
            Denke klarer. Arbeite fokussierter. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-indigo-200 bg-clip-text text-transparent">
              Clyven bringt Ordnung in deine Ideen.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8 max-w-2xl text-base sm:text-lg text-white/50 leading-relaxed font-normal"
          >
            Kombiniere vernetzte Markdown-Notizen, geführte KI-Reflexionen und binaurale Focus-Timer in einer schnellen, hochsicheren Anwendung.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto"
          >
            <Link href="/sign-up">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-sky-400 px-8 py-3.5 text-sm font-semibold text-white shadow-xl shadow-indigo-500/25 hover:opacity-90 transition-all cursor-pointer">
                Kostenlos starten <ArrowRight className="h-4 w-4" />
              </motion.button>
            </Link>
            <Link href="/support">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-7 py-3.5 text-sm font-medium text-white/70 hover:bg-white/[0.08] hover:text-white transition-all cursor-pointer">
                <MessageSquare className="h-4 w-4 text-sky-400" /> Support kontaktieren
              </motion.button>
            </Link>
          </motion.div>

          {/* Interactive Live-Preview Component */}
          <motion.div
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-14 w-full max-w-4xl rounded-2xl border border-white/10 bg-[#0d0d12]/90 backdrop-blur-xl shadow-2xl overflow-hidden text-left"
          >
            {/* Header / Tabs */}
            <div className="flex items-center justify-between border-b border-white/[0.08] bg-white/[0.02] px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500/60" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                <div className="h-3 w-3 rounded-full bg-green-500/60" />
                <span className="ml-2 text-xs font-mono text-white/30">clyven.app/workspace</span>
              </div>
              <div className="flex rounded-lg bg-black/40 p-1 border border-white/5">
                <button
                  onClick={() => setActiveTab("note")}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-all cursor-pointer ${
                    activeTab === "note" ? "bg-indigo-600/80 text-white shadow" : "text-white/40 hover:text-white"
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" /> Live Notes
                </button>
                <button
                  onClick={() => setActiveTab("timer")}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-all cursor-pointer ${
                    activeTab === "timer" ? "bg-indigo-600/80 text-white shadow" : "text-white/40 hover:text-white"
                  }`}
                >
                  <Timer className="h-3.5 w-3.5" /> Focus Mode
                </button>
              </div>
            </div>

            {/* Preview Body */}
            <div className="p-6 min-h-[260px] flex items-center justify-center">
              {activeTab === "note" ? (
                <div className="w-full space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Notiz-Editor</span>
                    <span className="rounded-md bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-[10px] text-indigo-300">
                      Vernetzt mit [[Projekt Alpha]]
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white"># Q3 Produkt-Roadmap & AI Features</h3>
                  <p className="text-sm text-white/60 leading-relaxed font-mono bg-white/[0.02] p-4 rounded-xl border border-white/5">
                    - Implementierung von <span className="text-sky-400 font-semibold">[[Smart Notes]]</span> mit KI-Assistent<br />
                    - Erstellung von wöchentlichen Journal-Summaries mit Mood-Analyse<br />
                    - Integration von binauralen Ambient Soundscapes (<span className="text-indigo-300">Rain, Lofi, White Noise</span>)
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-4 text-center w-full">
                  <div className="mb-2 text-xs text-indigo-300 uppercase tracking-widest font-mono">Pomodoro Session</div>
                  <div className="text-5xl font-mono font-bold text-white tracking-wider my-2">
                    {formatTime(demoTimeLeft)}
                  </div>
                  <div className="flex items-center gap-3 mt-4">
                    <button
                      onClick={toggleDemoTimer}
                      className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-all cursor-pointer shadow-lg shadow-indigo-500/30"
                    >
                      {demoTimerRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                      {demoTimerRunning ? "Pause" : "Start Focus"}
                    </button>
                    <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs text-white/60">
                      <Headphones className="h-3.5 w-3.5 text-sky-400" /> Soundscape: Rain Loop
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Feature Showcase (3 Main Pillars) */}
      <section id="features" className="px-6 py-28 scroll-mt-20 relative z-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-20 text-center">
            <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              className="mb-3 text-xs font-semibold uppercase tracking-widest text-indigo-400">
              Hauptpfeiler von Clyven
            </motion.p>
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="text-3xl font-bold text-white sm:text-5xl">
              Entworfen für Höchstleistung & Struktur
            </motion.h2>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {MAIN_PILLARS.map((pillar, i) => (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className={`group relative flex flex-col justify-between rounded-3xl border ${pillar.borderColor} bg-gradient-to-b ${pillar.color} p-8 backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/10`}
              >
                <div>
                  <div className="mb-6 flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 border border-white/10 text-sky-300">
                      <pillar.icon className="h-6 w-6" />
                    </div>
                    <span className="text-[10px] font-mono tracking-widest uppercase text-white/30 border border-white/10 px-2.5 py-1 rounded-full bg-black/30">
                      {pillar.badge}
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold text-white">{pillar.title}</h3>
                  <p className="mt-1 text-xs font-medium text-sky-300 mb-4">{pillar.tagline}</p>
                  <p className="text-sm text-white/60 leading-relaxed mb-6">{pillar.description}</p>
                </div>

                <div className="pt-6 border-t border-white/10">
                  <ul className="space-y-2.5">
                    {pillar.highlights.map((h) => (
                      <li key={h} className="flex items-center gap-2 text-xs text-white/70">
                        <Check className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section id="comparison" className="px-6 py-24 scroll-mt-20 border-t border-white/[0.08] bg-white/[0.01]">
        <div className="mx-auto max-w-4xl">
          <div className="mb-16 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-indigo-400">Vergleich</p>
            <h2 className="text-3xl font-bold text-white sm:text-4xl">Free vs. CLYVEN PLUS</h2>
            <p className="mt-3 text-sm text-white/50">Transparente Funktionen ohne versteckte Kosten.</p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c12]/80 backdrop-blur-md shadow-xl">
            <div className="grid grid-cols-3 border-b border-white/10 bg-white/[0.03] p-4 text-xs font-semibold uppercase tracking-wider text-white/50">
              <div>Funktion</div>
              <div className="text-center">Free Plan</div>
              <div className="text-center text-sky-300">CLYVEN PLUS</div>
            </div>

            {COMPARISON.map((row, idx) => (
              <div key={idx} className="grid grid-cols-3 border-b border-white/[0.06] p-4 text-sm text-white/70 hover:bg-white/[0.02] transition-colors items-center">
                <div className="font-medium text-white/90">{row.feature}</div>
                <div className="text-center text-xs text-white/50">{row.free}</div>
                <div className="text-center text-xs font-semibold text-sky-300">{row.plus}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-2xl">
          <div className="mb-12 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-indigo-400">FAQ</p>
            <h2 className="text-3xl font-bold text-white">Häufig gestellte Fragen</h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between px-6 py-4 text-left text-sm font-medium text-white/90 hover:text-white transition-colors cursor-pointer"
                >
                  {faq.q}
                  <ChevronDown className={`h-4 w-4 text-white/40 transition-transform ${openFaq === i ? "rotate-180 text-sky-400" : ""}`} />
                </button>
                {openFaq === i && (
                  <motion.div
                    initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                    className="border-t border-white/5 px-6 pb-4 pt-3 text-xs sm:text-sm text-white/50 leading-relaxed"
                  >
                    {faq.a}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final Bottom Call to Action */}
      <section className="px-6 pb-28 pt-10">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="rounded-3xl border border-indigo-500/30 bg-gradient-to-b from-indigo-950/40 via-[#0d0d14] to-[#080808] p-10 sm:p-14 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Sparkles className="h-32 w-32 text-indigo-400" />
            </div>

            <h2 className="mb-4 text-3xl sm:text-4xl font-extrabold text-white">Bereit für deinen neuen Second Brain?</h2>
            <p className="mb-8 text-sm sm:text-base text-white/50 max-w-lg mx-auto leading-relaxed">
              Erstelle deinen kostenlosen Account in wenigen Sekunden. Keine Kreditkarte erforderlich.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/sign-up">
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-indigo-500 to-sky-400 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 hover:opacity-90 transition-all cursor-pointer">
                  Kostenlos starten
                </motion.button>
              </Link>
              <Link href="/support">
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className="w-full sm:w-auto rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3.5 text-sm font-medium text-white/70 hover:bg-white/[0.08] hover:text-white transition-all cursor-pointer">
                  Support kontaktieren
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] px-6 py-8 relative z-10 bg-[#060606]">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <img src={`${basePath}/logo.svg`} alt="CLYVEN" className="h-5 w-5" />
            <span className="text-xs font-bold tracking-[0.2em] text-white/40">CLYVEN</span>
          </div>
          <div className="flex gap-6 text-xs text-white/40 items-center">
            <Link href="/privacy"><span className="hover:text-white cursor-pointer transition-colors">Datenschutz</span></Link>
            <Link href="/impressum"><span className="hover:text-white cursor-pointer transition-colors">Impressum</span></Link>
            <a href="https://github.com/offical-atsch16/clyven.app" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer">
              <Github className="h-3.5 w-3.5" /> GitHub
            </a>
            <a href="https://stats.uptimerobot.com/rS9J6TmeMj" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer">
              <Activity className="h-3.5 w-3.5" /> Status Page
            </a>
          </div>
          <p className="text-xs text-white/30">© 2026 CLYVEN</p>
        </div>
      </footer>
    </div>
  );
}
