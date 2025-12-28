import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

/* ===============================
   Base URL resolution
================================ */
const FALLBACK_LOCAL_IP = "10.1.47.131";

const API_BASE_URL =
  Platform.OS === "android"
    ? "http://10.0.2.2:8000"
    : Platform.OS === "ios"
    ? "http://localhost:8000"
    : `http://${FALLBACK_LOCAL_IP}:8000`;

/* ===============================
   Auth token storage
================================ */
const TOKEN_KEY = "auth_token";

export const getToken = async () => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

const setToken = async (token) => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    const stored = await AsyncStorage.getItem(TOKEN_KEY);
    return stored === token;
  } catch {
    return false;
  }
};

const removeToken = async () => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch {}
};

/* ===============================
   Auth invalidation listeners
================================ */
let authInvalidationSubscribers = [];

export const subscribeToAuthInvalidation = (callback) => {
  authInvalidationSubscribers.push(callback);
  return () => {
    authInvalidationSubscribers =
      authInvalidationSubscribers.filter((cb) => cb !== callback);
  };
};

const notifyAuthInvalidation = () => {
  authInvalidationSubscribers.forEach((cb) => cb());
};

/* ===============================
   Core API request helper
================================ */
const apiRequest = async (endpoint, options = {}) => {
  const token = await getToken();

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 401) {
      await removeToken();
      notifyAuthInvalidation();
      throw new Error("SESSION_EXPIRED");
    }

    if (!response.ok) {
      const text = await response.text();
      let message = text;
      try {
        message = JSON.parse(text)?.detail || text;
      } catch {}
      throw new Error(message);
    }

    return await response.json();
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
};

/* ===============================
   Auth API
================================ */
export const authAPI = {
  register: async (email, password, fullName) => {
    return apiRequest("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        full_name: fullName,
      }),
    });
  },

  login: async (email, password) => {
    const response = await apiRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (!response?.access_token) {
      return { success: false, reason: "NO_TOKEN_RETURNED" };
    }

    const stored = await setToken(response.access_token);

    if (!stored) {
      return { success: false, reason: "TOKEN_STORAGE_FAILED" };
    }

    return { success: true };
  },

  logout: async () => {
    await removeToken();
    notifyAuthInvalidation();
    try {
      await apiRequest("/api/auth/logout", { method: "POST" });
    } catch {}
  },

  getCurrentUser: async () => {
    return apiRequest("/api/auth/me");
  },
};

/* ===============================
   Domain APIs (unchanged)
================================ */
export const journalAPI = {
  createEntry: (entry) =>
    apiRequest("/api/journal/entries", {
      method: "POST",
      body: JSON.stringify(entry),
    }),

  getEntries: (skip = 0, limit = 10) =>
    apiRequest(`/api/journal/entries?skip=${skip}&limit=${limit}`),
};

export const progressAPI = {
  getProgress: () => apiRequest("/api/progress"),
};

export const emotionsAPI = {
  getWordOfTheDay: () => apiRequest("/api/emotions/word-of-the-day"),
};

export const quizAPI = {
  getQuestions: () => apiRequest("/api/quiz/questions"),

  submitAnswers: (answers) =>
    apiRequest("/api/quiz/submit", {
      method: "POST",
      body: JSON.stringify(answers),
    }),
};


export const profileAPI = {
  getProfile: () => apiRequest("/api/profile"),
  updateProfile: (data) =>
    apiRequest("/api/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};
