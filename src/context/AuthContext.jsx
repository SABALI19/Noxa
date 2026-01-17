 import React, { createContext, useContext, useState, useEffect } from 'react';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user on mount
    const storedUser = localStorage.getItem('noxa_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Ensure user has required fields
        const enrichedUser = {
          ...parsedUser,
          // Add default values if missing
          username: parsedUser.username || "",
          role: parsedUser.role || 'Member',
          createdAt: parsedUser.createdAt || new Date().toISOString(),
        };
        Promise.resolve().then(() => setUser(enrichedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('noxa_user');
      }
    }
    // Use a separate effect or callback to set loading to false
    const timer = setTimeout(() => setLoading(false), 0);
    return () => clearTimeout(timer);
  }, []);

  const login = (userData) => {
    // Enrich user data with default values
    const enrichedUser = {
      ...userData,
      username: userData.username || "",
      role: userData.role || 'Member',
      createdAt: userData.createdAt || new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };
    
    setUser(enrichedUser);
    localStorage.setItem('noxa_user', JSON.stringify(enrichedUser));
    localStorage.setItem('isAuthenticated', 'true');
    return enrichedUser;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('noxa_user');
    localStorage.removeItem('isAuthenticated');
  };

  const updateProfile = (updatedData) => {
    const updatedUser = { 
      ...user, 
      ...updatedData,
      updatedAt: new Date().toISOString()
    };
    setUser(updatedUser);
    localStorage.setItem('noxa_user', JSON.stringify(updatedUser));
    return updatedUser;
  };

  // Demo login function
  const demoLogin = () => {
    const demoUser = {
      id: "demo-123",
      username: "demo_user",
      name: "Demo User",
      email: "demo@example.com",
      role: "Administrator",
      avatar: null,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };
    
    setUser(demoUser);
    localStorage.setItem('noxa_user', JSON.stringify(demoUser));
    localStorage.setItem('isAuthenticated', 'true');
    return demoUser;
  };

  const value = {
    user,
    login,
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

// Convenience hook for consuming the Auth context
export const useAuth = () => {
  return useContext(AuthContext);
};