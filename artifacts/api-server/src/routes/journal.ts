import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { requireAuth, type AuthenticatedRequest } from "../lib/requireAuth.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
  try {
    const { data, error } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch journal entries", detail: e.message });
  }
});

router.get("/:date", requireAuth, async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
  const { date } = req.params;
  try {
    const { data, error } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("user_id", userId)
      .eq("date", date)
      .maybeSingle();
    if (error) throw error;
    res.json(data || null);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch journal entry", detail: e.message });
  }
});

router.post("/", requireAuth, async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
  const { date, mood, wentWell, learned, grateful, tomorrowGoals, freeText } = req.body;
  try {
    // Check if entry exists
    const { data: existing } = await supabase
      .from("journal_entries")
      .select("id")
      .eq("user_id", userId)
      .eq("date", date)
      .maybeSingle();

    if (existing) {
      const { data, error } = await supabase
        .from("journal_entries")
        .update({ mood, went_well: wentWell, learned, grateful, tomorrow_goals: tomorrowGoals, free_text: freeText, updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("date", date)
        .select()
        .single();
      if (error) throw error;
      return res.json(data);
    }

    const { data, error } = await supabase
      .from("journal_entries")
      .insert({ user_id: userId, date, mood, went_well: wentWell, learned, grateful, tomorrow_goals: tomorrowGoals, free_text: freeText })
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: "Failed to save journal entry", detail: e.message });
  }
});

export default router;
