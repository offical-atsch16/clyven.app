import { motion } from "framer-motion";
import { useState } from "react";
import { useLocation } from "wouter";
import {
  Zap, FileText, BarChart2, Download, Shield, ArrowLeft, Crown,
} from "lucide-react";
import { PricingTable, useUser } from "@clerk/react";
import { PREMIUM_PLAN } from "../lib/billing";
import { cn } from "../lib/utils";

const FAQS = [
  { q: "When will I be charged?", a: "You will be charged immediately after upgrading. Your access to CLYVEN PLUS begins right away." },
  { q: "Can I cancel anytime?", a: "Yes, you can cancel anytime. You will keep access until the end of your billing period." },
  { q: "What happens to my data when I downgrade?", a: "Your data stays preserved. However, you won't be able to create new notes if you exceed the free limit." },
  { q: "Is there a free trial?", a: "Yes, you can try Clyven Plus free for 30 days!" },
  { q: "What is Clyven Business?", a: "Clyven Business is designed for people who want to use Clyven in a corporate environment."},
];

function scrollToPlans() {
  document.getElementById("plans")?.scrollIntoView({ behavior: "smooth" });
}

export function Pricing() {
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
              Simple, fair<br />
              <span className="bg-gradient-to-r from-yellow-300 to-yellow-500 bg-clip-text text-transparent">pricing</span>
            </h1>
            <p className="text-lg text-white/40">
              Start for free. Upgrade when you're ready.
            </p>
          </motion.div>

          {/* Plans + Checkout — powered by Clerk Billing.
              Payment collection and checkout are handled entirely by Clerk. */}
          <motion.div
            id="plans"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="mb-16 scroll-mt-24"
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
              <p className="text-center text-sm font-medium text-yellow-400/70">PLUS</p>
            </div>
            {[
              { label: "Notes", free: "10", plus: "Unlimited" },
              { label: "Bookmarks", free: "25", plus: "Unlimited" },
              { label: "Focus Timer", free: "✓", plus: "✓" },
              { label: "Journal", free: "✓", plus: "✓" },
              { label: "Analytics", free: "7 days", plus: "30 days" },
              { label: "Export (Markdown)", free: "—", plus: "✓" },
              { label: "Streak Tracking", free: "—", plus: "✓" },
              { label: "Premium Badge", free: "—", plus: "✓" },
              { label: "All Achievements", free: "Basic", plus: "✓" },
              { label: "Support", free: "Community", plus: "Priority" },
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
              onClick={scrollToPlans}
              className="rounded-2xl bg-gradient-to-r from-yellow-400 to-yellow-500 px-10 py-4 text-sm font-bold text-black shadow-xl shadow-yellow-500/20 hover:from-yellow-300 hover:to-yellow-400 transition-all">
              Choose Plan →
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
