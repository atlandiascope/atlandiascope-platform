import { api, migrateSession, logout, clearSession, SessionExpired } from "./session.js";
const $ = id => document.getElementById(id);
$("logout").addEventListener("click", async () => {
  $("logout").disabled = true;
  await logout();
  location.replace("/auth.html");
});
window.addEventListener("storage", event => {
  if (event.key === "atlandiascope_access_token" && !event.newValue) location.replace("/auth.html");
});
function setProduct(prefix, product) {
  $(prefix + "-status").textContent = (product?.status || "unknown").replaceAll("_", " ");
  $(prefix + "-detail").textContent = product?.detail || "No status details returned.";
}

try {
  migrateSession();
  const profile = await api("/api/platform-me");
  $("welcome").textContent = profile.administrator
    ? "Administrator identity verified by the platform server."
    : "Signed in · standard customer account";
  const wallet = profile.wallet;
  $("wallet-balance").textContent = wallet
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: wallet.currency || "USD" }).format(Number(wallet.balance_cents || 0) / 100)
    : "Not available";
  $("free-exchanges").textContent = wallet ? String(wallet.free_exchanges_remaining ?? 0) : "—";
  $("entitlements-count").textContent = String((profile.entitlements || []).filter(x => x.status === "active").length);
  const integrations = await api("/api/platform-integrations");
  const byId = Object.fromEntries((integrations.products || []).map(x => [x.id, x]));
  setProduct("sylvie", byId.sylvie);
  setProduct("gateway", byId.dialogue_gateway);
  setProduct("repair", byId.diagnostics_repair);
} catch (error) {
  $("error").textContent = error.message;
  $("welcome").textContent = "Unable to finish loading your dashboard.";
  for (const prefix of ["sylvie", "gateway", "repair"]) {
    if ($(prefix + "-status").textContent === "Checking") setProduct(prefix, {status: "unavailable", detail: "Could not check this service. Reload to try again."});
  }
  if ($("wallet-balance").textContent === "Loading…") $("wallet-balance").textContent = "Unavailable";
  if (error instanceof SessionExpired) {
    clearSession();
    setTimeout(() => location.replace("/auth.html"), 900);
  }
}