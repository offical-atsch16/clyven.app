// Clerk & Clyven Billing configuration.

export const PREMIUM_PLAN = "clyven_plus";
export const PREMIUM_FEATURE = "premium_access";

export type PlanTier = "free" | "plus";

/**
 * Checks and resolves user plan tier across Clerk metadata, auth.has,
 * Supabase profile data, and backend user plan state.
 */
export function checkUserPlan(
  user?: any,
  hasFn?: (param: any) => boolean,
  profileData?: any,
  backendPlanTier?: PlanTier
): PlanTier {
  if (backendPlanTier && backendPlanTier !== "free") {
    return backendPlanTier;
  }

  // Check Clerk auth.has if available
  if (typeof hasFn === "function") {
    try {
      if (
        hasFn({ plan: PREMIUM_PLAN }) ||
        hasFn({ plan: "plus" }) ||
        hasFn({ plan: "premium" }) ||
        hasFn({ plan: "clyven_business" }) ||
        hasFn({ plan: "business" }) ||
        hasFn({ feature: PREMIUM_FEATURE })
      ) {
        return "plus";
      }
    } catch {
      // Ignore if hasFn fails
    }
  }

  // Check Clerk publicMetadata and unsafeMetadata
  const meta = {
    ...(user?.publicMetadata || {}),
    ...(user?.unsafeMetadata || {}),
  };

  const metaPlanStr = String(meta.plan || meta.tier || meta.subscription || "").toLowerCase();

  if (
    metaPlanStr === "plus" ||
    metaPlanStr === "clyven_plus" ||
    metaPlanStr === "premium" ||
    metaPlanStr === "business" ||
    metaPlanStr === "clyven_business" ||
    meta.clyven_plus === true ||
    meta.clyven_business === true ||
    meta.premium === true ||
    meta.plus === true ||
    meta.business === true
  ) {
    return "plus";
  }

  // Check Supabase profile data if provided
  if (profileData) {
    const profilePlan = String(profileData.plan || profileData.tier || "").toLowerCase();
    if (profilePlan.includes("plus") || profilePlan.includes("premium") || profilePlan.includes("business")) {
      return "plus";
    }
  }

  return "free";
}

/**
 * Helper function to determine whether user has the 'Plus' plan.
 * Evaluates Clerk user metadata, auth.has, Supabase profile, and backend plan state consistently.
 * This is now the sole helper check for all premium features.
 */
export function hasPlusPlan(
  user?: any,
  hasFn?: (param: any) => boolean,
  profileData?: any,
  backendPlanTier?: PlanTier
): boolean {
  const tier = checkUserPlan(user, hasFn, profileData, backendPlanTier);
  return tier === "plus";
}
