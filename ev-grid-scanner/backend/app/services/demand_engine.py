from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import RTOZone
from app.services.grid_math import DEFAULT_GRID_COLS, DEFAULT_GRID_ROWS, generate_grid


VISION_MULTIPLIER_RULES = {
  1.5: "Mall, tech park, or high-rise apartments visible",
  1.0: "Standard residential or mixed commercial",
  0.2: "Open fields, parks, water bodies, or dense forest",
}


def calculate_base_demand(total_evs_in_rto: int, total_grid_cells: int) -> float:
  if total_grid_cells <= 0:
    return 0.0
  return total_evs_in_rto / total_grid_cells


def apply_vision_multiplier(base_demand: float, multiplier: float) -> float:
  return base_demand * multiplier


async def get_grid_demand_for_zone(
  session: AsyncSession,
  rto_code: str,
  center_lat: float,
  center_lng: float,
  rows: int = DEFAULT_GRID_ROWS,
  cols: int = DEFAULT_GRID_COLS,
) -> list[dict[str, object]]:
  result = await session.execute(select(RTOZone).where(RTOZone.rto_code == rto_code))
  zone = result.scalar_one_or_none()
  if zone is None:
    raise ValueError(f"RTO zone '{rto_code}' not found.")

  grid_cells = generate_grid(center_lat=center_lat, center_lng=center_lng, rows=rows, cols=cols)
  base_demand = calculate_base_demand(zone.total_evs, len(grid_cells))

  populated_cells: list[dict[str, object]] = []
  for cell in grid_cells:
    cell.base_demand = base_demand
    cell.vision_multiplier = 1.0
    cell.grid_demand = apply_vision_multiplier(base_demand, cell.vision_multiplier)
    populated_cells.append(cell.to_dict())

  return populated_cells
