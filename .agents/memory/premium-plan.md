---
name: Premium Plan Architecture
description: How CLYVEN PLUS premium detection and enforcement works across frontend and backend
---

## Plan detection (frontend)
`usePremium` hook in `artifacts/web-app/src/hooks/usePremium.ts` checks (in order):
1. `has({ plan: 'clyven_plus' })` — Clerk Billing native
2. `has({ plan: 'plus' })` — alternate slug
3. `user.publicMetadata.plan === 'premium'` — manual metadata
4. `user.publicMetadata.clyven_plus === true` — alternate metadata

## Upgrade flow
`openUpgrade()` tries: `window.Clerk.openCheckout({ planSlug: 'clyven_plus' })` → `openBillingPortal()` → `/pricing`

## Free limits
- Notes: 10 max (enforced in API `routes/notes.ts` + visible in UI)
- Bookmarks: 25 max (enforced in API `routes/bookmarks.ts` + visible in UI)
- Analytics: 7-day history only (UI-gated, premium sees 30 days)

## API enforcement
`requireAuth` middleware exposes `req.isPremium` via Clerk `has()`.
CREATE routes count existing records and return `{ error: 'LIMIT_REACHED', limit, message }` with status 403.
Frontend catches this and opens `UpgradeModal`.

## Premium-only features
- Export notes as Markdown (client-side download)
- 30-day analytics + Focus session type chart
- PLUS badge in sidebar + user row crown icon
- Full achievements (future: streaks)

**Why:** Server-side enforcement prevents API abuse; client-side gating provides UX feedback.
