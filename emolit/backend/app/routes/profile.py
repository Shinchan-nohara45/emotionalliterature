from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
import logging

from app.database import get_database
from app.core.security import get_current_user
from app.models.schemas import (
    UserProfileCreateUpdate,
    UserProfileResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Profile"])


# =====================================================
# Helper: profile completion logic
# =====================================================

def is_profile_complete(profile: dict) -> bool:
    """
    Minimal, non-invasive definition of completion.
    Can evolve without breaking clients.
    """
    if not profile:
        return False

    required_fields = [
        "age",
        "usage_goal",
        "experience_level",
    ]

    return all(profile.get(field) is not None and profile.get(field) != "" for field in required_fields)


# =====================================================
# GET /api/profile
# =====================================================

@router.get("")
async def get_profile(current_user: dict = Depends(get_current_user)):
    db = await get_database()
    user_id = current_user["_id"]

    profile = await db.user_profiles.find_one(
        {"user_id": user_id},
        {"_id": 0}
    )

    if not profile:
        # Return empty profile instead of 404 for new users
        return {
            "user_id": str(user_id),
            "age": None,
            "gender": None,
            "occupation": None,
            "therapy_status": None,
            "usage_goal": None,
            "experience_level": None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }

    # Ensure user_id is a string, not ObjectId
    if "user_id" in profile:
        profile["user_id"] = str(profile["user_id"])
    else:
        profile["user_id"] = str(user_id)

    return profile


# =====================================================
# PATCH /api/profile
# =====================================================

@router.patch("", response_model=UserProfileResponse)
async def update_profile(
    payload: UserProfileCreateUpdate,
    current_user: dict = Depends(get_current_user),
):
    db = await get_database()
    user_id = current_user["_id"]

    now = datetime.utcnow()

    update_data = {
        k: v for k, v in payload.dict(exclude_unset=True).items()
    }

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided")

    result = await db.user_profiles.update_one(
        {"user_id": user_id},
        {
            "$set": {
                **update_data,
                "updated_at": now,
            },
            "$setOnInsert": {
                "user_id": user_id,
                "created_at": now,
            },
        },
        upsert=True,
    )

    profile = await db.user_profiles.find_one(
        {"user_id": user_id},
        {"_id": 0}
    )

    if not profile:
        raise HTTPException(status_code=500, detail="Profile update failed")

    # Ensure user_id is a string, not ObjectId
    profile["user_id"] = str(user_id)

    return profile
