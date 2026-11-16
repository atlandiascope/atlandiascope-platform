import { migrateSession, getConfig, saveSession, tokenNow } from "./session.js";
const $ = (id) => document.getElementById(id);
let mode = "signin";
let config = null;

try {
  migrateSession();
  config = await getConfig();
} catch (error) {
  $("status").textContent = error.message;
}

function setMode(next) {
  mode = next;
  $("heading").textContent = mode === "signin" ? "Welcome back" : "Create your account";
  $("submit").textContent = mode === "signin" ? "Sign in securely" : "Create account";
  $("password").autocomplete = mode === "signin" ? "current-password" : "new-password";
  $("signin").setAttribute("aria-pressed", String(mode === "signin"));
  $("signup").setAttribute("aria-pressed", String(mode === "signup"));
  $("status").textContent = "";
}
$("signin").addEventListener("click", () => setMode("signin"));
$("signup").addEventListener("click", () => setMode("signup"));

if (tokenNow()) location.replace("/dashboard.html");

$("auth-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!config?.supabaseUrl || !config?.supabaseAnonKey) {
    $("status").textContent = "Authentication configuration is missing. Please contact support.";
    return;
  }
  const email = $("email").value.trim();
  const password = $("password").value;
  const isSignup = mode === "signup";
  $("submit").disabled = true;
  $("status").textContent = isSignup ? "Creating your account…" : "Signing in…";
  try {
    const endpoint = isSignup ? "/auth/v1/signup" : "/auth/v1/token?grant_type=password";
    const response = await fetch(config.supabaseUrl.replace(/\/$/, "") + endpoint, {
      method: "POST",
      headers: { "content-type": "application/json", apikey: config.supabaseAnonKey },
      body: JSON.stringify({ email, password })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.msg || result.message || result.error_description || result.error || "Authentication failed.");
    if (isSignup && !result.access_token) {
      setMode("signin");
      $("status").textContent = "Account created. Check your email to confirm your address, then return here to sign in.";
      return;
    }
    if (!result.access_token) throw new Error("No authenticated session was returned. Please try signing in.");
    saveSession(result);
    location.replace("/dashboard.html");
  } catch (error) {
    $("status").textContent = error.message;
  } finally {
    $("submit").disabled = false;
  }
});