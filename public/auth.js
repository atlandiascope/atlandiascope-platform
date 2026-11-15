const $ = (id) => document.getElementById(id);
let mode = "signin";
let config;
try {
  const response = await fetch("/supabase-config.json", { cache: "no-store" });
  if (!response.ok) throw new Error("Supabase project settings have not been added yet.");
  config = await response.json();
} catch (error) {
  $("status").textContent = error.message;
}

function setMode(next) {
  mode = next;
  $("heading").textContent = mode === "signin" ? "Welcome back" : "Create your account";
  $("submit").textContent = mode === "signin" ? "Sign in" : "Create account";
  $("password").autocomplete = mode === "signin" ? "current-password" : "new-password";
  $("signin").setAttribute("aria-pressed", String(mode === "signin"));
  $("signup").setAttribute("aria-pressed", String(mode === "signup"));
  $("status").textContent = "";
}
$("signin").addEventListener("click", () => setMode("signin"));
$("signup").addEventListener("click", () => setMode("signup"));

$("auth-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!config?.supabaseUrl || !config?.supabaseAnonKey) {
    $("status").textContent = "Supabase is not configured yet. Add the project URL and public anon/publishable key to supabase-config.json.";
    return;
  }
  const email = $("email").value.trim();
  const password = $("password").value;
  const isSignup = mode === "signup";
  const endpoint = isSignup ? "/auth/v1/signup" : "/auth/v1/token?grant_type=password";
  $("submit").disabled = true;
  $("status").textContent = isSignup ? "Creating your account…" : "Signing in…";
  try {
    const response = await fetch(config.supabaseUrl.replace(/\/$/, "") + endpoint, {
      method: "POST",
      headers: { "content-type": "application/json", apikey: config.supabaseAnonKey },
      body: JSON.stringify({ email, password })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.msg || result.message || result.error_description || "Authentication failed.");
    if (isSignup && !result.access_token) {
      $("status").textContent = "Account created. Check your email to confirm your address, then return here to sign in.";
    } else if (result.access_token) {
      sessionStorage.setItem("atlandiascope_access_token", result.access_token);
      sessionStorage.setItem("atlandiascope_refresh_token", result.refresh_token || "");
      window.location.assign("/dashboard.html");
    } else {
      $("status").textContent = "Account request completed. Check your email for next steps.";
    }
  } catch (error) {
    $("status").textContent = error.message;
  } finally {
    $("submit").disabled = false;
  }
});
