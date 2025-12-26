-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS emolit_db;

-- Use the database
\c emolit_db;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create emotion words table and populate with sample data
CREATE TABLE IF NOT EXISTS emotion_words (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    word VARCHAR(100) UNIQUE NOT NULL,
    definition TEXT NOT NULL,
    example TEXT,
    category VARCHAR(50),
    level INTEGER DEFAULT 1,
    similar_words TEXT[],
    opposite_words TEXT[],
    cultural_context TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample emotion words
INSERT INTO emotion_words (word, definition, example, category, level, similar_words, opposite_words, cultural_context) VALUES
('Serenity', 'The state of being calm, peaceful, and untroubled; a sense of tranquil contentment', 'After weeks of stress, she finally found serenity while walking through the quiet forest.', 'happy', 3, ARRAY['tranquility', 'peacefulness', 'calm', 'composure'], ARRAY['turmoil', 'chaos', 'agitation'], 'Highly valued in many spiritual and philosophical traditions as a goal for emotional well-being'),
('Euphoria', 'A feeling of intense excitement and happiness; an overwhelming sense of well-being', 'The team felt euphoria after winning the championship game.', 'happy', 2, ARRAY['elation', 'ecstasy', 'bliss', 'rapture'], ARRAY['depression', 'despair', 'melancholy'], 'Often associated with peak life experiences and achievements'),
('Melancholy', 'A pensive sadness; a thoughtful or gentle sadness often mixed with longing', 'The old photograph filled her with melancholy for her childhood days.', 'sad', 3, ARRAY['wistfulness', 'sorrow', 'pensiveness'], ARRAY['joy', 'cheerfulness', 'elation'], 'Historically viewed as a temperament in classical philosophy and medicine'),
('Vexed', 'Feeling annoyed, frustrated, or worried, especially about a persistent problem', 'He was vexed by the constant noise from the construction site next door.', 'angry', 2, ARRAY['annoyed', 'frustrated', 'irritated'], ARRAY['pleased', 'satisfied', 'content'], 'Commonly used in literature to describe persistent irritation'),
('Jubilant', 'Feeling or expressing great happiness and triumph', 'The crowd was jubilant after their team scored the winning goal.', 'happy', 2, ARRAY['ecstatic', 'elated', 'exultant'], ARRAY['dejected', 'despondent', 'crestfallen'], 'Often associated with victory and celebration');

-- Create quiz questions table and populate
CREATE TABLE IF NOT EXISTS quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    word VARCHAR(100) NOT NULL,
    question TEXT NOT NULL,
    options JSON NOT NULL,
    correct_answer INTEGER NOT NULL,
    difficulty_level INTEGER DEFAULT 1,
    category VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample quiz questions
INSERT INTO quiz_questions (word, question, options, correct_answer, difficulty_level, category) VALUES
('vexed', 'What does "vexed" mean?', '["Feeling annoyed, frustrated, or worried, especially about a persistent problem", "Arousing pleasure tinged with sadness or pain", "Completely puzzled or confused", "Feeling extremely embarrassed or humiliated"]', 0, 2, 'angry'),
('serenity', 'Which situation best demonstrates serenity?', '["Jumping with excitement after good news", "Feeling calm and peaceful while meditating by a lake", "Being angry about an unfair situation", "Worrying about an upcoming exam"]', 1, 1, 'happy'),
('melancholy', 'What is the best definition of melancholy?', '["Extreme happiness and joy", "A pensive sadness; thoughtful or gentle sadness often mixed with longing", "Intense anger and frustration", "Complete confusion and bewilderment"]', 1, 3, 'sad');
