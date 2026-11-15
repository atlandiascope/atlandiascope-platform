function $(id) { return document.getElementById(id); }

const token = sessionStorage.getItem("atlandiascope_access_token");
if (!token) window.location.replace("/auth.html");

$("logout").addEventListener("click", async () => {
  try {
    const cfg = await (await fetch("/supabase-config.json")).json();
    await fetch(cfg.supabaseUrl.replace(/\/$/, "") + "/auth/v1/logout", {
      method: "POST",
      headers: { apikey: cfg.supabaseAnonKey, authorization: "Bearer " + token }
    });
  } finally {
    sessionStorage.removeItem("atlandiascope_access_token");
    sessionStorage.removeItem("atlandiascope_refresh_token");
    window.location.replace("/auth.html");
  }
});

function setProduct(prefix, product) {
  $(prefix + "-status").textContent = product.status.replaceAll("_", " ");
  $(prefix + "-detail").textContent = product.detail;
}

try {
  const response = await fetch("/api/platform-me", {
    headers: { authorization: "Bearer " + token }
  });
  const profile = await response.json();
  if (!response.ok) throw new Error(profile.error || "Unable to verify your account.");
  $("welcome").textContent = profile.administrator
    ? "Administrator account · paid-feature bypass enabled"
    : "Signed in · standard customer billing applies";

  const integrationResponse = await fetch("/api/platform-integrations", {
    headers: { authorization: "Bearer " + token },
    cache: "no-store"
  });
  const integrationData = await integrationResponse.json();
  if (!integrationResponse.ok) throw new Error(integrationData.error || "Unable to load product connection status.");

  const byId = Object.fromEntries(integrationData.products.map((product) => [product.id, product]));
  setProduct("sylvie", byId.sylvie);
  setProduct("gateway", byId.dialogue_gateway);
  setProduct("repair", byId.diagnostics_repair);
} catch (error) {
  $("error").textContent = error.message + " Your session may need to be refreshed.";
}
