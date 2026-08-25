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
    const { data, error } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;

    const defaults = {
      theme: "dark",
      dailyFocusGoal: 120,
      notificationsEnabled: true,
      taskEmailsEnabled: true,
      journalRemindersEnabled: true,
      streakAlertsEnabled: true,
    };

    res.json(data ? { ...defaults, ...snakeToCamel(data) } : defaults);
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
    timezone,
  } = req.body;

  try {
    const { data: existing } = await supabase
      .from("user_settings")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (theme !== undefined) updateData.theme = theme;
    if (dailyFocusGoal !== undefined) updateData.daily_focus_goal = dailyFocusGoal;
    if (notificationsEnabled !== undefined) updateData.notifications_enabled = notificationsEnabled;
    if (taskEmailsEnabled !== undefined) updateData.task_emails_enabled = taskEmailsEnabled;
    if (journalRemindersEnabled !== undefined) updateData.journal_reminders_enabled = journalRemindersEnabled;
    if (streakAlertsEnabled !== undefined) updateData.streak_alerts_enabled = streakAlertsEnabled;
    if (timezone !== undefined) updateData.timezone = timezone;

    if (existing) {
      const { data, error } = await supabase
        .from("user_settings")
        .update(updateData)
        .eq("user_id", userId)
        .select()
        .single();
      if (error) throw error;
      return res.json(snakeToCamel(data));
    }

    const { data, error } = await supabase
      .from("user_settings")
      .insert({
        user_id: userId,
        theme: theme ?? "dark",
        daily_focus_goal: dailyFocusGoal ?? 120,
        notifications_enabled: notificationsEnabled ?? true,
        task_emails_enabled: taskEmailsEnabled ?? true,
        journal_reminders_enabled: journalRemindersEnabled ?? true,
        streak_alerts_enabled: streakAlertsEnabled ?? true,
        timezone,
      })
      .select()
      .single();
    if (error) throw error;
    res.json(snakeToCamel(data));
  } catch (e: any) {
    res.status(500).json({ error: "Failed to save settings", detail: e.message });
  }
});

export default router;
