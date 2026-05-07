from __future__ import annotations

from math import asin, cos, radians, sin, sqrt

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import RTOZone


def haversine_distance_meters(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
  earth_radius_m = 6_371_000
  lat1_rad, lng1_rad, lat2_rad, lng2_rad = map(radians, (lat1, lng1, lat2, lng2))
  delta_lat = lat2_rad - lat1_rad
  delta_lng = lng2_rad - lng1_rad

  a = sin(delta_lat / 2) ** 2 + cos(lat1_rad) * cos(lat2_rad) * sin(delta_lng / 2) ** 2
  c = 2 * asin(sqrt(a))
  return earth_radius_m * c


async def detect_rto_zone(session: AsyncSession, lat: float, lng: float) -> RTOZone | None:
  result = await session.execute(select(RTOZone))
  zones = result.scalars().all()
  if not zones:
    return None

  nearest_zone: RTOZone | None = None
  nearest_distance = float("inf")

  for zone in zones:
    distance = haversine_distance_meters(lat, lng, zone.center_lat, zone.center_lng)
    if distance < nearest_distance:
      nearest_distance = distance
      nearest_zone = zone
      continue

    if abs(distance - nearest_distance) < 1e-6 and nearest_zone is not None:
      if zone.total_evs > nearest_zone.total_evs:
        nearest_zone = zone

  return nearest_zone
