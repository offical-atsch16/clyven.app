import { Router } from "express";
import { clerkClient } from "@clerk/express";
import { supabase } from "../lib/supabase.js";
import {
  sendReminderEmail,
  sendJournalReminderEmail,
  sendStreakWarningEmail,
  sendNewsletterEmail,
} from "../lib/email.js";

const router = Router();

async function getUserInfo(userId: string): Promise<{ email: string | null; fullName: string }> {
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
    // Fallback if Clerk user look-up fails
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

async function isNotificationEnabled(userId: string, type: "task" | "journal" | "streak"): Promise<boolean> {
  // First check user_preferences table
  const { data: prefs } = await supabase
    .from("user_preferences")
    .select("email_reminders, email_journal, email_streaks")
    .eq("user_id", userId)
    .maybeSingle();

  if (prefs) {
    if (type === "task") return prefs.email_reminders !== false;
    if (type === "journal") return prefs.email_journal !== false;
    if (type === "streak") return prefs.email_streaks !== false;
  }

  // Fallback to user_settings table
  const { data: settings } = await supabase
    .from("user_settings")
    .select("notifications_enabled, task_emails_enabled, journal_reminders_enabled, streak_alerts_enabled")
    .eq("user_id", userId)
    .maybeSingle();

  if (!settings) return true;
  if (settings.notifications_enabled === false) return false;

  if (type === "task") return settings.task_emails_enabled !== false;
  if (type === "journal") return settings.journal_reminders_enabled !== false;
  if (type === "streak") return settings.streak_alerts_enabled !== false;

  return true;
}

// 1. Scheduled Task Email Trigger
const processRemindersHandler = async (req: any, res: any) => {
  try {
    const todayStr = new Date().toISOString().split("T")[0];

    // Select tasks where due_date <= todayStr and notified is false or null
    const { data: dueTasks, error } = await supabase
      .from("tasks")
      .select("*")
      .not("due_date", "is", null)
      .lte("due_date", todayStr)
      .or("notified.eq.false,notified.is.null")
      .neq("status", "DONE");

    if (error) throw error;

    const tasksToNotify = dueTasks || [];
    let sentCount = 0;
    const details: any[] = [];

    for (const task of tasksToNotify) {
      const enabled = await isNotificationEnabled(task.user_id, "task");
      if (!enabled) {
        // Mark as notified so we don't re-process disabled notifications continuously
        await supabase.from("tasks").update({ notified: true }).eq("id", task.id);
        continue;
      }

      const { email, fullName } = await getUserInfo(task.user_id);
      if (!email) {
        console.warn(`[CRON REMINDERS] No email found for user_id ${task.user_id}`);
        await supabase.from("tasks").update({ notified: true }).eq("id", task.id);
        continue;
      }

      const success = await sendReminderEmail({
        toEmail: email,
        userName: fullName,
        taskTitle: task.title,
        taskDueDate: task.due_date,
      });

      if (success) {
        sentCount++;
        await supabase.from("tasks").update({ notified: true }).eq("id", task.id);
        details.push({ taskId: task.id, title: task.title, recipient: email });
      }
    }

    res.json({ success: true, processed: tasksToNotify.length, sentCount, details });
  } catch (e: any) {
    console.error("[CRON REMINDERS ERROR]", e);
    res.status(500).json({ error: "Failed to process reminders cron", detail: e.message });
  }
};

router.get("/process-reminders", processRemindersHandler);
router.post("/process-reminders", processRemindersHandler);

// 2. Daily Journal Nudge
const journalNudgeHandler = async (req: any, res: any) => {
  try {
    const todayStr = new Date().toISOString().split("T")[0];

    // Get distinct user_ids from profiles table
    const { data: profiles, error: profErr } = await supabase
      .from("profiles")
      .select("id, user_id, email, full_name");

    if (profErr) throw profErr;

    const users = (profiles || []).map((p: any) => ({
      userId: p.user_id || p.id,
      email: p.email,
      fullName: p.full_name || "Clyven User",
    }));

    let sentCount = 0;
    const details: any[] = [];

    for (const u of users) {
      if (!u.userId) continue;

      const enabled = await isNotificationEnabled(u.userId, "journal");
      if (!enabled) continue;

      // Check if user logged an entry today
      const { data: entry } = await supabase
        .from("journal_entries")
        .select("id")
        .eq("user_id", u.userId)
        .eq("date", todayStr)
        .maybeSingle();

      if (entry) continue; // User already wrote a journal entry today

      const { email, fullName } = await getUserInfo(u.userId);
      const targetEmail = email || u.email;

      if (!targetEmail) continue;

      const success = await sendJournalReminderEmail({
        toEmail: targetEmail,
        userName: fullName,
      });

      if (success) {
        sentCount++;
        details.push({ userId: u.userId, recipient: targetEmail });
      }
    }

    res.json({ success: true, sentCount, details });
  } catch (e: any) {
    console.error("[CRON JOURNAL NUDGE ERROR]", e);
    res.status(500).json({ error: "Failed to process journal nudge cron", detail: e.message });
  }
};

router.get("/journal-nudge", journalNudgeHandler);
router.post("/journal-nudge", journalNudgeHandler);

// 3. Streak Loss Warning
const streakWarningHandler = async (req: any, res: any) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get profiles
    const { data: profiles } = await supabase.from("profiles").select("id, user_id, email, full_name");
    const users = (profiles || []).map((p: any) => ({
      userId: p.user_id || p.id,
      email: p.email,
      fullName: p.full_name || "Clyven User",
    }));

    let sentCount = 0;
    const details: any[] = [];

    for (const u of users) {
      if (!u.userId) continue;

      const enabled = await isNotificationEnabled(u.userId, "streak");
      if (!enabled) continue;

      // Get user's focus sessions sorted descending
      const { data: sessions } = await supabase
        .from("focus_sessions")
        .select("completed_at")
        .eq("user_id", u.userId)
        .order("completed_at", { ascending: false });

      if (!sessions || sessions.length === 0) continue;

      // Check if session completed today
      const hasSessionToday = sessions.some((s: any) => {
        if (!s.completed_at) return false;
        const d = new Date(s.completed_at);
        return d >= today;
      });

      if (hasSessionToday) continue; // Already focused today, no warning needed

      // Calculate streak ending yesterday
      const uniqueDates = new Set<string>();
      sessions.forEach((s: any) => {
        if (s.completed_at) {
          const dateStr = new Date(s.completed_at).toISOString().split("T")[0];
          uniqueDates.add(dateStr);
        }
      });

      let currentStreak = 0;
      let checkDate = new Date();
      checkDate.setDate(checkDate.getDate() - 1); // Start checking from yesterday

      while (true) {
        const dateStr = checkDate.toISOString().split("T")[0];
        if (uniqueDates.has(dateStr)) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }

      if (currentStreak > 2) {
        const { email, fullName } = await getUserInfo(u.userId);
        const targetEmail = email || u.email;
        if (!targetEmail) continue;

        const success = await sendStreakWarningEmail({
          toEmail: targetEmail,
          userName: fullName,
          currentStreak,
        });

        if (success) {
          sentCount++;
          details.push({ userId: u.userId, currentStreak, recipient: targetEmail });
        }
      }
    }

    res.json({ success: true, sentCount, details });
  } catch (e: any) {
    console.error("[CRON STREAK WARNING ERROR]", e);
    res.status(500).json({ error: "Failed to process streak warning cron", detail: e.message });
  }
};

