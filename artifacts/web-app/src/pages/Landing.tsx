import { motion, useScroll, useTransform, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Link } from "wouter";
import {
  FileText, Timer, BookOpen, Bookmark,
  ArrowRight, ChevronDown, Check, Sparkles, Menu, X, Github, Activity,
  Play, Pause, Headphones, Layers, Lock, ArrowUpRight, Globe, Sparkle, Cpu, Mail, Send
} from "lucide-react";
import { useUser } from "@clerk/react";
import { useCookieBanner } from "../hooks/useCookieBanner";
import { api } from "../lib/api";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

// Minimalist Cyan / Glass Badges
const HIGHLIGHT_BADGES = [
  { icon: Cpu, label: "Sub-50ms Response", color: "text-cyan-400 border-cyan-500/20 bg-cyan-500/5" },
  { icon: Sparkles, label: "Gemini 2.5 Pro AI", color: "text-sky-400 border-sky-500/20 bg-sky-500/5" },
  { icon: Lock, label: "End-to-End Encrypted", color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" },
  { icon: Headphones, label: "Ambient Audio Engine", color: "text-blue-400 border-blue-500/20 bg-blue-500/5" },
];

// Minimal Bento items definition
const BENTO_FEATURES = [
  {
    id: "notes",
    title: "Bidirectional Mind-Mapping",
    subtitle: "SMART NOTES & BACKLINKS",
    description: "Connect your notes with `[[Graph Links]]`. Your knowledge evolves as a clear, searchable network.",
    badge: "01 / KNOWLEDGE",
    colSpan: "lg:col-span-2",
    icon: FileText,
    previewContent: (
      <div className="space-y-3 font-mono text-xs text-white/70">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
          <span className="text-cyan-400 font-semibold">[[Project Horizon]]</span>
          <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-sky-400">3 Backlinks</span>
        </div>
        <p className="text-white/60 leading-relaxed">
          - System focus: Interconnecting <span className="text-cyan-300 underline underline-offset-2">[[Focus Sessions]]</span> with journal summaries.<br />
          - Tags: <span className="text-sky-400">#architecture</span> <span className="text-blue-400">#minimalism</span>
        </p>
      </div>
    ),
  },
  {
    id: "focus",
    title: "Deep Work Focus Timer",
    subtitle: "POMODORO & AMBIENCE",
    description: "Distraction-free ambient soundscapes (Rain, Lofi, White Noise) for uninterrupted focus.",
    badge: "02 / FOCUS",
    colSpan: "lg:col-span-1",
    icon: Timer,
    previewContent: (
      <div className="flex flex-col items-center justify-center py-2 text-center">
        <span className="text-3xl font-mono font-bold tracking-widest text-white">25 : 00</span>
        <div className="mt-3 flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 px-3 py-1 text-[11px] text-cyan-300">
          <Headphones className="h-3 w-3 text-cyan-400" /> Rain Loop Active
        </div>
      </div>
    ),
  },
  {
    id: "journal",
    title: "Reflective AI Journaling",
    subtitle: "GUIDED REFLECTION",
    description: "Understand your thinking patterns through weekly mood analytics and clear AI summaries.",
    badge: "03 / REFLECTION",
    colSpan: "lg:col-span-1",
    icon: BookOpen,
    previewContent: (
      <div className="space-y-2 text-xs">
        <div className="flex items-center gap-2 text-cyan-400">
          <Sparkle className="h-3.5 w-3.5" />
          <span className="font-semibold">AI Weekly Synthesis</span>
        </div>
        <p className="text-white/60 text-[11px] leading-relaxed">
          "Highest productivity during morning deep-work phases. 94% goal completion this week."
        </p>
      </div>
    ),
  },
  {
    id: "tasks",
    title: "Kanban & Time Tracking",
    subtitle: "TASKS & PROJECTS",
    description: "Sleek Kanban boards, subtasks, and custom fields integrated into your workspace.",
    badge: "04 / WORKFLOW",
    colSpan: "lg:col-span-2",
    icon: Layers,
    previewContent: (
      <div className="grid grid-cols-3 gap-2 text-[11px]">
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-2">
          <span className="text-white/40 block mb-1">Backlog</span>
          <div className="rounded bg-white/5 p-1.5 font-medium text-white/80">API Optimization</div>
        </div>
        <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-2">
          <span className="text-cyan-400 block mb-1">In Progress</span>
          <div className="rounded bg-cyan-500/20 p-1.5 font-medium text-cyan-200">UI Pipeline</div>
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
  { feature: "Notes & Bookmarks", free: "10 Limit", plus: "Unlimited" },
  { feature: "Tasks & Kanban Boards", free: "10 To-Dos", plus: "Unlimited + Gantt & Custom Fields" },
  { feature: "Focus Timer & Audio", free: "Standard Audio", plus: "All Hi-Fi Soundscapes" },
  { feature: "CLYVEN AI Assistant", free: "—", plus: "Included (Gemini 2.5 Pro)" },
  { feature: "File Uploads", free: "—", plus: "100 MB per File" },
  { feature: "Markdown / PDF Export", free: "Standard", plus: "High-Res Export" },
];

const FAQS = [
  {
    q: "What sets Clyven's minimalist workspace apart?",
    a: "Clyven combines high-performance Markdown, focus timers, and AI journaling in a clean, dark interface free from unnecessary distractions."
  },
  {
    q: "Is getting started completely free?",
    a: "Yes. The Free plan is permanently free with no credit card required."
  },
  {
    q: "How secure is my data?",
    a: "Your data is encrypted end-to-end and stored securely on cloud servers without ever being sold or shared."
  },
  {
    q: "How does CLYVEN PLUS work?",
    a: "With CLYVEN PLUS (for just $5 / month), you unlock unlimited notes, tasks, AI insights, and advanced Kanban & Gantt views."
  }
];

export function Landing() {
  const { user } = useUser();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const yHero = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const opacityHero = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Live Interactive Demo State
  const [activeTab, setActiveTab] = useState<"notes" | "focus" | "journal" | "kanban">("notes");
  const [demoTimerRunning, setDemoTimerRunning] = useState(false);
  const [demoTimeLeft, setDemoTimeLeft] = useState(25 * 60);

  // Newsletter State
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubmitting, setNewsletterSubmitting] = useState(false);
  const [newsletterStatus, setNewsletterStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Subtle Mouse Tilt Effect
  const cardX = useMotionValue(0);
  const cardY = useMotionValue(0);
  const rotateX = useSpring(useTransform(cardY, [-200, 200], [4, -4]), { stiffness: 120, damping: 20 });
  const rotateY = useSpring(useTransform(cardX, [-200, 200], [-4, 4]), { stiffness: 120, damping: 20 });

  useCookieBanner();

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) return;
    const rect = e.currentTarget.getBoundingClientRect();
    cardX.set(e.clientX - (rect.left + rect.width / 2));
    cardY.set(e.clientY - (rect.top + rect.height / 2));
  };

  const handleMouseLeave = () => {
    cardX.set(0);
    cardY.set(0);
  };

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

  const handleNewsletterSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes("@")) {
      setNewsletterStatus({ type: "error", message: "Please enter a valid email address." });
      return;
    }

    setNewsletterSubmitting(true);
    setNewsletterStatus(null);

    try {
      await api.subscribeNewsletter(newsletterEmail);
      setNewsletterStatus({ type: "success", message: "Subscribed! Welcome to the Clyven Newsletter." });
      setNewsletterEmail("");
    } catch (err: any) {
      setNewsletterStatus({ type: "error", message: err.message || "Failed to subscribe. Please try again." });
    } finally {
      setNewsletterSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-full overflow-x-hidden bg-[#090A0F] text-[#FAFAFA] font-sans selection:bg-cyan-500/20 selection:text-cyan-200">

      {/* Soft Ambient Static Background Glow */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="absolute -top-[15%] left-1/2 h-[600px] w-[800px] -translate-x-1/2 rounded-full opacity-[0.06] blur-[140px]"
          style={{ background: "radial-gradient(circle, #00F2FE 0%, #38BDF8 60%, transparent 100%)" }}
        />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.2) 1px, transparent 1px)", backgroundSize: "32px 32px" }}
        />
      </div>

      {/* Navigation Header */}
      <header className="fixed top-0 z-50 w-full max-w-full border-b border-white/[0.08] bg-[#090A0F]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-4">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900/60 border border-white/10 group-hover:border-cyan-500/40 transition-colors">
                <img src={`${basePath}/logo.svg`} alt="CLYVEN" className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-[0.2em] text-white">CLYVEN</span>
                <span className="text-[9px] font-mono tracking-widest text-cyan-400 opacity-80 uppercase">Workspace Platform</span>
              </div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-medium tracking-wide text-white/60">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <Link href="/pricing"><span className="hover:text-white transition-colors cursor-pointer">Pricing</span></Link>
            <Link href="/support"><span className="hover:text-white transition-colors cursor-pointer">Support</span></Link>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <Link href="/dashboard">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-5 py-2.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition-all cursor-pointer flex items-center gap-2"
                >
                  Dashboard →
                </motion.button>
              </Link>
            ) : (
              <>
                <Link href="/sign-in">
                  <button className="px-4 py-2 text-xs font-medium text-white/60 hover:text-white transition-colors cursor-pointer">
                    Sign In
                  </button>
                </Link>
                <Link href="/sign-up">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="rounded-xl border border-white/15 bg-white/[0.06] px-5 py-2.5 text-xs font-semibold text-white hover:bg-white/10 transition-all cursor-pointer flex items-center gap-2"
                  >
                    Get Started Free <ArrowUpRight className="h-3.5 w-3.5 text-cyan-400" />
                  </motion.button>
                </Link>
              </>
            )}
          </div>

          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-white/[0.08] bg-[#090A0F] px-6 py-6 space-y-4"
            >
              <div className="flex flex-col gap-3 text-sm text-white/70">
                <a href="#features" onClick={() => setMobileMenuOpen(false)} className="hover:text-white py-1.5">Features</a>
                <Link href="/pricing"><span onClick={() => setMobileMenuOpen(false)} className="hover:text-white py-1.5 block cursor-pointer">Pricing</span></Link>
                <Link href="/support"><span onClick={() => setMobileMenuOpen(false)} className="hover:text-white py-1.5 block cursor-pointer">Support</span></Link>
              </div>

              <div className="pt-4 border-t border-white/[0.08] flex flex-col gap-2.5">
                {user ? (
                  <Link href="/dashboard">
                    <button className="w-full rounded-xl border border-cyan-500/40 bg-cyan-500/10 py-3 text-xs font-semibold text-cyan-300">
                      Open Dashboard →
                    </button>
                  </Link>
                ) : (
                  <>
                    <Link href="/sign-up">
                      <button className="w-full rounded-xl bg-white py-3 text-xs font-semibold text-black">
                        Get Started Free
                      </button>
                    </Link>
                    <Link href="/sign-in">
                      <button className="w-full rounded-xl border border-white/10 py-3 text-xs font-medium text-white/80">
                        Sign In
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
      <section ref={heroRef} className="relative flex min-h-[100dvh] w-full max-w-full flex-col items-center justify-center px-4 sm:px-6 lg:px-8 pt-32 pb-20 overflow-x-hidden">
        <motion.div style={{ y: yHero, opacity: opacityHero }} className="relative z-10 flex flex-col items-center text-center max-w-5xl mx-auto">

          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 px-4 py-1.5 text-xs font-mono text-cyan-400">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" /> DIGITAL WORKSPACE & SECOND BRAIN
          </div>

          <h1 className="mb-6 text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] text-white">
            Absolute Clarity. <br />
            <span className="text-white/60">Focus Without Distractions.</span>
          </h1>

          <p className="mb-10 max-w-2xl text-base sm:text-lg text-white/50 leading-relaxed">
            Markdown notes, guided AI journaling, and ambient focus soundscapes combined in a noise-free dark workspace.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-12">
            <Link href="/sign-up">
              <button className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-8 py-3.5 text-xs sm:text-sm font-semibold text-cyan-200 hover:bg-cyan-500/20 transition-all cursor-pointer">
                Get Started Free <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
            <a href="#features">
              <button className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-8 py-3.5 text-xs sm:text-sm font-medium text-white/70 hover:bg-white/[0.08] hover:text-white transition-all cursor-pointer">
                Explore System
              </button>
            </a>
          </div>

          {/* Minimal Badges Bar */}
          <div className="flex flex-wrap items-center justify-center gap-3 max-w-4xl mb-16">
            {HIGHLIGHT_BADGES.map((b) => (
              <div key={b.label} className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] font-mono ${b.color}`}>
                <b.icon className="h-3.5 w-3.5" />
                <span>{b.label}</span>
              </div>
            ))}
          </div>

          {/* Clean App Container / Interactive Demo */}
          <motion.div
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="w-full max-w-5xl [perspective:1000px]"
          >
            <div className="rounded-2xl border border-white/10 bg-[#12141D]/60 backdrop-blur-md shadow-2xl overflow-hidden text-left">

              {/* Header Bar */}
              <div className="flex items-center justify-between border-b border-white/[0.08] bg-white/[0.02] px-6 py-3.5">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-white/20" />
                  <div className="h-2.5 w-2.5 rounded-full bg-white/20" />
                  <div className="h-2.5 w-2.5 rounded-full bg-white/20" />
                  <span className="ml-3 text-xs font-mono text-white/30 flex items-center gap-1.5">
                    <Lock className="h-3 w-3 text-cyan-400" /> clyven.app/workspace
                  </span>
                </div>

                <div className="flex items-center gap-1.5 rounded-lg bg-black/40 p-1 border border-white/10">
                  {(["notes", "focus", "journal", "kanban"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 py-1 text-xs font-mono capitalize transition-all cursor-pointer rounded ${
                        activeTab === tab ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "text-white/40 hover:text-white"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Body */}
              <div className="p-8 min-h-[300px] flex items-center justify-center bg-[#090A0F]/80">
                {activeTab === "notes" && (
                  <div className="w-full space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-cyan-400">SMART NOTES & BACKLINKS</span>
                      <span className="rounded bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 text-[10px] text-cyan-300">
                        [[System Core]]
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white tracking-tight"># Modular Architecture & Minimal Second Brain</h3>
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 font-mono text-xs text-white/70 leading-relaxed space-y-2">
                      <p>- Bidirectional note links with instant search.</p>
                      <p>- Gemini 2.5 Pro AI assistant for automated summaries.</p>
                      <p>- Seamless Markdown & PDF export.</p>
                    </div>
                  </div>
                )}

                {activeTab === "focus" && (
                  <div className="flex flex-col items-center justify-center py-4 text-center w-full">
                    <span className="text-xs font-mono text-cyan-400 mb-2">Focus Session</span>
                    <div className="text-5xl font-mono font-bold text-white tracking-wider my-3">
                      {formatTime(demoTimeLeft)}
                    </div>
                    <button
                      onClick={() => setDemoTimerRunning(!demoTimerRunning)}
                      className="mt-4 flex items-center gap-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-5 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition-all cursor-pointer"
                    >
                      {demoTimerRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                      {demoTimerRunning ? "Pause" : "Start Focus"}
                    </button>
                  </div>
                )}

                {activeTab === "journal" && (
                  <div className="w-full space-y-3">
                    <span className="text-xs font-mono text-cyan-400 block">AI Journaling</span>
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-xs text-white/70 leading-relaxed font-sans">
                      <p className="text-cyan-300 font-semibold mb-1">AI Synthesis of the Week:</p>
                      <p>"Sustained deep concentration periods in morning hours. All core milestones delivered on schedule."</p>
                    </div>
                  </div>
                )}

                {activeTab === "kanban" && (
                  <div className="w-full space-y-3">
                    <span className="text-xs font-mono text-cyan-400 block">Task Management</span>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3 text-xs text-white/60">
                        Backlog: <span className="text-white font-medium block mt-1">Markdown Engine</span>
                      </div>
                      <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-3 text-xs text-cyan-300">
                        In Progress: <span className="text-white font-medium block mt-1">UI System</span>
                      </div>
                      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs text-emerald-300">
                        Done: <span className="text-white font-medium block mt-1">Supabase Sync</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Bento Grid */}
      <section id="features" className="px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-28 relative z-10 scroll-mt-20 max-w-full overflow-x-hidden">
        <div className="mx-auto max-w-7xl">
          <div className="mb-20 text-center">
            <p className="mb-3 text-xs font-mono uppercase tracking-widest text-cyan-400">System Modules</p>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white">Precision in Every Element.</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {BENTO_FEATURES.map((item) => (
              <div
                key={item.id}
                className={`rounded-2xl border border-white/10 bg-[#12141D]/50 p-8 backdrop-blur-md transition-all duration-300 hover:border-cyan-500/30 hover:bg-white/[0.03] ${item.colSpan}`}
              >
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] border border-white/10 text-cyan-400">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-mono tracking-widest text-white/40 border border-white/10 px-3 py-1 rounded-full">
                    {item.badge}
                  </span>
                </div>

                <span className="text-[11px] font-mono tracking-wider text-cyan-400 uppercase font-semibold block mb-1">
                  {item.subtitle}
                </span>
                <h3 className="text-xl font-bold text-white tracking-tight mb-3">{item.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed mb-6">{item.description}</p>

                <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                  {item.previewContent}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-28 relative z-10 scroll-mt-20 border-t border-white/[0.08] bg-[#0A0B10] max-w-full overflow-x-hidden">
        <div className="mx-auto max-w-6xl">
          <div className="mb-20 text-center">
            <p className="mb-3 text-xs font-mono uppercase tracking-widest text-cyan-400">Transparent Pricing</p>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white">Simple Pricing.</h2>
          </div>

          <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto mb-16">
            <div className="rounded-2xl border border-white/10 bg-[#12141D]/50 p-8 backdrop-blur-md flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Free Plan</h3>
                <div className="text-4xl font-extrabold text-white mb-6">$0</div>
                <ul className="space-y-3 text-xs text-white/60 mb-8">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-cyan-400 shrink-0" /> Max. 10 Notes & Bookmarks</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-cyan-400 shrink-0" /> Max. 10 Tasks & To-Dos</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-cyan-400 shrink-0" /> Focus Timer & Journal</li>
                </ul>
              </div>
              <Link href="/sign-up">
                <button className="w-full rounded-xl border border-white/15 bg-white/[0.04] py-3 text-xs font-semibold text-white hover:bg-white/10 transition-all cursor-pointer">
                  Get Started Free
                </button>
              </Link>
            </div>

            <div className="rounded-2xl border border-cyan-500/40 bg-cyan-500/5 p-8 backdrop-blur-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-white">CLYVEN PLUS</h3>
                </div>
                <div className="text-4xl font-extrabold text-white mb-6">$5 <span className="text-xs text-white/40 font-normal">/ month</span></div>
                <ul className="space-y-3 text-xs text-white/80 mb-8">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-cyan-400 shrink-0" /> Unlimited Notes, Bookmarks & Tasks</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-cyan-400 shrink-0" /> CLYVEN AI Assistant (Gemini 2.5 Pro)</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-cyan-400 shrink-0" /> Kanban Boards & Gantt Views</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-cyan-400 shrink-0" /> 100 MB File Uploads</li>
                </ul>
              </div>
              <Link href="/pricing">
                <button className="w-full rounded-xl border border-cyan-500/50 bg-cyan-500/20 py-3 text-xs font-bold text-cyan-200 hover:bg-cyan-500/30 transition-all cursor-pointer">
                  Upgrade Now →
                </button>
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#12141D]/50 backdrop-blur-md">
            <div className="min-w-[480px]">
              <div className="grid grid-cols-3 border-b border-white/10 bg-white/[0.02] p-4 text-xs font-mono uppercase text-white/50">
                <div>Feature</div>
                <div className="text-center">Free</div>
                <div className="text-center text-cyan-400">CLYVEN PLUS</div>
              </div>
              {COMPARISON.map((row, idx) => (
                <div key={idx} className="grid grid-cols-3 border-b border-white/[0.05] p-4 text-xs text-white/70 items-center">
                  <div className="font-medium text-white/90">{row.feature}</div>
                  <div className="text-center text-white/40">{row.free}</div>
                  <div className="text-center font-semibold text-cyan-300">{row.plus}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-28 relative z-10 max-w-full overflow-x-hidden">
        <div className="mx-auto max-w-3xl">
          <div className="mb-12 text-center">
            <p className="mb-2 text-xs font-mono uppercase tracking-widest text-cyan-400">FAQ</p>
            <h2 className="text-2xl font-bold text-white">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-[#12141D]/50 backdrop-blur-md overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between px-6 py-4 text-left text-sm font-medium text-white/90 hover:text-white transition-colors cursor-pointer"
                >
                  {faq.q}
                  <ChevronDown className={`h-4 w-4 text-white/40 transition-transform ${openFaq === i ? "rotate-180 text-cyan-400" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="border-t border-white/[0.06] px-6 pb-4 pt-3 text-xs text-white/60 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA & Newsletter Opt-In Section */}
      <section className="px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24 lg:pb-28 pt-8 relative z-10 max-w-full overflow-x-hidden">
        <div className="mx-auto max-w-4xl text-center">
          <div className="relative rounded-2xl border border-cyan-500/30 bg-[#12141D]/60 p-10 sm:p-14 shadow-2xl backdrop-blur-md overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-1/2 bg-cyan-500/10 blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1 text-[11px] font-mono text-cyan-400 mb-6">
                <Sparkles className="h-3.5 w-3.5" /> DISTRACTION-FREE WORKSPACE
              </span>

              <h2 className="mb-4 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Ready for Absolute Focus?
              </h2>

              <p className="mb-8 text-sm sm:text-base text-white/50 max-w-md mx-auto leading-relaxed">
                Create your free account in seconds. No credit card required.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                <Link href="/sign-up">
                  <button className="w-full sm:w-auto rounded-xl border border-cyan-500/50 bg-cyan-500/20 px-8 py-3.5 text-xs sm:text-sm font-bold text-cyan-200 hover:bg-cyan-500/30 transition-all cursor-pointer">
                    Get Started Free
                  </button>
                </Link>
                <Link href="/support">
                  <button className="w-full sm:w-auto rounded-xl border border-white/10 bg-white/[0.04] px-7 py-3.5 text-xs sm:text-sm font-medium text-white/70 hover:bg-white/[0.08] hover:text-white transition-all cursor-pointer">
                    Contact Support
                  </button>
                </Link>
              </div>

              {/* Newsletter Opt-In */}
              <div className="max-w-md mx-auto pt-8 border-t border-white/10 text-left">
                <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-widest mb-2">
                  <Mail className="h-3.5 w-3.5" /> Newsletter Subscriptions
                </div>
                <p className="text-xs text-white/50 mb-4">
                  Get product updates, productivity insights, and workspace tips directly in your inbox.
                </p>
                <form onSubmit={handleNewsletterSubscribe} className="flex gap-2">
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    required
                    className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:border-cyan-500/50 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={newsletterSubmitting}
                    className="rounded-xl border border-cyan-500/30 bg-cyan-500/20 px-4 py-2.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/30 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    {newsletterSubmitting ? "Subscribing..." : <><Send className="h-3.5 w-3.5" /> Subscribe</>}
                  </button>
                </form>
                {newsletterStatus && (
                  <p className={`mt-2 text-xs ${newsletterStatus.type === "success" ? "text-cyan-400" : "text-red-400"}`}>
                    {newsletterStatus.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] px-4 sm:px-6 lg:px-8 py-8 relative z-10 bg-[#06070B] max-w-full overflow-x-hidden">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-3">
            <img src={`${basePath}/logo.svg`} alt="CLYVEN" className="h-4 w-4" />
            <span className="text-xs font-bold tracking-[0.2em] text-white/40">CLYVEN</span>
          </div>

          <div className="flex gap-6 text-xs text-white/40 items-center">
            <Link href="/privacy"><span className="hover:text-white cursor-pointer transition-colors">Privacy Policy</span></Link>
            <Link href="/impressum"><span className="hover:text-white cursor-pointer transition-colors">Imprint</span></Link>
            <Link href="/terms"><span className="hover:text-white cursor-pointer transition-colors">Terms of Use</span></Link>
            <a href="https://github.com/offical-atsch16/clyven.app" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer">
              <Github className="h-3.5 w-3.5" /> GitHub
            </a>
            <a href="https://stats.uptimerobot.com/rS9J6TmeMj" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer">
              <Activity className="h-3.5 w-3.5 text-cyan-400" /> Status
            </a>
          </div>

          <p className="text-xs text-white/30 font-mono">© 2026 CLYVEN</p>
        </div>
      </footer>
    </div>
  );
}
