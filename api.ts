const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

type TokenState = {
  accessToken: string;
  refreshToken: string;
};

const TOKEN_KEY = "noxa_tokens";
let refreshPromise: Promise<string> | null = null;

function getTokens(): TokenState | null {
  const raw = localStorage.getItem(TOKEN_KEY);
  return raw ? JSON.parse(raw) : null;
}

function setTokens(tokens: TokenState) {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
}

function getAccessTokenFromResponse(data: any) {
  return data?.accessToken || data?.token;
}

export async function loginWithBackend(payload: { email: string; password: string }) {
  const res = await fetch(`${API_BASE}/api/v1/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || "Login failed");

  const data = json.data;
  setTokens({
    accessToken: getAccessTokenFromResponse(data),
    refreshToken: data.refreshToken,
  });

  return data.user;
}

async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const tokens = getTokens();
    if (!tokens?.refreshToken) throw new Error("No refresh token");

    const res = await fetch(`${API_BASE}/api/v1/users/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json?.message || "Refresh failed");

    const data = json.data;
    const newAccess = getAccessTokenFromResponse(data);

    setTokens({
      accessToken: newAccess,
      refreshToken: data.refreshToken, // rotated refresh token
    });

    return newAccess;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

export async function authFetch(path: string, init: RequestInit = {}) {
  const tokens = getTokens();

  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "application/json");
  if (tokens?.accessToken) {
    headers.set("Authorization", `Bearer ${tokens.accessToken}`);
  }

  let res = await fetch(`${API_BASE}${path}`, { ...init, headers });

  if (res.status === 401) {
    try {
      const newAccessToken = await refreshAccessToken();
      headers.set("Authorization", `Bearer ${newAccessToken}`);
      res = await fetch(`${API_BASE}${path}`, { ...init, headers });
    } catch {
      clearTokens();
      window.location.href = "/login"; // or your landing/auth route
      throw new Error("Session expired");
    }
  }

  return res;
}
