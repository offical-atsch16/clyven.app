import { useAuth, useClerk, useUser } from "@clerk/react";
import { useLocation } from "wouter";
import { checkUserPlan, PlanTier } from "../lib/billing";

export const FREE_LIMITS = {
  notes: 10,
  bookmarks: 10,
  tasks: 10,
  focusModesCustom: 1,
};

export function usePremium() {
  const { has, isLoaded } = useAuth();
  const { user } = useUser();
  const clerk = useClerk();
  const [, navigate] = useLocation();

  const planTier: PlanTier = checkUserPlan(user, typeof has === "function" ? has : undefined);

  const isBusiness = planTier === "business";
  const isPlus = planTier === "plus";
  const isPremium = planTier !== "free";
  const planName = planTier === "business" ? "Business" : planTier === "plus" ? "Plus" : "Free";

  function openUpgrade() {
    navigate("/pricing");
  }

  function openManage() {
    clerk.openUserProfile();
  }

  return {
    isPremium,
    isPlus,
    isBusiness,
    isLoaded,
    planTier,
    planName,
    openUpgrade,
    openManage,
    limits: FREE_LIMITS,
  };
}
