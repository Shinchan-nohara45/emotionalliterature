import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// Use localhost for iOS simulator, 10.0.2.2 for Android emulator, or your actual IP for physical device
const API_BASE_URL = "http://10.1.47.131:8000"; // Updated to your local IP for physical device support
// const API_BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';

// Helper function to get auth token from AsyncStorage
const getToken = async () => {
  try {
    return await AsyncStorage.getItem("auth_token");
  } catch (error) {
    console.error("Error getting token:", error);
    return null;
  }
};

// Helper function to set auth token
const setToken = async (token) => {
  try {
    await AsyncStorage.setItem("auth_token", token);
  } catch (error) {
    console.error("Error setting token:", error);
  }
};

// Helper function to remove auth token
const removeToken = async () => {
  try {
    await AsyncStorage.removeItem("auth_token");
  } catch (error) {
    console.error("Error removing token:", error);
  }
};

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
  const token = await getToken();
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...config,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 401) {
      // Unauthorized - remove token
      await removeToken();
      throw new Error("Unauthorized");
    }

    if (!response.ok) {
      const errorText = await response.text();
      let errorDetail;
      try {
        const errorJson = JSON.parse(errorText);
        errorDetail = errorJson.detail || errorJson.message;
      } catch (e) {
        errorDetail = errorText;
      }
      console.error("API Error:", response.status, errorDetail);
      throw new Error(
        errorDetail || `Request failed with status ${response.status}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error("API request error:", error);
    throw error;
  }
};

// Auth API
export const authAPI = {
  register: async (email, password, fullName) => {
    const response = await apiRequest("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        full_name: fullName,
      }),
    });
    return response;
  },

  login: async (email, password) => {
    const response = await apiRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
      }),
    });

    if (response.access_token) {
      await setToken(response.access_token);
    }

    return response;
  },

  logout: async () => {
    await removeToken();
    await apiRequest("/api/auth/logout", {
      method: "POST",
    });
  },

  getCurrentUser: async () => {
    return await apiRequest("/api/auth/me");
  },
};

// Journal API
export const journalAPI = {
  createEntry: async (entry) => {
    return await apiRequest("/api/journal/entries", {
      method: "POST",
      body: JSON.stringify(entry),
    });
  },

  getEntries: async (skip = 0, limit = 10) => {
    return await apiRequest(`/api/journal/entries?skip=${skip}&limit=${limit}`);
  },

  analyzeVoice: async (
    audioFile,
    targetLanguage = null,
    generateAudio = false
  ) => {
    const formData = new FormData();
    formData.append("audio", {
      uri: audioFile.uri,
      type: audioFile.type || "audio/m4a",
      name: audioFile.name || "recording.m4a",
    });

    // Add optional parameters to query string
    let queryParams = [];
    if (targetLanguage) queryParams.push(`target_language=${targetLanguage}`);
    if (generateAudio) queryParams.push(`generate_audio=${true}`);

    const queryString =
      queryParams.length > 0 ? `?${queryParams.join("&")}` : "";

    const token = await getToken();
    const headers = {
      "Content-Type": "multipart/form-data", // Fetch usually sets this automatically with boundary for FormData
    };
    // Note: When using FormData with fetch in React Native, usually you should NOT set Content-Type manually
    // to allow it to set the boundary. But let's see.
    // The previous code had empty headers object and added Authorization.

    // Let's stick to previous pattern but ensure we don't break multipart
    const requestHeaders = {};
    if (token) {
      requestHeaders["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(
      `${API_BASE_URL}/api/journal/analyze-voice${queryString}`,
      {
        method: "POST",
        headers: requestHeaders,
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || error.message || "Request failed");
    }

    return await response.json();
  },
};

// Progress API
export const progressAPI = {
  getProgress: async () => {
    return await apiRequest("/api/progress");
  },
};

// Emotions API
export const emotionsAPI = {
  getWordOfTheDay: async () => {
    return await apiRequest("/api/emotions/word-of-the-day");
  },
};

// Quiz API
export const quizAPI = {
  getQuestions: async () => {
    return await apiRequest("/api/quiz/questions");
  },

  submitAnswers: async (answers) => {
    return await apiRequest("/api/quiz/submit", {
      method: "POST",
      body: JSON.stringify(answers),
    });
  },
};

// Export token management functions
export { getToken, setToken, removeToken };
