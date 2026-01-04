from pydantic import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "PhyRISK – AI-Driven Mental Health Risk Intelligence"
    DATABASE_URL: str = "sqlite:///./dev.db"
    JWT_SECRET_KEY: str = "CHANGE_ME"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    class Config:
        env_file = ".env"


settings = Settings()
