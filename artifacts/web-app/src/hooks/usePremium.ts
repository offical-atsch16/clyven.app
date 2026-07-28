import { useAuth, useClerk, useUser } from "@clerk/react";
import { useLocation } from "wouter";
import { BUSINESS_PLAN, PREMIUM_FEATURE, PREMIUM_PLAN } from "../lib/billing";

export const FREE_LIMITS = {
  notes: 10,
  bookmarks: 25,
  focusModesCustom: 1,
  tasks: 20,
};

export type PlanTier = "free" | "plus" | "business";

export function usePremium() {
  const { has, isLoaded } = useAuth();
  const { user } = useUser();
  const clerk = useClerk();
  const [, navigate] = useLocation();

  const hasBusiness = typeof has === "function" && has({ plan: BUSINESS_PLAN });
  const hasPlus =
    typeof has === "function" && (has({ plan: PREMIUM_PLAN }) || has({ feature: PREMIUM_FEATURE }));

  // Determine plan tier from Clerk billing or metadata fallbacks
  const planTier: PlanTier = hasBusiness
    ? "business"
    : hasPlus ||
      user?.publicMetadata?.plan === "premium" ||
      user?.publicMetadata?.clyven_plus === true ||
      user?.publicMetadata?.premium === true ||
      user?.publicMetadata?.plan === "plus"
    ? "plus"
    : "free";

  const isPremium = planTier !== "free";
  const planName = planTier === "business" ? "Business" : planTier === "plus" ? "Plus" : "Free";

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

  return {
    isPremium,
    isLoaded,
    planTier,
    planName,
    openUpgrade,
    openManage,
    limits: FREE_LIMITS,
  };
}
