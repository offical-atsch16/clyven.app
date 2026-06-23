import { Router } from "express";
import { db, journalEntries } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, type AuthenticatedRequest } from "../lib/requireAuth.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
  try {
    const rows = await db
      .select()
      .from(journalEntries)
      .where(eq(journalEntries.userId, userId))
      .orderBy(desc(journalEntries.date));
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch journal entries" });
  }
});

router.get("/:date", requireAuth, async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
  const { date } = req.params;
  try {
    const [row] = await db
      .select()
      .from(journalEntries)
      .where(and(eq(journalEntries.userId, userId), eq(journalEntries.date, date)));
    res.json(row || null);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch journal entry" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
  const { date, mood, wentWell, learned, grateful, tomorrowGoals, freeText } = req.body;
  try {
    const existing = await db
      .select()
      .from(journalEntries)
      .where(and(eq(journalEntries.userId, userId), eq(journalEntries.date, date)));

    if (existing.length > 0) {
      const [row] = await db
        .update(journalEntries)
        .set({ mood, wentWell, learned, grateful, tomorrowGoals, freeText, updatedAt: new Date() })
        .where(and(eq(journalEntries.userId, userId), eq(journalEntries.date, date)))
        .returning();
      return res.json(row);
    }

    const [row] = await db
      .insert(journalEntries)
      .values({ userId, date, mood, wentWell, learned, grateful, tomorrowGoals, freeText })
      .returning();
    res.json(row);
  } catch (e) {
    res.status(500).json({ error: "Failed to save journal entry" });
  }
});

export default router;
