---
name: Supabase Connectivity
description: How CLYVEN connects to Supabase via REST API
---

## Architecture
CLYVEN uses **Supabase REST API** (not direct PostgreSQL) for all data operations:
- Backend: `@supabase/supabase-js` with **Service Role Key** (server-side, bypasses RLS)
- URL: `https://ubdyndpbayysjtevugjl.supabase.co`
- Service Role Key stored in `SUPABASE_SERVICE_ROLE_KEY` secret

## Why REST API instead of pg Pool?
Replit's sandbox blocks:
- DNS resolution for `*.supabase.co` hostnames
- TCP connections to port 5432 (PostgreSQL)

HTTPS/443 (REST API) works without restrictions.

## Files
- `artifacts/api-server/src/lib/supabase.ts` — shared Supabase client
- `artifacts/api-server/src/routes/*.ts` — all routes use Supabase queries
- `lib/db/supabase-schema.sql` — SQL to create tables (run in Supabase SQL Editor)

## Schema already exists
Tables were created by previous `drizzle-kit push` or manual execution:
`notes`, `bookmarks`, `focus_sessions`, `journal_entries`, `user_achievements`, `user_settings`

**Why:** REST API is reliable, no connection pooling issues, works everywhere.
