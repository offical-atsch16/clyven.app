---
name: Supabase Connectivity
description: Why drizzle-kit push to Supabase fails in Replit sandbox
---

## Problem
Replit's sandbox environment blocks outbound TCP connections to external hosts on port 5432 (standard PostgreSQL port).
`drizzle-kit push` hangs at "Pulling schema from database..." and exits with code 1 (no detailed error shown by drizzle-kit).

## Workaround
Run `drizzle-kit push` from:
1. Local machine with `SUPABASE_DATABASE_URL` set
2. After deployment (Replit deployments can reach external DBs)
3. Via Supabase web SQL editor — paste schema manually

## DB code
`lib/db/src/index.ts` and `lib/db/drizzle.config.ts` both use:
```
SUPABASE_DATABASE_URL || DATABASE_URL
```
with space-cleaning: `.replace(/:\s+/g, ':').trim()` in case URL has formatting spaces.
SSL: `{ rejectUnauthorized: false }` added when URL contains "supabase".

**Why:** The app falls back to Replit's built-in PostgreSQL (`DATABASE_URL`) automatically when Supabase is unreachable.
