// Clerk & Clyven Billing configuration.

export const PREMIUM_PLAN = "clyven_business";
export const PREMIUM_FEATURE = "premium_access";

export type PlanType = "free" | "business";
export type PlanTier = PlanType;

/**
 * Helper-Funktion: Prüfe ausschließlich auf user.publicMetadata.plan === 'business'
 */
export function hasBusinessPlan(user?: any): boolean {
  return user?.publicMetadata?.plan === "business";
}

/**
 * Helper-Funktion: Prüfe ob der User ein Premium/Business-Nutzer ist
 */
export function isPremiumUser(user?: any, backendPlanTier?: PlanType): boolean {
  if (backendPlanTier && backendPlanTier === "business") return true;
  return user?.publicMetadata?.plan === "business";
}

/**
 * Checks and resolves user plan tier across Clerk metadata, auth.has,
 * Supabase profile data, and backend user plan state.
 */
export function checkUserPlan(
  user?: any,
  hasFn?: (param: any) => boolean,
  profileData?: any,
  backendPlanTier?: PlanType
): PlanType {
  if (backendPlanTier && backendPlanTier === "business") {
    return "business";
  }

  if (user?.publicMetadata?.plan === "business") {
    return "business";
  }

  // Check Clerk auth.has if available
  if (typeof hasFn === "function") {
    try {
      if (
        hasFn({ plan: PREMIUM_PLAN }) ||
        hasFn({ plan: "business" }) ||
        hasFn({ plan: "clyven_business" }) ||
        hasFn({ feature: PREMIUM_FEATURE })
      ) {
        return "business";
      }
    } catch {
      // Ignore if hasFn fails
    }
  }

  const meta = {
    ...(user?.publicMetadata || {}),
    ...(user?.unsafeMetadata || {}),
  };

  const metaPlanStr = String(meta.plan || meta.tier || meta.subscription || "").toLowerCase();

  if (
    metaPlanStr === "business" ||
    metaPlanStr === "clyven_business" ||
    meta.clyven_business === true ||
    meta.business === true
  ) {
    return "business";
  }

  if (profileData) {
    const profilePlan = String(profileData.plan || profileData.tier || "").toLowerCase();
    if (profilePlan.includes("business")) {
      return "business";
    }
  }

  return "free";
}

/**
 * Backward compatibility alias for hasBusinessPlan / isPremiumUser
 */
export function hasPlusPlan(
  user?: any,
  hasFn?: (param: any) => boolean,
  profileData?: any,
  backendPlanTier?: PlanType
): boolean {
  return isPremiumUser(user, backendPlanTier);
}
