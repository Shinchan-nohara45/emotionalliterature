from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from typing import List, Optional
from datetime import datetime
from app.database import get_database
from app.models.user import JournalEntry
from app.core.security import get_current_user
from app.services.emotion_analyzer import EmotionAnalyzer
from app.services.response_generator import ResponseGenerator
from pydantic import BaseModel
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize services
emotion_analyzer = EmotionAnalyzer()
response_generator = ResponseGenerator()

class JournalEntryCreate(BaseModel):
    title: Optional[str] = None
    content: str
    is_private: bool = True

@router.post("/entries", response_model=dict)
async def create_journal_entry(
    entry: JournalEntryCreate,
    current_user: dict = Depends(get_current_user),
):
    """Create a new journal entry with emotion analysis"""
    try:
        db = await get_database()
        user_id = str(current_user["_id"])
        
        # Analyze emotions
        emotion_analysis = await emotion_analyzer.analyze_text(entry.content)
        
        # Generate AI response
        ai_response = await response_generator.generate_response(entry.content, emotion_analysis)
        
        # Create journal entry
        entry_data = {
            "user_id": user_id,
            "title": entry.title,
            "content": entry.content,
            "emotion_analysis": emotion_analysis,
            "detected_emotions": emotion_analysis.get('wheel_emotions', []),
            "mood_score": emotion_analysis.get('mood_score', 5),
            "risk_level": emotion_analysis.get('risk_level', 'low'),
            "is_private": entry.is_private,
            "word_count": len(entry.content.split()),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = await db.journal_entries.insert_one(entry_data)
        entry_id = str(result.inserted_id)
        
        # Update user progress
        progress = await db.user_progress.find_one({"user_id": user_id})
        if progress:
            await db.user_progress.update_one(
                {"user_id": user_id},
                {
                    "$inc": {
                        "journal_entries_count": 1,
                        "total_xp": 5
                    },
                    "$set": {"updated_at": datetime.utcnow()}
                }
            )
        
        return {
            "id": entry_id,
            "emotion_analysis": emotion_analysis,
            "ai_response": ai_response,
            "created_at": entry_data["created_at"],
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"Error creating journal entry: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create journal entry")

@router.post("/analyze-voice")
async def analyze_voice_entry(
    audio: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """Analyze voice journal entry using Azure Speech Service"""
    try:
        from app.services.azure_speech import AzureSpeechService
        
        # Read audio file
        audio_content = await audio.read()
        
        # Initialize Azure Speech Service
        speech_service = AzureSpeechService()
        
        # Convert speech to text
        transcript = await speech_service.speech_to_text(audio_content)
        
        if not transcript:
            return {
                "transcript": "Could not transcribe audio. Please check Azure Speech configuration.",
                "emotion_analysis": {"mood_score": 5, "emotions": []},
                "status": "transcription_failed"
            }
        
        # Analyze emotions in the transcript
        emotion_analysis = await emotion_analyzer.analyze_text(transcript)
        
        # Generate AI response
        ai_response = await response_generator.generate_response(transcript, emotion_analysis)
        
        return {
            "transcript": transcript,
            "emotion_analysis": emotion_analysis,
            "ai_response": ai_response,
            "status": "success"
        }
        
    except Exception as e:
        logger.error(f"Error analyzing voice: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to analyze voice: {str(e)}")

@router.get("/entries")
async def get_journal_entries(
    skip: int = 0,
    limit: int = 10,
    current_user: dict = Depends(get_current_user),
):
    """Get user's journal entries"""
    db = await get_database()
    user_id = str(current_user["_id"])
    
    entries = await db.journal_entries.find(
        {"user_id": user_id}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(length=limit)
    
    total = await db.journal_entries.count_documents({"user_id": user_id})
    
    return {
        "entries": [
            {
                "id": str(entry["_id"]),
                "title": entry.get("title"),
                "content": entry["content"][:200] + "..." if len(entry["content"]) > 200 else entry["content"],
                "created_at": entry.get("created_at", datetime.utcnow()),
                "mood_score": entry.get("mood_score"),
                "risk_level": entry.get("risk_level", "low"),
                "detected_emotions": entry.get("detected_emotions", [])
            }
            for entry in entries
        ],
        "total": total
    }
