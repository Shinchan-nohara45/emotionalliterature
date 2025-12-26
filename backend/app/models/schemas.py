from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: str
    created_at: datetime
    is_active: bool
    subscription_type: str
    
    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: Optional[str] = None

# Journal schemas
class JournalEntryBase(BaseModel):
    title: Optional[str] = None
    content: str
    is_private: bool = True

class JournalEntryCreate(JournalEntryBase):
    pass

class JournalEntryUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    is_private: Optional[bool] = None

class JournalEntryResponse(JournalEntryBase):
    id: str
    user_id: str
    emotion_analysis: Optional[Dict[str, Any]] = None
    detected_emotions: Optional[List[str]] = None
    mood_score: Optional[int] = None
    risk_level: str = "low"
    created_at: datetime
    updated_at: datetime
    word_count: Optional[int] = None
    
    class Config:
        from_attributes = True

# Emotion schemas
class EmotionAnalysisResponse(BaseModel):
    emotions: List[Dict[str, Any]]
    sentiment: List[Dict[str, Any]]
    risk_level: str
    mood_score: int
    wheel_emotions: List[str]
    word_count: int
    detected_crisis_keywords: List[str]

class AIResponse(BaseModel):
    response: str
    response_type: str
    suggestions: List[str]
    risk_level: str

# Progress schemas
class UserProgressResponse(BaseModel):
    current_level: int
    total_xp: int
    current_streak: int
    longest_streak: int
    words_learned: int
    journal_entries_count: int
    achievements: List[str]
    
    class Config:
        from_attributes = True

# Word of the day schema
class EmotionWord(BaseModel):
    word: str
    definition: str
    example: str
    category: str
    level: int
    similar_words: List[str]
    opposite_words: List[str]
    cultural_context: Optional[str] = None

# Quiz schemas
class QuizQuestion(BaseModel):
    id: str
    word: str
    question: str
    options: List[str]
    difficulty_level: int
    category: str

class QuizAnswer(BaseModel):
    question_id: str
    selected_answer: int

class QuizResult(BaseModel):
    score: int
    total_questions: int
    correct_answers: List[str]
    incorrect_answers: List[str]
    xp_earned: int
