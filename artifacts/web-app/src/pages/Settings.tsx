import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useClerk } from "@clerk/react";
import { Sun, Moon, Bell, Timer, LogOut, Save, Check, Shield, GitBranch, ExternalLink } from "lucide-react";
import { api } from "../lib/api";
import { useAppStore } from "../stores/useAppStore";
import { cn } from "../lib/utils";

export function Settings() {
  const { signOut } = useClerk();
  const { theme, setTheme } = useAppStore();
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: api.getSettings, retry: 1 });
  const { data: githubStatus } = useQuery({ queryKey: ["github-status"], queryFn: api.getGithubStatus });
  const saveSettings = useMutation({ mutationFn: api.saveSettings });

  const searchParams = new URLSearchParams(window.location.search);
  const isConnectedGithub = searchParams.get("connected") === "github" || searchParams.get("setup") === "github" || githubStatus?.isConnected;

  const handleConnectGithub = () => {
    // Redirect target configuration for Cloudflare Pages setup flow
    // Setup redirect URL: https://clyven.pages.dev/dashboard/settings?setup=github
    const githubAuthUrl = "https://github.com/apps/clyven-inc/installations/new?setup_action=install";
    window.location.href = githubAuthUrl;
  };

  const [focusGoal, setFocusGoal] = useState(120);
  const [notifications, setNotifications] = useState(true);
  const [taskEmails, setTaskEmails] = useState(true);
  const [journalReminders, setJournalReminders] = useState(true);
  const [streakAlerts, setStreakAlerts] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) {
      setFocusGoal(settings.dailyFocusGoal ?? 120);
      setNotifications(settings.notificationsEnabled ?? true);
      setTaskEmails(settings.emailReminders ?? settings.taskEmailsEnabled ?? true);
      setJournalReminders(settings.emailJournal ?? settings.journalRemindersEnabled ?? true);
      setStreakAlerts(settings.emailStreaks ?? settings.streakAlertsEnabled ?? true);
    }
  }, [settings]);

  const save = async () => {
    await saveSettings.mutateAsync({
      theme,
      dailyFocusGoal: focusGoal,
      notificationsEnabled: notifications,
      taskEmailsEnabled: taskEmails,
      journalRemindersEnabled: journalReminders,
      streakAlertsEnabled: streakAlerts,
      emailReminders: taskEmails,
      emailJournal: journalReminders,
      emailStreaks: streakAlerts,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <div className="min-h-full p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="mt-1 text-sm text-white/40">Customize Clyven to your liking.</p>
        </div>

        <div className="space-y-4">
          {/* GitHub Integration */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/[0.07] bg-[#111111] p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.05] border border-white/10 text-white">
                  <GitBranch className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white">GitHub Integration</p>
                    {isConnectedGithub && (
                      <span className="rounded-md bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono font-semibold text-emerald-400">
                        Connected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/40">Connect GitHub App to sync assigned issues and repository build statuses.</p>
                </div>
              </div>

              <button
                onClick={handleConnectGithub}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-xs font-mono font-semibold text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer shrink-0"
              >
                {isConnectedGithub ? "Reconnect GitHub" : "Connect GitHub"} <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>

          {/* Theme */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-white/[0.07] bg-[#111111] p-5">
            <p className="mb-1 text-sm font-medium text-white/70">Appearance</p>
            <p className="mb-4 text-xs text-white/30">Choose between Dark and Light Mode.</p>
            <div className="flex gap-3">
              <button onClick={() => setTheme("dark")}
                className={cn("flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all",
                  theme === "dark" ? "border-white/20 bg-white/[0.08] text-white" : "border-white/[0.08] text-white/40 hover:text-white/70")}>
                <Moon className="h-4 w-4" /> Dark
              </button>
              <button onClick={() => setTheme("light")}
                className={cn("flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all",
                  theme === "light" ? "border-white/20 bg-white/[0.08] text-white" : "border-white/[0.08] text-white/40 hover:text-white/70")}>
                <Sun className="h-4 w-4" /> Light
              </button>
            </div>
          </motion.div>

          {/* Focus goal */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="rounded-2xl border border-white/[0.07] bg-[#111111] p-5">
            <div className="flex items-center gap-2 mb-1">
              <Timer className="h-4 w-4 text-white/40" />
              <p className="text-sm font-medium text-white/70">Daily Focus Goal</p>
            </div>
            <p className="mb-4 text-xs text-white/30">How many minutes of focus time do you want to achieve daily?</p>
            <div className="flex items-center gap-3">
              <input type="range" min={15} max={480} step={15} value={focusGoal} onChange={(e) => setFocusGoal(Number(e.target.value))}
                className="flex-1 accent-white" />
              <span className="w-16 text-right text-sm font-semibold text-white">{focusGoal} min.</span>
            </div>
          </motion.div>

          {/* Notifications & Preferences */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="rounded-2xl border border-white/[0.07] bg-[#111111] p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-white/40" />
                <div>
                  <p className="text-sm font-medium text-white/70">Notifications</p>
                  <p className="text-xs text-white/30">Manage global and email notification preferences</p>
                </div>
              </div>
              <button onClick={() => setNotifications((n) => !n)}
                className={cn("relative h-6 w-11 rounded-full transition-colors", notifications ? "bg-white/40" : "bg-white/[0.1]")}>
                <div className={cn("absolute top-1 h-4 w-4 rounded-full bg-white transition-transform", notifications ? "translate-x-6" : "translate-x-1")} />
              </button>
            </div>

            {/* 1. Task & Reminder Emails */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/70">Task & Reminder Emails</p>
                <p className="text-xs text-white/30">Receive email reminders when tasks hit their due date</p>
              </div>
              <button onClick={() => setTaskEmails((n) => !n)}
                className={cn("relative h-6 w-11 rounded-full transition-colors", taskEmails ? "bg-white/40" : "bg-white/[0.1]")}>
                <div className={cn("absolute top-1 h-4 w-4 rounded-full bg-white transition-transform", taskEmails ? "translate-x-6" : "translate-x-1")} />
              </button>
            </div>

            {/* 2. Daily Journal Prompts */}
            <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
              <div>
                <p className="text-sm font-medium text-white/70">Daily Journal Prompts</p>
                <p className="text-xs text-white/30">Receive daily evening nudges to log your journal entries</p>
              </div>
              <button onClick={() => setJournalReminders((n) => !n)}
                className={cn("relative h-6 w-11 rounded-full transition-colors", journalReminders ? "bg-white/40" : "bg-white/[0.1]")}>
                <div className={cn("absolute top-1 h-4 w-4 rounded-full bg-white transition-transform", journalReminders ? "translate-x-6" : "translate-x-1")} />
              </button>
            </div>

            {/* 3. Focus Streak Warnings */}
            <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
              <div>
                <p className="text-sm font-medium text-white/70">Focus Streak Warnings</p>
                <p className="text-xs text-white/30">Receive warnings if your focus streak is at risk of breaking</p>
              </div>
              <button onClick={() => setStreakAlerts((n) => !n)}
                className={cn("relative h-6 w-11 rounded-full transition-colors", streakAlerts ? "bg-white/40" : "bg-white/[0.1]")}>
                <div className={cn("absolute top-1 h-4 w-4 rounded-full bg-white transition-transform", streakAlerts ? "translate-x-6" : "translate-x-1")} />
              </button>
            </div>
          </motion.div>

          {/* Save */}
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={save}
            disabled={saveSettings.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3 text-sm font-semibold text-black hover:bg-white/90 transition-colors disabled:opacity-60">
            {saved ? <><Check className="h-4 w-4" /> Saved!</> : <><Save className="h-4 w-4" /> Save Settings</>}
          </motion.button>

          {/* Logout */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <button onClick={() => signOut({ redirectUrl: basePath + "/" })}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-950/10 py-3 text-sm font-medium text-red-400/70 hover:bg-red-950/20 hover:text-red-400 transition-all">
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
