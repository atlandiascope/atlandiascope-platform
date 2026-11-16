const ACCESS = 'atlandiascope_access_token';
const REFRESH = 'atlandiascope_refresh_token';
let settings;
let refreshing;
export class SessionExpired extends Error {}
export function tokenNow() { return localStorage.getItem(ACCESS); }
export function clearSession() {
  for (const key of [ACCESS, REFRESH]) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }
}
export function saveSession(data) {
  if (!data.access_token) throw new Error('No authenticated session was returned. Please sign in again.');
  localStorage.setItem(ACCESS, data.access_token);
  if (data.refresh_token) localStorage.setItem(REFRESH, data.refresh_token);
}
export function migrateSession() {
  for (const key of [ACCESS, REFRESH]) {
    const old = sessionStorage.getItem(key);
    if (old && !localStorage.getItem(key)) localStorage.setItem(key, old);
    sessionStorage.removeItem(key);
  }
}
export async function getConfig() {
  if (!settings) {
    settings = (async () => {
      const res = await fetch('/supabase-config.json', { cache: 'no-store' });
      if (!res.ok) throw new Error('Unable to load sign-in settings. Please reload the page.');
      const data = await res.json();
      if (!data.supabaseUrl || !data.supabaseAnonKey) throw new Error('Sign-in settings are incomplete. Please contact support.');
      return data;
    })().catch(error => { settings = null; throw error; });
  }
  return settings;
}
async function refreshToken(failedToken) {
  // Reuse a refresh performed by another request or tab.
  if (tokenNow() && tokenNow() !== failedToken) return tokenNow();
  if (refreshing) return refreshing;
  const perform = async () => {
    if (tokenNow() && tokenNow() !== failedToken) return tokenNow();
    const refresh = localStorage.getItem(REFRESH);
    if (!refresh) throw new SessionExpired('Your session has expired. Please sign in again.');
    const config = await getConfig();
    const res = await fetch(config.supabaseUrl.replace(/\/$/, '') + '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST', headers: { 'content-type': 'application/json', apikey: config.supabaseAnonKey },
      body: JSON.stringify({ refresh_token: refresh })
    });
    const data = await res.json().catch(() => ({}));
    if ([400, 401, 403].includes(res.status)) throw new SessionExpired('Your session has expired. Please sign in again.');
    if (!res.ok || !data.access_token) throw new Error('Unable to renew your session right now. Please try again.');
    if (!localStorage.getItem(REFRESH)) throw new SessionExpired("You have signed out. Please sign in again.");
    saveSession(data);
    return data.access_token;
  };
  refreshing = (globalThis.navigator?.locks
    ? navigator.locks.request('atlandiascope-session-refresh', perform)
    : perform()).finally(() => { refreshing = null; });
  return refreshing;
}
export async function api(path) {
  let token = tokenNow();
  if (!token) token = await refreshToken(null);
  const send = () => fetch(path, { headers: { authorization: 'Bearer ' + token, accept: 'application/json' }, cache: 'no-store' });
  let res = await send();
  if (res.status === 401) { token = await refreshToken(token); res = await send(); }
  if (res.status === 401) throw new SessionExpired('Your session has expired. Please sign in again.');
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'The platform could not load this information. Please try again.');
  return data;
}
export async function logout() {
  const token = tokenNow();
  clearSession();
  try {
    const config = await getConfig();
    if (token) await fetch(config.supabaseUrl.replace(/\/$/, '') + '/auth/v1/logout', {
      method: 'POST', headers: { apikey: config.supabaseAnonKey, authorization: 'Bearer ' + token },
      signal: AbortSignal.timeout(5000)
    });
  } catch {}
}
