import { useAuth, useClerk, useUser } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { checkUserPlan, hasPlusPlan, PlanTier } from "../lib/billing";
import { api } from "../lib/api";

export const FREE_LIMITS = {
  notes: 10,
  bookmarks: 10,
  tasks: 10,
  focusModesCustom: 1,
};

export function usePremium() {
  const { has, isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const clerk = useClerk();
  const [, navigate] = useLocation();

  const { data: userMeData, isLoading: isMeLoading } = useQuery({
    queryKey: ["user-me", user?.id],
    queryFn: () => api.getMe(),
    enabled: !!isSignedIn && !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  });

  const hasFn = typeof has === "function" ? has : undefined;
  const backendPlanTier: PlanTier | undefined = userMeData?.planTier;
  const clientPlanTier: PlanTier = checkUserPlan(user, hasFn);

  // Derive planTier prioritizing non-free plan state
  let planTier: PlanTier = "free";
  if (backendPlanTier && backendPlanTier !== "free") {
    planTier = backendPlanTier;
  } else if (clientPlanTier && clientPlanTier !== "free") {
    planTier = clientPlanTier;
  }

  const isPlus = planTier === "plus" || hasPlusPlan(user, hasFn, undefined, backendPlanTier);
  const isPremium = planTier !== "free" || isPlus;
  const planName = isPlus ? "CLYVEN PLUS" : "Free";

  function openUpgrade() {
    navigate("/pricing");
  }

  function openManage() {
    clerk.openUserProfile();
  }

  return {
    isPremium,
    isPlus,
    isLoaded: isLoaded && !isMeLoading,
    planTier,
    planName,
    openUpgrade,
    openManage,
    limits: FREE_LIMITS,
  };
}
