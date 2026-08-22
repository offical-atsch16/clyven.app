import { getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";
import { supabase } from "./supabase.js";

export type PlanTier = "free" | "plus";

export interface AuthenticatedRequest extends Request {
  userId: string;
  planTier: PlanTier;
  isPremium: boolean;
}

export async function checkBackendUserPlan(auth: any): Promise<PlanTier> {
  if (!auth) return "free";

  try {
    const has = auth.has;
    if (typeof has === "function") {
      try {
        if (
          has({ plan: "clyven_plus" }) ||
          has({ plan: "plus" }) ||
          has({ plan: "premium" }) ||
          has({ plan: "clyven_business" }) ||
          has({ plan: "business" }) ||
          has({ feature: "premium_access" })
        ) {
          return "plus";
        }
      } catch {
        // Ignore has function error
      }
    }

    const claims = (auth.sessionClaims || {}) as any;
    const meta = {
      ...(claims.publicMetadata || {}),
      ...(claims.public_metadata || {}),
      ...(claims.metadata || {}),
      ...(claims.unsafeMetadata || {}),
    };

    const planStr = String(
      meta.plan || meta.tier || meta.subscription || claims.plan || claims.tier || claims.subscription || ""
    ).toLowerCase();

    if (
      planStr === "plus" ||
      planStr === "clyven_plus" ||
      planStr === "premium" ||
      planStr === "business" ||
      planStr === "clyven_business" ||
      meta.clyven_plus === true ||
      meta.premium === true ||
      meta.plus === true ||
      meta.business === true ||
      claims.clyven_plus === true ||
      claims.premium === true
    ) {
      return "plus";
    }

    // Check Supabase profiles and subscriptions table if auth userId exists
    if (auth.userId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("plan")
        .eq("id", auth.userId)
        .maybeSingle();

      if (profile?.plan) {
        const p = String(profile.plan).toLowerCase();
        if (p.includes("plus") || p.includes("premium") || p.includes("business")) return "plus";
      }

      const { data, error } = await supabase
        .from("subscriptions")
        .select("plan, status")
        .eq("user_id", auth.userId)
        .in("status", ["active", "trialing"])
        .order("created_at", { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        const subPlan = String(data[0].plan || "").toLowerCase();
        if (subPlan.includes("plus") || subPlan.includes("premium") || subPlan.includes("business")) return "plus";
      }
    }
  } catch (err) {
    console.error("[PLAN CHECK ERROR]", err);
  }

  return "free";
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = getAuth(req);
  if (!auth?.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const r = req as AuthenticatedRequest;
  r.userId = auth.userId;

  try {
    const planTier = await checkBackendUserPlan(auth);
    r.planTier = planTier;
    r.isPremium = planTier !== "free";
  } catch {
    r.planTier = "free";
    r.isPremium = false;
  }

  next();
}
