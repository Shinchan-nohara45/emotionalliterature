import React, { createContext, useContext, useState, useEffect } from "react";
import {
  authAPI,
  getToken,
  subscribeToAuthInvalidation,
} from "../services/api";

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profileCompleted, setProfileCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  /* ===============================
     Boot-time auth check
  ================================ */
  useEffect(() => {
    checkAuth();

    const unsubscribe = subscribeToAuthInvalidation(() => {
      clearAuthState();
    });

    return unsubscribe;
  }, []);

  const clearAuthState = () => {
    setUser(null);
    setIsAuthenticated(false);
    setProfileCompleted(false);
  };

  const hydrateUser = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    setProfileCompleted(Boolean(userData?.profile_completed));
  };

  const checkAuth = async () => {
    const token = await getToken();

    if (!token) {
      clearAuthState();
      setLoading(false);
      return;
    }

    try {
      const userData = await authAPI.getCurrentUser();
      hydrateUser(userData);
    } catch {
      clearAuthState();
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
     Login
  ================================ */
  const login = async (email, password) => {
    try {
      const result = await authAPI.login(email, password);

      if (!result.success) {
        return {
          success: false,
          error:
            result.reason === "TOKEN_STORAGE_FAILED"
              ? "Unable to store session securely"
              : "Login failed",
        };
      }

      const userData = await authAPI.getCurrentUser();
      hydrateUser(userData);

      return { success: true };
    } catch (err) {
      clearAuthState();
      return { success: false, error: err.message };
    }
  };

  /* ===============================
     Register
  ================================ */
  const register = async (email, password, fullName) => {
    try {
      await authAPI.register(email, password, fullName);
      return await login(email, password);
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  /* ===============================
     Logout
  ================================ */
  const logout = async () => {
    try {
      await authAPI.logout();
    } finally {
      clearAuthState();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        profileCompleted,
        loading,
        login,
        register,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
