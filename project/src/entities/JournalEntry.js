/**
 * JournalEntry entity module
 * Provides methods to interact with journal entries
 * Currently uses localStorage, but can be easily switched to API calls
 */

const STORAGE_KEY = 'emolit_journal_entries';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Initialize storage
function initializeStorage() {
  if (!localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  }
}

initializeStorage();

/**
 * Get all journal entries
 * @param {string} sort - Sort order (e.g., '-date' for newest first)
 * @param {number} limit - Maximum number of items to return
 * @returns {Promise<Array>} Array of journal entries
 */
export async function list(sort = '-date', limit = null) {
  try {
    // In production, this would be an API call
    // const response = await fetch(`${API_BASE_URL}/api/journal?sort=${sort}&limit=${limit}`);
    // return await response.json();
    
    const stored = localStorage.getItem(STORAGE_KEY);
    let entries = stored ? JSON.parse(stored) : [];
    
    // Sort entries
    if (sort === '-date') {
      entries.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (sort === 'date') {
      entries.sort((a, b) => new Date(a.date) - new Date(b.date));
    }
    
    // Apply limit
    if (limit && limit > 0) {
      entries = entries.slice(0, limit);
    }
    
    return entries;
  } catch (error) {
    console.error('Error fetching journal entries:', error);
    return [];
  }
}

/**
 * Get a single journal entry by ID
 * @param {number} id - The entry ID
 * @returns {Promise<Object|null>} The journal entry or null
 */
export async function get(id) {
  try {
    const entries = await list();
    return entries.find(entry => entry.id === id) || null;
  } catch (error) {
    console.error('Error fetching journal entry:', error);
    return null;
  }
}

/**
 * Create a new journal entry
 * @param {Object} data - The entry data
 * @returns {Promise<Object>} The created entry
 */
export async function create(data) {
  try {
    // In production, this would be an API call
    // const response = await fetch(`${API_BASE_URL}/api/journal`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(data)
    // });
    // return await response.json();
    
    const entries = await list();
    const newEntry = {
      id: Math.max(...entries.map(e => e.id || 0), 0) + 1,
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    entries.push(newEntry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    return newEntry;
  } catch (error) {
    console.error('Error creating journal entry:', error);
    throw error;
  }
}

/**
 * Update an existing journal entry
 * @param {number} id - The entry ID
 * @param {Object} data - The updated data
 * @returns {Promise<Object>} The updated entry
 */
export async function update(id, data) {
  try {
    // In production, this would be an API call
    // const response = await fetch(`${API_BASE_URL}/api/journal/${id}`, {
    //   method: 'PUT',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(data)
    // });
    // return await response.json();
    
    const entries = await list();
    const index = entries.findIndex(e => e.id === id);
    if (index === -1) {
      throw new Error(`Entry with id ${id} not found`);
    }
    entries[index] = { 
      ...entries[index], 
      ...data,
      updated_at: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    return entries[index];
  } catch (error) {
    console.error('Error updating journal entry:', error);
    throw error;
  }
}

/**
 * Delete a journal entry
 * @param {number} id - The entry ID
 * @returns {Promise<boolean>} Success status
 */
export async function remove(id) {
  try {
    // In production, this would be an API call
    // const response = await fetch(`${API_BASE_URL}/api/journal/${id}`, {
    //   method: 'DELETE'
    // });
    // return response.ok;
    
    const entries = await list();
    const filtered = entries.filter(e => e.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error deleting journal entry:', error);
    throw error;
  }
}

// Export as default object with methods
export default {
  list,
  get,
  create,
  update,
  remove
};

