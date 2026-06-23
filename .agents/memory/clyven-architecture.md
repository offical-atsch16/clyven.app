---
name: CLYVEN Architecture
description: Key architectural decisions, stack, and patterns for the CLYVEN productivity platform
---

# CLYVEN Platform — Architecture

## Stack
- **Frontend**: React + Vite (`artifacts/web-app`), wouter routing, Zustand, react-query, Framer Motion, Recharts, lucide-react, Tailwind CSS, Radix UI, cmdk
- **Backend**: Express API (`artifacts/api-server`), Drizzle ORM + PostgreSQL, Clerk auth
- **DB package**: `@workspace/db` at `lib/db/` — Drizzle with `drizzle-kit push` for migrations
- **Auth**: External Clerk keys (VITE_CLERK_PUBLISHABLE_KEY + CLERK_SECRET_KEY), NOT Replit-managed Clerk

## Database Schema (all in `lib/db/src/schema/clyven.ts`)
Tables: `notes`, `bookmarks`, `focus_sessions`, `journal_entries`, `user_achievements`, `user_settings`

## API Routes (all under `/api/` prefix)
- `/api/notes` — CRUD for notes
- `/api/bookmarks` — CRUD for bookmarks
- `/api/focus` — GET history/stats + POST session
- `/api/journal` — GET all, GET by date, POST (upsert by date)
- `/api/user/stats` — aggregated stats
- `/api/user/settings` — GET/POST settings

## Frontend Pages
All authenticated pages wrapped in `Layout` component (collapsible sidebar):
`/dashboard`, `/notes`, `/bookmarks`, `/focus`, `/journal`, `/analytics`, `/achievements`, `/profile`, `/settings`

## Key patterns
- API client: `artifacts/web-app/src/lib/api.ts` — plain fetch with `credentials: "include"`, base: `/api`
- `requireAuth` middleware at `artifacts/api-server/src/lib/requireAuth.ts`
- Dark theme default (#080808 bg, #111111 cards, white/7 borders)
- `Globe` icon — always import from lucide-react, never define locally (was a bug)

**Why:** Drizzle instead of Prisma because `@workspace/db` was already set up with Drizzle before Prisma was considered; consistent with monorepo pattern.
