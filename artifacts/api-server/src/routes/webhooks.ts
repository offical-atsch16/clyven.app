import { Router, type Request, type Response } from "express";
import { clerkClient } from "@clerk/express";
import { supabase } from "../lib/supabase.js";
import { requireAuth, type AuthenticatedRequest } from "../lib/requireAuth.js";

const router = Router();

export function normalizePlanName(rawPlan?: string): "plus" | "free" {
  if (!rawPlan) return "free";
  const p = String(rawPlan).toLowerCase();
  if (p.includes("plus") || p.includes("premium") || p.includes("clyven_plus") || p.includes("business") || p.includes("clyven_business")) {
    return "plus";
  }
  return "free";
}

/**
 * Webhook handler for Stripe payment/checkout completion
 * Supports Stripe event objects (e.g. checkout.session.completed, customer.subscription.created/updated)
 * or custom/Clerk webhook payloads.
 */
router.post("/stripe", async (req: Request, res: Response) => {
  try {
    const event = req.body;
    let userId: string | null = null;
    let rawPlan: string = "plus";

    if (event?.type) {
      // Stripe Webhook Event Format
      const object = event.data?.object || {};
      userId = object.client_reference_id || object.metadata?.userId || object.metadata?.user_id || object.customer_email || null;
      rawPlan = object.metadata?.plan || object.metadata?.tier || object.lines?.data?.[0]?.price?.nickname || "plus";
    } else {
      // Direct / Generic webhook payload
      userId = req.body.userId || req.body.user_id || req.body.client_reference_id || null;
      rawPlan = req.body.plan || req.body.tier || "plus";
    }

    if (!userId) {
      return res.status(400).json({ error: "Missing userId in webhook payload" });
    }

    const planTier = normalizePlanName(rawPlan);

    // 1. Sync Supabase profiles table
    const { error: profileErr } = await supabase
      .from("profiles")
      .upsert(
        {
          id: userId,
          plan: planTier,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

    if (profileErr) {
      console.error("[WEBHOOK ERROR] Failed to update profiles in Supabase:", profileErr);
    }

    // 2. Sync Supabase subscriptions table
    const { error: subErr } = await supabase
      .from("subscriptions")
      .upsert(
        {
          user_id: userId,
          plan: planTier === "plus" ? "clyven_plus" : "clyven_free",
          status: "active",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (subErr) {
      console.error("[WEBHOOK ERROR] Failed to update subscriptions in Supabase:", subErr);
    }

    // 3. Sync Clerk publicMetadata
    try {
      await clerkClient.users.updateUserMetadata(userId, {
        publicMetadata: {
          plan: planTier,
          clyven_plus: planTier === "plus",
          updatedAt: new Date().toISOString(),
        },
      });
      console.log(`[WEBHOOK SUCCESS] Updated Clerk publicMetadata for user ${userId} to plan: ${planTier}`);
    } catch (clerkErr: any) {
      console.error(`[WEBHOOK ERROR] Failed to update Clerk publicMetadata for user ${userId}:`, clerkErr);
    }

    return res.json({
      success: true,
      userId,
      plan: planTier,
      syncedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[WEBHOOK EXCEPTION]", err);
    return res.status(500).json({ error: "Webhook processing failed", details: err.message });
  }
});

/**
 * Direct Plan Sync Endpoint (requires authentication)
 */
router.post("/sync", requireAuth, async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const targetUserId = req.body.userId || authReq.userId;

  // Non-admin users can only trigger plan sync for their own user ID
  if (targetUserId !== authReq.userId) {
    return res.status(403).json({ error: "Forbidden: Cannot sync another user's plan" });
  }

  const planTier = normalizePlanName(req.body.plan || authReq.planTier);

  try {
    // 1. Supabase profiles
    await supabase.from("profiles").upsert(
      { id: targetUserId, plan: planTier, updated_at: new Date().toISOString() },
      { onConflict: "id" }
    );

    // 2. Supabase subscriptions
    await supabase.from("subscriptions").upsert(
      { user_id: targetUserId, plan: planTier === "plus" ? "clyven_plus" : "clyven_free", status: "active", updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );

    // 3. Clerk publicMetadata
    await clerkClient.users.updateUserMetadata(targetUserId, {
      publicMetadata: {
        plan: planTier,
        clyven_plus: planTier === "plus",
      },
    });

    return res.json({ success: true, userId: targetUserId, plan: planTier });
  } catch (err: any) {
    return res.status(500).json({ error: "Sync failed", details: err.message });
  }
});

export default router;
