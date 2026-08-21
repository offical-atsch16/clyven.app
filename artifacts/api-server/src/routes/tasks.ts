import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { requireAuth, type AuthenticatedRequest } from "../lib/requireAuth.js";
import { snakeToCamel } from "../lib/snakeToCamel.js";

const router = Router();
const FREE_LIMIT = 10;

router.get("/", requireAuth, async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
  try {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    res.json((data || []).map(snakeToCamel));
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch tasks", detail: e.message });
  }
});

router.post("/", requireAuth, async (req, res) => {
  const { userId, planTier, isPremium } = req as AuthenticatedRequest;
  const {
    title,
    description,
    status,
    priority,
    tags,
    subtasks,
    timeSpent,
    timerStartedAt,
    customFields,
    startDate,
    dueDate,
  } = req.body;

  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }

  try {
    if (!isPremium) {
      const { count } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);
      if ((count || 0) >= FREE_LIMIT) {
        return res.status(403).json({
          error: "LIMIT_REACHED",
          limit: FREE_LIMIT,
          message: `Free plan: Maximum ${FREE_LIMIT} tasks reached. Upgrade to CLYVEN PLUS or BUSINESS for unlimited tasks.`,
        });
      }
    }

    const finalSubtasks = planTier === "business" ? (subtasks || []) : [];
    const finalTimeSpent = planTier === "business" ? (timeSpent || 0) : 0;
    const finalTimerStartedAt = planTier === "business" ? (timerStartedAt || null) : null;
    const finalCustomFields = planTier === "business" ? (customFields || []) : [];
    const finalStartDate = planTier === "business" ? (startDate || null) : null;
    const finalDueDate = planTier === "business" ? (dueDate || null) : null;

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        user_id: userId,
        title,
        description: description || "",
        status: status || "TODO",
        priority: priority || "MEDIUM",
        tags: tags || [],
        subtasks: finalSubtasks,
        time_spent: finalTimeSpent,
        timer_started_at: finalTimerStartedAt,
        custom_fields: finalCustomFields,
        start_date: finalStartDate,
        due_date: finalDueDate,
      })
      .select()
      .single();
    if (error) throw error;
    res.json(snakeToCamel(data));
  } catch (e: any) {
    res.status(500).json({ error: "Failed to create task", detail: e.message });
  }
});

router.put("/:id", requireAuth, async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
  const { id } = req.params;
  const {
    title,
    description,
    status,
    priority,
    tags,
    subtasks,
    timeSpent,
    timerStartedAt,
    customFields,
    startDate,
    dueDate,
  } = req.body;

  try {
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (tags !== undefined) updateData.tags = tags;
    if (subtasks !== undefined) updateData.subtasks = subtasks;
    if (timeSpent !== undefined) updateData.time_spent = timeSpent;
    if (timerStartedAt !== undefined) updateData.timer_started_at = timerStartedAt;
    if (customFields !== undefined) updateData.custom_fields = customFields;
    if (startDate !== undefined) updateData.start_date = startDate;
    if (dueDate !== undefined) updateData.due_date = dueDate;

    const { data, error } = await supabase
      .from("tasks")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Task not found" });
    res.json(snakeToCamel(data));
  } catch (e: any) {
    res.status(500).json({ error: "Failed to update task", detail: e.message });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  const { userId } = req as AuthenticatedRequest;
  const { id } = req.params;
  try {
    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);
    if (error) throw error;
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: "Failed to delete task", detail: e.message });
  }
});

export default router;
