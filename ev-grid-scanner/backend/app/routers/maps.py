from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query, status
from fastapi.responses import FileResponse

from app.services.maps_fetcher import fetch_composite_map


router = APIRouter(tags=["maps"])


@router.get("/maps/static")
async def get_static_map(
  lat: float = Query(...),
  lng: float = Query(...),
  zoom: int = Query(default=16, ge=1, le=20),
) -> FileResponse:
  try:
    output_path = await fetch_composite_map(lat=lat, lng=lng, zoom=zoom)
  except Exception as exc:
    raise HTTPException(
      status_code=status.HTTP_502_BAD_GATEWAY,
      detail={"error": "STATIC_MAP_FETCH_FAILED", "message": "Failed to fetch the composite static map image."},
    ) from exc

  return FileResponse(path=output_path, media_type="image/png", filename=output_path.name)
