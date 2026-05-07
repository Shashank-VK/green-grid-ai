from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = BASE_DIR / ".env"
load_dotenv(ENV_FILE)


def _default_database_url() -> str:
  db_path = (BASE_DIR / "data" / "ev_grid.db").resolve()
  return f"sqlite+aiosqlite:///{db_path.as_posix()}"


def _database_url() -> str:
  raw_url = os.getenv("DATABASE_URL", _default_database_url())
  if raw_url.startswith("sqlite:///"):
    return raw_url.replace("sqlite:///", "sqlite+aiosqlite:///", 1)
  return raw_url


@dataclass(frozen=True)
class Settings:
  app_name: str
  app_version: str
  database_url: str
  google_maps_api_key: str
  openrouter_api_key: str
  ollama_host: str
  ollama_model: str
  vision_batch_size: int
  vision_timeout: int
  frontend_origin: str


settings = Settings(
  app_name="greengrid API",
  app_version="1.0.0",
  database_url=_database_url(),
  google_maps_api_key=os.getenv("GOOGLE_MAPS_API_KEY", ""),
  openrouter_api_key=os.getenv("OPENROUTER_API_KEY", ""),
  ollama_host=os.getenv("OLLAMA_HOST", "http://localhost:11434"),
  ollama_model=os.getenv("OLLAMA_MODEL", "gemma4:e4b"),
  vision_batch_size=int(os.getenv("VISION_BATCH_SIZE", "9")),
  vision_timeout=int(os.getenv("VISION_TIMEOUT", "120")),
  frontend_origin=os.getenv("FRONTEND_ORIGIN", "http://localhost:3000"),
)
