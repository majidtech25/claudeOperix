from pydantic_settings import BaseSettings
from typing import Literal


class Settings(BaseSettings):
    APP_NAME: str = "Operix ERP"
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
    PRO_MAX_USERS: int = 999

    # ── M-Pesa Daraja ─────────────────────────────────────────
    MPESA_CONSUMER_KEY: str = ""
    MPESA_CONSUMER_SECRET: str = ""
    MPESA_SHORTCODE: str = "174379"
    MPESA_PASSKEY: str = "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919"
    MPESA_CALLBACK_URL: str = "https://placeholder.ngrok-free.app/api/v1/billing/mpesa/callback"
    MPESA_ENV: Literal["sandbox", "production"] = "sandbox"

    # ── Stripe ────────────────────────────────────────────────
    STRIPE_SECRET_KEY: str = ""
    STRIPE_PUBLISHABLE_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = "whsec_placeholder"
    STRIPE_SUCCESS_URL: str = "http://localhost:5173/billing/success"
    STRIPE_CANCEL_URL: str = "http://localhost:5173/billing/cancel"

    # ── Pricing (KES) ─────────────────────────────────────────
    PLAN_BASIC_PRICE_KES: int = 2500
    PLAN_PRO_PRICE_KES: int = 6500

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()