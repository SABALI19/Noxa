import React, { createContext, useContext, useEffect, useState } from "react";
import {
  clearAuthSession,
  getAuthTokens,
  getCurrentUserRequest,
  loginRequest,
  logoutRequest,
  registerRequest,
} from "../services/authService";

export const AuthContext = createContext(null);

const USER_STORAGE_KEY = "noxa_user";

const enrichUser = (userData = {}) => ({
  ...userData,
  id: userData.id || userData._id || "",
  username: userData.username || "",
  role: userData.role || "Member",
  createdAt: userData.createdAt || new Date().toISOString(),
  lastLogin: userData.lastLogin || new Date().toISOString(),
});

const persistUser = (user) => {
  const enrichedUser = enrichUser(user);
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(enrichedUser));
  localStorage.setItem("isAuthenticated", "true");
  return enrichedUser;
};

const clearPersistedUser = () => {
  localStorage.removeItem(USER_STORAGE_KEY);
  localStorage.removeItem("isAuthenticated");
};

const clearSession = () => {
  clearAuthSession();
  clearPersistedUser();
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    const bootstrapAuth = async () => {
      try {
        const storedUserRaw = localStorage.getItem(USER_STORAGE_KEY);
        if (storedUserRaw) {
          try {
            const storedUser = JSON.parse(storedUserRaw);
            if (!isCancelled) {
              setUser(enrichUser(storedUser));
            }
          } catch {
            clearPersistedUser();
          }
        }

        const storedTokens = getAuthTokens();
        if (!storedTokens?.accessToken) {
          if (!isCancelled) {
            setToken(null);
          }
          return;
        }

        if (!isCancelled) {
          setToken(storedTokens.accessToken);
        }

        const profile = await getCurrentUserRequest();
        if (isCancelled) return;

        const persistedUser = persistUser(profile.user);
        setUser(persistedUser);
        setToken(getAuthTokens()?.accessToken || storedTokens.accessToken);
      } catch {
        if (!isCancelled) {
          clearSession();
          setUser(null);
          setToken(null);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    bootstrapAuth();

    return () => {
      isCancelled = true;
    };
  }, []);

  const loginWithBackend = async (credentials) => {
    const authResponse = await loginRequest(credentials);
    const persistedUser = persistUser(authResponse.user);
    setUser(persistedUser);
    setToken(authResponse.token);
    return persistedUser;
  };

  const signupWithBackend = async (formData) => {
    const authResponse = await registerRequest(formData);
    const persistedUser = persistUser(authResponse.user);
    setUser(persistedUser);
    setToken(authResponse.token);
    return persistedUser;
  };

  const logout = async () => {
    try {
      await logoutRequest();
    } catch {
      clearAuthSession();
    } finally {
      clearPersistedUser();
      setUser(null);
      setToken(null);
    }
  };

  const updateProfile = (updatedData) => {
    const updatedUser = {
      ...user,
      ...updatedData,
      updatedAt: new Date().toISOString(),
    };
    const persistedUser = persistUser(updatedUser);
    setUser(persistedUser);
    return persistedUser;
  };

  const value = {
    user,
    token,
    loginWithBackend,
    signupWithBackend,
    logout,
    updateProfile,
    loading,
    isAuthenticated: Boolean(user && token),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
