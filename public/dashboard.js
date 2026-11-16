import { api, migrateSession, logout, clearSession, SessionExpired, getUserProfile, updateUserProfile } from "./session.js";
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


async function loadAccountProfile() {
  try {
    const saved = await getUserProfile();
    $("profile-display-name").value = saved.display_name;
    $("profile-organization").value = saved.organization;
    $("profile-save").disabled = false;
    $("profile-status").textContent = "Your account profile is ready.";
  } catch (error) {
    $("profile-status").textContent = error.message;
    if (error instanceof SessionExpired) throw error;
  }
}
$("profile-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = $("profile-save");
  if (button.disabled) return;
  button.disabled = true;
  $("profile-status").textContent = "Saving…";
  try {
    await updateUserProfile({
      display_name: $("profile-display-name").value,
      organization: $("profile-organization").value
    });
    $("profile-status").textContent = "Profile saved to your account.";
  } catch (error) {
    $("profile-status").textContent = error.message;
    if (error instanceof SessionExpired) {
      clearSession();
      setTimeout(() => location.replace("/auth.html"), 900);
    }
  } finally {
    button.disabled = false;
  }
});

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
  await loadAccountProfile();
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