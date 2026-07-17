import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { requireAuth, type AuthenticatedRequest } from "../lib/requireAuth.js";

const router = Router();
const FREE_LIMIT = 10;

router.get("/", requireAuth, async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
  try {
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", userId)
      .eq("is_archived", false)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch notes", detail: e.message });
  }
});

router.post("/", requireAuth, async (req, res) => {
  const { userId, isPremium } = req as AuthenticatedRequest;
  const { title, content, category, tags, color } = req.body;

  if (!isPremium) {
    const { count } = await supabase
      .from("notes")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_archived", false);
    if ((count || 0) >= FREE_LIMIT) {
      return res.status(403).json({
        error: "LIMIT_REACHED",
        limit: FREE_LIMIT,
        message: `Free-Plan: Maximal ${FREE_LIMIT} Notizen. Upgrade auf CLYVEN PLUS für unbegrenzte Notizen.`,
      });
    }
  }

  const wordCount = (content || "").trim().split(/\s+/).filter(Boolean).length;
  try {
    const { data, error } = await supabase
      .from("notes")
      .insert({ user_id: userId, title: title || "Untitled", content: content || "", category, tags, color, word_count: wordCount })
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to create note", detail: e.message });
  }
});

router.put("/:id", requireAuth, async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
  const { id } = req.params;
  const { title, content, category, tags, color, isPinned, isFavorite, isArchived } = req.body;
  const wordCount = content !== undefined ? content.trim().split(/\s+/).filter(Boolean).length : undefined;
  try {
    const { data, error } = await supabase
      .from("notes")
      .update({ title, content, category, tags, color, is_pinned: isPinned, is_favorite: isFavorite, is_archived: isArchived, word_count: wordCount, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Not found" });
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to update note", detail: e.message });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
  const { id } = req.params;
  try {
    const { error } = await supabase.from("notes").delete().eq("id", id).eq("user_id", userId);
    if (error) throw error;
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: "Failed to delete note", detail: e.message });
  }
});

export default router;
