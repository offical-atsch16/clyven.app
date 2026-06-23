import { Router } from "express";
import { db, notes } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, type AuthenticatedRequest } from "../lib/requireAuth.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
  try {
    const rows = await db
      .select()
      .from(notes)
      .where(and(eq(notes.userId, userId), eq(notes.isArchived, false)))
      .orderBy(desc(notes.updatedAt));
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch notes" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
  const { title, content, category, tags, color } = req.body;
  const wordCount = (content || "").trim().split(/\s+/).filter(Boolean).length;
  try {
    const [row] = await db
      .insert(notes)
      .values({ userId, title: title || "Untitled", content: content || "", category, tags, color, wordCount })
      .returning();
    res.json(row);
  } catch (e) {
    res.status(500).json({ error: "Failed to create note" });
  }
});

router.put("/:id", requireAuth, async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
  const { id } = req.params;
  const { title, content, category, tags, color, isPinned, isFavorite, isArchived } = req.body;
  const wordCount = content !== undefined ? content.trim().split(/\s+/).filter(Boolean).length : undefined;
  try {
    const [row] = await db
      .update(notes)
      .set({ title, content, category, tags, color, isPinned, isFavorite, isArchived, wordCount, updatedAt: new Date() })
      .where(and(eq(notes.id, id), eq(notes.userId, userId)))
      .returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (e) {
    res.status(500).json({ error: "Failed to update note" });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
  const { id } = req.params;
  try {
    await db.delete(notes).where(and(eq(notes.id, id), eq(notes.userId, userId)));
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to delete note" });
  }
});

export default router;
