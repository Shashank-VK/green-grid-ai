from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def utc_now() -> datetime:
  return datetime.now(timezone.utc)


class RTOZone(Base):
  __tablename__ = "rto_zones"

  rto_code: Mapped[str] = mapped_column(String(10), primary_key=True)
  office_name: Mapped[str] = mapped_column(String(100), nullable=False)
  center_lat: Mapped[float] = mapped_column(Float, nullable=False)
  center_lng: Mapped[float] = mapped_column(Float, nullable=False)
  total_evs: Mapped[int] = mapped_column(Integer, nullable=False)
  two_wheelers: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
  four_wheelers: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
  others: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
  demand_profile: Mapped[str] = mapped_column(String(120), nullable=False, default="Unspecified")
  last_updated: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)


class FloodZone(Base):
  __tablename__ = "flood_zones"

  id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
  lat: Mapped[float] = mapped_column(Float, nullable=False)
  lng: Mapped[float] = mapped_column(Float, nullable=False)
  zone_name: Mapped[str] = mapped_column(String(150), nullable=False)
  vulnerability_level: Mapped[str] = mapped_column(String(50), nullable=False)
  bbmp_zone: Mapped[str] = mapped_column(String(100), nullable=False)


class AnalysisCache(Base):
  __tablename__ = "analysis_cache"

  session_id: Mapped[str] = mapped_column(String(64), primary_key=True)
  location_name: Mapped[str] = mapped_column(String(200), nullable=False)
  status: Mapped[str] = mapped_column(String(50), nullable=False, default="pending")
  result_json: Mapped[str | None] = mapped_column(Text, nullable=True)
  api_cost_inr: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
  pdf_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
  created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)


class ChargingStation(Base):
  __tablename__ = "charging_stations"

  place_id: Mapped[str] = mapped_column(String(150), primary_key=True)
  name: Mapped[str] = mapped_column(String(200), nullable=False)
  lat: Mapped[float] = mapped_column(Float, nullable=False)
  lng: Mapped[float] = mapped_column(Float, nullable=False)
  address: Mapped[str] = mapped_column(String(300), nullable=False, default="")
  operator: Mapped[str] = mapped_column(String(120), nullable=False, default="Unknown")
  source: Mapped[str] = mapped_column(String(50), nullable=False, default="google_places")
  last_verified: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)
