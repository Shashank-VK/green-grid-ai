from __future__ import annotations

from dataclasses import asdict, dataclass


METERS_PER_DEGREE_LAT = 110_570
METERS_PER_DEGREE_LNG = 107_480
DEFAULT_GRID_ROWS = 8
DEFAULT_GRID_COLS = 10
GRID_CELL_SIZE_METERS = 500
GRID_DELTA_LAT = GRID_CELL_SIZE_METERS / METERS_PER_DEGREE_LAT
GRID_DELTA_LNG = GRID_CELL_SIZE_METERS / METERS_PER_DEGREE_LNG


def meters_to_degrees_lat(meters: float) -> float:
  return meters / METERS_PER_DEGREE_LAT


def meters_to_degrees_lng(meters: float) -> float:
  return meters / METERS_PER_DEGREE_LNG


@dataclass
class GridBounds:
  north: float
  south: float
  east: float
  west: float


@dataclass
class GridCenter:
  lat: float
  lng: float


@dataclass
class GridCell:
  id: str
  row: str
  col: int
  bounds: GridBounds
  center: GridCenter
  base_demand: float = 0.0
  vision_multiplier: float = 1.0
  grid_demand: float = 0.0

  def to_dict(self) -> dict[str, object]:
    return asdict(self)


def generate_grid(
  center_lat: float,
  center_lng: float,
  rows: int = DEFAULT_GRID_ROWS,
  cols: int = DEFAULT_GRID_COLS,
) -> list[GridCell]:
  delta_lat = meters_to_degrees_lat(GRID_CELL_SIZE_METERS)
  delta_lng = meters_to_degrees_lng(GRID_CELL_SIZE_METERS)
  total_height = rows * delta_lat
  total_width = cols * delta_lng

  north_edge = center_lat + (total_height / 2)
  west_edge = center_lng - (total_width / 2)
  cells: list[GridCell] = []

  for row_index in range(rows):
    row_label = chr(ord("A") + row_index)
    north = north_edge - (row_index * delta_lat)
    south = north - delta_lat

    for col_index in range(cols):
      west = west_edge + (col_index * delta_lng)
      east = west + delta_lng
      center = GridCenter(lat=(north + south) / 2, lng=(east + west) / 2)
      cell = GridCell(
        id=f"{row_label}{col_index + 1}",
        row=row_label,
        col=col_index + 1,
        bounds=GridBounds(north=north, south=south, east=east, west=west),
        center=center,
      )
      cells.append(cell)

  return cells
