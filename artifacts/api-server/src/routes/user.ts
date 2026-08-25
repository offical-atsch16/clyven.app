import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { requireAuth, checkBackendUserPlan, type AuthenticatedRequest } from "../lib/requireAuth.js";
import { snakeToCamel } from "../lib/snakeToCamel.js";
import { getAuth } from "@clerk/express";

const router = Router();

router.get("/me", requireAuth, async (req, res) => {
  const { userId, planTier, isPremium } = req as AuthenticatedRequest;
  const isBusiness = planTier === "business";
  res.json({
    userId,
    planTier,
    isPremium,
    isBusiness,
    isPlus: isBusiness,
    syncedAt: new Date().toISOString(),
  });
});

router.post("/sync-plan", requireAuth, async (req, res) => {
  const auth = getAuth(req);
  const planTier = await checkBackendUserPlan(auth);
  const isBusiness = planTier === "business";
  res.json({
    userId: auth.userId,
    planTier,
    isPremium: planTier !== "free",
    isBusiness,
    isPlus: isBusiness,
    syncedAt: new Date().toISOString(),
  });
});

router.get("/stats", requireAuth, async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
  try {
    // Notes count
    const { count: notesCount } = await supabase
      .from("notes").select("*", { count: "exact", head: true }).eq("user_id", userId);

    // Bookmarks count
    const { count: bookmarksCount } = await supabase
      .from("bookmarks").select("*", { count: "exact", head: true }).eq("user_id", userId);

    // Focus sessions
    const { data: focusSessions } = await supabase
      .from("focus_sessions").select("duration, completed_at").eq("user_id", userId);

    // Journal count
    const { count: journalCount } = await supabase
      .from("journal_entries").select("*", { count: "exact", head: true }).eq("user_id", userId);

    // Achievements
    const { data: achievements } = await supabase
      .from("user_achievements").select("badge_id").eq("user_id", userId);

    const sessions = focusSessions || [];
    const totalFocusMinutes = sessions.reduce((acc: number, s: any) => acc + s.duration, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMinutes = sessions
      .filter((s: any) => s.completed_at && new Date(s.completed_at) >= today)
      .reduce((acc: number, s: any) => acc + s.duration, 0);

    res.json({
      notesCount: notesCount ?? 0,
      bookmarksCount: bookmarksCount ?? 0,
      totalFocusMinutes,
      totalFocusSessions: sessions.length,
      journalCount: journalCount ?? 0,
      achievements: achievements?.map((a: any) => a.badge_id) ?? [],
      todayFocusMinutes: todayMinutes,
    });
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch stats", detail: e.message });
  }
});

router.get("/settings", requireAuth, async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
  try {
    const { data: settingsData } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    const { data: prefData } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    const defaults = {
      theme: "dark",
      dailyFocusGoal: 120,
      notificationsEnabled: true,
      taskEmailsEnabled: prefData?.email_reminders ?? settingsData?.task_emails_enabled ?? true,
      journalRemindersEnabled: prefData?.email_journal ?? settingsData?.journal_reminders_enabled ?? true,
      streakAlertsEnabled: prefData?.email_streaks ?? settingsData?.streak_alerts_enabled ?? true,
      emailReminders: prefData?.email_reminders ?? settingsData?.task_emails_enabled ?? true,
      emailJournal: prefData?.email_journal ?? settingsData?.journal_reminders_enabled ?? true,
      emailStreaks: prefData?.email_streaks ?? settingsData?.streak_alerts_enabled ?? true,
    };

    const combined = {
      ...defaults,
      ...(settingsData ? snakeToCamel(settingsData) : {}),
      ...(prefData ? snakeToCamel(prefData) : {}),
    };

    res.json(combined);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch settings", detail: e.message });
  }
});

router.post("/settings", requireAuth, async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
  const {
    theme,
    dailyFocusGoal,
    notificationsEnabled,
    taskEmailsEnabled,
    journalRemindersEnabled,
    streakAlertsEnabled,
    emailReminders,
    emailJournal,
    emailStreaks,
    timezone,
  } = req.body;

  const remindersVal = emailReminders ?? taskEmailsEnabled;
  const journalVal = emailJournal ?? journalRemindersEnabled;
  const streaksVal = emailStreaks ?? streakAlertsEnabled;

  try {
    // 1. Update user_settings
    const { data: existingSettings } = await supabase
      .from("user_settings")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    const settingsUpdate: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (theme !== undefined) settingsUpdate.theme = theme;
    if (dailyFocusGoal !== undefined) settingsUpdate.daily_focus_goal = dailyFocusGoal;
    if (notificationsEnabled !== undefined) settingsUpdate.notifications_enabled = notificationsEnabled;
    if (remindersVal !== undefined) settingsUpdate.task_emails_enabled = remindersVal;
    if (journalVal !== undefined) settingsUpdate.journal_reminders_enabled = journalVal;
    if (streaksVal !== undefined) settingsUpdate.streak_alerts_enabled = streaksVal;
    if (timezone !== undefined) settingsUpdate.timezone = timezone;

    let savedSettings: any;
    if (existingSettings) {
      const { data, error } = await supabase
        .from("user_settings")
        .update(settingsUpdate)
        .eq("user_id", userId)
        .select()
        .single();
      if (error) throw error;
      savedSettings = data;
    } else {
      const { data, error } = await supabase
        .from("user_settings")
        .insert({
          user_id: userId,
          theme: theme ?? "dark",
          daily_focus_goal: dailyFocusGoal ?? 120,
          notifications_enabled: notificationsEnabled ?? true,
          task_emails_enabled: remindersVal ?? true,
          journal_reminders_enabled: journalVal ?? true,
          streak_alerts_enabled: streaksVal ?? true,
          timezone,
        })
        .select()
        .single();
      if (error) throw error;
      savedSettings = data;
    }

    // 2. Sync user_preferences table
    const { data: existingPrefs } = await supabase
      .from("user_preferences")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    const prefUpdate: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (remindersVal !== undefined) prefUpdate.email_reminders = remindersVal;
    if (journalVal !== undefined) prefUpdate.email_journal = journalVal;
    if (streaksVal !== undefined) prefUpdate.email_streaks = streaksVal;

    let savedPrefs: any;
    if (existingPrefs) {
      const { data, error } = await supabase
        .from("user_preferences")
        .update(prefUpdate)
        .eq("user_id", userId)
        .select()
        .single();
      if (error) throw error;
      savedPrefs = data;
    } else {
      const { data, error } = await supabase
        .from("user_preferences")
        .insert({
          user_id: userId,
          email_reminders: remindersVal ?? true,
          email_journal: journalVal ?? true,
          email_streaks: streaksVal ?? true,
        })
        .select()
        .single();
      if (error) throw error;
      savedPrefs = data;
    }

    res.json({
      ...snakeToCamel(savedSettings),
      ...snakeToCamel(savedPrefs),
    });
  } catch (e: any) {
    res.status(500).json({ error: "Failed to save settings", detail: e.message });
  }
});

export default router;
