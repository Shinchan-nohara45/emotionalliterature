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

    df = pd.read_excel(EXCEL_PATH)
    docs = []

    for _, row in df.iterrows():
        docs.append({
            "word": row["word"],
            "definition": row["definition"],
            "example": row["example"],
            "category": row["category"],
            "level": int(row["level"]),
            "similar_words": [w.strip() for w in str(row["similar_words"]).split(",")],
            "opposite_words": [w.strip() for w in str(row["opposite_words"]).split(",")],
            "cultural_context": row.get("cultural_context"),
            "used": False,
            "created_at": datetime.utcnow()
        })

    await db.emotion_words.insert_many(docs)

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
    db = await get_database()
    await load_emotion_words_once(db)

    today = datetime.utcnow().strftime("%Y-%m-%d")
    user_id = current_user["_id"]

    daily_entry = await db.daily_words.find_one({"date": today})

    if not daily_entry:
        word_doc = await db.emotion_words.find_one({"used": False})
        if not word_doc:
            raise HTTPException(500, "No unused emotion words available")

        await db.emotion_words.update_one(
            {"_id": word_doc["_id"]},
            {"$set": {"used": True}}
        )

        word_data = {
            "word": word_doc["word"],
            "definition": word_doc["definition"],
            "example": word_doc["example"],
            "category": word_doc["category"],
            "level": word_doc["level"],
            "similar_words": word_doc["similar_words"],
            "opposite_words": word_doc["opposite_words"],
            "cultural_context": word_doc.get("cultural_context"),
        }

        await db.daily_words.insert_one({
            "date": today,
            "word_data": word_data,
            "created_at": datetime.utcnow()
        })
    else:
        word_data = daily_entry["word_data"]

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
