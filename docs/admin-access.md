# Admin-only paid feature bypass

## Policy

The paid-feature bypass applies only to authenticated administrator accounts.

- Standard customer accounts always follow the normal free-usage and paid-credit rules.
- Administrators may use paid features without consuming customer credits or triggering per-use charges.
- Administrators cannot use this privilege to grant complimentary access or change another customer's billing status.
- There is no customer-facing bypass switch.

## Authorization requirements

1. Authenticate the administrator through the platform's chosen identity provider.
2. Validate the identity token on the server, including its signature, issuer, audience, and expiry.
3. Resolve the authenticated subject to a server-managed platform account.
4. Check a server-managed administrator role/entitlement. Never trust a role, email, or bypass flag supplied by browser code.
5. Apply the bypass only after successful authentication and authorization.

The administrator role must be assigned through a controlled server-side process. Do not grant administrator status merely because a user signs up with a particular email address.

## Billing behavior

For a verified administrator, paid-feature requests skip customer credit reservation and per-use charges. Record the request as an administrator-bypassed usage event for audit and operational reporting.

For every non-administrator, preserve the existing billing policy unchanged.

## Audit and safety

Record at least the administrator account ID, product, feature/action, timestamp, request ID, and outcome. Do not log secrets or sensitive prompt contents.

The bypass does not bypass product-level authorization, safety checks, rate limits, or approval requirements. In particular, diagnostic repair actions remain subject to their configured human-approval workflow.

## Implementation status

This document defines the required policy. The live login provider, administrator role assignment, server-side enforcement, and audit event pipeline still need to be implemented and tested before the bypass is active in production.
