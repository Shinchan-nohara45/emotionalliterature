from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    database_url: str
    database_name: str

    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    redis_url: Optional[str] = None

    azure_speech_key: Optional[str] = None
    azure_speech_region: Optional[str] = None
    azure_translator_key: Optional[str] = None
    azure_translator_region: Optional[str] = None

    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None
    s3_bucket: Optional[str] = None

    allowed_origins: Optional[str] = None
    
    # OpenRouter API for AI responses
    openrouter_api_key: Optional[str] = None
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    
    environment: str = "development"

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
