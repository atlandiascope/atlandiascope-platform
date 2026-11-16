const $ = (id) => document.getElementById(id);
const ACCESS = "atlandiascope_access_token";
const REFRESH = "atlandiascope_refresh_token";

// Migrate sessions created by the previous tab-scoped implementation.
for (const key of [ACCESS, REFRESH]) {
  const oldValue = sessionStorage.getItem(key);
  if (oldValue && !localStorage.getItem(key)) localStorage.setItem(key, oldValue);
  sessionStorage.removeItem(key);
}
const tokenNow = () => localStorage.getItem(ACCESS);
const config = await (await fetch("/supabase-config.json", { cache: "no-store" })).json();

async function refreshAccessToken() {
  const refresh = localStorage.getItem(REFRESH);
  if (!refresh) throw new Error("Your session has expired. Please sign in again.");
  const response = await fetch(config.supabaseUrl.replace(/\/$/, "") + "/auth/v1/token?grant_type=refresh_token", {
    method: "POST",
    headers: { "content-type": "application/json", apikey: config.supabaseAnonKey },
    body: JSON.stringify({ refresh_token: refresh })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token) throw new Error("Your session has expired. Please sign in again.");
  localStorage.setItem(ACCESS, data.access_token);
  if (data.refresh_token) localStorage.setItem(REFRESH, data.refresh_token);
  return data.access_token;
}

async function api(path) {
  let token = tokenNow();
  if (!token) throw new Error("Please sign in to view your dashboard.");
  let response = await fetch(path, { headers: { authorization: "Bearer " + token, accept: "application/json" }, cache: "no-store" });
  if (response.status === 401) {
    token = await refreshAccessToken();
    response = await fetch(path, { headers: { authorization: "Bearer " + token, accept: "application/json" }, cache: "no-store" });
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "The platform could not load this information.");
  return data;
}

$("logout").addEventListener("click", async () => {
  const token = tokenNow();
  try {
    if (token) await fetch(config.supabaseUrl.replace(/\/$/, "") + "/auth/v1/logout", {
      method: "POST", headers: { apikey: config.supabaseAnonKey, authorization: "Bearer " + token }
    });
  } catch {}
  localStorage.removeItem(ACCESS);
  localStorage.removeItem(REFRESH);
  location.replace("/auth.html");
});

function setProduct(prefix, product) {
  $(prefix + "-status").textContent = (product?.status || "unknown").replaceAll("_", " ");
  $(prefix + "-detail").textContent = product?.detail || "No status details returned.";
}

try {
  const [profile, integrations] = await Promise.all([
    api("/api/platform-me"),
    api("/api/platform-integrations")
  ]);
  $("welcome").textContent = profile.administrator
    ? "Administrator identity verified by the platform server."
    : "Signed in · standard customer account";
  const wallet = profile.wallet;
  $("wallet-balance").textContent = wallet
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: wallet.currency || "USD" }).format(Number(wallet.balance_cents || 0) / 100)
    : "Not available";
  $("free-exchanges").textContent = wallet ? String(wallet.free_exchanges_remaining ?? 0) : "—";
  $("entitlements-count").textContent = String((profile.entitlements || []).filter(x => x.status === "active").length);
  const byId = Object.fromEntries((integrations.products || []).map(x => [x.id, x]));
  setProduct("sylvie", byId.sylvie);
  setProduct("gateway", byId.dialogue_gateway);
  setProduct("repair", byId.diagnostics_repair);
} catch (error) {
  $("error").textContent = error.message;
  if (/sign in|session has expired/i.test(error.message)) {
    localStorage.removeItem(ACCESS);
    localStorage.removeItem(REFRESH);
    setTimeout(() => location.replace("/auth.html"), 900);
  }
}