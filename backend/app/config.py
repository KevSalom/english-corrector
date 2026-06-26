import os
from pydantic_settings import BaseSettings, SettingsConfigDict

def get_default_db_path() -> str:
    # If the standard Docker volume mount directory /data is writable, default to it
    if os.path.exists("/data") and os.access("/data", os.W_OK):
        return "/data/videos.db"
    return "videos.db"

class Settings(BaseSettings):
    openrouter_api_key: str = ""
    openrouter_model: str = ""
    host: str = "127.0.0.1"
    port: int = 8000
    database_path: str = get_default_db_path()

    # Look for .env file in parent directories
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
