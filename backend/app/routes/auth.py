from fastapi import APIRouter, Depends, HTTPException, status
from datetime import timedelta, datetime
from app.database import get_database
from app.models.user import User
from app.models.schemas import UserCreate, UserResponse, Token, UserLogin
from app.core.security import (
    verify_password, 
    get_password_hash, 
    create_access_token,
    get_current_user
)
from app.core.config import settings
from bson import ObjectId

router = APIRouter()

@router.post("/register", response_model=UserResponse)
async def register(user: UserCreate):
    """Register a new user"""
    db = await get_database()
    
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    user_data = {
        "email": user.email,
        "password_hash": hashed_password,
        "full_name": user.full_name,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "is_active": True,
        "subscription_type": "free",
        "timezone": "UTC"
    }
    
    result = await db.users.insert_one(user_data)
    user_id = str(result.inserted_id)
    
    # Create user progress record
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
    
    user_data["id"] = user_id
    return UserResponse(
        id=user_id,
        email=user_data["email"],
        full_name=user_data["full_name"],
        created_at=user_data["created_at"],
        is_active=user_data["is_active"],
        subscription_type=user_data["subscription_type"]
    )

@router.post("/login", response_model=Token)
async def login(user: UserLogin):
    """Login user"""
    db = await get_database()
    db_user = await db.users.find_one({"email": user.email})
    
    if not db_user or not verify_password(user.password, db_user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    if not db_user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": str(db_user["_id"])},
        expires_delta=access_token_expires
    )
    
    return Token(access_token=access_token, token_type="bearer")

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: dict = Depends(get_current_user)):
    """Get current user info"""
    return UserResponse(
        id=str(current_user["_id"]),
        email=current_user["email"],
        full_name=current_user.get("full_name"),
        created_at=current_user.get("created_at", datetime.utcnow()),
        is_active=current_user.get("is_active", True),
        subscription_type=current_user.get("subscription_type", "free")
    )

@router.post("/logout")
async def logout():
    """Logout user (client should remove token)"""
    return {"message": "Successfully logged out"}
