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
    // Add a safety timeout to prevent infinite loading
    const safetyTimeout = setTimeout(() => {
      if (loading) {
        console.warn("Auth check timeout - forcing loading to false");
        setLoading(false);
      }
    }, 15000); // 15 second max loading time

    checkAuth();

    const unsubscribe = subscribeToAuthInvalidation(() => {
      clearAuthState();
    });

    return () => {
      clearTimeout(safetyTimeout);
      unsubscribe();
    };
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
    try {
      const token = await getToken();

      if (!token) {
        clearAuthState();
        setLoading(false);
        return;
      }

      try {
        const userData = await authAPI.getCurrentUser();
        hydrateUser(userData);
      } catch (err) {
        // If token is invalid or expired, clear it
        console.log("Auth check failed:", err.message);
        clearAuthState();
      }
    } catch (err) {
      // Handle any unexpected errors
      console.error("Error in checkAuth:", err);
      clearAuthState();
    } finally {
      // Always set loading to false, even if there's an error
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
