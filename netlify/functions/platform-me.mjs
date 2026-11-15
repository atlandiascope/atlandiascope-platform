import { requirePrincipal, json } from "./_shared/auth.mjs";

export default async (request) => {
  if (request.method !== "GET") return json(405, { error: "Method not allowed" });
  const result = await requirePrincipal(request);
  if (!result.ok) return json(result.statusCode, { error: result.error });
  const { principal } = result;
  return json(200, {
    customer_id: principal.customerId,
    administrator: principal.isAdmin,
    billing_mode: principal.isAdmin ? "admin_bypass" : "standard"
  });
};
