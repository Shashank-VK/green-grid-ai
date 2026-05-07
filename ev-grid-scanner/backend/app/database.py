from __future__ import annotations

from typing import AsyncGenerator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import BASE_DIR, settings


(BASE_DIR / "data").mkdir(parents=True, exist_ok=True)


class Base(DeclarativeBase):
  pass


engine = create_async_engine(settings.database_url, echo=False, future=True)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
  async with AsyncSessionLocal() as session:
    yield session


async def init_db() -> None:
  async with engine.begin() as connection:
    await connection.run_sync(Base.metadata.create_all)
    columns = await connection.execute(text("PRAGMA table_info(analysis_cache)"))
    existing_columns = {str(row[1]) for row in columns}
    if "result_json" not in existing_columns:
      await connection.execute(text("ALTER TABLE analysis_cache ADD COLUMN result_json TEXT"))
    if "api_cost_inr" not in existing_columns:
      await connection.execute(text("ALTER TABLE analysis_cache ADD COLUMN api_cost_inr FLOAT DEFAULT 0 NOT NULL"))
    if "pdf_path" not in existing_columns:
      await connection.execute(text("ALTER TABLE analysis_cache ADD COLUMN pdf_path VARCHAR(500)"))
