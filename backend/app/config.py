from pydantic_settings import BaseSettings
from pydantic import Field

class Settings(BaseSettings):
    DATABASE_URL: str = Field(
        default="postgresql://postgres:postgres@db:5432/inventory",
        validation_alias="DATABASE_URL"
    )
    CORS_ORIGINS: str = Field(
        default="http://localhost:5173,http://localhost:80,http://localhost",
        validation_alias="CORS_ORIGINS"
    )

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
