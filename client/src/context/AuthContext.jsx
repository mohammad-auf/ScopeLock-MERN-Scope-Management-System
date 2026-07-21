import React, { createContext, useContext, useState, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

const TOKEN_KEY = 'sl_token';
const USER_KEY = 'sl_user';

export const AuthProvider = ({ children }) => {
  // Hydrate from localStorage on first render
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || null);
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  /** Persist token + user and update state */
  const login = useCallback((newToken, newUser) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  /** Clear all auth state */
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  /** Re-verify token against /api/auth/me (used on app mount) */
  const refreshUser = useCallback(async () => {
    if (!localStorage.getItem(TOKEN_KEY)) return false;
    try {
      const { data } = await authAPI.getMe();
      setUser(data.user);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      return true;
    } catch {
      logout();
      return false;
    }
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!token && !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/** Hook for consuming auth context */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};

export default AuthContext;
