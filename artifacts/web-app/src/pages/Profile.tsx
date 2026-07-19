import { motion } from "framer-motion";
import { useUser, useClerk } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";
import { usePremium } from "../hooks/usePremium";
import { api } from "../lib/api";
import { formatMinutes, formatDate } from "../lib/utils";
import { Timer, FileText, Bookmark, BookOpen, Trophy, Calendar, Crown, CreditCard } from "lucide-react";

export function Profile() {
  const { user, isLoaded } = useUser();
  const clerk = useClerk();
  const { isPremium } = usePremium();
  const { data: stats } = useQuery({ queryKey: ["stats"], queryFn: api.getStats, retry: 1 });

  if (!isLoaded) return <div className="flex h-full items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white/70" /></div>;

  const displayName = user?.fullName || user?.username || "User";
  const joinedAt = user?.createdAt ? formatDate(user.createdAt) : "—";

  const statItems = [
    { icon: Timer, label: "Total focus time", value: formatMinutes(stats?.totalFocusMinutes ?? 0) },
    { icon: FileText, label: "Notes created", value: stats?.notesCount ?? 0 },
    { icon: Bookmark, label: "Bookmarks saved", value: stats?.bookmarksCount ?? 0 },
    { icon: BookOpen, label: "Journal entries", value: stats?.journalCount ?? 0 },
    { icon: Trophy, label: "Achievements", value: stats?.achievements?.length ?? 0 },
    { icon: Timer, label: "Focus sessions", value: stats?.totalFocusSessions ?? 0 },
  ];

  return (
    <div className="min-h-full p-6 lg:p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Profile</h1>
        </div>

        {/* Profile card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-2xl border border-white/[0.07] bg-[#111111] p-8">
          <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
            {user?.imageUrl ? (
              <img src={user.imageUrl} alt={displayName}
                className="h-20 w-20 rounded-2xl object-cover ring-1 ring-white/10" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/[0.06] text-2xl font-bold text-white/60">
                {displayName[0]?.toUpperCase()}
              </div>
            )}
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-bold text-white">{displayName}</h2>
              <p className="mt-1 text-sm text-white/40">{user?.primaryEmailAddress?.emailAddress}</p>
              <div className="mt-3 flex items-center gap-2 justify-center sm:justify-start">
                <Calendar className="h-3.5 w-3.5 text-white/30" />
                <span className="text-xs text-white/30">Member since {joinedAt}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {statItems.map(({ icon: Icon, label, value }, i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-2xl border border-white/[0.07] bg-[#111111] p-4">
              <Icon className="mb-2 h-4 w-4 text-white/30" />
              <div className="text-xl font-bold text-white">{value}</div>
              <div className="text-xs text-white/35 mt-0.5">{label}</div>
            </motion.div>
          ))}
        </div>

        {/* Subscription */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
          className="mb-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="mb-1 flex items-center gap-2">
            <Crown className={isPremium ? "h-4 w-4 text-yellow-400/70" : "h-4 w-4 text-white/30"} />
            <p className="text-sm font-medium text-white/60">Subscription &amp; Billing</p>
          </div>
          <p className="text-xs text-white/30 mb-4">
            {isPremium
              ? "You are on CLYVEN PLUS. Cancel subscription, change payment method or view invoices."
              : "Manage your subscription, payment method and invoices in the billing area."}
          </p>
          <button onClick={() => clerk.openUserProfile()}
            className="flex items-center gap-2 rounded-lg border border-white/[0.1] bg-white/[0.04] px-4 py-2 text-sm text-white/60 hover:bg-white/[0.08] hover:text-white transition-all">
            <CreditCard className="h-4 w-4" /> Manage Subscription
          </button>
        </motion.div>

        {/* Account */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
          <p className="text-sm font-medium text-white/60 mb-1">Manage Account</p>
          <p className="text-xs text-white/30 mb-4">Manage password, email and security settings via Clerk.</p>
          <button onClick={() => clerk.openUserProfile()}
            className="rounded-lg border border-white/[0.1] bg-white/[0.04] px-4 py-2 text-sm text-white/60 hover:bg-white/[0.08] hover:text-white transition-all">
            Open Account Settings
          </button>
        </motion.div>
      </div>
    </div>
  );
}
