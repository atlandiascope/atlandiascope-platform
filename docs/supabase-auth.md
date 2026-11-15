# Supabase Auth setup

Supabase Auth is the selected identity provider for AtlandiaScope Platform.

## Required project configuration

1. Create a Supabase project in the owner's Supabase organization.
2. Copy the project URL and public publishable/anon key into a local copy of `supabase-config.example.json` named `supabase-config.json`.
3. Configure the same project URL as the Netlify environment variable `SUPABASE_URL`.
4. Set email confirmation and password policies in Supabase Auth.
5. Configure the JWT signing keys so the project exposes its JWKS endpoint at `/auth/v1/.well-known/jwks.json`.
6. Add the Supabase URL to the Auth redirect URL allowlist for the deployed site.

The public anon/publishable key is intended for browser use. Never place the Supabase service-role key in this repository, browser configuration, or client-side code.

## Server-side verification

The Netlify functions verify Supabase access tokens using the project's JWKS, expected issuer `{SUPABASE_URL}/auth/v1`, and audience `authenticated`. Configure `SUPABASE_URL` in Netlify Functions scope.

## Administrator-only paid bypass

The bypass is granted only when a verified JWT contains the trusted `app_metadata.roles` array with `platform_admin`. Assign that metadata only through a trusted Supabase administrative process (Dashboard or server-side service-role operation). Never use `user_metadata`, browser-supplied role values, email-domain checks, or a client toggle to grant admin.

The admin bypass does not grant extra product permissions and does not skip safety checks, rate limits, or human approval for repair actions.

## Current implementation boundary

The repository now contains a basic email/password sign-up and sign-in page, a dashboard shell, and server-side JWT verification. The Supabase project has not yet been provisioned or connected, so `supabase-config.json` is intentionally absent and authentication is not live. Refresh-token rotation, password reset, MFA, account deletion, durable customer records, and RLS-backed data tables remain to be completed before production launch.
