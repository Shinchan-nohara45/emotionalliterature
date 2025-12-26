from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")

# User Models
class User(BaseModel):
    id: Optional[str] = None
    email: EmailStr
    password_hash: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime = datetime.utcnow()
    updated_at: datetime = datetime.utcnow()
    timezone: str = "UTC"
    is_active: bool = True
    subscription_type: str = "free"

    class Config:
        json_encoders = {ObjectId: str}
        populate_by_name = True

class JournalEntry(BaseModel):
    id: Optional[str] = None
    user_id: str
    title: Optional[str] = None
    content: str
    audio_url: Optional[str] = None
    emotion_analysis: Optional[Dict[str, Any]] = None
    detected_emotions: Optional[List[str]] = []
    mood_score: Optional[int] = None
    risk_level: str = "low"
    created_at: datetime = datetime.utcnow()
    updated_at: datetime = datetime.utcnow()
    is_private: bool = True
    word_count: Optional[int] = None
    sentiment_score: Optional[str] = None

    class Config:
        json_encoders = {ObjectId: str}
        populate_by_name = True

class UserProgress(BaseModel):
    id: Optional[str] = None
    user_id: str
    current_level: int = 1
    total_xp: int = 0
    current_streak: int = 0
    longest_streak: int = 0
    words_learned: int = 0
    journal_entries_count: int = 0
    quiz_scores: Optional[Dict[str, Any]] = None
    achievements: Optional[List[str]] = []
    last_activity_date: Optional[datetime] = None
    created_at: datetime = datetime.utcnow()
    updated_at: datetime = datetime.utcnow()

    class Config:
        json_encoders = {ObjectId: str}
        populate_by_name = True
