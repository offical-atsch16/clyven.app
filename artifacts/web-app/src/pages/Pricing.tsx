import { motion } from "framer-motion";
import { useState } from "react";
import { useLocation } from "wouter";
import {
  Zap, FileText, BarChart2, Download, Shield, ArrowLeft, Crown, Check, Mail, Building2,
} from "lucide-react";
import { PricingTable, useUser } from "@clerk/react";
import { PREMIUM_PLAN } from "../lib/billing";
import { cn } from "../lib/utils";

const FAQS = [
  { q: "When will I be charged?", a: "You will be charged immediately after upgrading. Your access to CLYVEN PLUS begins right away." },
  { q: "Can I cancel anytime?", a: "Yes, you can cancel anytime. You will keep access until the end of your billing period." },
  { q: "What happens to my data when I downgrade?", a: "Your data stays preserved. However, you won't be able to create new notes if you exceed the free limit." },
  { q: "Is there a free trial?", a: "Yes, you can try Clyven Plus free for 30 days!" },
];

function scrollToPlans() {
  document.getElementById("plans")?.scrollIntoView({ behavior: "smooth" });
}

export function Pricing() {
  const { user } = useUser();
  const [, navigate] = useLocation();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  const handleCheckout = () => {
    try {
      if ((window as any).Clerk?.openCheckout) {
        (window as any).Clerk.openCheckout({ planSlug: "clyven_business" });
      } else {
        scrollToPlans();
      }
    } catch {
      scrollToPlans();
    }
  };

  return (
    <div className="min-h-[100dvh] overflow-x-hidden bg-[#080808] text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-40 border-b border-white/[0.05] bg-[#080808]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <button onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back
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
              Einfaches, faires<br />
              <span className="bg-gradient-to-r from-yellow-300 to-yellow-500 bg-clip-text text-transparent">Pricing</span>
            </h1>
            <p className="text-lg text-white/40">
              Kostenlos starten. Upgraden wenn du bereit bist.
            </p>
          </motion.div>

          {/* Pricing Cards (2 Options: Free & Business branded as CLYVEN PLUS) */}
          <div className="grid gap-8 md:grid-cols-2 mb-16 max-w-4xl mx-auto">
            {/* Free Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-8 flex flex-col justify-between">
              <div>
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-white">Free</h3>
                  <p className="mt-1 text-sm text-white/40">Perfekt für den Einstieg</p>
                </div>
                <div className="mb-6 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">0 €</span>
                  <span className="text-sm text-white/40">/ dauerhaft</span>
                </div>
                <ul className="space-y-3 mb-8 text-sm text-white/60">
                  <li className="flex items-center gap-2.5"><Check className="h-4 w-4 text-white/40 shrink-0" /> Max. 10 Notizen</li>
                  <li className="flex items-center gap-2.5"><Check className="h-4 w-4 text-white/40 shrink-0" /> Max. 10 Bookmarks</li>
                  <li className="flex items-center gap-2.5"><Check className="h-4 w-4 text-white/40 shrink-0" /> Max. 10 Aufgaben</li>
                  <li className="flex items-center gap-2.5"><Check className="h-4 w-4 text-white/40 shrink-0" /> Focus Timer & Tagebuch</li>
                  <li className="flex items-center gap-2.5"><Check className="h-4 w-4 text-white/40 shrink-0" /> Community Support</li>
                </ul>
              </div>
              <button
                onClick={() => navigate("/dashboard")}
                className="w-full rounded-xl border border-white/[0.1] bg-white/[0.04] py-3 text-sm font-semibold text-white/80 hover:bg-white/[0.08] hover:text-white transition-all cursor-pointer">
                Kostenlos nutzen
              </button>
            </motion.div>

            {/* Business Card branded as CLYVEN PLUS */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="relative rounded-3xl border border-yellow-400/30 bg-gradient-to-b from-yellow-400/[0.08] to-white/[0.02] p-8 flex flex-col justify-between shadow-2xl shadow-yellow-500/10">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full border border-yellow-400 bg-yellow-400 px-4 py-1 text-xs font-bold text-black uppercase tracking-wider shadow-md">
                Empfohlen
              </div>
              <div>
                <div className="mb-6">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-white">CLYVEN PLUS</h3>
                    <span className="rounded-full bg-yellow-400/20 px-2 py-0.5 text-[10px] font-bold text-yellow-300 border border-yellow-400/30">Business</span>
                  </div>
                  <p className="mt-1 text-sm text-yellow-200/60">Unbegrenzte Produktivität & alle Profi-Tools</p>
                </div>
                <div className="mb-6 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">5 $</span>
                  <span className="text-sm text-white/40">/ Monat</span>
                </div>
                <ul className="space-y-3 mb-8 text-sm text-white/90">
                  <li className="flex items-center gap-2.5"><Check className="h-4 w-4 text-yellow-400 shrink-0" /> Unbegrenzt Notizen, Bookmarks & Tasks</li>
                  <li className="flex items-center gap-2.5"><Check className="h-4 w-4 text-yellow-400 shrink-0" /> Kanban Board & Gantt Diagramm</li>
                  <li className="flex items-center gap-2.5"><Check className="h-4 w-4 text-yellow-400 shrink-0" /> Unteraufgaben (Subtasks) & Custom Fields</li>
                  <li className="flex items-center gap-2.5"><Check className="h-4 w-4 text-yellow-400 shrink-0" /> Zeiterfassung (Timer & Log)</li>
                  <li className="flex items-center gap-2.5"><Check className="h-4 w-4 text-yellow-400 shrink-0" /> Dateiuploads bis zu 100 MB per File</li>
                  <li className="flex items-center gap-2.5"><Check className="h-4 w-4 text-yellow-400 shrink-0" /> Markdown / PDF Export</li>
                  <li className="flex items-center gap-2.5"><Check className="h-4 w-4 text-yellow-400 shrink-0" /> Priority Support</li>
                </ul>
              </div>
              <button
                onClick={handleCheckout}
                className="w-full rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-500 py-3.5 text-sm font-bold text-black shadow-lg shadow-yellow-500/20 hover:from-yellow-300 hover:to-yellow-400 transition-all cursor-pointer">
                Jetzt Upgraden →
              </button>
            </motion.div>
          </div>

          {/* Plans + Checkout — powered by Clerk Billing. */}
          <motion.div
            id="plans"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="relative mb-16 scroll-mt-24"
          >
            <PricingTable
              highlightedPlan={PREMIUM_PLAN}
              newSubscriptionRedirectUrl={`${basePath}/dashboard`}
            />
          </motion.div>

          {/* Feature comparison */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="mb-16 overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.02]">
            <div className="grid grid-cols-3 border-b border-white/[0.07] px-6 py-4">
              <p className="text-sm font-medium text-white/50">Feature</p>
              <p className="text-center text-sm font-medium text-white/50">Free</p>
              <p className="text-center text-sm font-medium text-yellow-400/70">CLYVEN PLUS</p>
            </div>
            {[
              { label: "Notes & Bookmarks", free: "10 Limit", plus: "Unlimited" },
              { label: "Tasks & To-Dos", free: "10 Limit", plus: "Unlimited" },
              { label: "Kanban & Gantt Views", free: "—", plus: "✓" },
              { label: "Subtasks & Custom Fields", free: "—", plus: "✓" },
              { label: "Time Tracking & Timer Log", free: "—", plus: "✓" },
              { label: "Note File Uploads", free: "—", plus: "100 MB per File" },
              { label: "Focus Timer & Journal", free: "✓", plus: "✓" },
              { label: "Export (Markdown / PDF)", free: "—", plus: "✓" },
              { label: "Premium Badge", free: "—", plus: "✓" },
              { label: "Support", free: "Community", plus: "Priority" },
            ].map((row, i) => (
              <div key={row.label} className={cn("grid grid-cols-3 px-6 py-3.5 text-sm", i % 2 === 0 && "bg-white/[0.01]")}>
                <span className="text-white/50">{row.label}</span>
                <span className="text-center text-white/30">{row.free}</span>
                <span className="text-center font-medium text-yellow-400/70">{row.plus}</span>
              </div>
            ))}
          </motion.div>

          {/* B2B Notice Box */}
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="mb-16 rounded-2xl border border-white/[0.1] bg-white/[0.03] p-6 text-center sm:flex sm:items-center sm:justify-between sm:text-left">
            <div className="flex items-center gap-4 mb-4 sm:mb-0">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-400">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Erweiterte Team & Enterprise B2B Angebote</h4>
                <p className="text-xs text-white/50 mt-0.5">
                  Du benötigst erweiterte Team-Features? Kontaktiere uns unter <a href="mailto:billig@clyven.de" className="text-yellow-400 underline hover:text-yellow-300">billig@clyven.de</a> für individuelle B2B-Angebote.
                </p>
              </div>
            </div>
            <a href="mailto:billig@clyven.de"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-5 py-2.5 text-xs font-bold text-yellow-300 hover:bg-yellow-400/20 transition-all shrink-0">
              <Mail className="h-3.5 w-3.5" /> B2B Anfragen
            </a>
          </motion.div>

          {/* Why PLUS */}
          <div className="mb-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: FileText, title: "No Limit", desc: "Write as many notes as you want" },
              { icon: BarChart2, title: "Deep Insights", desc: "30-day analysis of your productivity" },
              { icon: Download, title: "Your Data", desc: "Export all your notes as Markdown or PDF" },
              { icon: Shield, title: "Premium Support", desc: "Fast responses from the CLYVEN team" },
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
            <h2 className="mb-8 text-center text-2xl font-bold text-white">Common Questions</h2>
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
            <h2 className="mb-3 text-2xl font-bold text-white">Ready for CLYVEN PLUS?</h2>
            <p className="mb-8 text-white/40">Over 100% more possibilities. Cancel anytime.</p>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={handleCheckout}
              className="rounded-2xl bg-gradient-to-r from-yellow-400 to-yellow-500 px-10 py-4 text-sm font-bold text-black shadow-xl shadow-yellow-500/20 hover:from-yellow-300 hover:to-yellow-400 transition-all cursor-pointer">
              Choose Plan →
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
