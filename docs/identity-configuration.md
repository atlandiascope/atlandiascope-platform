# Identity provider configuration

The server-side identity boundary is implemented in `netlify/functions/_shared/auth.mjs`.

Configure these Netlify environment variables before enabling authenticated endpoints:

- `PLATFORM_JWKS_URL` — HTTPS JSON Web Key Set endpoint for the chosen identity provider.
- `PLATFORM_JWT_ISSUER` — exact expected token issuer.
- `PLATFORM_JWT_AUDIENCE` — exact expected token audience.

The verifier accepts RS256 or ES256 signed tokens and validates signature, issuer, audience, and expiry. The admin bypass is derived only from the signed `app_metadata.roles` claim containing `platform_admin`. Do not use user-editable metadata or a client-provided flag for administrator assignment.

## Still required

- Select and configure the identity provider.
- Establish a stable server-managed customer ID mapping.
- Configure an administrator role through the provider's trusted administrative controls.
- Add login/logout UI and secure token handling.
- Add entitlement persistence, usage ledger, Stripe Checkout/webhook, and audit event storage.
- Add integration tests against the selected provider before production.

Until those steps are complete, endpoints return 503 when identity configuration is absent. No paid operation or admin bypass is activated by this foundation alone.
