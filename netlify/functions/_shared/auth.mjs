import { createRemoteJWKSet, jwtVerify } from "jose";

const env = (key) => globalThis.Netlify?.env?.get?.(key) ?? process.env[key];
const supabaseUrl = env("SUPABASE_URL")?.replace(/\/$/, "");
const issuer = env("PLATFORM_JWT_ISSUER") || (supabaseUrl ? supabaseUrl + "/auth/v1" : "");
const audience = env("PLATFORM_JWT_AUDIENCE") || "authenticated";
const jwksUrl = env("PLATFORM_JWKS_URL") || (supabaseUrl ? supabaseUrl + "/auth/v1/.well-known/jwks.json" : "");
const adminEmails = new Set(
  (env("PLATFORM_ADMIN_EMAILS") || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
);

let jwks;
function getJwks() {
  if (!jwksUrl) throw new Error("Supabase JWKS URL is not configured");
  if (!jwks) jwks = createRemoteJWKSet(new URL(jwksUrl));
  return jwks;
}

export async function requirePrincipal(request) {
  if (!issuer || !audience || !jwksUrl) {
    return { ok: false, statusCode: 503, error: "Supabase Auth is not configured" };
  }
  const header = request?.headers?.get
    ? request.headers.get("authorization") || ""
    : request?.headers?.authorization || request?.headers?.Authorization || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return { ok: false, statusCode: 401, error: "Authentication required" };
  try {
    const { payload } = await jwtVerify(match[1], getJwks(), {
      issuer, audience, algorithms: ["RS256", "ES256"]
    });
    if (typeof payload.sub !== "string" || !payload.sub) {
      return { ok: false, statusCode: 401, error: "Invalid identity subject" };
    }
    const appMetadata = payload.app_metadata && typeof payload.app_metadata === "object" ? payload.app_metadata : {};
    const roles = Array.isArray(appMetadata.roles) ? appMetadata.roles : [];
    const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
    const isAdmin = roles.includes("platform_admin") || (email !== "" && adminEmails.has(email));
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
