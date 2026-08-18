---
name: External hosting migration
description: Durable hosting and authentication boundary for running CLYVEN outside Replit
---

CLYVEN's external deployment boundary is Vercel for the Vite frontend, Railway for the Express API, Supabase for PostgreSQL, and an independently managed Clerk application for authentication. The Vercel `/api/*` rewrite should keep browser requests same-origin while forwarding to the Railway API.

**Why:** Replit-managed Clerk is platform-integrated and is not an exportable authentication instance for Vercel or Railway. Supabase is already external, so moving the database during the hosting migration would add avoidable risk.

**How to apply:** Treat external Clerk user/plan migration and domain configuration as a deliberate release step; do not assume existing Replit-managed users or subscriptions are present in the new Clerk instance.