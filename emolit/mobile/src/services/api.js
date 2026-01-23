import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

/* ===============================
   Base URL resolution
   
   For Expo Go on physical devices, you need to use your computer's local IP address.
   Find your IP: 
   - Windows: ipconfig (look for IPv4 Address)
   - Mac/Linux: ifconfig or ip addr
   
   Update LOCAL_IP below with your computer's IP address.
================================ */
// TODO: Replace with your computer's local IP address (e.g., "192.168.1.100")
const LOCAL_IP = "10.1.185.30"; // Change this to your computer's IP

const API_BASE_URL =
  Platform.OS === "android"
    ? __DEV__
      ? `http://${LOCAL_IP}:8000` // Use local IP for physical devices
      : "http://10.0.2.2:8000" // Android emulator
    : Platform.OS === "ios"
    ? __DEV__
      ? `http://${LOCAL_IP}:8000` // Use local IP for physical devices
      : "http://localhost:8000" // iOS simulator
    : `http://${LOCAL_IP}:8000`; // Default to local IP

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
  // Reduced timeout to 10 seconds for faster failure detection
  const timeoutId = setTimeout(() => controller.abort(), 10000);

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
    
    // Log the error for debugging
    console.error(`API Request failed [${endpoint}]:`, err.message);
    
    // Provide better error messages
    if (err.name === "AbortError" || err.message === "Aborted") {
      const errorMsg = `Connection timeout. Please check:\n` +
        `1. Backend server is running on port 8000\n` +
        `2. Your computer's IP is correct: ${API_BASE_URL}\n` +
        `3. Phone and computer are on the same WiFi network`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
    
    if (err.message.includes("Network request failed") || err.message.includes("Failed to fetch")) {
      const errorMsg = `Cannot connect to server at ${API_BASE_URL}\n` +
        `Make sure:\n` +
        `1. Backend is running: uvicorn app.main:app --host 0.0.0.0 --port 8000\n` +
        `2. Update LOCAL_IP in api.js to your computer's IP address\n` +
        `3. Both devices are on the same network`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }
    
    throw err;
  }
};

/* ===============================
   Auth API
================================ */
export const authAPI = {
  register: async (email, password, fullName) => {
    return apiRequest("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        full_name: fullName,
      }),
    });
  },

  login: async (email, password) => {
    const response = await apiRequest("/api/v1/auth/login", {
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
      await apiRequest("/api/v1/auth/logout", { method: "POST" });
    } catch {}
  },

  getCurrentUser: async () => {
    return apiRequest("/api/v1/auth/me");
  },
};

/* ===============================
   Domain APIs
================================ */
export const journalAPI = {
  createEntry: (entry) =>
    apiRequest("/api/v1/journal/entries", {
      method: "POST",
      body: JSON.stringify(entry),
    }),

  getEntries: (skip = 0, limit = 10) =>
    apiRequest(`/api/v1/journal/entries?skip=${skip}&limit=${limit}`),

  getEntry: (entryId) =>
    apiRequest(`/api/v1/journal/entries/${entryId}`),

  analyzeVoice: async (audioUri) => {
    const token = await getToken();
    const formData = new FormData();
    
    // Extract filename from URI
    const filename = audioUri.split('/').pop() || 'recording.m4a';
    const fileType = filename.split('.').pop() || 'm4a';
    
    formData.append('audio', {
      uri: audioUri,
      type: `audio/${fileType}`,
      name: filename,
    });

    const headers = {
      'Content-Type': 'multipart/form-data',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout for voice analysis

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/journal/analyze-voice`, {
        method: 'POST',
        headers,
        body: formData,
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
      console.error(`API Request failed [/api/v1/journal/analyze-voice]:`, err.message);
      throw err;
    }
  },
};

export const progressAPI = {
  getProgress: () => apiRequest("/api/v1/progress"),
};

export const emotionsAPI = {
  getWordOfTheDay: () => apiRequest("/api/v1/emotions/word-of-the-day"),
};

export const quizAPI = {
  getQuestions: () => apiRequest("/api/v1/quiz/questions?limit=5"),

  submitAnswers: (answers) =>
    apiRequest("/api/v1/quiz/submit", {
      method: "POST",
      body: JSON.stringify(answers),
    }),
};

export const profileAPI = {
  getProfile: () => apiRequest("/api/v1/profile"),
  updateProfile: (data) =>
    apiRequest("/api/v1/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};
