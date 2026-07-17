import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { requireAuth, type AuthenticatedRequest } from "../lib/requireAuth.js";
import { snakeToCamel } from "../lib/snakeToCamel.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
  try {
    const { data, error } = await supabase
      .from("focus_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("completed_at", { ascending: false })
      .limit(50);
    if (error) throw error;

    const sessions = data || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayMinutes = sessions
      .filter((s: any) => s.completed_at && new Date(s.completed_at) >= today)
      .reduce((acc: number, s: any) => acc + s.duration, 0);
    const totalMinutes = sessions.reduce((acc: number, s: any) => acc + s.duration, 0);

    res.json({ sessions: sessions.map(snakeToCamel), todayMinutes, totalMinutes, totalSessions: sessions.length });
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch focus data", detail: e.message });
  }
});

router.post("/", requireAuth, async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
  const { duration, type, label } = req.body;
  try {
    const { data, error } = await supabase
      .from("focus_sessions")
      .insert({ user_id: userId, duration, type: type || "pomodoro", label })
      .select()
      .single();
    if (error) throw error;
    res.json(snakeToCamel(data));
  } catch (e: any) {
    res.status(500).json({ error: "Failed to save focus session", detail: e.message });
  }
});

export default router;
