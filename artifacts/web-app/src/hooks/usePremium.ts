import { useAuth, useClerk, useUser } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { checkUserPlan, isPremiumUser, PlanType } from "../lib/billing";
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
  const backendPlanTier: PlanType | undefined = userMeData?.planTier;
  const clientPlanTier: PlanType = checkUserPlan(user, hasFn);

  // Derive planTier prioritizing non-free plan state
  let planTier: PlanType = "free";
  if (backendPlanTier && backendPlanTier !== "free") {
    planTier = backendPlanTier;
  } else if (clientPlanTier && clientPlanTier !== "free") {
    planTier = clientPlanTier;
  }

  const isBusiness = planTier === "business" || isPremiumUser(user, backendPlanTier);
  const isPlus = isBusiness;
  const isPremium = planTier !== "free" || isBusiness;
  const planName = isBusiness ? "CLYVEN PLUS" : "Free";

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
    isLoaded: isLoaded && !isMeLoading,
    planTier,
    planName,
    openUpgrade,
    openManage,
    limits: FREE_LIMITS,
  };
}
