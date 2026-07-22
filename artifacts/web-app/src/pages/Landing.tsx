import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Link } from "wouter";
import {
  FileText, Bookmark, Timer, BookOpen, BarChart2, Trophy,
  ArrowRight, ChevronDown, Star, Zap, Shield, Globe, Check, Sparkles, Lock,
} from "lucide-react";
import { useUser } from "@clerk/react";
import { useCookieBanner } from "../hooks/useCookieBanner";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const FEATURES = [
  { icon: FileText, title: "Second Brain", desc: "Capture every idea, thought, and insight in beautifully organized notes with tags, categories, and rich formatting." },
  { icon: Timer, title: "Deep Focus", desc: "Pomodoro-based focus sessions with streaks, ambient sounds, and detailed session tracking to maximize your productivity." },
  { icon: BookOpen, title: "Daily Journal", desc: "Reflect on your day with guided prompts, mood tracking, and a searchable history of your personal growth journey." },
  { icon: Bookmark, title: "Bookmark Vault", desc: "Save links, articles, and resources with automatic metadata fetching. Find anything instantly with smart search." },
  { icon: BarChart2, title: "Analytics", desc: "Beautiful charts and insights about your productivity patterns, focus time, mood trends, and content creation." },
  { icon: Trophy, title: "Achievements", desc: "Unlock badges and rewards as you build habits. Rare and legendary achievements make every milestone meaningful." },
];

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for getting started",
    features: ["10 notes", "25 bookmarks", "1 custom focus mode", "Basic analytics", "All core features"],
    cta: "Get Started",
    highlight: false,
  },
  {
    name: "CLYVEN PLUS",
    price: "$2",
    period: "/month",
    description: "Unlimited productivity",
    features: ["Unlimited notes", "Unlimited bookmarks", "Unlimited focus modes", "Advanced analytics", "Priority support", "Export as Markdown"],
    cta: "Upgrade Now",
    highlight: true,
  },
];

const FAQS = [
  { q: "Is Clyven free?", a: "Yes — the Free plan is free and includes all core features. For unlimited usage, there's CLYVEN PLUS for just $2/month." },
  { q: "Is my data stored securely?", a: "Yes. Your data is stored encrypted in the cloud. We don't sell data and don't share anything with third parties." },
  { q: "Can I use Clyven on multiple devices?", a: "Yes. Clyven automatically syncs your data across all your devices — desktop, tablet, and smartphone." },
  { q: "How can I cancel?", a: "You can cancel anytime via your profile. There is no minimum contract period and no hidden fees." },
];


