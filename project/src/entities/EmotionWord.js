/**
 * EmotionWord entity module
 * Provides methods to interact with emotion words data
 * Currently uses localStorage, but can be easily switched to API calls
 */

const STORAGE_KEY = 'emolit_emotion_words';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Sample emotion words data
const SAMPLE_WORDS = [
  {
    id: 1,
    word: "serendipity",
    definition: "The occurrence and development of events by chance in a happy or beneficial way",
    category: "joy",
    intensity_level: "moderate",
    context_example: "Finding a $20 bill on the street was pure serendipity.",
    synonyms: ["fortune", "luck", "chance"],
    antonyms: ["misfortune", "bad luck"],
    cultural_notes: "This word comes from a Persian fairy tale about three princes of Serendip who made discoveries by accident.",
    difficulty_level: 4
  },
  {
    id: 2,
    word: "melancholy",
    definition: "A feeling of pensive sadness, typically with no obvious cause",
    category: "sadness",
    intensity_level: "moderate",
    context_example: "She felt a sense of melancholy as autumn leaves fell.",
    synonyms: ["sadness", "sorrow", "gloom"],
    antonyms: ["joy", "happiness", "cheer"],
    cultural_notes: "Often associated with artistic and poetic expression.",
    difficulty_level: 3
  },
  {
    id: 3,
    word: "euphoria",
    definition: "A feeling or state of intense excitement and happiness",
    category: "joy",
    intensity_level: "intense",
    context_example: "Winning the championship filled him with euphoria.",
    synonyms: ["elation", "bliss", "rapture"],
    antonyms: ["despair", "misery", "depression"],
    cultural_notes: "Often used to describe extreme happiness or the effects of certain substances.",
    difficulty_level: 2
  },
  {
    id: 4,
    word: "trepidation",
    definition: "A feeling of fear or anxiety about something that may happen",
    category: "fear",
    intensity_level: "moderate",
    context_example: "She approached the interview with trepidation.",
    synonyms: ["fear", "apprehension", "worry"],
    antonyms: ["confidence", "calm", "assurance"],
    cultural_notes: "Often used in formal contexts.",
    difficulty_level: 3
  },
  {
    id: 5,
    word: "ire",
    definition: "Intense anger",
    category: "anger",
    intensity_level: "intense",
    context_example: "His constant interruptions filled her with ire.",
    synonyms: ["anger", "wrath", "fury"],
    antonyms: ["calm", "peace", "serenity"],
    cultural_notes: "A more formal or literary term for anger.",
    difficulty_level: 2
  },
  {
    id: 6,
    word: "contentment",
    definition: "A state of happiness and satisfaction",
    category: "joy",
    intensity_level: "mild",
    context_example: "She found contentment in her simple life.",
    synonyms: ["satisfaction", "peace", "tranquility"],
    antonyms: ["discontent", "dissatisfaction", "unrest"],
    cultural_notes: "Often associated with finding peace in simple pleasures.",
    difficulty_level: 1
  },
  {
    id: 7,
    word: "apprehension",
    definition: "Anxiety or fear that something bad or unpleasant will happen",
    category: "fear",
    intensity_level: "moderate",
    context_example: "He felt apprehension about the upcoming exam.",
    synonyms: ["anxiety", "worry", "unease"],
    antonyms: ["confidence", "calm", "ease"],
    cultural_notes: "Can also mean understanding or comprehension in different contexts.",
    difficulty_level: 2
  },
  {
    id: 8,
    word: "elation",
    definition: "Great happiness and exhilaration",
    category: "joy",
    intensity_level: "intense",
    context_example: "She felt elation when she received the acceptance letter.",
    synonyms: ["euphoria", "joy", "bliss"],
    antonyms: ["depression", "sadness", "despair"],
    cultural_notes: "Often used to describe a sudden surge of happiness.",
    difficulty_level: 2
  },
  {
    id: 9,
    word: "nostalgia",
    definition: "A sentimental longing or wistful affection for the past",
    category: "complex",
    intensity_level: "mild",
    context_example: "The old song filled her with nostalgia for her college days.",
    synonyms: ["reminiscence", "homesickness", "yearning"],
    antonyms: ["anticipation", "forward-looking"],
    cultural_notes: "Often bittersweet, mixing happiness and sadness.",
    difficulty_level: 2
  },
  {
    id: 10,
    word: "gratitude",
    definition: "The quality of being thankful; readiness to show appreciation",
    category: "joy",
    intensity_level: "mild",
    context_example: "She expressed gratitude for her friends' support.",
    synonyms: ["thankfulness", "appreciation", "gratefulness"],
    antonyms: ["ingratitude", "ungratefulness"],
    cultural_notes: "Practicing gratitude is linked to improved mental health.",
    difficulty_level: 1
  }
];

// Initialize storage with sample data if empty
function initializeStorage() {
  if (!localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_WORDS));
  }
}

initializeStorage();

/**
 * Get all emotion words
 * @param {string} sort - Sort order (e.g., '?', '-date', etc.)
 * @param {number} limit - Maximum number of items to return
 * @returns {Promise<Array>} Array of emotion words
 */
export async function list(sort = '?', limit = null) {
  try {
    // In production, this would be an API call
    // const response = await fetch(`${API_BASE_URL}/api/emotions?sort=${sort}&limit=${limit}`);
    // return await response.json();
    
    const stored = localStorage.getItem(STORAGE_KEY);
    let words = stored ? JSON.parse(stored) : SAMPLE_WORDS;
    
    // Shuffle if sort is '?'
    if (sort === '?') {
      words = [...words].sort(() => Math.random() - 0.5);
    }
    
    // Apply limit
    if (limit && limit > 0) {
      words = words.slice(0, limit);
    }
    
    return words;
  } catch (error) {
    console.error('Error fetching emotion words:', error);
    return [];
  }
}

/**
 * Get a single emotion word by ID
 * @param {number} id - The word ID
 * @returns {Promise<Object|null>} The emotion word or null
 */
export async function get(id) {
  try {
    const words = await list();
    return words.find(word => word.id === id) || null;
  } catch (error) {
    console.error('Error fetching emotion word:', error);
    return null;
  }
}

/**
 * Create a new emotion word
 * @param {Object} data - The word data
 * @returns {Promise<Object>} The created word
 */
export async function create(data) {
  try {
    // In production, this would be an API call
    // const response = await fetch(`${API_BASE_URL}/api/emotions`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(data)
    // });
    // return await response.json();
    
    const words = await list();
    const newWord = {
      id: Math.max(...words.map(w => w.id || 0), 0) + 1,
      ...data
    };
    words.push(newWord);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
    return newWord;
  } catch (error) {
    console.error('Error creating emotion word:', error);
    throw error;
  }
}

/**
 * Update an existing emotion word
 * @param {number} id - The word ID
 * @param {Object} data - The updated data
 * @returns {Promise<Object>} The updated word
 */
export async function update(id, data) {
  try {
    // In production, this would be an API call
    // const response = await fetch(`${API_BASE_URL}/api/emotions/${id}`, {
    //   method: 'PUT',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(data)
    // });
    // return await response.json();
    
    const words = await list();
    const index = words.findIndex(w => w.id === id);
    if (index === -1) {
      throw new Error(`Word with id ${id} not found`);
    }
    words[index] = { ...words[index], ...data };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
    return words[index];
  } catch (error) {
    console.error('Error updating emotion word:', error);
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

