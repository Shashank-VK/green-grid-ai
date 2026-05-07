from __future__ import annotations

from typing import Any

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, model_validator
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db_session
from app.services.rto_detector import detect_rto_zone


GOOGLE_GEOCODE_ENDPOINT = "https://maps.googleapis.com/maps/api/geocode/json"
BANGALORE_MIN_LAT = 12.85
BANGALORE_MAX_LAT = 13.30
BANGALORE_MIN_LNG = 77.45
BANGALORE_MAX_LNG = 77.80
KNOWN_LOCATION_FALLBACKS = {
  "jayanagar": {
    "lat": 12.9299,
    "lng": 77.5933,
    "formatted_address": "Jayanagar, Bengaluru, Karnataka, India",
  },
  "koramangala": {
    "lat": 12.9352,
    "lng": 77.6245,
    "formatted_address": "Koramangala, Bengaluru, Karnataka, India",
  },
  "yelahanka": {
    "lat": 13.1007,
    "lng": 77.5963,
    "formatted_address": "Yelahanka, Bengaluru, Karnataka, India",
  },
  "electronic city": {
    "lat": 12.8501,
    "lng": 77.6603,
    "formatted_address": "Electronic City, Bengaluru, Karnataka, India",
  },
  "devanahalli": {
    "lat": 13.2422,
    "lng": 77.7132,
    "formatted_address": "Devanahalli, Bengaluru Rural, Karnataka, India",
  },
  "whitefield": {
    "lat": 12.9698,
    "lng": 77.7499,
    "formatted_address": "Whitefield, Bengaluru, Karnataka, India",
  },
  "mumbai": {
    "lat": 19.0760,
    "lng": 72.8777,
    "formatted_address": "Mumbai, Maharashtra, India",
  },
}


class GeocodeRequest(BaseModel):
  location: str | None = Field(default=None)
  lat: float | None = Field(default=None)
  lng: float | None = Field(default=None)

  @model_validator(mode="after")
  def validate_payload(self) -> "GeocodeRequest":
    if self.location:
      return self
    if self.lat is not None and self.lng is not None:
      return self
    raise ValueError("Provide either a location string or latitude/longitude coordinates.")


router = APIRouter(tags=["geocode"])


def _is_within_bangalore(lat: float, lng: float) -> bool:
  return BANGALORE_MIN_LAT <= lat <= BANGALORE_MAX_LAT and BANGALORE_MIN_LNG <= lng <= BANGALORE_MAX_LNG


async def _call_google_geocode(params: dict[str, Any]) -> dict[str, Any]:
  async with httpx.AsyncClient(timeout=30) as client:
    response = await client.get(GOOGLE_GEOCODE_ENDPOINT, params=params)
    response.raise_for_status()
  return response.json()


@router.post("/geocode", response_model=None)
async def geocode_location(
  payload: GeocodeRequest,
  session: AsyncSession = Depends(get_db_session),
):
  params: dict[str, Any] = {"key": settings.google_maps_api_key}

  if payload.location:
    params.update(
      {
        "address": payload.location,
        "bounds": f"{BANGALORE_MIN_LAT},{BANGALORE_MIN_LNG}|{BANGALORE_MAX_LAT},{BANGALORE_MAX_LNG}",
        "components": "country:IN",
        "region": "in",
      }
    )
  else:
    params["latlng"] = f"{payload.lat},{payload.lng}"

  data: dict[str, Any] = {}
  try:
    data = await _call_google_geocode(params)
  except httpx.HTTPError:
    data = {}

  results = data.get("results", [])
  fallback = None
  if payload.location:
    normalized_location = payload.location.strip().lower()
    fallback = next(
      (value for key, value in KNOWN_LOCATION_FALLBACKS.items() if key in normalized_location),
      None,
    )

  if results:
    top_result = results[0]
    geometry = top_result.get("geometry", {}).get("location", {})
    lat = geometry.get("lat")
    lng = geometry.get("lng")
    formatted_address = top_result.get("formatted_address", "")
  elif fallback is not None:
    lat = fallback["lat"]
    lng = fallback["lng"]
    formatted_address = fallback["formatted_address"]
  else:
    return JSONResponse(
      status_code=status.HTTP_404_NOT_FOUND,
      content={"error": "LOCATION_NOT_FOUND", "message": "Could not find that location."},
    )

  if lat is None or lng is None:
    return JSONResponse(
      status_code=status.HTTP_502_BAD_GATEWAY,
      content={"error": "GEOCODE_INVALID_RESPONSE", "message": "Google Geocoding API returned an invalid response."},
    )

  if not _is_within_bangalore(lat, lng) and fallback is not None and _is_within_bangalore(fallback["lat"], fallback["lng"]):
    lat = fallback["lat"]
    lng = fallback["lng"]
    formatted_address = fallback["formatted_address"]

  if not _is_within_bangalore(lat, lng):
    return JSONResponse(
      status_code=status.HTTP_400_BAD_REQUEST,
      content={
        "error": "LOCATION_OUTSIDE_BANGALORE",
        "message": "greengrid currently supports Bangalore only. Try Yelahanka, Koramangala, Whitefield, or Electronic City.",
      },
    )

  zone = await detect_rto_zone(session=session, lat=lat, lng=lng)
  if zone is None:
    raise HTTPException(
      status_code=status.HTTP_404_NOT_FOUND,
      detail={"error": "RTO_ZONE_NOT_FOUND", "message": "No RTO zone data is available for this location."},
    )

  return {
    "lat": lat,
    "lng": lng,
    "formatted_address": formatted_address,
    "rto_zone": {
      "code": zone.rto_code,
      "name": f"{zone.office_name} RTO",
      "office_name": zone.office_name,
      "total_evs": zone.total_evs,
      "demand_profile": zone.demand_profile,
    },
  }
