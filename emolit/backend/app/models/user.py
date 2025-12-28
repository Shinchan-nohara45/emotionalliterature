from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from bson import ObjectId

# ---------- MongoDB ObjectId Helper ----------

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if isinstance(v, ObjectId):
            return v
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")

# ---------- User Persistence Model ----------

class UserModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id")
    email: EmailStr
    password_hash: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    timezone: str = "UTC"
    is_active: bool = True
    subscription_type: str = "free"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

# ---------- Journal Entry Persistence Model ----------

class JournalEntryModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id")
    user_id: PyObjectId
    title: Optional[str] = None
    content: str
    audio_url: Optional[str] = None
    emotion_analysis: Optional[Dict[str, Any]] = None
    detected_emotions: List[str] = Field(default_factory=list)
    mood_score: Optional[int] = None
    risk_level: str = "low"
    sentiment_score: Optional[str] = None
    is_private: bool = True
    word_count: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

# ---------- User Progress Persistence Model ----------

class UserProgressModel(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id")
    user_id: PyObjectId
    current_level: int = 1
    total_xp: int = 0
    current_streak: int = 0
    longest_streak: int = 0
    words_learned: int = 0
    journal_entries_count: int = 0
    quiz_scores: Optional[Dict[str, Any]] = None
    achievements: List[str] = Field(default_factory=list)
    last_activity_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
