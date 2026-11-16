# Cloudflare Pages migration — customer portal

This branch adapts the existing AtlandiaScope portal to Cloudflare Pages while preserving the working Netlify production branch.

## Create the Pages project

1. In Cloudflare, select **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
2. Connect the GitHub repository `atlandiascope/atlandiascope-platform`.
3. Select production branch `cloudflare-migration` for initial validation; leave Netlify's `main` unchanged.
4. Framework preset: **None**. Build command: **blank**. Build output directory: `public`.
5. Add no secret credentials to code or GitHub. Auth API requests use the existing public Supabase project URL; JWK signatures are verified server-side.
6. Deploy to the generated `pages.dev` address. Do not change `atlandiascope.com` DNS until all gateway dependencies have been migrated and verified.

## Smoke tests

- `/` shows the platform landing page, `/auth.html` displays signup/signin, and `/dashboard.html` loads the account portal.
- `GET /api/platform-me` without Authorization returns 401 JSON.
- `GET /api/platform-products` without Authorization returns 401 JSON.
- `GET /api/platform-integrations` without Authorization returns 401 JSON.
- `POST /api/platform-exchange` without Authorization returns 401 JSON.
- Sign in with the existing Supabase user; verify wallet, product statuses, and profile persistence.
- Confirm headers and `/supabase-config.json` load as expected.

## Important limitations

The customer portal can run on Cloudflare with its current Supabase backend. The AI Dialogue Gateway is a different repository using Netlify Database, and its records and API must be migrated separately before Netlify can be retired. The current diagnostics endpoint is a discovery preview, not remote repair execution. Stripe wallet funding and a hosted Sylvie chat provider remain unfinished.
