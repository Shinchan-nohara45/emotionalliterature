from fastapi import APIRouter, Depends, HTTPException, status
from datetime import timedelta, datetime
from bson import ObjectId
import pytz

from app.database import get_database
from app.models.schemas import UserCreate, UserResponse, Token, UserLogin
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_user,
)
from app.core.config import settings

router = APIRouter()

# --------------------------------------------------
# Helper: profile completeness check
# --------------------------------------------------
from typing import Optional, Dict

def is_profile_complete(profile: Optional[Dict]) -> bool:
    if not profile:
        return False

    required_fields = [
        "age",
        "usage_goal",
        "experience_level",
    ]

    return all(profile.get(field) is not None and profile.get(field) != "" for field in required_fields)

# --------------------------------------------------
# REGISTER
# --------------------------------------------------

@router.post("/register", response_model=UserResponse)
async def register(user: UserCreate):
    db = await get_database()

    # Check existing user
    if await db.users.find_one({"email": user.email}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    now = datetime.utcnow()
    hashed_password = get_password_hash(user.password)

    user_doc = {
        "email": user.email,
        "password_hash": hashed_password,
        "full_name": user.full_name,
        "timezone": "UTC",
        "is_active": True,
        "subscription_type": "free",
        "created_at": now,
        "updated_at": now,
    }

    result = await db.users.insert_one(user_doc)
    user_id = result.inserted_id

    # Create user progress document
    await db.user_progress.insert_one({
        "user_id": user_id,
        "current_level": 1,
        "total_xp": 0,
        "current_streak": 0,
        "longest_streak": 0,
        "words_learned": 0,
        "journal_entries_count": 0,
        "achievements": [],
        "last_activity_date": None,
        "created_at": now,
        "updated_at": now,
    })

    return UserResponse(
        id=str(user_id),
        email=user.email,
        full_name=user.full_name,
        created_at=now,
        is_active=True,
        subscription_type="free",
    )

# --------------------------------------------------
# LOGIN
# --------------------------------------------------

@router.post("/login", response_model=Token)
async def login(user: UserLogin):
    db = await get_database()

    db_user = await db.users.find_one({"email": user.email})
    if not db_user or not verify_password(user.password, db_user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    if not db_user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user",
        )

    user_id = db_user["_id"]
    # Use IST timezone
    ist = pytz.timezone('Asia/Kolkata')
    now = datetime.now(ist)

    access_token = create_access_token(
        data={"sub": str(user_id)},
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes),
    )

    # Update streak safely
    try:
        progress = await db.user_progress.find_one({"user_id": user_id})
        if progress:
            last_activity = progress.get("last_activity_date")

            if last_activity:
                # Convert last_activity to IST for comparison
                if isinstance(last_activity, datetime):
                    if last_activity.tzinfo is None:
                        last_activity = pytz.UTC.localize(last_activity)
                    last_activity_ist = last_activity.astimezone(ist)
                    now_ist_date = now.date()
                    last_activity_ist_date = last_activity_ist.date()
                    diff = (now_ist_date - last_activity_ist_date).days
                else:
                    diff = (now.date() - last_activity.date()).days
                if diff == 1:
                    # Increment streak and update longest if needed
                    progress_doc = await db.user_progress.find_one({"user_id": user_id})
                    new_streak = (progress_doc.get("current_streak", 0) or 0) + 1
                    longest_streak = progress_doc.get("longest_streak", 0) or 0
                    
                    update_data = {
                        "$inc": {"current_streak": 1},
                        "$set": {"last_activity_date": now.astimezone(pytz.UTC), "updated_at": now.astimezone(pytz.UTC)}
                    }
                    
                    if new_streak > longest_streak:
                        update_data["$set"]["longest_streak"] = new_streak
                    
                    await db.user_progress.update_one(
                        {"user_id": user_id},
                        update_data
                    )
                elif diff > 1:
                    await db.user_progress.update_one(
                        {"user_id": user_id},
                        {"$set": {"current_streak": 1,
                                  "last_activity_date": now.astimezone(pytz.UTC),
                                  "updated_at": now.astimezone(pytz.UTC)}}
                    )
                else:
                    await db.user_progress.update_one(
                        {"user_id": user_id},
                        {"$set": {"last_activity_date": now.astimezone(pytz.UTC),
                                  "updated_at": now.astimezone(pytz.UTC)}}
                    )
            else:
                await db.user_progress.update_one(
                    {"user_id": user_id},
                    {"$set": {"current_streak": 1,
                              "last_activity_date": now.astimezone(pytz.UTC),
                              "updated_at": now.astimezone(pytz.UTC)}}
                )
    except Exception:
        pass  # Login must not fail due to streak issues

    return Token(access_token=access_token, token_type="bearer")

# --------------------------------------------------
# CURRENT USER (FULLY EXTENDED)
# --------------------------------------------------

@router.get("/me")
async def read_users_me(current_user: dict = Depends(get_current_user)):
    db = await get_database()

    profile = await db.user_profiles.find_one(
        {"user_id": current_user["_id"]},
        {"_id": 0}
    )

    # Convert profile to dict and ensure all ObjectIds are strings
    profile_dict = None
    if profile:
        profile_dict = {}
        for key, value in profile.items():
            # Convert ObjectId to string
            if isinstance(value, ObjectId):
                profile_dict[key] = str(value)
            else:
                profile_dict[key] = value

    return {
        "id": str(current_user["_id"]),
        "email": current_user["email"],
        "full_name": current_user.get("full_name"),
        "created_at": current_user.get("created_at"),
        "is_active": current_user.get("is_active", True),
        "subscription_type": current_user.get("subscription_type", "free"),

        "profile": profile_dict,
        "profile_completed": is_profile_complete(profile_dict),
    }

# --------------------------------------------------
# LOGOUT
# --------------------------------------------------

@router.post("/logout")
async def logout():
    return {"message": "Successfully logged out"}
