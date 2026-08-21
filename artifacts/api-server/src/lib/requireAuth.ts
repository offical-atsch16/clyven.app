import { getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";
import { supabase } from "./supabase.js";

export type PlanTier = "free" | "plus" | "business";

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
        if (has({ plan: "clyven_business" }) || has({ plan: "business" }) || has({ feature: "business_access" })) {
          return "business";
        }
        if (
          has({ plan: "clyven_plus" }) ||
          has({ plan: "plus" }) ||
          has({ plan: "premium" }) ||
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
      planStr === "business" ||
      planStr === "clyven_business" ||
      planStr === "pro_business" ||
      meta.clyven_business === true ||
      meta.business === true ||
      claims.clyven_business === true ||
      claims.business === true
    ) {
      return "business";
    }

    if (
      planStr === "plus" ||
      planStr === "clyven_plus" ||
      planStr === "premium" ||
      meta.clyven_plus === true ||
      meta.premium === true ||
      meta.plus === true ||
      claims.clyven_plus === true ||
      claims.premium === true
    ) {
      return "plus";
    }

    // Check Supabase subscriptions table if auth userId exists
    if (auth.userId) {
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
        if (subPlan.includes("plus") || subPlan.includes("premium")) return "plus";
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
