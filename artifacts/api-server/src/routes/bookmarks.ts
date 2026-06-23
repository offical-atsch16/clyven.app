import { Router } from "express";
import { db, bookmarks } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, type AuthenticatedRequest } from "../lib/requireAuth.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
  try {
    const rows = await db
      .select()
      .from(bookmarks)
      .where(eq(bookmarks.userId, userId))
      .orderBy(desc(bookmarks.createdAt));
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch bookmarks" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
  const { url, title, description, thumbnail, siteName, category, tags, isReadLater } = req.body;
  try {
    const [row] = await db
      .insert(bookmarks)
      .values({ userId, url, title, description, thumbnail, siteName, category, tags, isReadLater })
      .returning();
    res.json(row);
  } catch (e) {
    res.status(500).json({ error: "Failed to create bookmark" });
  }
});

router.put("/:id", requireAuth, async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
  const { id } = req.params;
  const updates = req.body;
  try {
    const [row] = await db
      .update(bookmarks)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(bookmarks.id, id), eq(bookmarks.userId, userId)))
      .returning();
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (e) {
    res.status(500).json({ error: "Failed to update bookmark" });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
  const { id } = req.params;
  try {
    await db.delete(bookmarks).where(and(eq(bookmarks.id, id), eq(bookmarks.userId, userId)));
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to delete bookmark" });
  }
});

export default router;
