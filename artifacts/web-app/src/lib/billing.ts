// Clerk Billing configuration.
// These slugs must match what is configured in the Clerk Dashboard under
// Subscription plans -> Plans for Users.
//
// - PREMIUM_PLAN: the plan slug of the paid "Clyven Plus" plan.
// - PREMIUM_FEATURE: a feature slug attached to that plan. Access checks pass if
//   the user has either the plan or the feature, so gating keeps working even
//   before/without the feature flag being configured.
export const PREMIUM_PLAN = "clyven_plus";
export const PREMIUM_FEATURE = "premium_access";
