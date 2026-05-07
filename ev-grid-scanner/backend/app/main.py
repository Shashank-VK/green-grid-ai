from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db
from app.routers.analyze import router as analyze_router
from app.routers.chat import router as chat_router
from app.routers.flood import router as flood_router
from app.routers.geocode import router as geocode_router
from app.routers.health import router as health_router
from app.routers.maps import router as maps_router
from app.routers.report import router as report_router
from app.routers.zones import router as zones_router


@asynccontextmanager
async def lifespan(_: FastAPI):
  await init_db()
  yield


app = FastAPI(title=settings.app_name, version=settings.app_version, lifespan=lifespan)

app.add_middleware(
  CORSMiddleware,
  allow_origins=[settings.frontend_origin, "http://127.0.0.1:3000"],
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)

app.include_router(health_router, prefix="/api")
app.include_router(geocode_router, prefix="/api/v1")
app.include_router(maps_router, prefix="/api/v1")
app.include_router(analyze_router, prefix="/api/v1")
app.include_router(chat_router, prefix="/api/v1")
app.include_router(flood_router, prefix="/api/v1")
app.include_router(report_router, prefix="/api/v1")
app.include_router(zones_router, prefix="/api/v1")


@app.get("/")
async def root() -> dict[str, str]:
  return {"message": "greengrid API is running"}
