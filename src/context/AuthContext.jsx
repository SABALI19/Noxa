import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginRequest, registerRequest } from '../services/authService';

export const AuthContext = createContext(null);

const AUTH_STORAGE_KEY = 'noxa_auth';
const USER_STORAGE_KEY = 'noxa_user';

const enrichUser = (userData = {}) => ({
  ...userData,
  id: userData.id || userData._id || '',
  username: userData.username || '',
  role: userData.role || 'Member',
  createdAt: userData.createdAt || new Date().toISOString(),
  lastLogin: userData.lastLogin || new Date().toISOString()
});

const persistAuth = ({ user, token = null, refreshToken = null }) => {
  const enrichedUser = enrichUser(user);
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(enrichedUser));
  localStorage.setItem('isAuthenticated', 'true');
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
    user: enrichedUser,
    token: token || null,
    refreshToken: refreshToken || null
  }));
  return enrichedUser;
};

const clearPersistedAuth = () => {
  localStorage.removeItem(USER_STORAGE_KEY);
  localStorage.removeItem('isAuthenticated');
  localStorage.removeItem(AUTH_STORAGE_KEY);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
    if (storedAuth) {
      try {
        const parsed = JSON.parse(storedAuth);
        if (parsed?.user) {
          setUser(enrichUser(parsed.user));
          setToken(parsed.token || null);
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('Error parsing stored auth:', error);
      }
    }

    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    if (storedUser) {
      try {
        setUser(enrichUser(JSON.parse(storedUser)));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        clearPersistedAuth();
      }
    }

    setLoading(false);
  }, []);

  const login = (userData) => {
    const enrichedUser = persistAuth({ user: userData });
    setUser(enrichedUser);
    setToken(null);
    return enrichedUser;
  };

  const loginWithBackend = async (credentials) => {
    const authResponse = await loginRequest(credentials);
    const enrichedUser = persistAuth({
      user: authResponse.user,
      token: authResponse.token,
      refreshToken: authResponse.refreshToken
    });
    setUser(enrichedUser);
    setToken(authResponse.token || null);
    return enrichedUser;
  };

  const signupWithBackend = async (formData) => {
    const authResponse = await registerRequest(formData);
    const enrichedUser = persistAuth({
      user: authResponse.user,
      token: authResponse.token,
      refreshToken: authResponse.refreshToken
    });
    setUser(enrichedUser);
    setToken(authResponse.token || null);
    return enrichedUser;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    clearPersistedAuth();
  };

  const updateProfile = (updatedData) => {
    const updatedUser = {
      ...user,
      ...updatedData,
      updatedAt: new Date().toISOString()
    };
    const persistedUser = persistAuth({ user: updatedUser, token });
    setUser(persistedUser);
    return persistedUser;
  };

  const demoLogin = () => {
    const demoUser = {
      id: 'demo-123',
      username: 'demo_user',
      name: 'Demo User',
      email: 'demo@example.com',
      role: 'Administrator',
      avatar: null,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };
    const persistedUser = persistAuth({ user: demoUser });
    setUser(persistedUser);
    setToken(null);
    return persistedUser;
  };

  const value = {
    user,
    token,
    login,
    loginWithBackend,
    signupWithBackend,
    logout,
    updateProfile,
    demoLogin,
    loading,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
