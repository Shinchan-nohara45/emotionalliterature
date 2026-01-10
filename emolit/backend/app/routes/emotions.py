from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from datetime import datetime
import pandas as pd

from app.database import get_database
from app.services.emotion_analyzer import EmotionAnalyzer
from app.models.schemas import EmotionWord
from app.core.security import get_current_user

router = APIRouter()
emotion_analyzer = EmotionAnalyzer()

EXCEL_PATH = "C:\\Users\\asifs\\Downloads\\Emo-Lit\\emolit\\backend\\app\\wordsheet\\Emotions vocabulary.xlsx"
DAILY_WORD_XP = 10

# ---------- Request Model ----------

class TextAnalysisRequest(BaseModel):
    text: str

# ---------- Load Vocabulary Once ----------

async def load_emotion_words_once(db):
    if await db.emotion_words.count_documents({}) > 0:
        return

    try:
        import os
        if not os.path.exists(EXCEL_PATH):
            # If Excel file doesn't exist, create some default words
            default_words = [
                {
                    "word": "serenity",
                    "definition": "The state of being calm, peaceful, and untroubled",
                    "example": "She found serenity in the quiet morning hours",
                    "category": "positive",
                    "level": 1,
                    "similar_words": ["calm", "peace", "tranquility"],
                    "opposite_words": ["anxiety", "chaos"],
                    "cultural_context": None,
                    "used": False,
                    "created_at": datetime.utcnow()
                },
                {
                    "word": "melancholy",
                    "definition": "A feeling of pensive sadness, typically with no obvious cause",
                    "example": "A deep melancholy settled over him",
                    "category": "negative",
                    "level": 1,
                    "similar_words": ["sadness", "sorrow", "gloom"],
                    "opposite_words": ["joy", "happiness"],
                    "cultural_context": None,
                    "used": False,
                    "created_at": datetime.utcnow()
                },
            ]
            await db.emotion_words.insert_many(default_words)
            return

        df = pd.read_excel(EXCEL_PATH)
        docs = []

        for _, row in df.iterrows():
            # Handle missing or NaN values
            similar_words_str = str(row.get("similar_words", "")).strip()
            opposite_words_str = str(row.get("opposite_words", "")).strip()
            
            similar_words = [w.strip() for w in similar_words_str.split(",") if w.strip()] if similar_words_str and similar_words_str != "nan" else []
            opposite_words = [w.strip() for w in opposite_words_str.split(",") if w.strip()] if opposite_words_str and opposite_words_str != "nan" else []
            
            docs.append({
                "word": str(row.get("word", "")).strip(),
                "definition": str(row.get("definition", "")).strip(),
                "example": str(row.get("example", "")).strip(),
                "category": str(row.get("category", "")).strip(),
                "level": int(row.get("level", 1)),
                "similar_words": similar_words,
                "opposite_words": opposite_words,
                "cultural_context": str(row.get("cultural_context", "")).strip() if pd.notna(row.get("cultural_context")) else None,
                "created_at": datetime.utcnow()
            })

        await db.emotion_words.insert_many(docs)
    except Exception as e:
        # If loading fails, create default words
        default_words = [
            {
                "word": "serenity",
                "definition": "The state of being calm, peaceful, and untroubled",
                "example": "She found serenity in the quiet morning hours",
                "category": "positive",
                "level": 1,
                "similar_words": ["calm", "peace", "tranquility"],
                "opposite_words": ["anxiety", "chaos"],
                "cultural_context": None,
                "used": False,
                "created_at": datetime.utcnow()
            },
        ]
        await db.emotion_words.insert_many(default_words)

# ---------- Analyze Text (Profile-aware) ----------

@router.post("/analyze-text")
async def analyze_text_emotions(
    request: TextAnalysisRequest,
    current_user: dict = Depends(get_current_user)
):
    db = await get_database()

    # Fetch user profile context if available
    user_profile = await db.user_profiles.find_one(
        {"user_id": current_user["_id"]},
        {"_id": 0}
    )

    analysis = await emotion_analyzer.analyze_text(
        text=request.text,
        user_context=user_profile  # may be None, analyzer must handle
    )

    return {
        "success": True,
        "analysis": analysis
    }

# ---------- Word of the Day (XP + Profile-neutral) ----------

@router.get("/word-of-the-day", response_model=EmotionWord)
async def get_word_of_the_day(
    current_user: dict = Depends(get_current_user)
):
    import random
    
    db = await get_database()
    await load_emotion_words_once(db)

    today = datetime.utcnow().strftime("%Y-%m-%d")
    user_id = current_user["_id"]

    # Check if there's already a word for today
    daily_entry = await db.daily_words.find_one({"date": today})

    if not daily_entry:
        # Get all emotion words (don't filter by "used" - select random word)
        all_words = await db.emotion_words.find({}).to_list(length=1000)
        
        if not all_words:
            raise HTTPException(500, "No emotion words available. Please ensure Emotions vocabulary.xlsx is loaded.")

        # Select a random word for today
        word_doc = random.choice(all_words)

        word_data = {
            "word": word_doc["word"],
            "definition": word_doc["definition"],
            "example": word_doc["example"],
            "category": word_doc["category"],
            "level": word_doc["level"],
            "similar_words": word_doc.get("similar_words", []),
            "opposite_words": word_doc.get("opposite_words", []),
            "cultural_context": word_doc.get("cultural_context"),
        }

        # Store today's word
        await db.daily_words.insert_one({
            "date": today,
            "word_data": word_data,
            "created_at": datetime.utcnow()
        })
    else:
        word_data = daily_entry["word_data"]

    # Track if user has learned today's word (for XP)
    already_learned = await db.user_daily_words.find_one({
        "user_id": user_id,
        "date": today
    })

    if not already_learned:
        await db.user_daily_words.insert_one({
            "user_id": user_id,
            "date": today,
            "word": word_data["word"]
        })

        await db.user_progress.update_one(
            {"user_id": user_id},
            {
                "$inc": {
                    "words_learned": 1,
                    "total_xp": DAILY_WORD_XP
                },
                "$set": {
                    "last_activity_date": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
            }
        )

    return EmotionWord(**word_data)

# ---------- Emotion Wheel ----------

@router.get("/wheel")
async def get_emotion_wheel():
    return {
        "categories": {
            "happy": ["joy", "serenity", "love", "optimism"],
            "sad": ["sadness", "melancholy", "grief"],
            "angry": ["anger", "rage", "irritation"],
            "fearful": ["fear", "anxiety"],
            "anticipation": ["hope", "excitement"]
        }
    }
