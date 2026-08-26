import type { Request, Response, NextFunction } from "express";
import { supabase } from "../lib/supabase.js";

export async function readOnlyGuard(req: Request, res: Response, next: NextFunction) {
  // Allow safe HTTP methods (GET, HEAD, OPTIONS)
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  // Allow admin and setup operations to manage settings during maintenance
  if (req.path.startsWith("/admin") || req.path.startsWith("/setup")) {
    return next();
  }

  try {
    const { data } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "read_only_mode")
      .single();

    const isReadOnly = data?.value === true || data?.value === "true" || data?.value?.enabled === true;

    if (isReadOnly) {
      return res.status(503).json({
        error: "System befindet sich in Wartungsarbeiten. Änderungen können aktuell nicht gespeichert werden.",
        readOnlyMode: true,
      });
    }
  } catch (err) {
    // If table doesn't exist yet or error occurs, default to allowing request
    console.warn("Read-only mode check warning:", err);
  }

  next();
}
