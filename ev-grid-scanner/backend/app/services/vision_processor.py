from __future__ import annotations

import asyncio
import logging
import time
from typing import Any

from PIL import Image

from app.config import settings
from app.services import maps_fetcher
from app.services.gemma_client import GemmaClient, default_vision_analysis


logger = logging.getLogger(__name__)


class VisionProcessor:
  def __init__(self, gemma_client: GemmaClient, maps_fetcher_module=maps_fetcher):
    self.gemma = gemma_client
    self.maps = maps_fetcher_module

  async def analyze_zone(
    self,
    center_lat: float,
    center_lng: float,
    cells: list[Any],
    session_id: str,
  ) -> dict[str, dict[str, Any]]:
    """
    Fetches a composite map, draws the grid, and analyzes cells in batches with Gemma.
    """
    composite_path = await self.maps.fetch_composite_map(center_lat, center_lng, zoom=16)
    base_image = Image.open(composite_path).convert("RGBA")
    grid_image = self.maps.draw_grid_on_image(base_image, cells)
    analysis_image_path = self.maps.save_analysis_image(grid_image, session_id)

    results: dict[str, dict[str, Any]] = {}
    sorted_cells = sorted(cells, key=lambda cell: (_cell_row(cell), _cell_col(cell)))
    batch_size = max(1, settings.vision_batch_size)
    deadline = time.monotonic() + settings.vision_timeout

    for index in range(0, len(sorted_cells), batch_size):
      batch = sorted_cells[index : index + batch_size]
      cell_ids = [_cell_id(cell) for cell in batch]
      remaining_seconds = deadline - time.monotonic()
      if remaining_seconds <= 1:
        logger.warning("Gemma vision budget exhausted; defaulting remaining cells.")
        for remaining_cell in sorted_cells[index:]:
          remaining_cell_id = _cell_id(remaining_cell)
          results[remaining_cell_id] = default_vision_analysis(remaining_cell_id)
        break

      try:
        batch_results = await asyncio.wait_for(
          self.gemma.analyze_image(analysis_image_path, cell_ids),
          timeout=remaining_seconds,
        )
      except Exception as exc:
        logger.warning("Gemma vision batch failed for %s: %s", cell_ids, exc)
        batch_results = {}

      for cell_id in cell_ids:
        results[cell_id] = batch_results.get(cell_id, default_vision_analysis(cell_id))

      if index + batch_size < len(sorted_cells):
        await asyncio.sleep(min(1, max(0, deadline - time.monotonic())))

    return results


def _cell_id(cell: Any) -> str:
  if isinstance(cell, dict):
    return str(cell.get("id", ""))
  return str(getattr(cell, "id", ""))


def _cell_row(cell: Any) -> str:
  if isinstance(cell, dict):
    return str(cell.get("row", ""))
  return str(getattr(cell, "row", ""))


def _cell_col(cell: Any) -> int:
  if isinstance(cell, dict):
    return int(cell.get("col", 0))
  return int(getattr(cell, "col", 0))
