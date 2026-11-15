const token = sessionStorage.getItem("atlandiascope_access_token");
const refreshToken = sessionStorage.getItem("atlandiascope_refresh_token");
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

function $(id) { return document.getElementById(id); }
try {
  const response = await fetch("/.netlify/functions/platform-me", {
    headers: { authorization: "Bearer " + token }
  });
  const profile = await response.json();
  if (!response.ok) throw new Error(profile.error || "Unable to verify your account.");
  $("welcome").textContent = profile.administrator
    ? "Administrator account · paid-feature bypass enabled"
    : "Signed in · standard customer billing applies";
} catch (error) {
  $("error").textContent = error.message + " Your session may need to be refreshed or identity configuration may still be pending.";
}
