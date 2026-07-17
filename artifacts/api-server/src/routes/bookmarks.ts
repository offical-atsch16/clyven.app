import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { requireAuth, type AuthenticatedRequest } from "../lib/requireAuth.js";
import { snakeToCamel } from "../lib/snakeToCamel.js";

const router = Router();
const FREE_LIMIT = 25;

router.get("/", requireAuth, async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
  try {
    const { data, error } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json((data || []).map(snakeToCamel));
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch bookmarks", detail: e.message });
  }
});

router.post("/", requireAuth, async (req, res) => {
  const { userId, isPremium } = req as AuthenticatedRequest;

  if (!isPremium) {
    const { count } = await supabase
      .from("bookmarks")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);
    if ((count || 0) >= FREE_LIMIT) {
      return res.status(403).json({
        error: "LIMIT_REACHED",
        limit: FREE_LIMIT,
        message: `Free-Plan: Maximal ${FREE_LIMIT} Bookmarks. Upgrade auf CLYVEN PLUS für unbegrenzte Bookmarks.`,
      });
    }
  }

  const { url, title, description, thumbnail, siteName, category, tags, isReadLater } = req.body;
  try {
    const { data, error } = await supabase
      .from("bookmarks")
      .insert({ user_id: userId, url, title, description, thumbnail, site_name: siteName, category, tags, is_read_later: isReadLater })
      .select()
      .single();
    if (error) throw error;
    res.json(snakeToCamel(data));
  } catch (e: any) {
    res.status(500).json({ error: "Failed to create bookmark", detail: e.message });
  }
});

router.put("/:id", requireAuth, async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
  const { id } = req.params;
  const updates = req.body;
  try {
    const { data, error } = await supabase
      .from("bookmarks")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Not found" });
    res.json(snakeToCamel(data));
  } catch (e: any) {
    res.status(500).json({ error: "Failed to update bookmark", detail: e.message });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
  const { id } = req.params;
  try {
    const { error } = await supabase.from("bookmarks").delete().eq("id", id).eq("user_id", userId);
    if (error) throw error;
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: "Failed to delete bookmark", detail: e.message });
  }
});

export default router;
