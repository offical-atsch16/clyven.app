import { useAuth, useClerk, useUser } from "@clerk/react";
import { useLocation } from "wouter";
import { PREMIUM_FEATURE, PREMIUM_PLAN } from "../lib/billing";

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

  const hasPremium =
    typeof has === "function" &&
    (has({ plan: PREMIUM_PLAN }) || has({ feature: PREMIUM_FEATURE }));

  const isPremium =
    hasPremium ||
    user?.publicMetadata?.plan === "premium" ||
    user?.publicMetadata?.clyven_plus === true ||
    user?.publicMetadata?.premium === true;

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

  return { isPremium: !!isPremium, isLoaded, openUpgrade, openManage, limits: FREE_LIMITS };
}
