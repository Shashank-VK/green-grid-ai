from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db_session
from app.models import FloodZone


router = APIRouter(tags=["flood"])


@router.get("/flood-zones")
async def list_flood_zones(session: AsyncSession = Depends(get_db_session)) -> dict[str, object]:
  result = await session.execute(select(FloodZone).order_by(FloodZone.vulnerability_level.desc(), FloodZone.zone_name))
  zones = result.scalars().all()
  return {
    "total_zones": len(zones),
    "zones": [
      {
        "id": zone.id,
        "lat": zone.lat,
        "lng": zone.lng,
        "zone_name": zone.zone_name,
        "vulnerability_level": zone.vulnerability_level,
        "bbmp_zone": zone.bbmp_zone,
        "notes": f"{zone.vulnerability_level.title()} flood vulnerability in {zone.bbmp_zone}.",
      }
      for zone in zones
    ],
  }
