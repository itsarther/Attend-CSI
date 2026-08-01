import os
from typing import List, Union
from pydantic_settings import BaseSettings
from pydantic import Field, field_validator


class Settings(BaseSettings):
    PROJECT_NAME: str = "Attend | CSI - Event Attendance Management System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Secret keys & Security
    SECRET_KEY: str = Field(default="attend_csi_super_secret_jwt_key_2026_change_in_production")
    PRESENCE_SECRET_SEED: str = Field(default="csi_catt_venue_presence_secret_2026")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    ALGORITHM: str = "HS256"

    # Default Administrator Credentials
    DEFAULT_ADMIN_USERNAME: str = Field(default="admin")
    DEFAULT_ADMIN_PASSWORD: str = Field(default="admin123")
    
    # Token Rotation Settings
    TOKEN_ROTATION_INTERVAL_SECONDS: int = 20
    TOKEN_VALIDITY_WINDOW_STEPS: int = 3  # Allows current step +/- 3 (140 sec total grace window)
    
    # Database
    DATABASE_URL: str = Field(default="sqlite:///./attend_csi.db")
    
    # Frontend URL & CORS
    FRONTEND_URL: str = Field(default="")
    BACKEND_CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000"
    ]

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            origins = [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, str) and v.startswith("["):
            import json
            try:
                origins = json.loads(v)
            except Exception:
                origins = []
        elif isinstance(v, list):
            origins = v
        else:
            origins = []

        # Remove raw '*' if present to avoid CORS credential rejection in browsers
        origins = [o for o in origins if o != "*"]
        return origins

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "allow"


settings = Settings()

