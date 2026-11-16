import { createRemoteJWKSet, jwtVerify } from "jose";

// Public Supabase project URL; no server-side secret is stored in source.
const DEFAULT_SUPABASE_URL = "https://lzujcsqldxkqgijowdlw.supabase.co";
const jwksCache = new Map();
const readEnv = (key, bindings) => bindings?.[key] ?? globalThis.Netlify?.env?.get?.(key) ?? globalThis.process?.env?.[key];

function authSettings(bindings) {
  const supabaseUrl = (readEnv("SUPABASE_URL", bindings) || DEFAULT_SUPABASE_URL).replace(/\/$/, "");
  return {
    issuer: readEnv("PLATFORM_JWT_ISSUER", bindings) || supabaseUrl + "/auth/v1",
    audience: readEnv("PLATFORM_JWT_AUDIENCE", bindings) || "authenticated",
    jwksUrl: readEnv("PLATFORM_JWKS_URL", bindings) || supabaseUrl + "/auth/v1/.well-known/jwks.json"
  };
}
function getJwks(jwksUrl) {
  if (!jwksCache.has(jwksUrl)) jwksCache.set(jwksUrl, createRemoteJWKSet(new URL(jwksUrl)));
  return jwksCache.get(jwksUrl);
}

export async function requirePrincipal(request, bindings) {
  const { issuer, audience, jwksUrl } = authSettings(bindings);
  if (!issuer || !audience || !jwksUrl) {
    return { ok: false, statusCode: 503, error: "Supabase Auth is not configured" };
  }
  const header = request?.headers?.get
    ? request.headers.get("authorization") || ""
    : request?.headers?.authorization || request?.headers?.Authorization || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return { ok: false, statusCode: 401, error: "Authentication required" };
  try {
    const { payload } = await jwtVerify(match[1], getJwks(jwksUrl), {
      issuer, audience, algorithms: ["RS256", "ES256"]
    });
    if (typeof payload.sub !== "string" || !payload.sub) {
      return { ok: false, statusCode: 401, error: "Invalid identity subject" };
    }
    const appMetadata = payload.app_metadata && typeof payload.app_metadata === "object" ? payload.app_metadata : {};
    const roles = Array.isArray(appMetadata.roles) ? appMetadata.roles : [];
    // Administrator privileges are granted only by a trusted app_metadata claim.
    // Email addresses are never sufficient to grant elevated access.
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
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff"
    }
  });
}
