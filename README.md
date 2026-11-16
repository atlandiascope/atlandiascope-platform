# AtlandiaScope Platform

The parent website and customer portal for AtlandiaScope.

## Product family

- **Sylvie Runtime** — conversational AI runtime.
- **AI Dialogue Gateway** — agent-to-agent communication.
- **Universal AI Diagnostics & Repair** — diagnostics and approval-gated repair workflows.

The three products remain independently deployable and connect through authenticated platform APIs. This repository owns the parent website and, as implementation progresses, the shared customer experience.

## Current status

The deployed platform provides Supabase email/password sign-in, persistent sessions, a protected customer dashboard, wallet and entitlement reads, and server-verified administrator claims. Gateway health and diagnostics capabilities are checked from the dashboard.

Sylvie has no hosted chat API yet. Diagnostics is a discovery preview; remote repair execution and Stripe wallet funding are not connected. Product links do not imply those features are live.

## Local preview and validation

Serve `public/` with a static server for the frontend. Netlify runs `netlify/functions/` for the authenticated API routes. Run `npm test` to exercise session recovery. Production configuration is in `netlify.toml`, with `public/` as the publish directory.

The root HTML/JS copies mirror the public files for legacy previews. Update both together. Authentication sessions belong to their exact website origin and do not transfer automatically between the custom domain and Netlify subdomains.

## Deployment

Production is deployed from the connected GitHub main branch. Keep each fix in one commit per site to avoid unnecessary builds. Runtime secrets belong in Netlify environment variables; only the Supabase publishable key is sent to the browser.

## Security principles

- Never commit API keys, Stripe secrets, signing keys, or customer data.
- Verify identity tokens server-side before creating a customer principal.
- Enforce product entitlements and API scopes on the server, not in browser code.
- Keep repair actions approval-gated.
