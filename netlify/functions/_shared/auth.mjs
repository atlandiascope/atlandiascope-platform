import { createRemoteJWKSet, jwtVerify } from "jose";

const jwksUrl = process.env.PLATFORM_JWKS_URL;
const issuer = process.env.PLATFORM_JWT_ISSUER;
const audience = process.env.PLATFORM_JWT_AUDIENCE;

let jwks;

function getJwks() {
  if (!jwksUrl) throw new Error("PLATFORM_JWKS_URL is not configured");
  if (!jwks) jwks = createRemoteJWKSet(new URL(jwksUrl));
  return jwks;
}

export async function requirePrincipal(event) {
  if (!issuer || !audience) {
    return { ok: false, statusCode: 503, error: "Identity provider is not configured" };
  }

  const header = event.headers?.authorization || event.headers?.Authorization || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return { ok: false, statusCode: 401, error: "Authentication required" };

  try {
    const { payload } = await jwtVerify(match[1], getJwks(), {
      issuer,
      audience,
      algorithms: ["RS256", "ES256"]
    });
    if (typeof payload.sub !== "string" || !payload.sub) {
      return { ok: false, statusCode: 401, error: "Invalid identity subject" };
    }

    // Only trusted server-managed application metadata can assign the admin role.
    const appMetadata = payload.app_metadata && typeof payload.app_metadata === "object"
      ? payload.app_metadata : {};
    const roles = Array.isArray(appMetadata.roles) ? appMetadata.roles : [];
    const isAdmin = roles.includes("platform_admin");

    return {
      ok: true,
      principal: {
        subject: payload.sub,
        issuer: payload.iss,
        customerId: typeof appMetadata.customer_id === "string" ? appMetadata.customer_id : payload.sub,
        isAdmin
      }
    };
  } catch {
    return { ok: false, statusCode: 401, error: "Invalid or expired access token" };
  }
}

export function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff"
    },
    body: JSON.stringify(body)
  };
}
