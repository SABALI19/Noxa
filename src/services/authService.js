const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
const LOGIN_PATH = import.meta.env.VITE_AUTH_LOGIN_PATH || "/api/v1/users/login";
const LOGIN_VERIFY_OTP_PATH =
  import.meta.env.VITE_AUTH_LOGIN_VERIFY_OTP_PATH || "/api/v1/users/login/verify-otp";
const SIGNUP_PATH =
  import.meta.env.VITE_AUTH_SIGNUP_PATH ||
  import.meta.env.VITE_AUTH_REGISTER_PATH ||
  "/api/v1/users/signup";
const SIGNUP_REQUEST_VERIFICATION_PATH =
  import.meta.env.VITE_AUTH_SIGNUP_REQUEST_VERIFICATION_PATH ||
  "/api/v1/users/signup/request-verification";
const SIGNUP_VERIFY_EMAIL_PATH =
  import.meta.env.VITE_AUTH_SIGNUP_VERIFY_EMAIL_PATH || "/api/v1/users/signup/verify-email";
const SIGNUP_RESEND_VERIFICATION_PATH =
  import.meta.env.VITE_AUTH_SIGNUP_RESEND_VERIFICATION_PATH ||
  "/api/v1/users/signup/resend-verification";
const REFRESH_PATH = import.meta.env.VITE_AUTH_REFRESH_PATH || "/api/v1/users/refresh";
const LOGOUT_PATH = import.meta.env.VITE_AUTH_LOGOUT_PATH || "/api/v1/users/logout";
const ME_PATH = import.meta.env.VITE_AUTH_ME_PATH || "/api/v1/users/me";
const UPDATE_PROFILE_PATH =
  import.meta.env.VITE_AUTH_UPDATE_PROFILE_PATH || "/api/v1/users/me";
const DELETE_ACCOUNT_PATH =
  import.meta.env.VITE_AUTH_DELETE_ACCOUNT_PATH || "/api/v1/users/me";
const FORGOT_PASSWORD_PATH =
  import.meta.env.VITE_AUTH_FORGOT_PASSWORD_PATH || "/api/v1/users/forgot-password";
const RESET_PASSWORD_PATH =
  import.meta.env.VITE_AUTH_RESET_PASSWORD_PATH || "/api/v1/users/reset-password";

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
  selectedRingtone: candidate.selectedRingtone || "Default",
  createdAt: candidate.createdAt || new Date().toISOString(),
  lastLogin: new Date().toISOString(),
});

const getAccessTokenFromData = (data = {}) => data.accessToken || data.token || data.jwt || null;
const getRefreshTokenFromData = (data = {}) =>
  data.refreshToken || data?.tokens?.refreshToken || null;
const normalizeAuthNotification = (candidate) => {
  if (!candidate || typeof candidate !== "object") return null;
  return {
    eventId: candidate.eventId || null,
    timestamp: candidate.timestamp || null,
    notificationType: candidate.notificationType || null,
    itemType: candidate.itemType || null,
    item: candidate.item && typeof candidate.item === "object" ? candidate.item : null,
    message: candidate.message || null,
    title: candidate.title || null,
  };
};

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
    message: data.message || null,
    notification: normalizeAuthNotification(data.notification),
  };
};

const normalizeLoginOtpChallenge = (data = {}) => {
  const loginOtpToken = data.loginOtpToken || data.token || null;

  if (!loginOtpToken) {
    throw new Error("Login failed: missing login OTP token in response.");
  }

  return {
    requiresOtp: true,
    loginOtpToken,
    expiresAt: data.expiresAt || null,
    loginOtp: data.loginOtp || data.otp || null,
    message: data.message || "Login OTP sent. Verify it to complete sign in.",
  };
};

const normalizeSignupVerificationChallenge = (data = {}, emailFallback = "") => {
  const signupVerificationToken = data.signupVerificationToken || data.token || null;

  if (!signupVerificationToken) {
    throw new Error("Signup verification failed: missing signup verification token in response.");
  }

  return {
    requiresEmailVerification: true,
    signupVerificationToken,
    email: data.email || emailFallback || "",
    expiresAt: data.expiresAt || null,
    signupOtp: data.signupOtp || data.otp || null,
    confirmationEmailSent: data.confirmationEmailSent !== false,
    message: data.message || "Confirmation email sent. Verify it before completing signup.",
  };
};

