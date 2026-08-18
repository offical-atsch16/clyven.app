# CLYVEN deployment

The production setup is split between Vercel and Railway:

- Vercel hosts the Vite frontend from `artifacts/web-app`.
- Railway runs the Express API from `artifacts/api-server`.
- Supabase remains the PostgreSQL provider.
- Clerk is configured as an external Clerk application.

## Vercel

Set the repository root as the project root. The checked-in `vercel.json`
contains the build and output settings. Add:

```text
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
```

The `/api/*` rewrite expects the Railway service to be available at
`https://api.clyven.app`. Add that custom domain to Railway, or replace the
destination in `vercel.json` with the actual API domain.

## Railway

Use the repository root and the checked-in `railway.json`. Set:

```text
CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_DATABASE_URL=postgresql://...
ADMIN_JWT_SECRET=...
CORS_ORIGINS=https://clyven.app,https://www.clyven.app
GMAIL_USER=...
GMAIL_APP_PASSWORD=...
```

Railway provides `PORT` automatically. The health check is
`/api/healthz`.

## Clerk

Create or select an external Clerk application and configure the Vercel
domains as allowed origins and redirect URLs. The current Replit-managed Clerk
user store is separate; existing users and subscription plans must be
recreated or migrated deliberately before switching production traffic.