/**
 * UserProgress entity module
 * Provides methods to interact with user progress data
 * Currently uses localStorage, but can be easily switched to API calls
 */

const STORAGE_KEY = 'emolit_user_progress';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Initialize storage with default progress
function initializeStorage() {
  if (!localStorage.getItem(STORAGE_KEY)) {
    const defaultProgress = {
      id: 1,
      words_learned: 0,
      current_streak: 0,
      longest_streak: 0,
      level: 1,
      experience_points: 0,
      badges_earned: [],
      quiz_score: 0,
      daily_goal: 1,
      last_activity_date: null
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([defaultProgress]));
  }
}

initializeStorage();

/**
 * Get all user progress records
 * @param {string} sort - Sort order (usually empty for progress)
 * @param {number} limit - Maximum number of items to return
 * @returns {Promise<Array>} Array of progress records
 */
export async function list(sort = '', limit = null) {
  try {
    // In production, this would be an API call
    // const response = await fetch(`${API_BASE_URL}/api/progress?sort=${sort}&limit=${limit}`);
    // return await response.json();
    
    const stored = localStorage.getItem(STORAGE_KEY);
    let progress = stored ? JSON.parse(stored) : [];
    
    // Apply limit
    if (limit && limit > 0) {
      progress = progress.slice(0, limit);
    }
    
    return progress;
  } catch (error) {
    console.error('Error fetching user progress:', error);
    return [];
  }
}

/**
 * Get a single progress record by ID
 * @param {number} id - The progress ID
 * @returns {Promise<Object|null>} The progress record or null
 */
export async function get(id) {
  try {
    const progress = await list();
    return progress.find(p => p.id === id) || null;
  } catch (error) {
    console.error('Error fetching user progress:', error);
    return null;
  }
}

/**
 * Create a new progress record
 * @param {Object} data - The progress data
 * @returns {Promise<Object>} The created progress record
 */
export async function create(data) {
  try {
    // In production, this would be an API call
    // const response = await fetch(`${API_BASE_URL}/api/progress`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(data)
    // });
    // return await response.json();
    
    const progress = await list();
    const newProgress = {
      id: Math.max(...progress.map(p => p.id || 0), 0) + 1,
      words_learned: 0,
      current_streak: 0,
      longest_streak: 0,
      level: 1,
      experience_points: 0,
      badges_earned: [],
      quiz_score: 0,
      daily_goal: 1,
      last_activity_date: null,
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    progress.push(newProgress);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    return newProgress;
  } catch (error) {
    console.error('Error creating user progress:', error);
    throw error;
  }
}

/**
 * Update an existing progress record
 * @param {number} id - The progress ID
 * @param {Object} data - The updated data
 * @returns {Promise<Object>} The updated progress record
 */
export async function update(id, data) {
  try {
    // In production, this would be an API call
    // const response = await fetch(`${API_BASE_URL}/api/progress/${id}`, {
    //   method: 'PUT',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(data)
    // });
    // return await response.json();
    
    const progress = await list();
    const index = progress.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error(`Progress with id ${id} not found`);
    }
    progress[index] = { 
      ...progress[index], 
      ...data,
      updated_at: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    return progress[index];
  } catch (error) {
    console.error('Error updating user progress:', error);
    throw error;
  }
}

// Export as default object with methods
export default {
  list,
  get,
  create,
  update
};

