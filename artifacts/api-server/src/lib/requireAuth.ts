import { getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";

// Keep these in sync with the Clerk Dashboard (Subscription plans -> Plans for
// Users) and with the frontend config in web-app/src/lib/billing.ts.
// Any paid tier (Plus or Business) counts as premium for server-side gating.
const PAID_PLANS = [
  { plan: "clyven_business", feature: "business_access" },
  { plan: "clyven_plus", feature: "premium_access" },
];

export interface AuthenticatedRequest extends Request {
  userId: string;
  isPremium: boolean;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = getAuth(req);
  if (!auth?.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const r = req as AuthenticatedRequest;
  r.userId = auth.userId;

  try {
    const has = auth.has;
    r.isPremium =
      typeof has === "function" &&
      PAID_PLANS.some(({ plan, feature }) => has({ plan }) || has({ feature }));
  } catch {
    r.isPremium = false;
  }

  next();
}
