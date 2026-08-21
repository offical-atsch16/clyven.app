// Clerk Billing configuration.
// These slugs match what is configured in the Clerk Dashboard under
// Subscription plans -> Plans for Users.

export const PREMIUM_PLAN = "clyven_plus";
export const BUSINESS_PLAN = "clyven_business";
export const PREMIUM_FEATURE = "premium_access";
export const BUSINESS_FEATURE = "business_access";

export type PlanTier = "free" | "plus" | "business";

export function checkUserPlan(user: any, hasFn?: (param: any) => boolean): PlanTier {
  if (!user && !hasFn) return "free";

  // Check Clerk auth.has if available
  if (typeof hasFn === "function") {
    try {
      if (hasFn({ plan: BUSINESS_PLAN }) || hasFn({ plan: "business" }) || hasFn({ feature: BUSINESS_FEATURE })) {
        return "business";
      }
      if (
        hasFn({ plan: PREMIUM_PLAN }) ||
        hasFn({ plan: "plus" }) ||
        hasFn({ plan: "premium" }) ||
        hasFn({ feature: PREMIUM_FEATURE })
      ) {
        return "plus";
      }
    } catch {
      // Ignore if hasFn fails
    }
  }

  // Check user publicMetadata and unsafeMetadata
  const meta = {
    ...(user?.publicMetadata || {}),
    ...(user?.unsafeMetadata || {}),
  };

  const planStr = String(meta.plan || meta.tier || meta.subscription || "").toLowerCase();

  if (
    planStr === "business" ||
    planStr === "clyven_business" ||
    planStr === "pro_business" ||
    meta.clyven_business === true ||
    meta.business === true
  ) {
    return "business";
  }

  if (
    planStr === "plus" ||
    planStr === "clyven_plus" ||
    planStr === "premium" ||
    meta.clyven_plus === true ||
    meta.premium === true ||
    meta.plus === true
  ) {
    return "plus";
  }

  return "free";
}
