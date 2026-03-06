from pydantic_settings import BaseSettings
from typing import Literal


class Settings(BaseSettings):
    APP_NAME: str = "RetailDiscipline ERP"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    SECRET_KEY: str = "change-this-secret-key-in-production-min-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    DATABASE_URL: str = "sqlite+aiosqlite:///./retail_erp.db"

    TRIAL_DURATION_DAYS: int = 14
    TRIAL_MAX_USERS: int = 1
    BASIC_MAX_USERS: int = 3

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()