router.get("/streak-warning", streakWarningHandler);
router.post("/streak-warning", streakWarningHandler);

// 4. Newsletter Broadcast Trigger
const newsletterBroadcastHandler = async (req: any, res: any) => {
  try {
    const { subject, content } = req.body || {};
    const frontendUrl = process.env.FRONTEND_URL?.split(",")[0] || "https://clyven.app";

    // Query active newsletter subscribers ONLY
    const { data: subscribers, error } = await supabase
      .from("newsletter_subscribers")
      .select("email")
      .eq("is_subscribed", true);

    if (error) throw error;

    const activeSubscribers = subscribers || [];
    let sentCount = 0;
    const details: any[] = [];

    for (const sub of activeSubscribers) {
      if (!sub.email) continue;

      const unsubscribeUrl = `${frontendUrl}/unsubscribe?email=${encodeURIComponent(sub.email)}`;

      const success = await sendNewsletterEmail({
        toEmail: sub.email,
        subject,
        content,
        unsubscribeUrl,
      });

      if (success) {
        sentCount++;
        details.push({ email: sub.email });
      }
    }

    res.json({ success: true, recipientCount: activeSubscribers.length, sentCount, details });
  } catch (e: any) {
    console.error("[CRON NEWSLETTER BROADCAST ERROR]", e);
    res.status(500).json({ error: "Failed to process newsletter broadcast", detail: e.message });
  }
};

router.get("/newsletter-broadcast", newsletterBroadcastHandler);
router.post("/newsletter-broadcast", newsletterBroadcastHandler);

export default router;
