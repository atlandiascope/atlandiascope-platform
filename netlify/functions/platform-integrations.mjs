import { requirePrincipal, json } from "./_shared/auth.mjs";

const GATEWAY = "https://ai-dialogue-gateway.netlify.app";

async function readJson(url) {
  const response = await fetch(url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(6000) });
  let body = null;
  try { body = await response.json(); } catch {}
  return { ok: response.ok, http_status: response.status, body };
}

export default async (request) => {
  if (request.method !== "GET") return json(405, { error: "Method not allowed" });
  const auth = await requirePrincipal(request);
  if (!auth.ok) return json(auth.statusCode, { error: auth.error });

  const [gateway, diagnostics] = await Promise.all([
    readJson(GATEWAY + "/api/status").catch(() => ({ ok: false, http_status: 0, body: null })),
    readJson(GATEWAY + "/api/repair/capabilities").catch(() => ({ ok: false, http_status: 0, body: null }))
  ]);

  return json(200, {
    checked_at: new Date().toISOString(),
    products: [
      {
        id: "sylvie",
        name: "Sylvie Runtime",
        status: "not_deployed",
        detail: "The Python runtime package exists in the gateway repository, but no hosted Sylvie chat API is deployed yet.",
        source: "https://github.com/atlandiascope/ai-dialogue-gateway/tree/main/sylvie-runtime"
      },
      {
        id: "dialogue_gateway",
        name: "AI Dialogue Gateway",
        status: gateway.ok && gateway.body?.status === "operational" ? "operational" : "unavailable",
        http_status: gateway.http_status,
        detail: gateway.body?.status === "operational" ? "Live API health check passed." : "Live API health check failed.",
        endpoint: GATEWAY,
        capabilities: gateway.body?.capabilities || {}
      },
      {
        id: "diagnostics_repair",
        name: "Universal AI Diagnostics & Repair",
        status: diagnostics.ok ? "preview" : "unavailable",
        http_status: diagnostics.http_status,
        detail: diagnostics.body?.safety?.remote_code_execution === false
          ? "Capability discovery is live. Remote repair execution is not enabled."
          : "Capability discovery endpoint responded; execution capability requires separate verification.",
        endpoint: GATEWAY + "/api/repair/capabilities",
        capabilities: diagnostics.body?.capabilities || []
      }
    ],
    administrator: auth.principal.isAdmin
  });
};
