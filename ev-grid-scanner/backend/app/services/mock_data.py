from __future__ import annotations

import hashlib
import re
from typing import Any

from app.services.rto_detector import haversine_distance_meters


JAYANAGAR_ANCHOR_CELLS = {"D4", "D5", "E4"}


def stable_seed(*parts: object) -> int:
  payload = "|".join(str(part).strip().lower() for part in parts)
  digest = hashlib.sha256(payload.encode("utf-8")).hexdigest()
  return int(digest[:16], 16)


def _randint(seed: int, lower: int, upper: int) -> int:
  if upper <= lower:
    return lower
  return lower + (seed % (upper - lower + 1))


def _parse_cell_id(cell_id: str) -> tuple[int, int] | None:
  match = re.match(r"^([A-Za-z])(\d+)$", cell_id.strip())
  if not match:
    return None
  row_index = ord(match.group(1).upper()) - ord("A")
  col_index = int(match.group(2)) - 1
  if row_index < 0 or col_index < 0:
    return None
  return row_index, col_index


def _cell_ring(cell_id: str) -> str:
  parsed = _parse_cell_id(cell_id)
  if parsed is None:
    return "inner"

  row_index, col_index = parsed
  row_dist = abs(row_index - 3.5)
  col_dist = abs(col_index - 4.5)

  if row_dist <= 1.5 and col_dist <= 2.0:
    return "center"
  if row_dist >= 3.0 or col_dist >= 4.0:
    return "peripheral"
  return "inner"


def is_jayanagar_anchor_cell(cell_id: str, rto_code: str) -> bool:
  return rto_code.strip().upper() == "KA-05" and cell_id.strip().upper() in JAYANAGAR_ANCHOR_CELLS


def generate_mock_chargers(cell_id: str, rto_code: str) -> int:
  rto = rto_code.strip().upper()
  ring = _cell_ring(cell_id)

  if is_jayanagar_anchor_cell(cell_id, rto):
    return 0

  if rto == "KA-05":
    if ring == "center":
      lower, upper = (15, 20)
    elif ring == "inner":
      lower, upper = (18, 25)
    else:
      lower, upper = (22, 30)
  elif rto == "KA-51":
    lower, upper = (2, 8)
  elif rto == "KA-50":
    lower, upper = (0, 3)
  elif rto == "KA-43":
    lower, upper = (1, 5)
  else:
    lower, upper = (3, 10)

  seed = stable_seed("chargers", cell_id, rto)
  return _randint(seed, lower, upper)


def generate_mock_transformer(cell_id: str, rto_code: str) -> dict[str, int | bool]:
  if is_jayanagar_anchor_cell(cell_id, rto_code):
    return {"found": True, "distance_m": 50}

  seed = stable_seed("transformer", cell_id, rto_code)
  found = (seed % 100) < 60
  ring = _cell_ring(cell_id)

  if found:
    if ring == "center":
      center_bucket = seed % 100
      if center_bucket < 25:
        distance = 50
      elif center_bucket < 60:
        distance = _randint(seed // 7, 60, 130)
      else:
        distance = _randint(seed // 7, 131, 200)
    elif ring == "peripheral":
      distance = _randint(seed // 7, 300, 800)
    else:
      distance = _randint(seed // 7, 150, 500)
  else:
    distance = _randint(seed // 7, 600, 900)

  return {"found": found, "distance_m": int(distance)}


def generate_mock_pois(cell_id: str, rto_code: str) -> dict[str, int]:
  rto = rto_code.strip().upper()

  if rto in {"KA-05", "KA-01"}:
    profile = {
      "restaurants": (5, 15),
      "malls": (1, 2),
      "hotels": (1, 4),
      "theaters": (0, 2),
      "tech_parks": (0, 2),
    }
  elif rto == "KA-51":
    profile = {
      "restaurants": (2, 7),
      "malls": (0, 1),
      "hotels": (1, 3),
      "theaters": (0, 1),
      "tech_parks": (1, 3),
    }
  elif rto in {"KA-50", "KA-43"}:
    profile = {
      "restaurants": (0, 3),
      "malls": (0, 0),
      "hotels": (0, 1),
      "theaters": (0, 1),
      "tech_parks": (0, 1),
    }
  else:
    profile = {
      "restaurants": (1, 7),
      "malls": (0, 1),
      "hotels": (0, 2),
      "theaters": (0, 1),
      "tech_parks": (0, 1),
    }

  return {
    key: _randint(stable_seed("pois", key, cell_id, rto), value[0], value[1])
    for key, value in profile.items()
  }


def generate_mock_road_type(cell_id: str, rto_code: str | None = None) -> str:
  if rto_code is not None and is_jayanagar_anchor_cell(cell_id, rto_code):
    return "highway"

  seed = stable_seed("road", cell_id)
  bucket = seed % 100

  if bucket < 10:
    return "highway"
  if bucket < 25:
    return "arterial_road"
  if bucket < 50:
    return "main_road"
  if bucket < 80:
    return "residential_lane"
  return "interior"


def generate_mock_flood_risk(
  cell_id: str,
  rto_code: str,
  *,
  cell_center: dict[str, float] | None = None,
  flood_points: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
  if is_jayanagar_anchor_cell(cell_id, rto_code):
    seed = stable_seed("anchor-flood", cell_id, rto_code)
    return {
      "bbmp_severe": False,
      "bbmp_moderate": False,
      "gemma_flood_score": _randint(seed, 0, 3),
      "gemma_tree_score": _randint(seed // 13, 0, 3),
      "bbmp_zone": "",
      "distance_to_nearest_flood_m": None,
    }

  seed = stable_seed("flood", cell_id, rto_code)

  bbmp_severe = False
  bbmp_moderate = False
  bbmp_zone = ""
  nearest_distance: int | None = None

  if cell_center is not None and flood_points:
    nearest_point: dict[str, Any] | None = None
    nearest_distance_m = float("inf")

    for point in flood_points:
      distance = haversine_distance_meters(
        cell_center["lat"],
        cell_center["lng"],
        float(point["lat"]),
        float(point["lng"]),
      )
      if distance < nearest_distance_m:
        nearest_distance_m = distance
        nearest_point = point

    if nearest_point is not None:
      nearest_distance = int(round(nearest_distance_m))
      if nearest_distance_m <= 500:
        vulnerability = str(nearest_point.get("vulnerability_level", "")).lower()
        bbmp_severe = "severe" in vulnerability
        bbmp_moderate = (not bbmp_severe) and ("moderate" in vulnerability)
        bbmp_zone = str(nearest_point.get("bbmp_zone", ""))

  if bbmp_severe:
    gemma_flood_score = _randint(seed, 7, 10)
    gemma_tree_score = _randint(seed // 13, 4, 8)
  elif bbmp_moderate:
    gemma_flood_score = _randint(seed, 5, 8)
    gemma_tree_score = _randint(seed // 13, 3, 7)
  else:
    gemma_flood_score = _randint(seed, 0, 4)
    gemma_tree_score = _randint(seed // 13, 0, 3)

  return {
    "bbmp_severe": bbmp_severe,
    "bbmp_moderate": bbmp_moderate,
    "gemma_flood_score": gemma_flood_score,
    "gemma_tree_score": gemma_tree_score,
    "bbmp_zone": bbmp_zone,
    "distance_to_nearest_flood_m": nearest_distance,
  }
