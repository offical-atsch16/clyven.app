import { getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";

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
    const has = (auth as any).has;
    r.isPremium =
      (typeof has === "function" &&
        (has({ plan: "clyven_plus" }) || has({ plan: "plus" }))) ||
      false;
  } catch {
    r.isPremium = false;
  }

  next();
}
