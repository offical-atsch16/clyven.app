import { getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";
import { supabase } from "./supabase.js";

export type PlanType = "free" | "business";
export type PlanTier = PlanType;

export interface AuthenticatedRequest extends Request {
  userId: string;
  planTier: PlanType;
  isPremium: boolean;
}

export async function checkBackendUserPlan(auth: any): Promise<PlanType> {
  if (!auth) return "free";

  try {
    const has = auth.has;
    if (typeof has === "function") {
      try {
        if (
          has({ plan: "clyven_business" }) ||
          has({ plan: "business" }) ||
          has({ feature: "premium_access" })
        ) {
          return "business";
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
      planStr === "business" ||
      planStr === "clyven_business" ||
      meta.clyven_business === true ||
      meta.business === true ||
      claims.clyven_business === true
    ) {
      return "business";
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
        if (p.includes("business")) return "business";
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
        if (subPlan.includes("business")) return "business";
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
