from __future__ import annotations

import asyncio
import sys
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy import func, select

BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
  sys.path.insert(0, str(BACKEND_DIR))

from app.database import AsyncSessionLocal, Base, engine
from app.models import FloodZone, RTOZone


RTO_SEED_DATA = [
  {"rto_code": "KA-05", "office_name": "Jayanagar", "center_lat": 12.9299, "center_lng": 77.5933, "total_evs": 23090, "demand_profile": "Residential/Solar Hub"},
  {"rto_code": "KA-01", "office_name": "Koramangala", "center_lat": 12.9352, "center_lng": 77.6245, "total_evs": 11690, "demand_profile": "High-Income/Tech"},
  {"rto_code": "KA-02", "office_name": "Rajajinagar", "center_lat": 12.9915, "center_lng": 77.5538, "total_evs": 11652, "demand_profile": "Industrial/Business"},
  {"rto_code": "KA-04", "office_name": "Yeshwanthpur", "center_lat": 13.0280, "center_lng": 77.5540, "total_evs": 10665, "demand_profile": "Commercial/Transit"},
  {"rto_code": "KA-03", "office_name": "Indiranagar", "center_lat": 12.9784, "center_lng": 77.6408, "total_evs": 10585, "demand_profile": "Luxury/Corporate"},
  {"rto_code": "KA-53", "office_name": "KR Puram", "center_lat": 13.0096, "center_lng": 77.6956, "total_evs": 8976, "demand_profile": "High-Density IT/Suburban"},
  {"rto_code": "KA-51", "office_name": "Electronic City", "center_lat": 12.8501, "center_lng": 77.6603, "total_evs": 5954, "demand_profile": "Very High Tech/Corporate"},
  {"rto_code": "KA-43", "office_name": "Devanahalli", "center_lat": 13.2422, "center_lng": 77.7132, "total_evs": 3967, "demand_profile": "Peripheral/Emerging"},
  {"rto_code": "KA-50", "office_name": "Yelahanka", "center_lat": 13.1007, "center_lng": 77.5963, "total_evs": 1365, "demand_profile": "Rapid Residential Growth"},
  {"rto_code": "KA-59", "office_name": "Banashankari", "center_lat": 12.9181, "center_lng": 77.5730, "total_evs": 7059, "demand_profile": "Residential"},
]

FLOOD_ZONE_SEED_DATA = [
  {"lat": 12.9312, "lng": 77.5948, "zone_name": "Jayanagar 4th Block Drain", "vulnerability_level": "severe", "bbmp_zone": "South"},
  {"lat": 12.9255, "lng": 77.6021, "zone_name": "Lalbagh Gate Junction", "vulnerability_level": "moderate", "bbmp_zone": "South"},
  {"lat": 12.9368, "lng": 77.6262, "zone_name": "Koramangala 80ft Road", "vulnerability_level": "severe", "bbmp_zone": "South East"},
  {"lat": 12.9279, "lng": 77.6216, "zone_name": "Koramangala Lake Area", "vulnerability_level": "severe", "bbmp_zone": "South East"},
  {"lat": 12.9945, "lng": 77.6957, "zone_name": "Mahadevapura Sai Layout", "vulnerability_level": "severe", "bbmp_zone": "Mahadevapura"},
  {"lat": 12.9350, "lng": 77.6750, "zone_name": "Bellandur Lake Overflow", "vulnerability_level": "moderate", "bbmp_zone": "Mahadevapura"},
  {"lat": 13.1034, "lng": 77.5958, "zone_name": "Yelahanka Low-Lying", "vulnerability_level": "moderate", "bbmp_zone": "Yelahanka"},
  {"lat": 12.8498, "lng": 77.6588, "zone_name": "Electronic City Ph-1 Underpass", "vulnerability_level": "moderate", "bbmp_zone": "Bommanahalli"},
  {"lat": 12.9908, "lng": 77.5534, "zone_name": "Rajajinagar Sub Road", "vulnerability_level": "moderate", "bbmp_zone": "West"},
  {"lat": 13.0105, "lng": 77.6948, "zone_name": "KR Puram Railway Underbridge", "vulnerability_level": "severe", "bbmp_zone": "Mahadevapura"},
  {"lat": 13.1018, "lng": 77.5952, "zone_name": "Yelahanka Old Town Junction", "vulnerability_level": "moderate", "bbmp_zone": "Yelahanka"},
  {"lat": 13.0994, "lng": 77.6039, "zone_name": "Yelahanka New Town Cross", "vulnerability_level": "moderate", "bbmp_zone": "Yelahanka"},
  {"lat": 12.9774, "lng": 77.6401, "zone_name": "Indiranagar 100ft Road", "vulnerability_level": "moderate", "bbmp_zone": "East"},
  {"lat": 12.9188, "lng": 77.5738, "zone_name": "Banashankari Bus Stand Belt", "vulnerability_level": "moderate", "bbmp_zone": "South"},
]


async def seed_rto_data() -> None:
  async with engine.begin() as connection:
    await connection.run_sync(Base.metadata.drop_all)
    await connection.run_sync(Base.metadata.create_all)

  async with AsyncSessionLocal() as session:
    session.add_all(
      [
        RTOZone(
          rto_code=item["rto_code"],
          office_name=item["office_name"],
          center_lat=item["center_lat"],
          center_lng=item["center_lng"],
          total_evs=item["total_evs"],
          two_wheelers=0,
          four_wheelers=0,
          others=0,
          demand_profile=item["demand_profile"],
          last_updated=datetime.now(timezone.utc),
        )
        for item in RTO_SEED_DATA
      ]
    )
    session.add_all(
      [
        FloodZone(
          lat=item["lat"],
          lng=item["lng"],
          zone_name=item["zone_name"],
          vulnerability_level=item["vulnerability_level"],
          bbmp_zone=item["bbmp_zone"],
        )
        for item in FLOOD_ZONE_SEED_DATA
      ]
    )
    await session.commit()

    rto_count_result = await session.execute(select(func.count()).select_from(RTOZone))
    flood_count_result = await session.execute(select(func.count()).select_from(FloodZone))
    rto_count = rto_count_result.scalar_one()
    flood_count = flood_count_result.scalar_one()
    print(f"Seed complete. Inserted {rto_count} RTO rows and {flood_count} flood rows into the database.")


if __name__ == "__main__":
  asyncio.run(seed_rto_data())