const normalizeVerifiedSignup = (data = {}, emailFallback = "") => {
  const verifiedSignupToken =
    data.verifiedSignupToken || data.emailVerificationToken || data.verificationToken || null;

  if (data.existingAccountVerified || data.canLogin) {
    return {
      verifiedSignupToken: null,
      existingAccountVerified: true,
      canLogin: data.canLogin !== false,
      email: data.email || emailFallback || "",
      expiresAt: data.expiresAt || null,
      message: data.message || "Email verified. You can now sign in to your existing account.",
    };
  }

  if (!verifiedSignupToken) {
    throw new Error("Signup verification failed: missing verified signup token in response.");
  }

  return {
    verifiedSignupToken,
    existingAccountVerified: false,
    canLogin: false,
    email: data.email || emailFallback || "",
    expiresAt: data.expiresAt || null,
    message: data.message || "Email verified. Complete signup to create your account.",
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

export const loginRequest = async ({ email, identifier, username, password }) => {
  const loginIdentifier = identifier || email || username || "";
  const payload = await request(LOGIN_PATH, {
    method: "POST",
    body: {
      identifier: loginIdentifier,
      email: loginIdentifier,
      password,
    },
  });

  const data = extractData(payload);
  if (data.requiresOtp) {
    return {
      ...normalizeLoginOtpChallenge(data),
      raw: payload,
    };
  }

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

export const verifyLoginOtpRequest = async ({ loginOtpToken, otp }) => {
  const payload = await request(LOGIN_VERIFY_OTP_PATH, {
    method: "POST",
    body: { loginOtpToken, otp },
  });

  const data = extractData(payload);
  const normalized = validateAuthResult(data, "Login OTP verification");
  storeTokens({
    accessToken: normalized.token,
    refreshToken: normalized.refreshToken,
  });

  return {
    ...normalized,
    raw: payload,
  };
};

export const requestSignupVerificationRequest = async ({ email }) => {
  const payload = await request(SIGNUP_REQUEST_VERIFICATION_PATH, {
    method: "POST",
    body: { email },
  });

  const data = extractData(payload);
  return {
    ...normalizeSignupVerificationChallenge(data, email),
    raw: payload,
  };
};

export const verifySignupEmailRequest = async ({ signupVerificationToken, otp }) => {
  const payload = await request(SIGNUP_VERIFY_EMAIL_PATH, {
    method: "POST",
    body: { signupVerificationToken, otp },
  });

  const data = extractData(payload);
  return {
    ...normalizeVerifiedSignup(data),
    raw: payload,
  };
};

export const resendSignupVerificationRequest = async ({ email }) => {
  const payload = await request(SIGNUP_RESEND_VERIFICATION_PATH, {
    method: "POST",
    body: { email },
  });

  const data = extractData(payload);
  return {
    ...normalizeSignupVerificationChallenge(data, email),
    raw: payload,
  };
};

export const registerRequest = async ({
  name,
  email,
  password,
  confirmPassword,
  verifiedSignupToken,
}) => {
  const payload = await request(SIGNUP_PATH, {
    method: "POST",
    body: { name, email, password, confirmPassword, verifiedSignupToken },
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

export const updateProfileRequest = async ({
  username,
  name,
  email,
  avatar,
  selectedRingtone,
} = {}) => {
  const profilePayload = {};

  if (username !== undefined) profilePayload.username = username;
  if (name !== undefined) profilePayload.name = name;
  if (email !== undefined) profilePayload.email = email;
  if (avatar !== undefined) profilePayload.avatar = avatar;
  if (selectedRingtone !== undefined) profilePayload.selectedRingtone = selectedRingtone;

  const payload = await request(UPDATE_PROFILE_PATH, {
    method: "PATCH",
    body: profilePayload,
    requireAuth: true,
    retryOn401: true,
  });

  const data = extractData(payload);
  const userCandidate = data.user || data.account || data.profile || data;
  const user = normalizeUser(userCandidate);

  if (!user.id || !user.email) {
    throw new Error("Invalid profile update response from backend.");
  }

  return {
    user,
    message: data.message || "Profile updated successfully",
    notification: normalizeAuthNotification(data.notification),
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

export const deleteAccountRequest = async () => {
  const payload = await request(DELETE_ACCOUNT_PATH, {
    method: "DELETE",
    requireAuth: true,
    retryOn401: true,
  });

  clearStoredTokens();

  return {
    message: extractMessage(payload, "Account deleted successfully."),
    raw: payload,
  };
};

export const forgotPasswordRequest = async ({ email }) => {
  try {
    const payload = await request(FORGOT_PASSWORD_PATH, {
      method: "POST",
      body: { email },
    });

    return {
      message: extractMessage(payload, "If an account exists, a reset link has been sent."),
      raw: payload,
    };
  } catch (error) {
    const message = error?.message || "Forgot password request failed.";
    if (/404|not found|route not found/i.test(message)) {
      throw new Error(
        "Password reset is not enabled on the backend yet (forgot-password route not found)."
      );
    }
    throw error;
  }
};

export const resetPasswordRequest = async ({ token, password, confirmPassword }) => {
  try {
    const payload = await request(RESET_PASSWORD_PATH, {
      method: "POST",
      body: {
        token,
        resetToken: token,
        password,
        newPassword: password,
        confirmPassword,
      },
    });

    return {
      message: extractMessage(payload, "Password reset successful. Please sign in."),
      raw: payload,
    };
  } catch (error) {
    const message = error?.message || "Reset password request failed.";
    if (/404|not found|route not found/i.test(message)) {
      throw new Error(
        "Password reset is not enabled on the backend yet (reset-password route not found)."
      );
    }
    throw error;
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
  LOGIN_VERIFY_OTP_PATH,
  SIGNUP_PATH,
  SIGNUP_REQUEST_VERIFICATION_PATH,
  SIGNUP_VERIFY_EMAIL_PATH,
  SIGNUP_RESEND_VERIFICATION_PATH,
  REFRESH_PATH,
  LOGOUT_PATH,
  ME_PATH,
  UPDATE_PROFILE_PATH,
  DELETE_ACCOUNT_PATH,
  FORGOT_PASSWORD_PATH,
  RESET_PASSWORD_PATH,
  TOKEN_STORAGE_KEY,
};
