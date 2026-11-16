import { requirePrincipal, json } from "./_shared/auth.mjs";

const SUPABASE_URL = "https://lzujcsqldxkqgijowdlw.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_IHrS6OIqPYHUhtjcgYwgwA__QG1n-ZY";

async function callRpc(name, payload, accessToken) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
      accept: "application/json"
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10000)
  });
  const raw = await response.text();
  let data;
  try { data = raw ? JSON.parse(raw) : null; } catch { data = null; }
  if (!response.ok) {
    const status = response.status === 401 || response.status === 403 ? 403 : 502;
    return { ok: false, status, data: { error: "The exchange could not be authorized or recorded.", detail: data?.message || data?.hint || null } };
  }
  return { ok: true, data };
}

export default async (request, context = {}) => {
  if (request.method !== "POST") return json(405, { error: "Method not allowed" });
  const auth = await requirePrincipal(request, context.env);
  if (!auth.ok) return json(auth.statusCode, { error: auth.error });

  const header = request.headers.get("authorization") || "";
  const accessToken = header.replace(/^Bearer\s+/i, "");
  let body;
  try { body = await request.json(); } catch { return json(400, { error: "A JSON request body is required." }); }

  if (body.action === "reserve") {
    if (typeof body.product_id !== "string" || typeof body.request_id !== "string") {
      return json(400, { error: "product_id and request_id are required." });
    }
    const result = await callRpc("reserve_platform_exchange", {
      p_product_id: body.product_id,
      p_request_id: body.request_id
    }, accessToken);
    return result.ok ? json(200, result.data) : json(result.status, result.data);
  }

  if (body.action === "complete") {
    if (typeof body.event_id !== "string" || typeof body.succeeded !== "boolean") {
      return json(400, { error: "event_id and succeeded are required." });
    }
    const result = await callRpc("complete_platform_exchange", {
      p_event_id: body.event_id,
      p_succeeded: body.succeeded
    }, accessToken);
    return result.ok ? json(200, result.data) : json(result.status, result.data);
  }

  return json(400, { error: "action must be reserve or complete." });
};
