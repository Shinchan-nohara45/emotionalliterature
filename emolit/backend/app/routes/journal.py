from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from typing import Optional
from datetime import datetime
from bson import ObjectId
import logging
import base64

from app.database import get_database
from app.core.security import get_current_user
from app.services.emotion_analyzer import EmotionAnalyzer
from app.services.response_generator import ResponseGenerator
from app.services.azure_speech import AzureSpeechService, AzureTranslatorService
from app.models.schemas import JournalEntryCreate

logger = logging.getLogger(__name__)
router = APIRouter()

emotion_analyzer = EmotionAnalyzer()
response_generator = ResponseGenerator()
speech_service = AzureSpeechService()
translator_service = AzureTranslatorService()

# ---------- CREATE JOURNAL ENTRY (WRITING) ----------

@router.post("/entries", response_model=dict)
async def create_journal_entry(
    entry: JournalEntryCreate,
    current_user: dict = Depends(get_current_user),
):
    try:
        db = await get_database()
        user_id = current_user["_id"]  # ObjectId (aligned with users.py)

        # Fetch user profile context (optional)
        user_profile = await db.user_profiles.find_one(
            {"user_id": user_id},
            {"_id": 0}
        )

        # Analyze emotions
        emotion_analysis = await emotion_analyzer.analyze_text(
            entry.content,
            user_context=user_profile
        )

        # Fetch recent journal emotion history (light pattern context)
        recent_entries = await db.journal_entries.find(
            {"user_id": user_id},
            {"emotion_analysis": 1}
        ).sort("created_at", -1).limit(5).to_list(length=5)

        # Generate AI response (context-aware, non-judgmental)
        ai_response = await response_generator.generate_response(
            text=entry.content,
            emotion_analysis=emotion_analysis,
            user_context=user_profile,
            recent_emotions=recent_entries
        )

        # Create journal entry document
        entry_data = {
            "user_id": user_id,
            "title": entry.title,
            "content": entry.content,
            "emotion_analysis": emotion_analysis,
            "detected_emotions": emotion_analysis.get("wheel_emotions", []),
            "mood_score": emotion_analysis.get("mood_score"),
            "risk_level": emotion_analysis.get("risk_level", "low"),
            "is_private": entry.is_private,
            "word_count": len(entry.content.split()),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }

        result = await db.journal_entries.insert_one(entry_data)

        # Update user progress (aligned)
        await db.user_progress.update_one(
            {"user_id": user_id},
            {
                "$inc": {
                    "journal_entries_count": 1,
                    "total_xp": 50
                },
                "$set": {"updated_at": datetime.utcnow()}
            }
        )

        return {
            "id": str(result.inserted_id),
            "created_at": entry_data["created_at"],
            "status": "success",

            # Presentation-safe reflection
            "reflection": {
                "text": ai_response.get("response"),
                "suggestions": ai_response.get("suggestions", []),
                "tone": ai_response.get("response_type", "supportive"),
            },
            # Keep internal data for analytics / future use
            "emotion_analysis": emotion_analysis,
        }


    except Exception as e:
        logger.error(f"Journal entry error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create journal entry")

# ---------- GET JOURNAL ENTRIES ----------

@router.get("/entries")
async def get_journal_entries(
    skip: int = 0,
    limit: int = 10,
    current_user: dict = Depends(get_current_user),
):
    db = await get_database()
    user_id = current_user["_id"]

    entries = await db.journal_entries.find(
        {"user_id": user_id}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(length=limit)

    total = await db.journal_entries.count_documents({"user_id": user_id})

    return {
        "entries": [
            {
                "id": str(entry["_id"]),
                "title": entry.get("title"),
                "content": (
                    entry["content"][:200] + "..."
                    if len(entry["content"]) > 200
                    else entry["content"]
                ),
                "created_at": entry.get("created_at"),
                "mood_score": entry.get("mood_score"),
                "risk_level": entry.get("risk_level", "low"),
                "detected_emotions": entry.get("detected_emotions", []),
            }
            for entry in entries
        ],
        "total": total
    }
