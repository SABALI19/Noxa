const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const LOGIN_PATH = import.meta.env.VITE_AUTH_LOGIN_PATH || '/api/v1/users/login';
const REGISTER_PATH = import.meta.env.VITE_AUTH_REGISTER_PATH || '/api/v1/users/register';

const joinUrl = (base, path) => {
  if (!path) return base;
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedBase = base.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
};

const extractMessage = (payload, fallback = 'Request failed') => {
  if (!payload || typeof payload !== 'object') return fallback;
  return (
    payload.message ||
    payload.error?.message ||
    payload.error ||
    payload.details ||
    fallback
  );
};

const extractPayload = (payload) => {
  if (!payload || typeof payload !== 'object') return {};
  if (payload.data && typeof payload.data === 'object') return payload.data;
  return payload;
};

const normalizeUser = (candidate = {}) => {
  return {
    id: candidate.id || candidate._id || candidate.userId || '',
    username: candidate.username || '',
    name: candidate.name || candidate.fullName || candidate.username || '',
    email: candidate.email || '',
    role: candidate.role || 'Member',
    avatar: candidate.avatar || candidate.profileImage || null,
    createdAt: candidate.createdAt || new Date().toISOString(),
    lastLogin: new Date().toISOString()
  };
};

const normalizeAuthResponse = (responsePayload) => {
  const payload = extractPayload(responsePayload);
  const userCandidate = payload.user || payload.account || payload.profile || payload;
  const token = payload.accessToken || payload.token || payload.jwt || null;
  const refreshToken = payload.refreshToken || payload?.tokens?.refreshToken || null;

  return {
    user: normalizeUser(userCandidate),
    token,
    refreshToken,
    raw: responsePayload
  };
};

const requestAuth = async (path, body) => {
  const response = await fetch(joinUrl(API_BASE_URL, path), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(body)
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(extractMessage(payload, `Request failed (${response.status})`));
  }

  return normalizeAuthResponse(payload);
};

export const loginRequest = async ({ email, password }) => {
  return requestAuth(LOGIN_PATH, { email, password });
};

export const registerRequest = async ({ name, email, password, confirmPassword }) => {
  return requestAuth(REGISTER_PATH, { name, email, password, confirmPassword });
};

export const authConfig = {
  API_BASE_URL,
  LOGIN_PATH,
  REGISTER_PATH
};
