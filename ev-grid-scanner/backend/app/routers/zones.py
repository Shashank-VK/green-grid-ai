from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db_session
from app.models import RTOZone


router = APIRouter(tags=["zones"])


def _zone_to_dict(zone: RTOZone) -> dict[str, Any]:
  return {
    "rto_code": zone.rto_code,
    "office_name": zone.office_name,
    "total_evs": zone.total_evs,
    "two_wheelers": zone.two_wheelers,
    "four_wheelers": zone.four_wheelers,
    "others": zone.others,
    "demand_profile": zone.demand_profile,
    "last_updated": zone.last_updated.isoformat() if zone.last_updated else None,
  }


@router.get("/zones")
async def list_zones(session: AsyncSession = Depends(get_db_session)):
  result = await session.execute(select(RTOZone).order_by(RTOZone.total_evs.desc()))
  zones = result.scalars().all()

  total_evs_result = await session.execute(select(func.coalesce(func.sum(RTOZone.total_evs), 0)))
  total_evs = int(total_evs_result.scalar_one())

  return {
    "zones": [_zone_to_dict(zone) for zone in zones],
    "total_zones": len(zones),
    "total_evs_bangalore": total_evs,
  }


@router.get("/zones/{rto_code}")
async def get_zone(rto_code: str, session: AsyncSession = Depends(get_db_session)):
  code = rto_code.strip().upper()
  result = await session.execute(select(RTOZone).where(RTOZone.rto_code == code))
  zone = result.scalar_one_or_none()

  if zone is None:
    raise HTTPException(
      status_code=status.HTTP_404_NOT_FOUND,
      detail={"error": "ZONE_NOT_FOUND", "message": f"RTO zone '{code}' was not found."},
    )

  return _zone_to_dict(zone)
