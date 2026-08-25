import { Router } from "express";
import { clerkClient } from "@clerk/express";
import { supabase } from "../lib/supabase.js";
import { requireAuth, type AuthenticatedRequest } from "../lib/requireAuth.js";
import { snakeToCamel } from "../lib/snakeToCamel.js";
import { sendMilestoneEmail } from "../lib/email.js";

const router = Router();

async function getUserEmailAndName(userId: string): Promise<{ email: string | null; fullName: string }> {
  let email: string | null = null;
  let fullName: string | null = null;

  try {
    const user = await clerkClient.users.getUser(userId);
    email =
      user.emailAddresses?.find((e: any) => e.id === user.primaryEmailAddressId)?.emailAddress ||
      user.emailAddresses?.[0]?.emailAddress ||
      null;
    fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || null;
  } catch {
    // Fallback
  }

  if (!email) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .or(`id.eq.${userId},user_id.eq.${userId}`)
      .maybeSingle();
    if (profile) {
      email = profile.email || null;
      fullName = profile.full_name || null;
    }
  }

  return { email, fullName: fullName || "Clyven User" };
}

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
    // 1. Fetch previous total duration for milestone detection
    const { data: existingSessions } = await supabase
      .from("focus_sessions")
      .select("duration")
      .eq("user_id", userId);

    const prevTotalMinutes = (existingSessions || []).reduce((acc: number, s: any) => acc + (s.duration || 0), 0);

    // 2. Insert new session
    const { data, error } = await supabase
      .from("focus_sessions")
      .insert({ user_id: userId, duration, type: type || "pomodoro", label })
      .select()
      .single();
    if (error) throw error;

    // 3. Check for milestones
    const newTotalMinutes = prevTotalMinutes + (Number(duration) || 0);
    const milestones = [
      { hours: 25, minutes: 1500 },
      { hours: 50, minutes: 3000 },
      { hours: 100, minutes: 6000 },
    ];

    for (const milestone of milestones) {
      if (prevTotalMinutes < milestone.minutes && newTotalMinutes >= milestone.minutes) {
        // Milestone reached! Check user notification preferences
        const { data: settings } = await supabase
          .from("user_settings")
          .select("notifications_enabled, streak_alerts_enabled")
          .eq("user_id", userId)
          .maybeSingle();

        const notificationsEnabled = !settings || (settings.notifications_enabled !== false && settings.streak_alerts_enabled !== false);

        if (notificationsEnabled) {
          const { email, fullName } = await getUserEmailAndName(userId);
          if (email) {
            sendMilestoneEmail({
              toEmail: email,
              userName: fullName,
              milestoneHours: milestone.hours,
              totalFocusMinutes: newTotalMinutes,
            }).catch((err) => console.error("[MILESTONE COURIER ERROR]", err));
          }
        }
      }
    }

    res.json(snakeToCamel(data));
  } catch (e: any) {
    res.status(500).json({ error: "Failed to save focus session", detail: e.message });
  }
});

export default router;
