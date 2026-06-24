import { createConnectTransport } from "@connectrpc/connect-web";
import type { Interceptor } from "@connectrpc/connect";

const TOKEN_KEY = "user_admin_token";

// The team scope the user last selected (a team id). Cleared on logout.
export const SELECTED_TEAM_KEY = "user_admin_selected_team";

// Generic persistence helpers. `remember` decides where a value lives:
// localStorage (survives browser close) vs sessionStorage (cleared on close).
// Reads check both; removes clear both so we never leak a stale value.
export function setItem(key: string, value: string, remember: boolean) {
  const target = remember ? localStorage : sessionStorage;
  const other = remember ? sessionStorage : localStorage;
  target.setItem(key, value);
  other.removeItem(key);
}
export function getItem(key: string): string | null {
  return localStorage.getItem(key) ?? sessionStorage.getItem(key);
}
export function removeItem(key: string) {
  localStorage.removeItem(key);
  sessionStorage.removeItem(key);
}

export function getToken(): string | null {
  return getItem(TOKEN_KEY);
}
export function setToken(token: string, remember: boolean) {
  setItem(TOKEN_KEY, token, remember);
}
export function clearToken() {
  removeItem(TOKEN_KEY);
}

// Attach the bearer token to every request when present.
const authInterceptor: Interceptor = (next) => async (req) => {
  const token = getToken();
  if (token) {
    req.header.set("Authorization", `Bearer ${token}`);
  }
  return await next(req);
};

export const transport = createConnectTransport({
  baseUrl: "http://localhost:8086",
  interceptors: [authInterceptor],
});
