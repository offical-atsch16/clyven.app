import { Router } from "express";
import { db, notes, bookmarks, focusSessions, journalEntries, userAchievements, userSettings } from "@workspace/db";
import { eq, count, sum } from "drizzle-orm";
import { requireAuth, type AuthenticatedRequest } from "../lib/requireAuth.js";

const router = Router();

router.get("/stats", requireAuth, async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
  try {
    const [notesCount] = await db.select({ count: count() }).from(notes).where(eq(notes.userId, userId));
    const [bookmarksCount] = await db.select({ count: count() }).from(bookmarks).where(eq(bookmarks.userId, userId));
    const [focusData] = await db
      .select({ total: sum(focusSessions.duration), sessions: count() })
      .from(focusSessions)
      .where(eq(focusSessions.userId, userId));
    const [journalCount] = await db.select({ count: count() }).from(journalEntries).where(eq(journalEntries.userId, userId));
    const achievements = await db.select().from(userAchievements).where(eq(userAchievements.userId, userId));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const allFocusSessions = await db.select().from(focusSessions).where(eq(focusSessions.userId, userId));
    const todayMinutes = allFocusSessions
      .filter((s) => s.completedAt && new Date(s.completedAt) >= today)
      .reduce((acc, s) => acc + s.duration, 0);

    res.json({
      notesCount: notesCount?.count ?? 0,
      bookmarksCount: bookmarksCount?.count ?? 0,
      totalFocusMinutes: Number(focusData?.total ?? 0),
      totalFocusSessions: focusData?.sessions ?? 0,
      journalCount: journalCount?.count ?? 0,
      achievements: achievements.map((a) => a.badgeId),
      todayFocusMinutes: todayMinutes,
    });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

router.get("/settings", requireAuth, async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
  try {
    const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
    res.json(settings || { theme: "dark", dailyFocusGoal: 120 });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

router.post("/settings", requireAuth, async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
  const { theme, dailyFocusGoal, notificationsEnabled, timezone } = req.body;
  try {
    const existing = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
    if (existing.length > 0) {
      const [row] = await db
        .update(userSettings)
        .set({ theme, dailyFocusGoal, notificationsEnabled, timezone, updatedAt: new Date() })
        .where(eq(userSettings.userId, userId))
        .returning();
      return res.json(row);
    }
    const [row] = await db
      .insert(userSettings)
      .values({ userId, theme, dailyFocusGoal, notificationsEnabled, timezone })
      .returning();
    res.json(row);
  } catch (e) {
    res.status(500).json({ error: "Failed to save settings" });
  }
});

export default router;
