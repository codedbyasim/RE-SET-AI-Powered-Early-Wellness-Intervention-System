import os
import urllib.parse
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

# Detect .env location (backend directory or project root)
_CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
_BACKEND_DIR = os.path.dirname(_CURRENT_DIR)
_ROOT_DIR = os.path.dirname(_BACKEND_DIR)

_ENV_FILES = [
    os.path.join(_BACKEND_DIR, ".env"),
    os.path.join(_ROOT_DIR, ".env"),
    ".env"
]

class Settings(BaseSettings):
    # Project Info
    PROJECT_NAME: str = "RE:SET Wellness Engine"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security & Authentication (Loaded from environment)
    SECRET_KEY: str = "reset-wellness-secret-key-hackathon-2026-secure"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database Connection Fields (Loaded from environment)
    DB_USER: Optional[str] = None
    DB_PASSWORD: Optional[str] = None
    DB_HOST: Optional[str] = None
    DB_PORT: str = "6543"
    DB_NAME: str = "postgres"
    
    # Optional direct connection string override
    DATABASE_URL_OVERRIDE: Optional[str] = None
    
    # Fallback SQLite DB path
    SQLITE_URL: str = "sqlite:///./reset_wellness.db"
    
    # AIML API Configuration (Loaded from environment)
    AIML_API_KEY: str = ""
    AIML_API_BASE_URL: str = "https://api.aimlapi.com/v1"
    AIML_MODEL: str = "gpt-4o-mini"
    AIML_FALLBACK_MODEL: str = "gpt-4o"
    
    # CORS Configuration
    FRONTEND_URL: str = "http://localhost:5173"
    ALLOW_ALL_ORIGINS: bool = True

    model_config = SettingsConfigDict(
        env_file=_ENV_FILES,
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def DATABASE_URL(self) -> str:
        # 1. Direct explicit environment variable / override
        direct_url = os.getenv("DATABASE_URL") or self.DATABASE_URL_OVERRIDE
        if direct_url:
            return direct_url
        
        # 2. Build PostgreSQL URL from credentials if provided
        if self.DB_USER and self.DB_PASSWORD and self.DB_HOST:
            encoded_password = urllib.parse.quote_plus(self.DB_PASSWORD)
            return f"postgresql://{self.DB_USER}:{encoded_password}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        
        # 3. Fallback to local SQLite URL if no database credentials provided
        return self.SQLITE_URL

settings = Settings()
