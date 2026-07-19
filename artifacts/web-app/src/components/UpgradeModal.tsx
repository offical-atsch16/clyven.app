import { motion } from "framer-motion";
import { X, Zap, Check } from "lucide-react";
import { usePremium } from "../hooks/usePremium";

const PERKS = [
  "Unlimited notes",
  "Unlimited bookmarks",
  "Full analytics (30 days)",
  "Export notes as Markdown",
  "Focus streak tracking",
  "Premium profile badge",
  "All focus modes",
  "Priority support",
];

interface Props {
  onClose: () => void;
  reason?: string;
}

export function UpgradeModal({ onClose, reason }: Props) {
  const { openUpgrade } = usePremium();

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/[0.1] bg-[#0f0f0f] shadow-2xl"
      >
        {/* Glow */}
        <div className="absolute -top-20 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-white/[0.06] blur-3xl" />

        <div className="relative p-7">
          <button onClick={onClose} className="absolute right-5 top-5 text-white/30 hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>

          <div className="mb-5 flex flex-col items-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-400/20 to-yellow-600/10 border border-yellow-400/20">
              <Zap className="h-6 w-6 text-yellow-400" />
            </div>
            <h2 className="text-xl font-bold text-white">CLYVEN PLUS</h2>
            <p className="mt-1.5 text-sm text-white/40 leading-relaxed">
              {reason || "Unlock all premium features."}
            </p>
          </div>

          <ul className="mb-6 space-y-2.5">
            {PERKS.map((p) => (
              <li key={p} className="flex items-center gap-2.5 text-sm text-white/60">
                <Check className="h-3.5 w-3.5 shrink-0 text-yellow-400/70" />
                {p}
              </li>
            ))}
          </ul>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { openUpgrade(); onClose(); }}
            className="w-full rounded-2xl bg-gradient-to-r from-yellow-400 to-yellow-500 py-3.5 text-sm font-bold text-black hover:from-yellow-300 hover:to-yellow-400 transition-all shadow-lg shadow-yellow-500/20"
          >
            Upgrade now →
          </motion.button>

          <p className="mt-3 text-center text-[10px] text-white/20">
            Cancel anytime · Instant access
          </p>
        </div>
      </motion.div>
    </div>
  );
}
