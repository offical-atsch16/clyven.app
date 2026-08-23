import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { getAuth } from "@clerk/express";

const router = Router();

function snakeToCamel(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = value;
  }
  return result;
}

// GET /api/feature-flags
router.get("/", async (req, res) => {
  const auth = getAuth(req);
  const userId = auth.userId || null;

  try {
    const { data: flags, error } = await supabase
      .from("feature_flags")
      .select("*");

    if (error) throw error;

    const flagMap: Record<string, boolean> = {};

    (flags || []).forEach((flag) => {
      const isGlobal = flag.is_enabled_globally;
      const allowedUsers = Array.isArray(flag.allowed_user_ids)
        ? flag.allowed_user_ids
        : typeof flag.allowed_user_ids === "string"
        ? JSON.parse(flag.allowed_user_ids || "[]")
        : [];

      const isAllowedForUser = userId && allowedUsers.includes(userId);
      flagMap[flag.flag_key] = Boolean(isGlobal || isAllowedForUser);
    });

    res.json({ flags: flagMap });
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch feature flags", detail: e.message });
  }
});

export default router;
