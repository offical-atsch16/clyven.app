import { motion, useScroll, useTransform, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Link } from "wouter";
import {
  FileText, Timer, BookOpen, Bookmark, BarChart2,
  ArrowRight, ChevronDown, Check, Sparkles, Menu, X, Github, Activity,
  Play, Pause, Headphones, MessageSquare, Layers, ShieldCheck, Zap,
  CheckCircle2, Compass, Cpu, Lock, ArrowUpRight, Globe, Layers3, Flame,
  Clock, Calendar, Star, Sparkle, Command, Sliders, HardDrive, RefreshCw
} from "lucide-react";
import { useUser } from "@clerk/react";
import { useCookieBanner } from "../hooks/useCookieBanner";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

// Ambient floating metric badges
const HIGHLIGHT_BADGES = [
  { icon: Cpu, label: "Sub-50ms Response", color: "text-amber-400 border-amber-500/20 bg-amber-500/5" },
  { icon: Sparkles, label: "Gemini 2.5 Pro AI", color: "text-sky-400 border-sky-500/20 bg-sky-500/5" },
  { icon: Lock, label: "End-to-End Encrypted", color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" },
  { icon: Headphones, label: "Binaural Ambient Audio", color: "text-purple-400 border-purple-500/20 bg-purple-500/5" },
];

// Bento items definition
const BENTO_FEATURES = [
  {
    id: "notes",
    title: "Bidirectionales Mind-Mapping",
    subtitle: "SMART NOTES & BACKLINKS",
    description: "Verknüpfe deine Notizen mühelos mit `[[Graph Links]]`. Dein Wissen entwickelt sich organisch wie ein persönliches Gehirn-Netzwerk.",
    badge: "01 / WISSEN",
    colSpan: "lg:col-span-2",
    accentGlow: "from-[#D4AF37]/20 to-[#38BDF8]/10",
    borderAccent: "group-hover:border-[#D4AF37]/40",
    icon: FileText,
    previewContent: (
      <div className="space-y-3 font-mono text-xs text-white/70">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
          <span className="text-[#D4AF37] font-semibold">[[Projekt Horizon]]</span>
          <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-sky-400">3 Backlinks</span>
        </div>
        <p className="text-white/60 leading-relaxed">
          - Hauptfokus: Strategische Vernetzung von <span className="text-sky-300 underline underline-offset-2">[[Fokus-Sessions]]</span> mit täglichen KI-Zusammenfassungen.<br />
          - Erforderliche Module: <span className="text-amber-300">#architecture</span> <span className="text-purple-300">#system-design</span>
        </p>
      </div>
    ),
  },
  {
    id: "focus",
    title: "Deep Work Focus Timer",
    subtitle: "POMODORO & SOUNDSCAPES",
    description: "Integrierte Ambient Audio Loops (Lofi, Regen, White Noise) kombiniert mit exakter Session-Analyse für maximale Ablenkungsfreiheit.",
    badge: "02 / FOKUS",
    colSpan: "lg:col-span-1",
    accentGlow: "from-sky-500/20 to-indigo-500/10",
    borderAccent: "group-hover:border-sky-500/40",
    icon: Timer,
    previewContent: (
      <div className="flex flex-col items-center justify-center py-2 text-center">
        <span className="text-3xl font-mono font-bold tracking-widest text-white">25 : 00</span>
        <div className="mt-3 flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-[11px] text-sky-300">
          <Headphones className="h-3 w-3 animate-pulse text-sky-400" /> Rain Soundscape Active
        </div>
      </div>
    ),
  },
  {
    id: "journal",
    title: "Reflektives AI-Journaling",
    subtitle: "GEFÜHRTE INSIGHTS",
    description: "Verstehe deine Denkmuster durch wöchentliche Mood-Analytics und intelligente Zusammenfassungen angetrieben von Gemini 2.5 Pro.",
    badge: "03 / REFLEXION",
    colSpan: "lg:col-span-1",
    accentGlow: "from-purple-500/20 to-[#D4AF37]/10",
    borderAccent: "group-hover:border-purple-500/40",
    icon: BookOpen,
    previewContent: (
      <div className="space-y-2 text-xs">
        <div className="flex items-center gap-2 text-emerald-400">
          <Sparkle className="h-3.5 w-3.5" />
          <span className="font-semibold">KI-Wochen-Synthese</span>
        </div>
        <p className="text-white/60 text-[11px] leading-relaxed">
          "Höchste Produktivität am Dienstag während der 90-Minuten Deep-Work-Phase. Empfehlung: Morgen-Focus-Sessions priorisieren."
        </p>
      </div>
    ),
  },
  {
    id: "tasks",
    title: "Kanban, Gantt & Subtasks",
    subtitle: "AUFGABEN & ZEITERFASSUNG",
    description: "Kein Wechsel zwischen Tools mehr. Manage Projekte, Kanban Boards und benutzerdefinierte Felder direkt in deiner Arbeitsumgebung.",
    badge: "04 / STRATEGIE",
    colSpan: "lg:col-span-2",
    accentGlow: "from-[#D4AF37]/20 to-emerald-500/10",
    borderAccent: "group-hover:border-[#D4AF37]/40",
    icon: Layers,
    previewContent: (
      <div className="grid grid-cols-3 gap-2 text-[11px]">
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-2">
          <span className="text-white/40 block mb-1">To Do</span>
          <div className="rounded bg-white/5 p-1.5 font-medium text-white/80">API Redesign</div>
        </div>
        <div className="rounded-lg border border-sky-500/20 bg-sky-500/5 p-2">
          <span className="text-sky-400 block mb-1">In Progress</span>
          <div className="rounded bg-sky-500/20 p-1.5 font-medium text-sky-200">Glass UI Engine</div>
        </div>
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2">
          <span className="text-emerald-400 block mb-1">Done</span>
          <div className="rounded bg-emerald-500/20 p-1.5 font-medium text-emerald-200">Supabase Sync</div>
        </div>
      </div>
    ),
  },
];

const COMPARISON = [
  { feature: "Anzahl Notizen & Bookmarks", free: "10 Limit", plus: "Unbegrenzt" },
  { feature: "Aufgaben, Kanban & Gantt", free: "10 To-Dos Limit", plus: "Unbegrenzt inkl. Custom Fields" },
  { feature: "Focus Timer & Ambience", free: "Standard Audio", plus: "Alle Hi-Fi Soundscapes" },
  { feature: "CLYVEN AI Assistent & Journal AI", free: "—", plus: "Unbegrenzt (Gemini 2.5 Pro)" },
  { feature: "Datei-Uploads & Anhänge", free: "—", plus: "100 MB pro Datei (180 MB Note Max)" },
  { feature: "Markdown & PDF Export", free: "Standard Export", plus: "Unbegrenzter High-Res Export" },
  { feature: "Priority Support & Early Access", free: "Community Support", plus: "24/7 VIP Support" },
];

const FAQS = [
  {
    q: "Was unterscheidet Clyven von herkömmlichen Notiz-Apps?",
    a: "Clyven vereint Notizen, Focus-Timer, Journaling und Aufgabenverwaltung in einer extrem schnellen, dunklen Luxus-SaaS-Oberfläche. Du musst nicht mehr zwischen Notion, Pomodoro-Apps und Trello wechseln."
  },
  {
    q: "Ist der Einstieg in Clyven wirklich dauerhaft kostenlos?",
    a: "Ja. Unser Free-Tarif ist dauerhaft kostenlos ohne Eingabe von Zahlungsdaten. Du erhältst Zugriff auf alle Kern-Funktionen für bis zu 10 Notizen, Bookmarks und Tasks."
  },
  {
    q: "Wie sicher sind meine vertraulichen Daten und Dokumente?",
    a: "Alle deine Notizen, Tagebucheinträge und Dateien werden nach höchsten europäischen Sicherheitsstandards verschlüsselt gespeichert und niemals an Dritte verkauft oder für KI-Training verwendet."
  },
  {
    q: "Was bietet der CLYVEN PLUS Tarif?",
    a: "CLYVEN PLUS (im System als Business-Plan hinterlegt für nur 5 $ / Monat) hebt alle Limits auf, schaltet die KI-Assistenten frei, ermöglicht Kanban- & Gantt-Ansichten sowie unbegrenzte Ambient-Audio-Streams."
  },
  {
    q: "Wie funktioniert die Kündigung von CLYVEN PLUS?",
    a: "Du kannst dein Abonnement jederzeit mit einem einzigen Klick direkt in deinen Systemeinstellungen kündigen – ohne Fristen oder versteckte Gebühren."
  }
];

export function Landing() {
  const { user } = useUser();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const yHero = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const opacityHero = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Live Interactive Demo State for Hero 3D Showcase
  const [activeTab, setActiveTab] = useState<"notes" | "focus" | "journal" | "kanban">("notes");
  const [demoTimerRunning, setDemoTimerRunning] = useState(false);
  const [demoTimeLeft, setDemoTimeLeft] = useState(25 * 60);
  const [activeSound, setActiveSound] = useState<"rain" | "lofi" | "white-noise">("rain");
  const [soundPlaying, setSoundPlaying] = useState(false);

  // Interactive 3D Card Perspective Tilt
  const cardX = useMotionValue(0);
  const cardY = useMotionValue(0);
  const rotateX = useSpring(useTransform(cardY, [-200, 200], [10, -10]), { stiffness: 150, damping: 20 });
  const rotateY = useSpring(useTransform(cardX, [-200, 200], [-10, 10]), { stiffness: 150, damping: 20 });

  useCookieBanner();

  // Handle Mouse Movement for 3D Tilt Effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    cardX.set(e.clientX - centerX);
    cardY.set(e.clientY - centerY);
  };

  const handleMouseLeave = () => {
    cardX.set(0);
    cardY.set(0);
  };

  // Demo Timer interval
  useEffect(() => {
    let interval: any = null;
    if (demoTimerRunning && demoTimeLeft > 0) {
      interval = setInterval(() => setDemoTimeLeft((prev) => prev - 1), 1000);
    } else if (demoTimeLeft === 0) {
      setDemoTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [demoTimerRunning, demoTimeLeft]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className="min-h-[100dvh] overflow-x-hidden bg-[#090A0F] text-[#FAFAFA] selection:bg-[#D4AF37]/30 selection:text-white font-sans"
    >
      {/* Background Dark Luxury Mesh & Animated Orbs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {/* Subtle Champagne Glow Orb */}
        <div
          className="absolute -top-[10%] left-1/2 h-[700px] w-[900px] -translate-x-1/2 rounded-full opacity-[0.14] blur-[150px] animate-pulse"
          style={{ background: "radial-gradient(circle, #D4AF37 0%, #38BDF8 45%, transparent 75%)" }}
        />
        {/* Subtle Cyan Light Orb */}
        <div
          className="absolute top-[45%] -left-[15%] h-[600px] w-[600px] rounded-full opacity-[0.08] blur-[140px]"
          style={{ background: "radial-gradient(circle, #38BDF8 0%, #6366F1 50%, transparent 80%)" }}
        />
        {/* Subtle Deep Gold Bottom Ambient Glow */}
        <div
          className="absolute -bottom-[20%] right-[5%] h-[700px] w-[700px] rounded-full opacity-[0.10] blur-[160px]"
          style={{ background: "radial-gradient(circle, #D4AF37 0%, transparent 70%)" }}
        />
        {/* Noise / Mesh Overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px)", backgroundSize: "28px 28px" }}
        />
      </div>

      {/* Navigation Bar */}
      <header className="fixed top-0 z-50 w-full border-b border-white/[0.08] bg-[#090A0F]/80 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.05] border border-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] group-hover:border-[#D4AF37]/50 transition-colors">
                <img src={`${basePath}/logo.svg`} alt="CLYVEN" className="h-5 w-5 transition-transform group-hover:scale-105" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-[0.25em] text-white">CLYVEN</span>
                <span className="text-[9px] font-mono tracking-widest text-[#D4AF37] opacity-80 uppercase">Luxury Workspace</span>
              </div>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-medium tracking-wide text-white/70">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#bento" className="hover:text-white transition-colors">System</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <Link href="/pricing"><span className="hover:text-white transition-colors cursor-pointer">Tarife</span></Link>
            <Link href="/support"><span className="hover:text-white transition-colors cursor-pointer">Support</span></Link>
            <Link href="/documentation"><span className="hover:text-white transition-colors cursor-pointer">Docs</span></Link>
          </nav>

          {/* Desktop Auth CTAs */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <Link href="/dashboard">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="rounded-xl border border-[#D4AF37]/40 bg-gradient-to-r from-[#D4AF37]/20 via-[#38BDF8]/20 to-white/10 px-5 py-2.5 text-xs font-semibold text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] backdrop-blur-md hover:border-[#D4AF37] transition-all cursor-pointer flex items-center gap-2"
                >
                  <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" /> Dashboard →
                </motion.button>
              </Link>
            ) : (
              <>
                <Link href="/sign-in">
                  <button className="px-4 py-2 text-xs font-medium text-white/70 hover:text-white transition-colors cursor-pointer">
                    Anmelden
                  </button>
                </Link>
                <Link href="/sign-up">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="rounded-xl border border-white/20 bg-white/[0.08] px-5 py-2.5 text-xs font-semibold text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)] backdrop-blur-lg hover:bg-white/15 transition-all cursor-pointer flex items-center gap-2"
                  >
                    Kostenlos starten
                    <ArrowUpRight className="h-3.5 w-3.5 text-[#D4AF37]" />
                  </motion.button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden border-t border-white/[0.08] bg-[#0C0E17]/95 px-6 py-6 backdrop-blur-2xl space-y-4"
            >
              <div className="flex flex-col gap-3 text-sm text-white/70">
                <a href="#features" onClick={() => setMobileMenuOpen(false)} className="hover:text-white py-1.5">Features</a>
                <a href="#bento" onClick={() => setMobileMenuOpen(false)} className="hover:text-white py-1.5">System Bento</a>
                <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="hover:text-white py-1.5">Pricing</a>
                <Link href="/pricing"><span onClick={() => setMobileMenuOpen(false)} className="hover:text-white py-1.5 block cursor-pointer">Tarife</span></Link>
                <Link href="/support"><span onClick={() => setMobileMenuOpen(false)} className="hover:text-white py-1.5 block cursor-pointer">Support</span></Link>
                <Link href="/documentation"><span onClick={() => setMobileMenuOpen(false)} className="hover:text-white py-1.5 block cursor-pointer">Dokumentation</span></Link>
              </div>

              <div className="pt-4 border-t border-white/[0.08] flex flex-col gap-2.5">
                {user ? (
                  <Link href="/dashboard">
                    <button className="w-full rounded-xl border border-[#D4AF37]/50 bg-[#D4AF37]/20 py-3 text-xs font-semibold text-white shadow-lg">
                      Dashboard öffnen →
                    </button>
                  </Link>
                ) : (
                  <>
                    <Link href="/sign-up">
                      <button className="w-full rounded-xl bg-white py-3 text-xs font-semibold text-black shadow-md">
                        Kostenlos registrieren
                      </button>
                    </Link>
                    <Link href="/sign-in">
                      <button className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-3 text-xs font-medium text-white/80">
                        Anmelden
                      </button>
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Hero Section */}
      <section ref={heroRef} className="relative flex min-h-[100dvh] flex-col items-center justify-center px-6 pt-32 pb-20 overflow-hidden">
        <motion.div style={{ y: yHero, opacity: opacityHero }} className="relative z-10 flex flex-col items-center text-center max-w-5xl mx-auto">

          {/* Top Pill Tag */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-1.5 text-xs font-medium text-[#D4AF37] backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#38BDF8] animate-pulse" />
            <span className="tracking-wide">DAS LUXUS WORKSPACE OPERATING SYSTEM</span>
          </motion.div>

          {/* Main Hero Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-6 text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]"
          >
            Denke ohne Grenzen. <br />
            <span className="bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              Arbeite in absoluter Klarheit.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-10 max-w-2xl text-base sm:text-lg text-white/60 leading-relaxed font-normal"
          >
            Vernetzte Markdown-Notizen, geführte KI-Analysen und binaurale Focus Soundscapes vereint in einer atemberaubenden, dunklen Ästhetik.
          </motion.p>

          {/* Action CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-12"
          >
            <Link href="/sign-up">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl border border-[#D4AF37]/50 bg-gradient-to-r from-[#D4AF37] via-[#f3d37a] to-[#38BDF8] px-8 py-4 text-xs sm:text-sm font-bold text-black shadow-xl shadow-[#D4AF37]/20 hover:opacity-95 transition-all cursor-pointer"
              >
                Kostenlos ausprobieren <ArrowRight className="h-4 w-4" />
              </motion.button>
            </Link>

            <a href="#features">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-8 py-4 text-xs sm:text-sm font-medium text-white/80 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] hover:bg-white/[0.08] hover:text-white transition-all cursor-pointer"
              >
                Features erkunden
              </motion.button>
            </a>
          </motion.div>

          {/* Floating Metric Badges Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="flex flex-wrap items-center justify-center gap-3 max-w-4xl"
          >
            {HIGHLIGHT_BADGES.map((b) => (
              <div
                key={b.label}
                className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] font-medium backdrop-blur-md shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] ${b.color}`}
              >
                <b.icon className="h-3.5 w-3.5" />
                <span>{b.label}</span>
              </div>
            ))}
          </motion.div>

          {/* Interactive 3D Floating Glass Mockup Container */}
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.4 }}
            className="mt-16 w-full max-w-5xl [perspective:1000px]"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <motion.div
              style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
              className="relative rounded-3xl border border-white/[0.12] bg-[#12141D]/90 backdrop-blur-2xl shadow-2xl shadow-black/80 overflow-hidden text-left p-1 border-gradient group"
            >
              {/* Inner Glow Overlay */}
              <div className="absolute inset-0 pointer-events-none rounded-3xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)] z-20" />

              {/* Mockup Top Window Bar */}
              <div className="flex items-center justify-between border-b border-white/[0.08] bg-white/[0.02] px-6 py-3.5">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500/80" />
                  <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-3 text-xs font-mono text-white/40 flex items-center gap-1.5">
                    <Lock className="h-3 w-3 text-emerald-400" /> clyven.app/workspace/luxury-mode
                  </span>
                </div>

                {/* Interactive Feature Tabs */}
                <div className="flex items-center gap-1.5 rounded-xl bg-black/50 p-1 border border-white/10">
                  <button
                    onClick={() => setActiveTab("notes")}
                    className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === "notes"
                        ? "bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] shadow"
                        : "text-white/50 hover:text-white"
                    }`}
                  >
                    <FileText className="h-3.5 w-3.5" /> Smart Notes
                  </button>
                  <button
                    onClick={() => setActiveTab("focus")}
                    className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === "focus"
                        ? "bg-sky-500/20 border border-sky-400/40 text-sky-300 shadow"
                        : "text-white/50 hover:text-white"
                    }`}
                  >
                    <Timer className="h-3.5 w-3.5" /> Focus Mode
                  </button>
                  <button
                    onClick={() => setActiveTab("journal")}
                    className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === "journal"
                        ? "bg-purple-500/20 border border-purple-400/40 text-purple-300 shadow"
                        : "text-white/50 hover:text-white"
                    }`}
                  >
                    <BookOpen className="h-3.5 w-3.5" /> AI Journal
                  </button>
                  <button
                    onClick={() => setActiveTab("kanban")}
                    className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === "kanban"
                        ? "bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 shadow"
                        : "text-white/50 hover:text-white"
                    }`}
                  >
                    <Layers className="h-3.5 w-3.5" /> Tasks
                  </button>
                </div>
              </div>

              {/* Mockup Preview Dynamic Content Body */}
              <div className="p-8 min-h-[320px] flex items-center justify-center bg-gradient-to-b from-[#12141D] to-[#0A0B10]">
                {activeTab === "notes" && (
                  <div className="w-full space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono uppercase tracking-widest text-[#D4AF37]">Markdown & Graph Links</span>
                      <span className="rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 px-3 py-1 text-[11px] text-[#D4AF37]">
                        Verknüpft mit [[Architektur 2026]]
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-white tracking-tight"># System Architektur & Second Brain Engine</h3>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 font-mono text-xs text-white/70 leading-relaxed shadow-inner space-y-2">
                      <p>- <span className="text-[#38BDF8] font-semibold">[[Notizen]]</span> werden bidirektional in der Graph-Datenbank verknüpft.</p>
                      <p>- Automatische KI-Gliederung durch <span className="text-[#D4AF37]">CLYVEN AI</span> (Gemini 2.5 Pro Integration).</p>
                      <p>- Integriertes Code Syntax Highlighting & unbegrenzte Verschachtelung.</p>
                    </div>
                  </div>
                )}

                {activeTab === "focus" && (
                  <div className="flex flex-col items-center justify-center py-4 text-center w-full">
                    <span className="text-xs font-mono uppercase tracking-widest text-sky-400 mb-2">Deep Work Session</span>
                    <div className="text-6xl font-mono font-extrabold text-white tracking-wider my-3 drop-shadow-[0_0_20px_rgba(56,189,248,0.3)]">
                      {formatTime(demoTimeLeft)}
                    </div>

                    {/* Audio & Controls */}
                    <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
                      <button
                        onClick={() => setDemoTimerRunning(!demoTimerRunning)}
                        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-sky-500/25 hover:opacity-90 transition-all cursor-pointer"
                      >
                        {demoTimerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        {demoTimerRunning ? "Session Pausieren" : "Focus Starten"}
                      </button>

                      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-1">
                        {(["rain", "lofi", "white-noise"] as const).map((s) => (
                          <button
                            key={s}
                            onClick={() => { setActiveSound(s); setSoundPlaying(true); }}
                            className={`px-3 py-1.5 text-[11px] font-medium rounded-lg transition-colors cursor-pointer capitalize ${
                              activeSound === s ? "bg-sky-500/20 text-sky-300 border border-sky-400/30" : "text-white/40 hover:text-white"
                            }`}
                          >
                            {s === "white-noise" ? "White Noise" : s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "journal" && (
                  <div className="w-full space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono uppercase tracking-widest text-purple-400">Reflektives Tagebuch</span>
                      <span className="rounded-full bg-purple-500/10 border border-purple-500/30 px-3 py-1 text-[11px] text-purple-300">
                        Stimmung: ⚡ Produktiv & Gelassen
                      </span>
                    </div>
                    <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-5 space-y-3">
                      <div className="flex items-center gap-2 text-purple-300 text-xs font-semibold">
                        <Sparkles className="h-4 w-4" /> Wöchentlicher KI-Journal-Insight
                      </div>
                      <p className="text-xs text-white/70 leading-relaxed font-sans">
                        Deine Reflexionen zeigen eine erhebliche Steigerung der Konzentration durch die Nutzung von Binaural Rain Loops. Die meisten Aufgaben wurden in unter 45 Minuten abgeschlossen.
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === "kanban" && (
                  <div className="w-full space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono uppercase tracking-widest text-emerald-400">Kanban Board & Custom Fields</span>
                      <span className="text-xs text-white/40">3 Active Sprints</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-2">
                        <span className="text-[10px] font-mono uppercase text-white/40">Backlog</span>
                        <div className="rounded-lg bg-white/5 p-2.5 text-xs text-white/80 font-medium border border-white/5">
                          Markdown Sync Optimization
                        </div>
                      </div>
                      <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-3 space-y-2">
                        <span className="text-[10px] font-mono uppercase text-sky-400">In Progress</span>
                        <div className="rounded-lg bg-sky-500/20 p-2.5 text-xs text-sky-200 font-medium border border-sky-400/20">
                          Floating 3D Glass Surface Engine
                        </div>
                      </div>
                      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 space-y-2">
                        <span className="text-[10px] font-mono uppercase text-emerald-400">Completed</span>
                        <div className="rounded-lg bg-emerald-500/20 p-2.5 text-xs text-emerald-200 font-medium border border-emerald-400/20">
                          Gemini 2.5 AI Integration
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Feature Bento Grid Section */}
      <section id="bento" className="px-6 py-28 relative z-10 scroll-mt-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-20 text-center">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="mb-3 text-xs font-mono uppercase tracking-widest text-[#D4AF37]"
            >
              Architektur des Systems
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl font-extrabold text-white sm:text-5xl tracking-tight"
            >
              Asymmetrische Perfektion. <br />
              <span className="bg-gradient-to-r from-white via-zinc-300 to-zinc-500 bg-clip-text text-transparent">
                Alles was du brauchst, nahtlos vereint.
              </span>
            </motion.h2>
          </div>

          {/* Bento Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {BENTO_FEATURES.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.12 }}
                className={`group relative flex flex-col justify-between rounded-3xl border border-white/[0.08] bg-[#12141D]/80 p-8 backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:bg-white/[0.05] ${item.colSpan} ${item.borderAccent}`}
              >
                {/* Background Ambient Glow */}
                <div className={`pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br ${item.accentGlow} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                <div>
                  <div className="mb-6 flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.05] border border-white/10 text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]">
                      <item.icon className="h-6 w-6 text-[#D4AF37]" />
                    </div>
                    <span className="text-[10px] font-mono tracking-widest uppercase text-white/40 border border-white/10 px-3 py-1 rounded-full bg-black/40">
                      {item.badge}
                    </span>
                  </div>

                  <span className="text-[11px] font-mono tracking-wider text-[#38BDF8] uppercase font-semibold block mb-1">
                    {item.subtitle}
                  </span>
                  <h3 className="text-2xl font-bold text-white tracking-tight mb-3">{item.title}</h3>
                  <p className="text-sm text-white/60 leading-relaxed mb-8">{item.description}</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/40 p-4 backdrop-blur-md shadow-inner">
                  {item.previewContent}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing & Comparison Section */}
      <section id="pricing" className="px-6 py-28 relative z-10 scroll-mt-20 border-t border-white/[0.08] bg-[#0A0B10]">
        <div className="mx-auto max-w-6xl">
          <div className="mb-20 text-center">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="mb-3 text-xs font-mono uppercase tracking-widest text-[#D4AF37]"
            >
              Transparenz ohne Haken
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl font-extrabold text-white sm:text-5xl"
            >
              Wähle dein Level an Fokus.
            </motion.h2>
            <p className="mt-4 text-sm text-white/50 max-w-lg mx-auto">
              Starte dauerhaft kostenlos oder schalte mit CLYVEN PLUS unbegrenzte Werkzeuge frei.
            </p>
          </div>

          {/* Pricing Cards (Free & CLYVEN PLUS) */}
          <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto mb-20">
            {/* Free Plan Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-3xl border border-white/[0.08] bg-[#12141D]/60 p-8 flex flex-col justify-between backdrop-blur-xl relative"
            >
              <div>
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white">Free Plan</h3>
                  <p className="mt-1 text-xs text-white/40">Perfekt zum Ausprobieren und Testen</p>
                </div>
                <div className="mb-6 flex items-baseline gap-1">
                  <span className="text-5xl font-extrabold text-white tracking-tight">0 €</span>
                  <span className="text-xs font-mono text-white/40">/ dauerhaft frei</span>
                </div>
                <ul className="space-y-3.5 mb-8 text-xs text-white/70">
                  <li className="flex items-center gap-2.5"><Check className="h-4 w-4 text-white/40 shrink-0" /> Max. 10 Notizen</li>
                  <li className="flex items-center gap-2.5"><Check className="h-4 w-4 text-white/40 shrink-0" /> Max. 10 Bookmarks</li>
                  <li className="flex items-center gap-2.5"><Check className="h-4 w-4 text-white/40 shrink-0" /> Max. 10 Aufgaben & To-Dos</li>
                  <li className="flex items-center gap-2.5"><Check className="h-4 w-4 text-white/40 shrink-0" /> Focus Timer & Ambient Sounds</li>
                  <li className="flex items-center gap-2.5"><Check className="h-4 w-4 text-white/40 shrink-0" /> Community Support</li>
                </ul>
              </div>
              <Link href="/sign-up">
                <button className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3.5 text-xs font-semibold text-white hover:bg-white/[0.08] transition-all cursor-pointer">
                  Kostenlos starten
                </button>
              </Link>
            </motion.div>

            {/* CLYVEN PLUS Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
              className="relative rounded-3xl border border-[#D4AF37]/40 bg-gradient-to-b from-[#D4AF37]/10 via-[#12141D] to-[#12141D] p-8 flex flex-col justify-between shadow-2xl shadow-[#D4AF37]/10 backdrop-blur-xl"
            >
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full border border-[#D4AF37] bg-[#D4AF37] px-4 py-1 text-[10px] font-bold text-black uppercase tracking-wider shadow-md">
                CLYVEN PLUS / POPULÄR
              </div>
              <div>
                <div className="mb-6">
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-bold text-white">CLYVEN PLUS</h3>
                    <span className="rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 px-2.5 py-0.5 text-[9px] font-bold text-[#D4AF37]">
                      BUSINESS TIER
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[#D4AF37]/80">Unbegrenzte Produktivität & alle KI-Features</p>
                </div>
                <div className="mb-6 flex items-baseline gap-1">
                  <span className="text-5xl font-extrabold text-white tracking-tight">5 $</span>
                  <span className="text-xs font-mono text-white/40">/ Monat (monatlich kündbar)</span>
                </div>
                <ul className="space-y-3.5 mb-8 text-xs text-white/90">
                  <li className="flex items-center gap-2.5"><Check className="h-4 w-4 text-[#D4AF37] shrink-0" /> Unbegrenzt Notizen, Bookmarks & Tasks</li>
                  <li className="flex items-center gap-2.5"><Check className="h-4 w-4 text-[#D4AF37] shrink-0" /> CLYVEN AI Assistent (Gemini 2.5 Pro)</li>
                  <li className="flex items-center gap-2.5"><Check className="h-4 w-4 text-[#D4AF37] shrink-0" /> Kanban Boards & Gantt-Diagramme</li>
                  <li className="flex items-center gap-2.5"><Check className="h-4 w-4 text-[#D4AF37] shrink-0" /> Custom Fields & Subtasks</li>
                  <li className="flex items-center gap-2.5"><Check className="h-4 w-4 text-[#D4AF37] shrink-0" /> Zeiterfassung & Timer-Log</li>
                  <li className="flex items-center gap-2.5"><Check className="h-4 w-4 text-[#D4AF37] shrink-0" /> Dateiuploads bis zu 100 MB pro Datei</li>
                  <li className="flex items-center gap-2.5"><Check className="h-4 w-4 text-[#D4AF37] shrink-0" /> Priority VIP Support</li>
                </ul>
              </div>
              <Link href="/pricing">
                <button className="w-full rounded-2xl border border-[#D4AF37]/60 bg-gradient-to-r from-[#D4AF37] to-[#f3d37a] py-3.5 text-xs font-bold text-black shadow-lg shadow-[#D4AF37]/20 hover:opacity-90 transition-all cursor-pointer">
                  Jetzt Upgraden →
                </button>
              </Link>
            </motion.div>
          </div>

          {/* B2B Request Banner */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-xl"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Teams & B2B Enterprise Lösungen</h4>
                <p className="text-xs text-white/50">Benötigst du Team-Lizenzen oder individuelle Rechnungsstellung? Schreib uns an <a href="mailto:billig@clyven.de" className="text-[#D4AF37] underline">billig@clyven.de</a>.</p>
              </div>
            </div>
            <a href="mailto:billig@clyven.de" className="shrink-0 rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-4 py-2 text-xs font-semibold text-[#D4AF37] hover:bg-[#D4AF37]/20 transition-all">
              B2B Anfrage senden
            </a>
          </motion.div>

          {/* Detailed Feature Comparison Matrix */}
          <div className="mt-16 overflow-hidden rounded-3xl border border-white/10 bg-[#12141D]/50 backdrop-blur-md">
            <div className="grid grid-cols-3 border-b border-white/10 bg-white/[0.02] p-4 text-xs font-mono uppercase text-white/50">
              <div>System Feature</div>
              <div className="text-center">Free</div>
              <div className="text-center text-[#D4AF37]">CLYVEN PLUS</div>
            </div>
            {COMPARISON.map((row, idx) => (
              <div key={idx} className="grid grid-cols-3 border-b border-white/[0.05] p-4 text-xs text-white/80 hover:bg-white/[0.02] transition-colors items-center">
                <div className="font-medium">{row.feature}</div>
                <div className="text-center text-white/40">{row.free}</div>
                <div className="text-center font-bold text-[#D4AF37]">{row.plus}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section className="px-6 py-28 relative z-10">
        <div className="mx-auto max-w-3xl">
          <div className="mb-16 text-center">
            <p className="mb-3 text-xs font-mono uppercase tracking-widest text-[#D4AF37]">Antworten</p>
            <h2 className="text-3xl font-extrabold text-white">Häufig gestellte Fragen</h2>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="overflow-hidden rounded-2xl border border-white/10 bg-[#12141D]/70 backdrop-blur-xl"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between px-6 py-5 text-left text-sm font-semibold text-white/90 hover:text-white transition-colors cursor-pointer"
                >
                  {faq.q}
                  <ChevronDown className={`h-4 w-4 text-white/40 transition-transform ${openFaq === i ? "rotate-180 text-[#D4AF37]" : ""}`} />
                </button>
                {openFaq === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-white/[0.06] px-6 pb-5 pt-3 text-xs sm:text-sm text-white/60 leading-relaxed font-sans"
                  >
                    {faq.a}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom Liquid Pulse CTA Section */}
      <section className="px-6 pb-28 pt-12 relative z-10">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative rounded-3xl border border-[#D4AF37]/30 bg-gradient-to-b from-[#12141D] via-[#0A0B10] to-[#090A0F] p-12 sm:p-16 shadow-2xl overflow-hidden backdrop-blur-2xl"
          >
            {/* Ambient Liquid Pulse Lighting */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1/2 bg-gradient-to-b from-[#D4AF37]/20 to-transparent blur-3xl pointer-events-none animate-pulse" />

            <div className="relative z-10">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-4 py-1 text-[11px] font-mono text-[#D4AF37] mb-6">
                <Sparkles className="h-3.5 w-3.5 text-[#38BDF8]" /> SECURE SECOND BRAIN
              </span>

              <h2 className="mb-4 text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                Bereit für deinen neuen Fokus-Standard?
              </h2>

              <p className="mb-8 text-sm sm:text-base text-white/50 max-w-lg mx-auto leading-relaxed">
                Erstelle deinen kostenlosen Account in wenigen Sekunden. Keine Kreditkarte erforderlich.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/sign-up">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full sm:w-auto rounded-2xl border border-[#D4AF37]/60 bg-gradient-to-r from-[#D4AF37] to-[#38BDF8] px-8 py-4 text-xs sm:text-sm font-bold text-black shadow-xl shadow-[#D4AF37]/20 hover:opacity-90 transition-all cursor-pointer"
                  >
                    Kostenlos starten
                  </motion.button>
                </Link>
                <Link href="/support">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full sm:w-auto rounded-2xl border border-white/10 bg-white/[0.04] px-7 py-4 text-xs sm:text-sm font-medium text-white/80 hover:bg-white/[0.08] hover:text-white transition-all cursor-pointer"
                  >
                    Support kontaktieren
                  </motion.button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] px-6 py-10 relative z-10 bg-[#06070B]">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/5 border border-white/10">
              <img src={`${basePath}/logo.svg`} alt="CLYVEN" className="h-3.5 w-3.5" />
            </div>
            <span className="text-xs font-bold tracking-[0.2em] text-white/50">CLYVEN</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-white/50">
            <Link href="/privacy"><span className="hover:text-white cursor-pointer transition-colors">Datenschutz</span></Link>
            <Link href="/impressum"><span className="hover:text-white cursor-pointer transition-colors">Impressum</span></Link>
            <a href="https://github.com/offical-atsch16/clyven.app" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer">
              <Github className="h-3.5 w-3.5" /> GitHub
            </a>
            <a href="https://stats.uptimerobot.com/rS9J6TmeMj" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer">
              <Activity className="h-3.5 w-3.5 text-emerald-400" /> Status Page
            </a>
          </div>

          <p className="text-xs text-white/30 font-mono">© 2026 CLYVEN. ALL RIGHTS RESERVED.</p>
        </div>
      </footer>
    </div>
  );
}
