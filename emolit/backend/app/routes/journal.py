from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from typing import Optional
from datetime import datetime
from bson import ObjectId
import logging
import base64
import pytz

from app.database import get_database
from app.core.security import get_current_user
from app.services.emotion_analyzer import EmotionAnalyzer
from app.services.response_generator import ResponseGenerator
from app.services.azure_speech import AzureSpeechService, AzureTranslatorService, AzureBlobStorageService
from app.models.schemas import JournalEntryCreate

logger = logging.getLogger(__name__)
router = APIRouter()

emotion_analyzer = EmotionAnalyzer()
response_generator = ResponseGenerator()
speech_service = AzureSpeechService()
translator_service = AzureTranslatorService()
blob_storage_service = AzureBlobStorageService()

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
            "ai_response": {
                "text": ai_response.get("response"),
                "suggestions": ai_response.get("suggestions", []),
                "tone": ai_response.get("response_type", "supportive"),
            },
            # Use IST timezone, store as UTC in MongoDB
            "created_at": datetime.now(pytz.timezone('Asia/Kolkata')).astimezone(pytz.UTC),
            "updated_at": datetime.now(pytz.timezone('Asia/Kolkata')).astimezone(pytz.UTC),
        }

        result = await db.journal_entries.insert_one(entry_data)

        # Update user progress with daily XP limit (max 50XP per day)
        # Use IST timezone
        ist = pytz.timezone('Asia/Kolkata')
        now_ist = datetime.now(ist)
        today = now_ist.date()
        today_start = datetime.combine(today, datetime.min.time())
        today_start = ist.localize(today_start)
        
        # Count today's journal entries (convert IST to UTC for MongoDB query)
        today_start_utc = today_start.astimezone(pytz.UTC)
        today_end_utc = ist.localize(datetime.combine(today, datetime.max.time())).astimezone(pytz.UTC)
        
        today_entries = await db.journal_entries.count_documents({
            "user_id": user_id,
            "created_at": {
                "$gte": today_start_utc,
                "$lte": today_end_utc
            }
        })
        
        # Calculate XP: first entry gets 50XP, subsequent entries get 0XP (max 50XP/day)
        xp_to_add = 50 if today_entries == 1 else 0
        
        await db.user_progress.update_one(
            {"user_id": user_id},
            {
                "$inc": {
                    "journal_entries_count": 1,
                    "total_xp": xp_to_add
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

# ---------- GET SINGLE JOURNAL ENTRY ----------

@router.get("/entries/{entry_id}")
async def get_journal_entry(
    entry_id: str,
    current_user: dict = Depends(get_current_user),
):
    db = await get_database()
    user_id = current_user["_id"]

    try:
        entry = await db.journal_entries.find_one({
            "_id": ObjectId(entry_id),
            "user_id": user_id
        })
    except:
        raise HTTPException(status_code=404, detail="Journal entry not found")

    if not entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")

    # Get AI response if stored separately, or reconstruct from emotion_analysis
    # For now, we'll return the full entry with emotion analysis
    return {
        "id": str(entry["_id"]),
        "title": entry.get("title"),
        "content": entry.get("content"),
        "created_at": entry.get("created_at"),
        "mood_score": entry.get("mood_score"),
        "risk_level": entry.get("risk_level", "low"),
        "detected_emotions": entry.get("detected_emotions", []),
        "emotion_analysis": entry.get("emotion_analysis"),
        "ai_response": entry.get("ai_response", {
            "text": "",
            "suggestions": [],
            "tone": "supportive"
        }),
    }

# ---------- ANALYZE VOICE ENTRY ----------

@router.post("/analyze-voice")
async def analyze_voice_entry(
    audio: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """
    Complete voice entry workflow:
    1. User speaks → React Native records audio
    2. Upload to Azure Blob Storage (required)
    3. Azure Speech Service transcribes audio to text
    4. FastAPI receives text → AI Model processes emotions
    5. Generate AI response and create journal entry
    6. Return response back to user
    """
    try:
        db = await get_database()
        user_id = current_user["_id"]
        
        # Read audio file from request
        audio_content = await audio.read()
        
        if not audio_content or len(audio_content) == 0:
            raise HTTPException(status_code=400, detail="Audio file is empty")
        
        # Step 1: Upload to Azure Blob Storage
        file_extension = audio.filename.split('.')[-1] if audio.filename else "m4a"
        try:
            blob_info = await blob_storage_service.upload_audio(
                audio_content,
                file_extension=file_extension,
                metadata={
                    "user_id": str(user_id),
                    "uploaded_at": datetime.utcnow().isoformat()
                }
            )
        except Exception as e:
            logger.error(f"Blob storage upload failed: {str(e)}")
            raise HTTPException(
                status_code=500, 
                detail=f"Failed to upload audio to Azure Blob Storage: {str(e)}. Please ensure AZURE_STORAGE_CONNECTION_STRING is configured."
            )
        
        if not blob_info:
            raise HTTPException(
                status_code=500, 
                detail="Failed to upload audio to storage. Blob storage returned no information."
            )
        
        # Step 2: Convert speech to text using Azure Speech Service
        logger.info(f"Transcribing audio for user {user_id}...")
        # Determine audio format from file extension
        audio_format_map = {
            "m4a": "audio/mp4",
            "mp3": "audio/mpeg",
            "wav": "audio/wav",
            "ogg": "audio/ogg"
        }
        content_type = audio_format_map.get(file_extension.lower(), "audio/wav")
        
        try:
            transcript = await speech_service.speech_to_text(audio_content, audio_format=content_type)
        except Exception as e:
            logger.error(f"Speech-to-text failed: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to transcribe audio: {str(e)}. Please ensure Azure Speech Service is properly configured."
            )
        
        if not transcript or transcript == "":
            raise HTTPException(
                status_code=400, 
                detail="Could not transcribe audio. Please ensure Azure Speech Service is configured (AZURE_SPEECH_KEY and AZURE_SPEECH_REGION in .env file)."
            )
        
        logger.info(f"Transcription successful: {len(transcript)} characters")
        
        # Step 3: Fetch user profile context for personalized analysis
        user_profile = await db.user_profiles.find_one(
            {"user_id": user_id},
            {"_id": 0}
        )
        
        # Step 4: Analyze emotions from transcript
        logger.info("Analyzing emotions from transcript...")
        emotion_analysis = await emotion_analyzer.analyze_text(
            transcript,
            user_context=user_profile
        )
        
        # Fetch recent journal emotion history for context
        recent_entries = await db.journal_entries.find(
            {"user_id": user_id},
            {"emotion_analysis": 1}
        ).sort("created_at", -1).limit(5).to_list(length=5)
        
        # Step 5: Generate AI response using emotion analysis
        logger.info("Generating AI response...")
        ai_response = await response_generator.generate_response(
            text=transcript,
            emotion_analysis=emotion_analysis,
            user_context=user_profile,
            recent_emotions=recent_entries
        )
        
        # Step 6: Create journal entry document with all processed data
        ist = pytz.timezone('Asia/Kolkata')
        entry_data = {
            "user_id": user_id,
            "title": "Voice Entry",
            "content": transcript,
            "emotion_analysis": emotion_analysis,
            "detected_emotions": emotion_analysis.get("wheel_emotions", []),
            "mood_score": emotion_analysis.get("mood_score"),
            "risk_level": emotion_analysis.get("risk_level", "low"),
            "is_private": True,
            "word_count": len(transcript.split()),
            "audio_url": blob_info.get("blob_url"),
            "audio_blob_name": blob_info.get("blob_name"),
            "ai_response": {
                "text": ai_response.get("response"),
                "suggestions": ai_response.get("suggestions", []),
                "tone": ai_response.get("response_type", "supportive"),
            },
            "created_at": datetime.now(ist).astimezone(pytz.UTC),
            "updated_at": datetime.now(ist).astimezone(pytz.UTC),
        }
        
        result = await db.journal_entries.insert_one(entry_data)
        
        # Update user progress (same logic as written entries)
        now_ist = datetime.now(ist)
        today = now_ist.date()
        today_start = datetime.combine(today, datetime.min.time())
        today_start = ist.localize(today_start)
        today_start_utc = today_start.astimezone(pytz.UTC)
        today_end_utc = ist.localize(datetime.combine(today, datetime.max.time())).astimezone(pytz.UTC)
        
        today_entries = await db.journal_entries.count_documents({
            "user_id": user_id,
            "created_at": {
                "$gte": today_start_utc,
                "$lte": today_end_utc
            }
        })
        
        xp_to_add = 50 if today_entries == 1 else 0
        
        await db.user_progress.update_one(
            {"user_id": user_id},
            {
                "$inc": {
                    "journal_entries_count": 1,
                    "total_xp": xp_to_add
                },
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        
        # Step 7: Return complete response back to user
        logger.info(f"Voice entry created successfully for user {user_id}, entry ID: {result.inserted_id}")
        return {
            "id": str(result.inserted_id),
            "created_at": entry_data["created_at"],
            "status": "success",
            "transcript": transcript,
            "audio_url": blob_info.get("blob_url"),
            "reflection": {
                "text": ai_response.get("response"),
                "suggestions": ai_response.get("suggestions", []),
                "tone": ai_response.get("response_type", "supportive"),
            },
            "emotion_analysis": emotion_analysis,
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Voice analysis error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to analyze voice entry: {str(e)}"
        )
