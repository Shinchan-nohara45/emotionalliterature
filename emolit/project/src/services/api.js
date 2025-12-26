/**
 * API service for connecting to the EmoLit backend
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Helper function to get auth token from localStorage
const getToken = () => {
  return localStorage.getItem('auth_token');
};

// Helper function to set auth token
const setToken = (token) => {
  localStorage.setItem('auth_token', token);
};

// Helper function to remove auth token
const removeToken = () => {
  localStorage.removeItem('auth_token');
};

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (response.status === 401) {
      // Unauthorized - remove token and redirect to login
      removeToken();
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || error.message || 'Request failed');
    }

    return await response.json();
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

// Auth API
export const authAPI = {
  register: async (email, password, fullName) => {
    const response = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        full_name: fullName,
      }),
    });
    return response;
  },

  login: async (email, password) => {
    const response = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
      }),
    });
    
    if (response.access_token) {
      setToken(response.access_token);
    }
    
    return response;
  },

  logout: async () => {
    removeToken();
    await apiRequest('/api/auth/logout', {
      method: 'POST',
    });
  },

  getCurrentUser: async () => {
    return await apiRequest('/api/auth/me');
  },
};

// Journal API
export const journalAPI = {
  createEntry: async (entry) => {
    return await apiRequest('/api/journal/entries', {
      method: 'POST',
      body: JSON.stringify(entry),
    });
  },

  getEntries: async (skip = 0, limit = 10) => {
    return await apiRequest(`/api/journal/entries?skip=${skip}&limit=${limit}`);
  },

  analyzeVoice: async (audioFile) => {
    const formData = new FormData();
    formData.append('audio', audioFile);
    
    const token = getToken();
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api/journal/analyze-voice`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || error.message || 'Request failed');
    }

    return await response.json();
  },
};

// Progress API
export const progressAPI = {
  getProgress: async () => {
    return await apiRequest('/api/progress');
  },
};

// Emotions API
export const emotionsAPI = {
  getWordOfTheDay: async () => {
    return await apiRequest('/api/emotions/word-of-the-day');
  },
};

// Quiz API
export const quizAPI = {
  getQuestions: async () => {
    return await apiRequest('/api/quiz/questions');
  },

  submitAnswers: async (answers) => {
    return await apiRequest('/api/quiz/submit', {
      method: 'POST',
      body: JSON.stringify({ answers }),
    });
  },
};

// Export token management functions
export { getToken, setToken, removeToken };

