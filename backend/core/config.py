from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    APP_NAME: str = "Habits Tracker"

    @property
    def DATABASE_URL(self) -> str:
        return f"sqlite+aiosqlite:///{BASE_DIR}/habits.db"

    model_config = SettingsConfigDict(env_file=BASE_DIR / ".env")


settings = Settings()