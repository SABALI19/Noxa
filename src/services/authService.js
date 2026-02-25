const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
const LOGIN_PATH = import.meta.env.VITE_AUTH_LOGIN_PATH || "/api/v1/users/login";
const SIGNUP_PATH =
  import.meta.env.VITE_AUTH_SIGNUP_PATH ||
  import.meta.env.VITE_AUTH_REGISTER_PATH ||
  "/api/v1/users/signup";
const REFRESH_PATH = import.meta.env.VITE_AUTH_REFRESH_PATH || "/api/v1/users/refresh";
const LOGOUT_PATH = import.meta.env.VITE_AUTH_LOGOUT_PATH || "/api/v1/users/logout";
const ME_PATH = import.meta.env.VITE_AUTH_ME_PATH || "/api/v1/users/me";

const TOKEN_STORAGE_KEY = "noxa_tokens";
let refreshInFlight = null;

const joinUrl = (base, path) => {
  if (!path) return base;
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedBase = (base || "").replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
};

const parseJsonSafe = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const extractMessage = (payload, fallback = "Request failed") => {
  if (!payload || typeof payload !== "object") return fallback;
  return payload.message || payload.error?.message || payload.error || payload.details || fallback;
};

const extractData = (payload) => {
  if (!payload || typeof payload !== "object") return {};
  if (payload.data && typeof payload.data === "object") return payload.data;
  return payload;
};

const normalizeUser = (candidate = {}) => ({
  id: candidate.id || candidate._id || candidate.userId || "",
  username: candidate.username || "",
  name: candidate.name || candidate.fullName || candidate.username || "",
  email: candidate.email || "",
  role: candidate.role || "Member",
  avatar: candidate.avatar || candidate.profileImage || null,
  createdAt: candidate.createdAt || new Date().toISOString(),
  lastLogin: new Date().toISOString(),
});

const getAccessTokenFromData = (data = {}) => data.accessToken || data.token || data.jwt || null;
const getRefreshTokenFromData = (data = {}) =>
  data.refreshToken || data?.tokens?.refreshToken || null;

const validateAuthResult = (data, contextLabel) => {
  const userCandidate = data.user || data.account || data.profile || data;
  const user = normalizeUser(userCandidate);
  const accessToken = getAccessTokenFromData(data);
  const refreshToken = getRefreshTokenFromData(data);

  if (!accessToken) {
    throw new Error(`${contextLabel} failed: missing access token in response.`);
  }
  if (!user.id) {
    throw new Error(`${contextLabel} failed: missing user id in response.`);
  }
  if (!user.email) {
    throw new Error(`${contextLabel} failed: missing user email in response.`);
  }

  return {
    user,
    token: accessToken,
    refreshToken,
  };
};

const getStoredTokens = () => {
  const raw = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return {
      accessToken: parsed.accessToken || parsed.token || null,
      refreshToken: parsed.refreshToken || null,
    };
  } catch {
    return null;
  }
};

const storeTokens = ({ accessToken, refreshToken }) => {
  localStorage.setItem(
    TOKEN_STORAGE_KEY,
    JSON.stringify({
      accessToken: accessToken || null,
      refreshToken: refreshToken || null,
    })
  );
};

const clearStoredTokens = () => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
};

const request = async (path, options = {}) => {
  const {
    method = "GET",
    body,
    headers = {},
    requireAuth = false,
    retryOn401 = false,
  } = options;

  const url = joinUrl(API_BASE_URL, path);
  const requestHeaders = new Headers(headers);
  if (!requestHeaders.has("Content-Type") && body !== undefined) {
    requestHeaders.set("Content-Type", "application/json");
  }

  const tokens = getStoredTokens();
  if (requireAuth && tokens?.accessToken) {
    requestHeaders.set("Authorization", `Bearer ${tokens.accessToken}`);
  }

  const execute = () =>
    fetch(url, {
      method,
      headers: requestHeaders,
      credentials: "include",
      body: body === undefined ? undefined : JSON.stringify(body),
    });

  let response = await execute();

  if (response.status === 401 && retryOn401 && requireAuth) {
    try {
      const newAccessToken = await refreshAccessToken();
      requestHeaders.set("Authorization", `Bearer ${newAccessToken}`);
      response = await execute();
    } catch {
      clearStoredTokens();
      throw new Error("Session expired. Please log in again.");
    }
  }

  const payload = await parseJsonSafe(response);
  if (!response.ok) {
    throw new Error(extractMessage(payload, `Request failed (${response.status})`));
  }

  return payload;
};

