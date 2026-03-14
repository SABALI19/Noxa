import React, { createContext, useContext, useEffect, useState } from "react";
import {
  clearAuthSession,
  forgotPasswordRequest,
  getAuthTokens,
  getCurrentUserRequest,
  loginRequest,
  resetPasswordRequest,
  logoutRequest,
  registerRequest,
  updateProfileRequest,
  verifyLoginOtpRequest,
} from "../services/authService";

export const AuthContext = createContext(null);

const USER_STORAGE_KEY = "noxa_user";

const enrichUser = (userData = {}) => ({
  ...userData,
  id: userData.id || userData._id || "",
  username: userData.username || "",
  role: userData.role || "Member",
  selectedRingtone: userData.selectedRingtone || "Default",
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
    if (authResponse?.requiresOtp) {
      return {
        requiresOtp: true,
        loginOtpToken: authResponse.loginOtpToken,
        expiresAt: authResponse.expiresAt || null,
        message: authResponse.message || "Login OTP sent. Verify it to complete sign in.",
      };
    }

    const persistedUser = persistUser(authResponse.user);
    setUser(persistedUser);
    setToken(authResponse.token);
    return {
      user: persistedUser,
      message: authResponse.message || "Login successful",
      notification: authResponse.notification || null,
    };
  };

  const verifyLoginOtpWithBackend = async ({ loginOtpToken, otp }) => {
    const authResponse = await verifyLoginOtpRequest({ loginOtpToken, otp });
    const persistedUser = persistUser(authResponse.user);
    setUser(persistedUser);
    setToken(authResponse.token);
    return {
      user: persistedUser,
      message: authResponse.message || "Login successful",
      notification: authResponse.notification || null,
    };
  };

  const signupWithBackend = async (formData) => {
    const authResponse = await registerRequest(formData);
    const persistedUser = persistUser(authResponse.user);
    setUser(persistedUser);
    setToken(authResponse.token);
    return {
      user: persistedUser,
      message: authResponse.message || "Signup successful",
      notification: authResponse.notification || null,
    };
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

  const forgotPassword = async (email) => {
    const response = await forgotPasswordRequest({ email });
    return response?.message || "If an account exists, a reset link has been sent.";
  };

  const resetPassword = async ({ token: resetToken, password, confirmPassword }) => {
    const response = await resetPasswordRequest({
      token: resetToken,
      password,
      confirmPassword,
    });
    return response?.message || "Password reset successful. Please sign in.";
  };

  const updateProfile = async (updatedData) => {
    const response = await updateProfileRequest(updatedData);
    const persistedUser = persistUser(response.user);
    setUser(persistedUser);
    return {
      user: persistedUser,
      message: response.message || "Profile updated successfully",
      notification: response.notification || null,
    };
  };

  const value = {
    user,
    token,
    loginWithBackend,
    verifyLoginOtpWithBackend,
    signupWithBackend,
    forgotPassword,
    resetPassword,
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
