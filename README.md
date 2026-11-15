# AtlandiaScope Platform

The parent website and customer portal for AtlandiaScope.

## Product family

- **Sylvie Runtime** — conversational AI runtime.
- **AI Dialogue Gateway** — agent-to-agent communication.
- **Universal AI Diagnostics & Repair** — diagnostics and approval-gated repair workflows.

The three products remain independently deployable and connect through authenticated platform APIs. This repository owns the parent website and, as implementation progresses, the shared customer experience.

## Current status

This repository is the starting point for the parent website. The initial site is a static, responsive landing page. Customer authentication, account provisioning, product entitlements, billing, and live product API connections are not yet implemented.

Do not treat a visible product card or link as proof that a product integration is live.

## Local preview

Open `index.html` in a browser, or serve this directory with any static web server.

## Deployment

The included `netlify.toml` publishes the repository root. Connect this private repository to a Netlify site to deploy it. Configure the production domain only after verifying the deployment and environment settings.

## Security principles

- Never commit API keys, Stripe secrets, signing keys, or customer data.
- Verify identity tokens server-side before creating a customer principal.
- Enforce product entitlements and API scopes on the server, not in browser code.
- Keep repair actions approval-gated.