const refreshAccessToken = async () => {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const tokens = getStoredTokens();
    if (!tokens?.refreshToken) {
      throw new Error("No refresh token available.");
    }

    const response = await fetch(joinUrl(API_BASE_URL, REFRESH_PATH), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    });

    const payload = await parseJsonSafe(response);
    if (!response.ok) {
      throw new Error(extractMessage(payload, "Session refresh failed."));
    }

    const data = extractData(payload);
    const accessToken = getAccessTokenFromData(data);
    if (!accessToken) {
      throw new Error("Session refresh failed: missing access token.");
    }

    storeTokens({
      accessToken,
      refreshToken: getRefreshTokenFromData(data) || tokens.refreshToken,
    });

    return accessToken;
  })().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
};

export const loginRequest = async ({ email, password }) => {
  const payload = await request(LOGIN_PATH, {
    method: "POST",
    body: { email, password },
  });

  const data = extractData(payload);
  const normalized = validateAuthResult(data, "Login");
  storeTokens({
    accessToken: normalized.token,
    refreshToken: normalized.refreshToken,
  });

  return {
    ...normalized,
    raw: payload,
  };
};

export const registerRequest = async ({ name, email, password, confirmPassword }) => {
  const payload = await request(SIGNUP_PATH, {
    method: "POST",
    body: { name, email, password, confirmPassword },
  });

  const data = extractData(payload);
  const normalized = validateAuthResult(data, "Signup");
  storeTokens({
    accessToken: normalized.token,
    refreshToken: normalized.refreshToken,
  });

  return {
    ...normalized,
    raw: payload,
  };
};

export const getCurrentUserRequest = async () => {
  const payload = await request(ME_PATH, {
    method: "GET",
    requireAuth: true,
    retryOn401: true,
  });

  const data = extractData(payload);
  const userCandidate = data.user || data.account || data.profile || data;
  const user = normalizeUser(userCandidate);
  if (!user.id || !user.email) {
    throw new Error("Invalid profile response from backend.");
  }

  return {
    user,
    raw: payload,
  };
};

export const logoutRequest = async () => {
  const tokens = getStoredTokens();
  try {
    await request(LOGOUT_PATH, {
      method: "POST",
      body: tokens?.refreshToken ? { refreshToken: tokens.refreshToken } : {},
      requireAuth: true,
      retryOn401: false,
    });
  } finally {
    clearStoredTokens();
  }
};

export const authFetch = async (path, init = {}) => {
  const url = /^https?:\/\//i.test(path) ? path : joinUrl(API_BASE_URL, path);
  const requestHeaders = new Headers(init.headers || {});

  const tokens = getStoredTokens();
  if (tokens?.accessToken) {
    requestHeaders.set("Authorization", `Bearer ${tokens.accessToken}`);
  }

  const execute = () =>
    fetch(url, {
      ...init,
      headers: requestHeaders,
      credentials: init.credentials ?? "include",
    });

  let response = await execute();

  if (response.status === 401) {
    try {
      const newAccessToken = await refreshAccessToken();
      requestHeaders.set("Authorization", `Bearer ${newAccessToken}`);
      response = await execute();
    } catch {
      clearStoredTokens();
      throw new Error("Session expired. Please log in again.");
    }
  }

  return response;
};

export const clearAuthSession = () => {
  clearStoredTokens();
};

export const getAuthTokens = () => getStoredTokens();

export const authConfig = {
  API_BASE_URL,
  LOGIN_PATH,
  SIGNUP_PATH,
  REFRESH_PATH,
  LOGOUT_PATH,
  ME_PATH,
  TOKEN_STORAGE_KEY,
};
