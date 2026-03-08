import React, { useState, useEffect, useMemo } from "react";
import { ThemeContext } from "./themeContextValue";

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    // Check for saved theme, default to 'system'
    return savedTheme || 'system';
  });

  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const isDarkMode = useMemo(() => {
    if (theme === 'dark') return true;
    if (theme === 'light') return false;
    return systemDark;
  }, [theme, systemDark]);

  // Effect to handle system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      setSystemDark(mediaQuery.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Effect to apply dark class to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Save theme to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleDarkMode = () => {
    // Toggle between light and dark directly
    if (theme === 'dark') {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  };

  const value = {
    theme,
    setTheme,
    isDarkMode,
    toggleDarkMode
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
