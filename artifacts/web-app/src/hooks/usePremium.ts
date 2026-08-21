import { useAuth, useClerk, useUser } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { checkUserPlan, PlanTier } from "../lib/billing";
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

  const clientPlanTier: PlanTier = checkUserPlan(user, typeof has === "function" ? has : undefined);

  const { data: userMeData, isLoading: isMeLoading } = useQuery({
    queryKey: ["user-me", user?.id],
    queryFn: () => api.getMe(),
    enabled: !!isSignedIn && !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
  });

  const backendPlanTier: PlanTier | undefined = userMeData?.planTier;
  const planTier: PlanTier = backendPlanTier || clientPlanTier;

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
    isLoaded: isLoaded && !isMeLoading,
    planTier,
    planName,
    openUpgrade,
    openManage,
    limits: FREE_LIMITS,
  };
}
