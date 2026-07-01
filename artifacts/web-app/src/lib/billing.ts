// Clerk Billing configuration.
// These slugs must match what is configured in the Clerk Dashboard under
// Subscription plans -> Plans for Users.
//
// Plans are ordered from highest to lowest tier. Access checks pass if the user
// has either the plan or its feature, so gating keeps working even before/without
// a feature flag being configured for a plan.

export type PlanTier = "business" | "plus";

export interface PlanConfig {
  /** Clerk plan slug (Dashboard -> Subscription plans -> Plan -> Slug). */
  slug: string;
  /** Optional Clerk feature slug attached to the plan. */
  feature?: string;
  /** Short label shown in the UI badge (e.g. "PLUS"). */
  label: string;
}

// Highest tier first so tier detection resolves to the best plan a user holds.
export const PLANS: Record<PlanTier, PlanConfig> = {
  business: { slug: "clyven_business", feature: "business_access", label: "BUSINESS" },
  plus: { slug: "clyven_plus", feature: "premium_access", label: "PLUS" },
};

export const PLAN_TIERS: PlanTier[] = ["business", "plus"];

// Backwards-compatible single-plan exports (the paid entry-level plan).
export const PREMIUM_PLAN = PLANS.plus.slug;
export const PREMIUM_FEATURE = PLANS.plus.feature as string;
