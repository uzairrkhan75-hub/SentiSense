import os
import secrets
from datetime import timedelta

from dotenv import load_dotenv

load_dotenv()

FLASK_ENV = os.getenv("FLASK_ENV", "development")

if FLASK_ENV == "production" and not (os.getenv("SECRET_KEY") and os.getenv("JWT_SECRET_KEY")):
    raise RuntimeError(
        "SECRET_KEY and JWT_SECRET_KEY must be set via environment variables in production."
    )


class Config:
    # Random per-process fallback (dev only) so a missing .env fails loudly
    # via invalid tokens rather than silently accepting a known default.
    SECRET_KEY = os.getenv("SECRET_KEY") or secrets.token_hex(32)
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY") or secrets.token_hex(32)
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=7)

    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/sentisense")

    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")

    CORS_ORIGINS = [
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
        if origin.strip()
    ]

    MAX_CONTENT_LENGTH = 10 * 1024 * 1024  # 10 MB upload cap
