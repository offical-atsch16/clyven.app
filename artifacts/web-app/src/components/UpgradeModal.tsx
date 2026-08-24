import { motion } from "framer-motion";
import { X, Check, Sparkles } from "lucide-react";
import { usePremium } from "../hooks/usePremium";
import { PlanBadge } from "./PlanBadge";

interface Props {
  onClose: () => void;
  reason?: string;
  targetTier?: "business";
}

export function UpgradeModal({ onClose, reason }: Props) {
  const { openUpgrade } = usePremium();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-3xl border border-white/10 bg-black/90 backdrop-blur-xl p-5 sm:p-8 shadow-2xl text-white transform-gpu"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex items-center justify-center min-w-[44px] min-h-[44px] p-2 rounded-full bg-white/[0.05] hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer z-10"
          aria-label="Close modal"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-400 text-xs font-semibold mb-3">
            <Sparkles className="h-3.5 w-3.5" /> Tarif-Upgrade
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Upgrade auf CLYVEN PLUS</h2>
          {reason && <p className="mt-2 text-sm text-amber-400/90 font-medium bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl inline-block max-w-md">{reason}</p>}
        </div>

        {/* Features Comparison Matrix */}
        <div className="grid grid-cols-2 gap-4 mb-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 text-xs">
          {/* Column 1: Free */}
          <div className="space-y-2 border-r border-white/[0.06] pr-3">
            <div className="font-bold text-white/50 mb-1 flex items-center justify-between">
              Free <PlanBadge tier="free" size="sm" showFree />
            </div>
            <p className="text-[11px] text-white/30">Basis-Funktionen</p>
            <ul className="space-y-2 pt-2 text-[11px] text-white/40">
              <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-white/30 shrink-0" /> Max. 10 Notizen</li>
              <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-white/30 shrink-0" /> Max. 10 Bookmarks</li>
              <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-white/30 shrink-0" /> Max. 10 Aufgaben</li>
              <li className="flex items-center gap-1.5 text-red-400/50">✕ Keine Dateiuploads</li>
              <li className="flex items-center gap-1.5 text-red-400/50">✕ Kein Kanban / Gantt</li>
              <li className="flex items-center gap-1.5 text-red-400/50">✕ Keine Zeiterfassung</li>
            </ul>
          </div>

          {/* Column 2: CLYVEN PLUS */}
          <div className="space-y-2 bg-amber-500/[0.06] border border-amber-500/20 rounded-xl p-3">
            <div className="font-bold text-amber-400 mb-1 flex items-center justify-between">
              CLYVEN PLUS <PlanBadge tier="business" size="sm" />
            </div>
            <p className="text-[11px] text-amber-300/70">Alle Profi-Funktionen freigeschaltet</p>
            <ul className="space-y-2 pt-2 text-[11px] text-white/90">
              <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-amber-400 shrink-0" /> Unbegrenzt Notizen, Bookmarks & Tasks</li>
              <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-amber-400 shrink-0" /> Kanban Board & Gantt Diagramm</li>
              <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-amber-400 shrink-0" /> Unteraufgaben (Subtasks)</li>
              <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-amber-400 shrink-0" /> Zeiterfassung (Timer & Log)</li>
              <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-amber-400 shrink-0" /> Custom Fields & Dateiuploads (100 MB)</li>
            </ul>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={() => { openUpgrade(); onClose(); }}
          className="w-full py-3.5 min-h-[44px] rounded-2xl font-bold text-sm transition-all shadow-lg cursor-pointer bg-sky-500 text-zinc-950 hover:bg-sky-400 shadow-sky-500/20"
        >
          Zu Clyven Plus upgraden →
        </button>

        <p className="mt-3 text-center text-[10px] text-white/30">
          Jederzeit kündbar · Sofortige Freischaltung aller Funktionen
        </p>
      </motion.div>
    </div>
  );
}
