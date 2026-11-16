import { requirePrincipal, json } from "./_shared/auth.mjs";

const SUPABASE_ANON_KEY = "sb_publishable_IHrS6OIqPYHUhtjcgYwgwA__QG1n-ZY";
const SUPABASE_URL = "https://lzujcsqldxkqgijowdlw.supabase.co";

async function readOwnRows(table, columns, customerId, accessToken) {
  const url = new URL(SUPABASE_URL + "/rest/v1/" + table);
  url.searchParams.set("select", columns);
  url.searchParams.set("customer_id", "eq." + customerId);
  const response = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      authorization: "Bearer " + accessToken,
      accept: "application/json"
    },
    signal: AbortSignal.timeout(8000)
  });
  if (!response.ok) throw new Error("Unable to load account data");
  return response.json();
}

export default async (request, context = {}) => {
  if (request.method !== "GET") return json(405, { error: "Method not allowed" });
  const result = await requirePrincipal(request, context.env);
  if (!result.ok) return json(result.statusCode, { error: result.error });
  const { principal } = result;
  const authorization = request.headers.get("authorization") || "";
  const bearerMatch = authorization.match(/^Bearer\s+(.+)$/i);
  if (!bearerMatch) return json(401, { error: "Authentication required" });
  const accessToken = bearerMatch[1];

  try {
    const [walletRows, entitlementRows] = await Promise.all([
      readOwnRows("platform_wallets", "balance_cents,currency,free_exchanges_remaining", principal.customerId, accessToken),
      readOwnRows("platform_entitlements", "product_id,status,plan_code", principal.customerId, accessToken)
    ]);
    return json(200, {
      customer_id: principal.customerId,
      administrator: principal.isAdmin,
      billing_mode: principal.isAdmin ? "admin_bypass" : "standard",
      wallet: walletRows[0] || null,
      entitlements: entitlementRows
    });
  } catch {
    return json(502, { error: "Your account is verified, but account details could not be loaded. Please try again." });
  }
};
