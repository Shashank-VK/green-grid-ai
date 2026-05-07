from __future__ import annotations

from datetime import datetime
from io import BytesIO
from pathlib import Path
from typing import Any

import httpx
from PIL import Image, ImageDraw, ImageFont

from app.config import BASE_DIR, settings


TEMP_MAPS_DIR = BASE_DIR / "temp" / "maps"
TEMP_ANALYSIS_DIR = BASE_DIR / "temp" / "analysis"
STATIC_MAP_ENDPOINT = "https://maps.googleapis.com/maps/api/staticmap"


async def fetch_static_map(
  lat: float,
  lng: float,
  zoom: int = 16,
  maptype: str = "satellite",
  size: str = "800x600",
) -> Image.Image:
  params = {
    "center": f"{lat},{lng}",
    "zoom": zoom,
    "maptype": maptype,
    "size": size,
    "format": "png",
    "scale": 1,
    "key": settings.google_maps_api_key,
  }

  async with httpx.AsyncClient(timeout=30) as client:
    response = await client.get(STATIC_MAP_ENDPOINT, params=params)
    response.raise_for_status()

  content_type = response.headers.get("content-type", "")
  if "image" not in content_type:
    raise RuntimeError("Google Static Maps API did not return an image.")

  return Image.open(BytesIO(response.content)).convert("RGBA")


async def fetch_composite_map(lat: float, lng: float, zoom: int = 16) -> Path:
  TEMP_MAPS_DIR.mkdir(parents=True, exist_ok=True)

  satellite_image = await fetch_static_map(lat=lat, lng=lng, zoom=zoom, maptype="satellite")
  terrain_image = await fetch_static_map(lat=lat, lng=lng, zoom=zoom, maptype="terrain")
  composite_image = Image.blend(satellite_image, terrain_image, alpha=0.35)

  timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S%f")
  safe_lat = str(lat).replace(".", "_")
  safe_lng = str(lng).replace(".", "_")
  output_path = TEMP_MAPS_DIR / f"{safe_lat}_{safe_lng}_{zoom}_{timestamp}.png"
  composite_image.save(output_path, format="PNG")
  return output_path


def draw_grid_on_image(
  image: Image.Image,
  cells: list[Any],
  highlight_cells: list[str] | None = None,
) -> Image.Image:
  highlight_set = set(highlight_cells or [])
  output = image.convert("RGBA")
  overlay = Image.new("RGBA", output.size, (0, 0, 0, 0))
  draw = ImageDraw.Draw(overlay)
  width, height = output.size

  if not cells:
    return output

  rows = max(_cell_row_index(cell) for cell in cells) + 1
  cols = max(int(_cell_value(cell, "col", 1)) for cell in cells)
  cell_width = width / cols
  cell_height = height / rows
  font = _load_grid_font()

  for cell in cells:
    cell_id = str(_cell_value(cell, "id", ""))
    row_index = _cell_row_index(cell)
    col_index = int(_cell_value(cell, "col", 1)) - 1
    x1 = int(round(col_index * cell_width))
    y1 = int(round(row_index * cell_height))
    x2 = int(round((col_index + 1) * cell_width))
    y2 = int(round((row_index + 1) * cell_height))

    if cell_id in highlight_set:
      outline = (217, 119, 87, 230)
      line_width = 2
    else:
      outline = (255, 255, 255, 102)
      line_width = 1

    draw.rectangle((x1, y1, x2, y2), outline=outline, width=line_width)
    draw.text((x1 + 6, y1 + 4), cell_id, fill=(255, 255, 255, 230), font=font)

  return Image.alpha_composite(output, overlay)


def save_analysis_image(image: Image.Image, session_id: str) -> str:
  TEMP_ANALYSIS_DIR.mkdir(parents=True, exist_ok=True)
  safe_session_id = "".join(char for char in session_id if char.isalnum() or char in ("-", "_"))
  output_path = TEMP_ANALYSIS_DIR / f"{safe_session_id}.png"
  image.save(output_path, format="PNG")
  return str(output_path)


def _load_grid_font() -> ImageFont.ImageFont:
  try:
    return ImageFont.truetype("arial.ttf", 20)
  except OSError:
    return ImageFont.load_default()


def _cell_value(cell: Any, key: str, default: Any = None) -> Any:
  if isinstance(cell, dict):
    return cell.get(key, default)
  return getattr(cell, key, default)


def _cell_row_index(cell: Any) -> int:
  row = str(_cell_value(cell, "row", "A")).upper()
  return max(0, ord(row[0]) - ord("A")) if row else 0
