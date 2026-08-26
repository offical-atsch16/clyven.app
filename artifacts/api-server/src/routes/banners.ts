import { Router } from "express";
import { supabase } from "../lib/supabase.js";

const router = Router();

function snakeToCamel(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = value;
  }
  return result;
}

// GET /api/banners/active?route=/notes
router.get("/active", async (req, res) => {
  const route = (req.query.route as string || "*").trim();

  try {
    const { data: banners, error } = await supabase
      .from("system_banners")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    if (!banners || banners.length === 0) {
      return res.json({ banner: null });
    }

    // Match route wildcard or exact path
    const matchingBanner = banners.find((b) => {
      const target = b.target_route || "*";
      if (target === "*") return true;
      if (target === route) return true;
      if (target.endsWith("*") && route.startsWith(target.slice(0, -1))) return true;
      return false;
    });

    if (!matchingBanner) {
      return res.json({ banner: null });
    }

    res.json({ banner: snakeToCamel(matchingBanner) });
  } catch (e: any) {
    res.status(500).json({ error: "Failed to fetch active banner", detail: e.message });
  }
});

export default router;
