from fastapi import APIRouter, Depends
from datetime import datetime, timedelta
from app.database import get_database
from app.models.schemas import UserProgressResponse
from app.core.security import get_current_user
import calendar

router = APIRouter()

@router.get("/", response_model=UserProgressResponse)
async def get_progress(
    current_user: dict = Depends(get_current_user),
):
    """Get user's progress statistics"""
    db = await get_database()
    user_id = str(current_user["_id"])
    
    progress = await db.user_progress.find_one({"user_id": user_id})
    
    if not progress:
        # Create default progress if none exists
        progress_data = {
            "user_id": user_id,
            "current_level": 1,
            "total_xp": 0,
            "current_streak": 0,
            "longest_streak": 0,
            "words_learned": 0,
            "journal_entries_count": 0,
            "achievements": [],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        await db.user_progress.insert_one(progress_data)
        progress = progress_data
    
    return UserProgressResponse(
        current_level=progress.get("current_level", 1),
        total_xp=progress.get("total_xp", 0),
        current_streak=progress.get("current_streak", 0),
        longest_streak=progress.get("longest_streak", 0),
        words_learned=progress.get("words_learned", 0),
        journal_entries_count=progress.get("journal_entries_count", 0),
        achievements=progress.get("achievements", [])
    )

@router.get("/stats", response_model=UserProgressResponse)
async def get_progress_stats(
    current_user: dict = Depends(get_current_user),
):
    """Get user's progress statistics (alternative endpoint)"""
    return await get_progress(current_user)

@router.get("/weekly-activity")
async def get_weekly_activity(
    current_user: dict = Depends(get_current_user),
):
    """Get weekly activity data"""
    db = await get_database()
    user_id = str(current_user["_id"])
    
    today = datetime.now()
    week_start = today - timedelta(days=today.weekday())
    
    weekly_data = []
    for i in range(7):
        day = week_start + timedelta(days=i)
        day_str = day.strftime("%Y-%m-%d")
        
        # Check if there are journal entries for this day
        count = await db.journal_entries.count_documents({
            "user_id": user_id,
            "created_at": {
                "$gte": datetime.combine(day.date(), datetime.min.time()),
                "$lt": datetime.combine(day.date(), datetime.max.time())
            }
        })
        
        weekly_data.append({
            "date": day_str,
            "day": calendar.day_name[day.weekday()][:3],
            "active": count > 0
        })
    
    return {
        "weekly_activity": weekly_data,
        "active_days": sum(1 for d in weekly_data if d["active"]),
        "total_days": 7
    }

@router.post("/update-streak")
async def update_streak(
    current_user: dict = Depends(get_current_user),
):
    """Update user's streak"""
    db = await get_database()
    user_id = str(current_user["_id"])
    
    progress = await db.user_progress.find_one({"user_id": user_id})
    
    if progress:
        today = datetime.now().date()
        last_activity = progress.get("last_activity_date")
        
        if not last_activity or last_activity.date() != today:
            new_streak = progress.get("current_streak", 0) + 1
            longest_streak = max(progress.get("longest_streak", 0), new_streak)
            
            await db.user_progress.update_one(
                {"user_id": user_id},
                {
                    "$set": {
                        "current_streak": new_streak,
                        "longest_streak": longest_streak,
                        "last_activity_date": datetime.utcnow(),
                        "updated_at": datetime.utcnow()
                    },
                    "$inc": {"total_xp": 10}
                }
            )
            progress["current_streak"] = new_streak
    
    return {"message": "Streak updated", "current_streak": progress.get("current_streak", 0) if progress else 0}

@router.get("/achievements")
async def get_achievements(
    current_user: dict = Depends(get_current_user),
):
    """Get user achievements"""
    db = await get_database()
    user_id = str(current_user["_id"])
    
    progress = await db.user_progress.find_one({"user_id": user_id})
    
    all_achievements = [
        {
            "id": "first_steps",
            "name": "First Steps",
            "description": "Created your first journal entry",
            "icon": "mountain",
            "unlocked": (progress.get("journal_entries_count", 0) > 0) if progress else False
        },
        {
            "id": "word_explorer",
            "name": "Word Explorer", 
            "description": "Learned 10 emotion words",
            "icon": "book",
            "unlocked": (progress.get("words_learned", 0) >= 10) if progress else False
        },
        {
            "id": "streak_master",
            "name": "Streak Master",
            "description": "Maintained a 7-day streak",
            "icon": "fire",
            "unlocked": (progress.get("longest_streak", 0) >= 7) if progress else False
        },
        {
            "id": "emotion_expert",
            "name": "Emotion Expert",
            "description": "Reached level 5",
            "icon": "trophy",
            "unlocked": (progress.get("current_level", 1) >= 5) if progress else False
        }
    ]
    
    return {
        "achievements": all_achievements,
        "total_unlocked": sum(1 for a in all_achievements if a["unlocked"])
    }
