from fastapi import APIRouter

from app.routes import auth, journal, quiz, progress, profile

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(journal.router, prefix="/journal", tags=["journal"])
api_router.include_router(quiz.router, prefix="/quiz", tags=["quiz"])
api_router.include_router(progress.router, prefix="/progress", tags=["progress"])
api_router.include_router(profile.router, prefix="/profile", tags=["profile"])
