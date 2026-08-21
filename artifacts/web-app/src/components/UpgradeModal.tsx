import { useState } from "react";
import { motion } from "framer-motion";
import { X, Check, Crown, Zap, Sparkles } from "lucide-react";
import { usePremium } from "../hooks/usePremium";
import { PlanBadge } from "./PlanBadge";

interface Props {
  onClose: () => void;
  reason?: string;
  targetTier?: "plus" | "business";
}

export function UpgradeModal({ onClose, reason, targetTier }: Props) {
  const { openUpgrade, planTier } = usePremium();
  const [selectedTab, setSelectedTab] = useState<"plus" | "business">(targetTier || "business");

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
        className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-[#0c0c0c] p-6 sm:p-8 shadow-2xl text-white"
      >
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 rounded-full bg-white/[0.05] hover:bg-white/10 text-white/50 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-400 text-xs font-semibold mb-3">
            <Sparkles className="h-3.5 w-3.5" /> Tarif-Upgrade
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Wähle den passenden Tarif für dich</h2>
          {reason && <p className="mt-2 text-sm text-amber-400/90 font-medium bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl inline-block max-w-md">{reason}</p>}
        </div>

        {/* Selector Tabs */}
        <div className="flex rounded-2xl bg-white/[0.04] p-1.5 border border-white/[0.06] mb-6">
          <button
            onClick={() => setSelectedTab("plus")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              selectedTab === "plus"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            <Zap className="h-3.5 w-3.5" /> Clyven PLUS
          </button>
          <button
            onClick={() => setSelectedTab("business")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              selectedTab === "business"
                ? "bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-lg shadow-amber-500/30"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            <Crown className="h-3.5 w-3.5" /> Clyven BUSINESS
          </button>
        </div>

        {/* Features Comparison Matrix */}
        <div className="grid grid-cols-3 gap-3 mb-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 text-xs">
          {/* Column 1: Free */}
          <div className="space-y-2 border-r border-white/[0.06] pr-2">
            <div className="font-bold text-white/50 mb-1 flex items-center justify-between">
              Free <PlanBadge tier="free" size="sm" showFree />
            </div>
            <p className="text-[11px] text-white/30">Basis-Funktionen</p>
            <ul className="space-y-1.5 pt-2 text-[11px] text-white/40">
              <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-white/30 shrink-0" /> Max. 10 Notizen</li>
              <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-white/30 shrink-0" /> Max. 10 Bookmarks</li>
              <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-white/30 shrink-0" /> Simple Listen-Aufgaben (Max. 10)</li>
              <li className="flex items-center gap-1.5 text-red-400/50">✕ Keine Dateiuploads</li>
              <li className="flex items-center gap-1.5 text-red-400/50">✕ Kein Kanban / Gantt</li>
            </ul>
          </div>

          {/* Column 2: Plus */}
          <div className={`space-y-2 border-r border-white/[0.06] px-2 rounded-xl py-1 transition-all ${selectedTab === "plus" ? "bg-indigo-500/[0.08]" : ""}`}>
            <div className="font-bold text-indigo-400 mb-1 flex items-center justify-between">
              Plus <PlanBadge tier="plus" size="sm" />
            </div>
            <p className="text-[11px] text-indigo-300/60">Für Power-User</p>
            <ul className="space-y-1.5 pt-2 text-[11px] text-white/70">
              <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-indigo-400 shrink-0" /> Unbegrenzt Notizen & Bookmarks</li>
              <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-indigo-400 shrink-0" /> Unbegrenzte Simple-To-Do-Listen</li>
              <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-indigo-400 shrink-0" /> Dateiuploads (bis 10 MB)</li>
              <li className="flex items-center gap-1.5 text-white/30">✕ Keine Unteraufgaben / Timer</li>
              <li className="flex items-center gap-1.5 text-white/30">✕ Kein Kanban / Gantt</li>
            </ul>
          </div>

          {/* Column 3: Business */}
          <div className={`space-y-2 pl-2 rounded-xl py-1 transition-all ${selectedTab === "business" ? "bg-amber-500/[0.08]" : ""}`}>
            <div className="font-bold text-amber-400 mb-1 flex items-center justify-between">
              Business <PlanBadge tier="business" size="sm" />
            </div>
            <p className="text-[11px] text-amber-300/60">Vollversion für Profis</p>
            <ul className="space-y-1.5 pt-2 text-[11px] text-white/90">
              <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-amber-400 shrink-0" /> Alles aus Plus</li>
              <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-amber-400 shrink-0" /> **Kanban Board & Gantt Diagramm**</li>
              <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-amber-400 shrink-0" /> **Unteraufgaben (Subtasks)**</li>
              <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-amber-400 shrink-0" /> **Zeiterfassung (Timer & Log)**</li>
              <li className="flex items-center gap-1.5"><Check className="h-3 w-3 text-amber-400 shrink-0" /> **Custom Fields & Dateiuploads (100 MB)**</li>
            </ul>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={() => { openUpgrade(); onClose(); }}
          className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all shadow-lg cursor-pointer ${
            selectedTab === "business"
              ? "bg-gradient-to-r from-amber-400 to-amber-500 text-black hover:from-amber-300 hover:to-amber-400 shadow-amber-500/20"
              : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/30"
          }`}
        >
          {selectedTab === "business" ? "Zu Clyven Business upgraden →" : "Zu Clyven Plus upgraden →"}
        </button>

        <p className="mt-3 text-center text-[10px] text-white/30">
          Jederzeit kündbar · Sofortige Freischaltung aller Funktionen
        </p>
      </motion.div>
    </div>
  );
}
