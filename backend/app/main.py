from fastapi import FastAPI, HTTPException, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from contextlib import asynccontextmanager
import uvicorn
from app.database import connect_to_mongo, close_mongo_connection
from app.routes import auth, journal, emotions, progress, quiz
from app.core.config import settings
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting EmoLit Backend...")
    await connect_to_mongo()
    yield
    # Shutdown
    await close_mongo_connection()
    logger.info("Shutting down EmoLit Backend...")

app = FastAPI(
    title="EmoLit API",
    description="Emotional Intelligence Platform Backend",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
# Build allowed origins from settings (comma-separated in .env)
allowed_origins = []
if hasattr(settings, "allowed_origins") and settings.allowed_origins:
    # settings.allowed_origins is a comma separated string in env
    allowed_origins = [o.strip() for o in settings.allowed_origins.split(",") if o.strip()]
# Ensure the dev port 5174 used by Vite is allowed
if "http://localhost:5174" not in allowed_origins:
    allowed_origins.append("http://localhost:5174")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(journal.router, prefix="/api/journal", tags=["Journal"])
app.include_router(emotions.router, prefix="/api/emotions", tags=["Emotions"])
app.include_router(progress.router, prefix="/api/progress", tags=["Progress"])
app.include_router(quiz.router, prefix="/api/quiz", tags=["Quiz"])

@app.get("/")
async def root():
    return {"message": "EmoLit API is running", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "emolit-backend"}

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