export function Landing() {
  const { user } = useUser();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [pos, setPos] = useState({ x: 50, y: 50 });

  useCookieBanner();

  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-[#080808] text-white"
      onMouseMove={(e) => setPos({ x: (e.clientX / window.innerWidth) * 100, y: (e.clientY / window.innerHeight) * 100 })}>

      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/[0.05] bg-[#080808]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <img src={`${basePath}/logo.svg`} alt="CLYVEN" className="h-6 w-6" />
            <span className="text-sm font-bold tracking-[0.25em]">CLYVEN</span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Link href="/dashboard">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="rounded-lg bg-white px-5 py-2 text-sm font-semibold text-black hover:bg-white/90 transition-colors">
                  Dashboard →
                </motion.button>
              </Link>
            ) : (
              <>
                <Link href="/support">
                  <button className="px-4 py-2 text-sm text-white/50 hover:text-white transition-colors">Support</button>
                </Link>
                <Link href="/sign-in">
                  <button className="px-4 py-2 text-sm text-white/50 hover:text-white transition-colors">Login</button>
                </Link>
                <Link href="/sign-up">
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="rounded-lg bg-white px-5 py-2 text-sm font-semibold text-black hover:bg-white/90 transition-colors">
                    Get Started
                  </motion.button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section ref={heroRef} className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-6 pt-20">
        <div className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="pointer-events-none absolute inset-0"
          style={{ background: `radial-gradient(800px circle at ${pos.x}% ${pos.y}%, rgba(255,255,255,0.04), transparent 50%)` }} />

        <motion.div style={{ y, opacity }} className="relative z-10 flex flex-col items-center text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-1.5 text-xs text-white/50">
            <Sparkles className="h-3 w-3" />
            Your personal digital workspace
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-6 max-w-4xl text-5xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
            <span className="text-white">Clyven — </span>
            <span className="bg-gradient-to-r from-white/80 to-white/30 bg-clip-text text-transparent">
              Your personal digital workspace
            </span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-10 max-w-xl text-lg text-white/40 leading-relaxed">
            Capture ideas, stay focused and organize your life in one place. 
            Second Brain, Focus Timer, Journal & Bookmarks — all in one.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col gap-3 sm:flex-row">
            <Link href="/sign-up">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-semibold text-black hover:bg-white/90 transition-colors">
                Get Started <ArrowRight className="h-4 w-4" />
              </motion.button>
            </Link>
            <Link href="/sign-in">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="rounded-xl border border-white/[0.1] bg-white/[0.04] px-8 py-3.5 text-sm font-semibold text-white/70 hover:bg-white/[0.08] hover:text-white transition-all">
                Login
              </motion.button>
            </Link>
            <Link href="/support">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="rounded-xl border border-white/[0.1] bg-white/[0.04] px-8 py-3.5 text-sm font-semibold text-white/70 hover:bg-white/[0.08] hover:text-white transition-all">
                Support
              </motion.button>
            </Link>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
            className="mt-16 flex animate-bounce flex-col items-center gap-2 text-white/20">
            <span className="text-xs tracking-widest uppercase">Explore</span>
            <ChevronDown className="h-4 w-4" />
          </motion.div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              className="mb-3 text-xs font-medium uppercase tracking-widest text-white/30">Features</motion.p>
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="text-3xl font-bold text-white sm:text-4xl">Everything you need</motion.h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.08 }} whileHover={{ y: -4 }}
                className="group rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 hover:border-white/10 hover:bg-white/[0.04] transition-all">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] group-hover:bg-white/[0.1] transition-colors">
                  <f.icon className="h-5 w-5 text-white/60" />
                </div>
                <h3 className="mb-2 font-semibold text-white">{f.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-white/[0.06] px-6 py-20">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-8 sm:grid-cols-4">
          {[
            { value: "∞", label: "Notes" },
            { value: "7+", label: "Features" },
            { value: "100%", label: "Private" },
            { value: "0", label: "Distractions" },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center">
              <div className="text-4xl font-bold text-white">{s.value}</div>
              <div className="mt-1 text-sm text-white/30">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <div className="mb-16 text-center">
            <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              className="mb-3 text-xs font-medium uppercase tracking-widest text-white/30">Pricing</motion.p>
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="text-3xl font-bold text-white sm:text-4xl">Simple & fair</motion.h2>
            <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
              className="mt-4 text-white/40">Start for free. Upgrade only when you need more.</motion.p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {PLANS.map((plan, i) => (
              <motion.div key={plan.name}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className={`relative rounded-3xl border p-8 ${
                  plan.highlight
                    ? "border-white/20 bg-white/[0.04]"
                    : "border-white/[0.08] bg-white/[0.02]"
                }`}>
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-white px-4 py-1 text-xs font-semibold text-black">
                    Popular
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                  <p className="mt-1 text-sm text-white/40">{plan.description}</p>
                </div>

                <div className="mb-6 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-sm text-white/40">{plan.period}</span>
                </div>

                <ul className="mb-8 space-y-3">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2.5 text-sm text-white/60">
                      <Check className={`mt-0.5 h-4 w-4 shrink-0 ${plan.highlight ? "text-white" : "text-white/40"}`} />
                      {feat}
                    </li>
                  ))}
                </ul>

                <Link href="/sign-up">
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className={`w-full rounded-xl py-3 text-sm font-semibold transition-colors ${
                      plan.highlight
                        ? "bg-white text-black hover:bg-white/90"
                        : "border border-white/[0.1] bg-white/[0.04] text-white/70 hover:bg-white/[0.08] hover:text-white"
                    }`}>
                    {plan.cta}
                  </motion.button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-2xl">
          <div className="mb-12 text-center">
            <p className="mb-3 text-xs font-medium uppercase tracking-widest text-white/30">FAQ</p>
            <h2 className="text-3xl font-bold text-white">Common Questions</h2>
          </div>
          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                className="overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.02]">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium text-white/80 hover:text-white transition-colors">
                  {faq.q}
                  <ChevronDown className={`h-4 w-4 shrink-0 text-white/30 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                    className="border-t border-white/[0.05] px-5 pb-4 pt-3 text-sm text-white/40 leading-relaxed">
                    {faq.a}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-24 pt-8">
        <div className="mx-auto max-w-2xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-12">
            <h2 className="mb-4 text-3xl font-bold text-white">Ready to get started?</h2>
            <p className="mb-8 text-white/40">Create your free account and get started in seconds.</p>
            <Link href="/sign-up">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="rounded-xl bg-white px-8 py-3.5 text-sm font-semibold text-black hover:bg-white/90 transition-colors">
                Get started — for free
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <img src={`${basePath}/logo.svg`} alt="CLYVEN" className="h-5 w-5" />
            <span className="text-xs font-bold tracking-[0.2em] text-white/40">CLYVEN</span>
          </div>
          <div className="flex gap-6 text-xs text-white/30">
            <Link href="/privacy"><span className="hover:text-white/50 cursor-pointer transition-colors">Privacy</span></Link>
            <Link href="/impressum"><span className="hover:text-white/50 cursor-pointer transition-colors">Legal Notice</span></Link>
          </div>
          <p className="text-xs text-white/20">© 2026 CLYVEN</p>
        </div>
      </footer>
    </div>
  );
}
