from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import uvicorn

from app.core.config import settings
from app.database import connect_to_mongo, close_mongo_connection
from app.routes import api_router

# ---------- Logging Configuration ----------

logger = logging.getLogger("emolit")
logger.setLevel(logging.INFO)

handler = logging.StreamHandler()
formatter = logging.Formatter(
    "[%(asctime)s] [%(levelname)s] %(name)s: %(message)s"
)
handler.setFormatter(formatter)

if not logger.handlers:
    logger.addHandler(handler)

# ---------- Application Lifespan ----------

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting EmoLit backend")
    await connect_to_mongo()
    yield
    await close_mongo_connection()
    logger.info("Shutting down EmoLit backend")

# ---------- FastAPI App ----------

app = FastAPI(
    title="EmoLit API",
    description="Emotional Intelligence Platform Backend",
    version="1.0.0",
    lifespan=lifespan,
)

# ---------- CORS Configuration ----------

allowed_origins = []

if settings.allowed_origins:
    allowed_origins = [
        origin.strip()
        for origin in settings.allowed_origins.split(",")
        if origin.strip()
    ]

# Development fallback only
if settings.environment == "development":
    allowed_origins.extend([
        "http://localhost:5174",
        "http://localhost:3000",
        "http://localhost:8081",  # Expo default
        "exp://localhost:8081",  # Expo
    ])
    
    # Add common local network IPs for Expo Go on physical devices
    # Users should add their specific IP to allowed_origins in .env if needed
    # For now, we'll allow all origins in development (less secure but easier)

# In development, be more permissive with CORS
if settings.environment == "development":
    # Allow all origins in development for easier testing with Expo Go
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Allow all in development
        allow_credentials=False,  # Can't use credentials with wildcard
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    # Production: strict CORS
    if not allowed_origins:
        raise RuntimeError(
            "CORS misconfiguration: no allowed origins set for production"
        )
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# ---------- API Versioning ----------

app.include_router(api_router, prefix="/api/v1")

# ---------- Health Endpoints ----------

@app.get("/")
async def root():
    return {"message": "EmoLit API is running", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "emolit-backend"}


# ---------- Debug Configuration ----------
from app.core.config import settings
print(f"Storage connection string loaded: {settings.azure_storage_connection_string is not None}")

# ---------- Local Dev Entrypoint ----------

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
