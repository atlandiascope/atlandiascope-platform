import { requirePrincipal, json } from "./_shared/auth.mjs";

const products = [
  { id: "sylvie", name: "Sylvie Runtime", description: "Conversational AI runtime" },
  { id: "dialogue_gateway", name: "AI Dialogue Gateway", description: "Agent-to-agent communication" },
  { id: "diagnostics_repair", name: "Universal AI Diagnostics & Repair", description: "Diagnostics and approval-gated repair workflows" }
];

export default async (event) => {
  if (event.httpMethod !== "GET") return json(405, { error: "Method not allowed" });
  const result = await requirePrincipal(event);
  if (!result.ok) return json(result.statusCode, { error: result.error });
  return json(200, {
    products,
    administrator: result.principal.isAdmin,
    billing_mode: result.principal.isAdmin ? "admin_bypass" : "standard",
    integrations: "not_connected"
  });
};
