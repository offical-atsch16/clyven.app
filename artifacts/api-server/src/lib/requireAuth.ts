import { getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";

// Keep these in sync with the Clerk Dashboard (Subscription plans -> Plans for
// Users) and with the frontend config in web-app/src/lib/billing.ts.
const PREMIUM_PLAN = "clyven_plus";
const PREMIUM_FEATURE = "premium_access";

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
      (has({ plan: PREMIUM_PLAN }) || has({ feature: PREMIUM_FEATURE }));
  } catch {
    r.isPremium = false;
  }

  next();
}
