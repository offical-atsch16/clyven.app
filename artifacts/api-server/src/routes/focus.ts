import { Router } from "express";
import { db, focusSessions } from "@workspace/db";
import { eq, desc, gte, sum, count } from "drizzle-orm";
import { requireAuth, type AuthenticatedRequest } from "../lib/requireAuth.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
  try {
    const sessions = await db
      .select()
      .from(focusSessions)
      .where(eq(focusSessions.userId, userId))
      .orderBy(desc(focusSessions.completedAt))
      .limit(50);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaySessions = sessions.filter(
      (s) => s.completedAt && new Date(s.completedAt) >= today,
    );
    const todayMinutes = todaySessions.reduce((acc, s) => acc + s.duration, 0);
    const totalMinutes = sessions.reduce((acc, s) => acc + s.duration, 0);

    res.json({ sessions, todayMinutes, totalMinutes, totalSessions: sessions.length });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch focus data" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
  const { duration, type, label } = req.body;
  try {
    const [row] = await db
      .insert(focusSessions)
      .values({ userId, duration, type: type || "pomodoro", label })
      .returning();
    res.json(row);
  } catch (e) {
    res.status(500).json({ error: "Failed to save focus session" });
  }
});

export default router;
