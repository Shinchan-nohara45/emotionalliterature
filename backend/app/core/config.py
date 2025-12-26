from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    # Database
    database_url: str = "mongodb://localhost:27017"
    database_name: str = "emolit_db"
    
    # Redis
    redis_url: str = "redis://localhost:6379"
    
    # JWT
    secret_key: str = "your-secret-key-change-this-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # OpenRouter (for Claude/AI responses)
    openrouter_api_key: Optional[str] = None
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    
    # Azure AI Services
    azure_speech_key: Optional[str] = None
    azure_speech_region: Optional[str] = None
    azure_translator_key: Optional[str] = None
    azure_translator_region: Optional[str] = None
    
    # AWS (for file storage)
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None
    s3_bucket: str = "emolit-storage"
    
    # Environment
    environment: str = "development"
    debug: bool = True
    # Logging and CORS
    log_level: str = "INFO"
    allowed_origins: str = "http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

settings = Settings()
