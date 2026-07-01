import { useAuth, useClerk, useUser } from "@clerk/react";
import { useLocation } from "wouter";
import { PLAN_TIERS, PLANS, type PlanTier } from "../lib/billing";

export const FREE_LIMITS = {
  notes: 10,
  bookmarks: 25,
  focusModesCustom: 1,
};

export function usePremium() {
  const { has, isLoaded } = useAuth();
  const { user } = useUser();
  const clerk = useClerk();
  const [, navigate] = useLocation();

  // Resolve the highest tier the user holds (PLAN_TIERS is ordered high -> low).
  let tier: PlanTier | null = null;
  if (typeof has === "function") {
    for (const t of PLAN_TIERS) {
      const { slug, feature } = PLANS[t];
      if (has({ plan: slug }) || (feature ? has({ feature }) : false)) {
        tier = t;
        break;
      }
    }
  }

  const metadataPremium =
    user?.publicMetadata?.plan === "premium" ||
    user?.publicMetadata?.clyven_plus === true ||
    user?.publicMetadata?.premium === true;

  const isPremium = tier !== null || metadataPremium;
  const planLabel = tier ? PLANS[tier].label : null;

  // Send users to the pricing page, where the Clerk <PricingTable /> handles
  // plan selection, payment collection and checkout.
  function openUpgrade() {
    navigate("/pricing");
  }

  // Subscription management (cancel, change payment method, invoices) lives in
  // the Billing tab of the Clerk <UserProfile /> modal.
  function openManage() {
    clerk.openUserProfile();
  }

  return { isPremium, isLoaded, tier, planLabel, openUpgrade, openManage, limits: FREE_LIMITS };
}
