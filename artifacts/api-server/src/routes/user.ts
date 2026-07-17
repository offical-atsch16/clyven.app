import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { requireAuth, type AuthenticatedRequest } from "../lib/requireAuth.js";

const router = Router();

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
    res.json(data || { theme: "dark", daily_focus_goal: 120 });
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch settings", detail: e.message });
  }
});

router.post("/settings", requireAuth, async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
  const { theme, dailyFocusGoal, notificationsEnabled, timezone } = req.body;
  try {
    const { data: existing } = await supabase
      .from("user_settings")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      const { data, error } = await supabase
        .from("user_settings")
        .update({ theme, daily_focus_goal: dailyFocusGoal, notifications_enabled: notificationsEnabled, timezone, updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .select()
        .single();
      if (error) throw error;
      return res.json(data);
    }

    const { data, error } = await supabase
      .from("user_settings")
      .insert({ user_id: userId, theme, daily_focus_goal: dailyFocusGoal, notifications_enabled: notificationsEnabled, timezone })
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to save settings", detail: e.message });
  }
});

export default router;
