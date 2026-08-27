import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { requireAuth, type AuthenticatedRequest } from "../lib/requireAuth.js";
import { snakeToCamel } from "../lib/snakeToCamel.js";

const router = Router();

// GET /api/snippets - List user code snippets
router.get("/snippets", requireAuth, async (req, res) => {
  const { userId } = req as AuthenticatedRequest;

  try {
    const { data: snippets, error } = await supabase
      .from("code_snippets")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const formatted = (snippets || []).map((s: any) => snakeToCamel(s));
    return res.json(formatted);
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to fetch code snippets", details: err.message });
  }
});

// POST /api/snippets - Create code snippet (capped at 10 for Free users)
router.post("/snippets", requireAuth, async (req, res) => {
  const { userId, isPremium } = req as AuthenticatedRequest;
  const { title, language, codeContent, tags } = req.body;

  if (!title || !codeContent) {
    return res.status(400).json({ error: "Title and code content are required" });
  }

  try {
    // Check snippet limit for free users
    if (!isPremium) {
      const { count } = await supabase
        .from("code_snippets")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      if ((count ?? 0) >= 10) {
        return res.status(403).json({
          error: "LIMIT_REACHED",
          message: "Free plan limit reached (max 10 code snippets). Upgrade to Clyven Plus for unlimited snippets.",
        });
      }
    }

    const newSnippet = {
      user_id: userId,
      title: String(title).trim(),
      language: String(language || "javascript").toLowerCase(),
      code_content: String(codeContent),
      tags: Array.isArray(tags) ? tags : [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("code_snippets")
      .insert(newSnippet)
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json(snakeToCamel(data));
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to create code snippet", details: err.message });
  }
});

// PUT /api/snippets/:id - Update code snippet
router.put("/snippets/:id", requireAuth, async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
  const { id } = req.params;
  const { title, language, codeContent, tags } = req.body;

  try {
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (title !== undefined) updateData.title = String(title).trim();
    if (language !== undefined) updateData.language = String(language).toLowerCase();
    if (codeContent !== undefined) updateData.code_content = String(codeContent);
    if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags : [];

    const { data, error } = await supabase
      .from("code_snippets")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Snippet not found" });

    return res.json(snakeToCamel(data));
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to update code snippet", details: err.message });
  }
});

// DELETE /api/snippets/:id - Delete code snippet
router.delete("/snippets/:id", requireAuth, async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
  const { id } = req.params;

  try {
    const { error } = await supabase
      .from("code_snippets")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw error;

    return res.json({ success: true, message: "Code snippet deleted successfully" });
  } catch (err: any) {
    return res.status(500).json({ error: "Failed to delete code snippet", details: err.message });
  }
});

export default router;
