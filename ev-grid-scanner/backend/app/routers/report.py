from __future__ import annotations

import json
from datetime import datetime
from io import BytesIO
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import BASE_DIR
from app.database import get_db_session
from app.models import AnalysisCache
from app.services.maps_fetcher import draw_grid_on_image, fetch_composite_map, save_analysis_image
from app.services.pdf_generator import PDFGenerator


router = APIRouter(tags=["reports"])
REPORT_DIR = BASE_DIR / "temp" / "reports"


@router.post("/report/{session_id}")
async def generate_report(session_id: str, session: AsyncSession = Depends(get_db_session)) -> StreamingResponse:
  cache = await _get_cache(session_id, session)
  analysis_data = json.loads(cache.result_json or "{}")
  map_image_path = await _build_report_map(analysis_data, session_id)
  pdf_bytes = PDFGenerator().generate(analysis_data, map_image_path)

  REPORT_DIR.mkdir(parents=True, exist_ok=True)
  output_path = REPORT_DIR / f"{session_id}.pdf"
  output_path.write_bytes(pdf_bytes)
  cache.pdf_path = str(output_path)
  await session.commit()

  safe_location = "".join(char if char.isalnum() else "-" for char in cache.location_name).strip("-")
  filename = f"EV-Grid-Report-{safe_location}-{datetime.now().strftime('%Y-%m-%d')}.pdf"
  return StreamingResponse(
    BytesIO(pdf_bytes),
    media_type="application/pdf",
    headers={"Content-Disposition": f'attachment; filename="{filename}"'},
  )


@router.get("/report/{session_id}/preview")
async def preview_report(session_id: str, session: AsyncSession = Depends(get_db_session)) -> dict[str, object]:
  cache = await _get_cache(session_id, session)
  file_size = Path(cache.pdf_path).stat().st_size if cache.pdf_path and Path(cache.pdf_path).exists() else 0
  return {
    "session_id": session_id,
    "location": cache.location_name,
    "pages": 3,
    "file_size_bytes": file_size,
    "download_url": f"/api/v1/report/{session_id}",
  }


async def _get_cache(session_id: str, session: AsyncSession) -> AnalysisCache:
  result = await session.execute(select(AnalysisCache).where(AnalysisCache.session_id == session_id))
  cache = result.scalar_one_or_none()
  if cache is None or not cache.result_json:
    raise HTTPException(
      status_code=status.HTTP_404_NOT_FOUND,
      detail={"error": "REPORT_NOT_FOUND", "message": "Analysis session was not found."},
    )
  return cache


async def _build_report_map(analysis_data: dict[str, object], session_id: str) -> str | None:
  try:
    location = analysis_data.get("location", {})
    lat = float(location.get("lat"))  # type: ignore[union-attr]
    lng = float(location.get("lng"))  # type: ignore[union-attr]
    map_path = await fetch_composite_map(lat, lng, zoom=14)
    from PIL import Image

    image = Image.open(map_path).convert("RGBA")
    return save_analysis_image(draw_grid_on_image(image, analysis_data.get("cells", [])), f"report_{session_id}")
  except Exception:
    return None
