from fastapi import APIRouter, Depends
from datetime import datetime
from typing import List, Dict, Any

from app.database import get_database
from app.core.security import get_current_user
from app.utils.progress_logic import ProgressLogic

router = APIRouter()


@router.get("")
async def get_user_progress(current_user: dict = Depends(get_current_user)):
    db = await get_database()
    user_id = current_user["_id"]

    # ---- Fetch raw progress ----
    progress = await db.user_progress.find_one({"user_id": user_id})

    if not progress:
        return {
            "level": 1,
            "total_xp": 0,
            "progress_percent": 0,
            "current_streak": 0,
            "longest_streak": 0,
            "words_learned": 0,
            "milestones": [],
            "emotional_trends": {},
            "journal_themes": [],
        }

    # ---- Compute level & progress ----
    current_level = ProgressLogic.calculate_level(progress.get("total_xp", 0))
    progress_percent = ProgressLogic.progress_percentage(
        progress.get("total_xp", 0),
        current_level,
    )

    # ---- Fetch recent journal entries for trends ----
    recent_entries = await db.journal_entries.find(
        {"user_id": user_id},
        {
            "detected_emotions": 1,
            "mood_score": 1,
        },
    ).sort("created_at", -1).limit(10).to_list(length=10)

    emotional_trends = ProgressLogic.analyze_emotional_trends(recent_entries)
    journal_themes = ProgressLogic.extract_journal_themes(recent_entries)

    # ---- Milestones (soft achievements) ----
    milestones = ProgressLogic.evaluate_milestones({
        **progress,
        "current_level": current_level,
    })

    return {
        "level": current_level,
        "total_xp": progress.get("total_xp", 0),
        "progress_percent": progress_percent,

        "current_streak": progress.get("current_streak", 0),
        "longest_streak": progress.get("longest_streak", 0),
        "words_learned": progress.get("words_learned", 0),

        "milestones": milestones,

        "emotional_trends": emotional_trends,
        "journal_themes": journal_themes,

        "last_updated": progress.get("updated_at"),
    }
