from __future__ import annotations

from collections import deque
from typing import Any


def _clamp(value: float, minimum: float, maximum: float) -> float:
  return max(minimum, min(maximum, value))


def _verdict_for_score(score: float) -> tuple[str, str]:
  if score >= 8.0:
    return "HIGH PRIORITY", "high_priority"
  if score >= 6.0:
    return "VIABLE", "viable"
  if score >= 4.0:
    return "MARGINAL", "marginal"
  return "NOT RECOMMENDED", "not_recommended"


def recommend_charger(
  final_score: float,
  s4_commercial: float,
  s5_strategic: float,
  *,
  s3_grid: float | None = None,
  s6_environment: float | None = None,
) -> dict[str, Any]:
  warnings: list[str] = []

  high_commercial = s4_commercial >= 7.0
  high_strategic = s5_strategic >= 8.0

  if final_score < 4.0:
    charger = {
      "type": "NOT_RECOMMENDED",
      "label": "NOT RECOMMENDED",
      "power_kw": None,
      "connector": None,
      "recommended": False,
    }
  elif final_score >= 8.0 and (high_commercial or high_strategic):
    charger = {
      "type": "DC_FAST_50KW_CCS2",
      "label": "DC Fast 50kW+ (CCS2)",
      "power_kw": "50+",
      "connector": "CCS2",
      "recommended": True,
    }
  elif final_score >= 8.0:
    charger = {
      "type": "AC_FAST_22KW",
      "label": "AC Fast 22kW (Type 2)",
      "power_kw": "22",
      "connector": "Type 2",
      "recommended": True,
    }
  elif final_score >= 6.0:
    charger = {
      "type": "AC_FAST_22KW",
      "label": "AC Fast 22kW (Type 2)",
      "power_kw": "22",
      "connector": "Type 2",
      "recommended": True,
    }
  else:
    charger = {
      "type": "AC_SLOW_7_4KW",
      "label": "AC Slow 7.4kW (Type 2)",
      "power_kw": "7.4",
      "connector": "Type 2",
      "recommended": True,
    }

  if charger["type"] == "DC_FAST_50KW_CCS2" and s3_grid is not None and s3_grid < 3.0:
    warnings.append("Transformer upgrade required. Add 8-12 weeks + Rs 2-5L.")
  if s6_environment is not None and s6_environment >= 8.0:
    warnings.append("Flood zone. Raised platform required. Add Rs 2-4L.")

  charger["warnings"] = warnings
  return charger


class ViabilityEngine:
  def calculate_s1(self, grid_demand: float, max_grid_demand: float, min_demand: float = 0.0) -> float:
    if max_grid_demand <= min_demand:
      return 1.0
    score = ((grid_demand - min_demand) / (max_grid_demand - min_demand)) * 9 + 1
    return _clamp(score, 1.0, 10.0)

  def calculate_s2(self, grid_demand: float, existing_chargers_5km: int) -> float:
    chargers = max(existing_chargers_5km, 0)
    if chargers == 0:
      return 10.0

    ratio = grid_demand / max(chargers, 1)
    if ratio >= 300:
      return 10.0
    if ratio >= 100:
      return 9.0
    if ratio >= 40:
      return 7.5
    if ratio >= 20:
      return 5.0
    if ratio >= 10:
      return 3.0
    return 1.0

  def calculate_s3(self, nearest_transformer_m: int | None) -> float:
    if nearest_transformer_m is None:
      return 5.0
    if nearest_transformer_m <= 50:
      return 10.0
    if nearest_transformer_m <= 150:
      return 8.0
    if nearest_transformer_m <= 300:
      return 6.0
    if nearest_transformer_m <= 500:
      return 4.0
    return 2.0

  def calculate_s4(self, pois: dict[str, int]) -> float:
    restaurants = pois.get("restaurants", 0)
    malls = pois.get("malls", 0)
    hotels = pois.get("hotels", 0)
    theaters = pois.get("theaters", 0)
    tech_parks = pois.get("tech_parks", 0)

    score = 5.0
    if malls >= 2 or tech_parks >= 1:
      score += 4.0
    elif malls == 1:
      score += 3.0

    if restaurants >= 5:
      score += 2.0
    elif restaurants >= 2:
      score += 1.0

    if hotels >= 2:
      score += 1.5
    if theaters >= 1:
      score += 1.0

    return _clamp(score, 1.0, 10.0)

  def calculate_s5(self, road_type: str, nearest_highway_m: int | None) -> float:
    road_scores = {
      "highway": 10.0,
      "arterial_road": 8.0,
      "main_road": 6.5,
      "residential_lane": 4.0,
      "interior": 2.0,
      "dead_end": 2.0,
    }
    score = road_scores.get(road_type, 5.0)

    if nearest_highway_m is not None:
      if nearest_highway_m < 100:
        score = max(score, 9.0)
      elif nearest_highway_m < 300:
        score = max(score, 7.0)

    return _clamp(score, 1.0, 10.0)

  def calculate_s6(self, flood_risk: dict[str, Any]) -> float:
    risk = 0.0

    if flood_risk.get("bbmp_severe"):
      risk += 8.0
    if flood_risk.get("bbmp_moderate"):
      risk += 5.0
    if int(flood_risk.get("gemma_flood_score", 0)) >= 7:
      risk += 2.0

    tree_score = int(flood_risk.get("gemma_tree_score", 0))
    if tree_score >= 7:
      risk += 3.0
    elif tree_score >= 4:
      risk += 1.5

    return _clamp(risk, 0.0, 10.0)

  def calculate_final_score(
    self,
    cell_data: dict[str, Any],
    zone_data: dict[str, Any],
    all_cells: list[dict[str, Any]],
  ) -> dict[str, Any]:
    del zone_data

    grid_demands = [float(cell.get("grid_demand", 0.0)) for cell in all_cells]
    max_grid_demand = max(grid_demands) if grid_demands else 1.0
    min_grid_demand = min(grid_demands) if grid_demands else 0.0

    s1 = self.calculate_s1(float(cell_data.get("grid_demand", 0.0)), max_grid_demand, min_grid_demand)
    s2 = self.calculate_s2(float(cell_data.get("grid_demand", 0.0)), int(cell_data.get("existing_chargers_5km", 0)))
    s3 = self.calculate_s3(cell_data.get("nearest_transformer_m"))
    s4 = self.calculate_s4(cell_data.get("pois_nearby", {}))
    s5 = self.calculate_s5(str(cell_data.get("road_type", "interior")), cell_data.get("nearest_highway_m"))
    s6 = self.calculate_s6(cell_data.get("flood_risk", {}))

    final_score = (s1 * 0.25) + (s2 * 0.15) + (s3 * 0.20) + (s4 * 0.15) + (s5 * 0.15) - (s6 * 0.10)
    final_score = _clamp(final_score, 0.0, 10.0)

    flood_risk = cell_data.get("flood_risk", {})
    hard_gate_applied = bool(flood_risk.get("bbmp_severe"))
    if hard_gate_applied:
      final_score = min(final_score, 4.0)
      verdict, category = "NOT RECOMMENDED", "not_recommended"
    else:
      verdict, category = _verdict_for_score(final_score)

    recommendation = recommend_charger(
      final_score=final_score,
      s4_commercial=s4,
      s5_strategic=s5,
      s3_grid=s3,
      s6_environment=s6,
    )

    if cell_data.get("nearest_transformer_m") is not None and int(cell_data["nearest_transformer_m"]) > 500:
      transformer_warning = "Nearest transformer is beyond 500m. Expect higher distribution extension effort."
      if transformer_warning not in recommendation["warnings"]:
        recommendation["warnings"].append(transformer_warning)

    return {
      "scores": {
        "s1_demand": round(s1, 2),
        "s2_infra_gap": round(s2, 2),
        "s3_grid_ready": round(s3, 2),
        "s4_commercial": round(s4, 2),
        "s5_strategic": round(s5, 2),
        "s6_env_risk": round(s6, 2),
      },
      "final_score": round(final_score, 2),
      "verdict": verdict,
      "category": category,
      "hard_gate_applied": hard_gate_applied,
      "charger_recommendation": recommendation,
    }


def _cell_sort_key(cell: dict[str, Any]) -> tuple[int, int]:
  row_label = str(cell.get("row", "A")).strip().upper() or "A"
  row_index = max(0, ord(row_label[0]) - ord("A"))
  col_value = int(cell.get("col", 0))
  return row_index, col_value


def _cluster_bounds(cells: list[dict[str, Any]]) -> dict[str, float]:
  north = max(float(cell["bounds"]["north"]) for cell in cells)
  south = min(float(cell["bounds"]["south"]) for cell in cells)
  east = max(float(cell["bounds"]["east"]) for cell in cells)
  west = min(float(cell["bounds"]["west"]) for cell in cells)
  return {"north": north, "south": south, "east": east, "west": west}


def find_clusters(cells: list[dict[str, Any]], min_score: float = 6.0, min_size: int = 2) -> list[dict[str, Any]]:
  eligible_cells = [cell for cell in cells if float(cell.get("final_score", 0.0)) >= min_score]
  if not eligible_cells:
    return []

  position_to_cell: dict[tuple[str, int], dict[str, Any]] = {
    (str(cell.get("row", "")).upper(), int(cell.get("col", 0))): cell
    for cell in eligible_cells
  }

  directions = [
    (-1, 0),
    (-1, 1),
    (0, 1),
    (1, 1),
    (1, 0),
    (1, -1),
    (0, -1),
    (-1, -1),
  ]

  visited: set[tuple[str, int]] = set()
  grouped_clusters: list[list[dict[str, Any]]] = []

  for position in position_to_cell:
    if position in visited:
      continue

    queue: deque[tuple[str, int]] = deque([position])
    cluster: list[dict[str, Any]] = []

    while queue:
      current = queue.popleft()
      if current in visited:
        continue

      visited.add(current)
      current_cell = position_to_cell.get(current)
      if current_cell is None:
        continue
      cluster.append(current_cell)

      row_label, col_value = current
      if not row_label:
        continue
      row_index = ord(row_label[0]) - ord("A")

      for row_delta, col_delta in directions:
        neighbor_row_index = row_index + row_delta
        neighbor_col = col_value + col_delta
        if neighbor_row_index < 0 or neighbor_col <= 0:
          continue

        neighbor_position = (chr(ord("A") + neighbor_row_index), neighbor_col)
        if neighbor_position in position_to_cell and neighbor_position not in visited:
          queue.append(neighbor_position)

    if len(cluster) >= min_size:
      grouped_clusters.append(cluster)

  if not grouped_clusters:
    return []

  def cluster_rank(cluster_cells: list[dict[str, Any]]) -> float:
    avg_score = sum(float(cell.get("final_score", 0.0)) for cell in cluster_cells) / len(cluster_cells)
    size_bonus = min(10.0, len(cluster_cells) * 2.0)
    max_strategic = max(float(cell.get("scores", {}).get("s5_strategic", 0.0)) for cell in cluster_cells)
    return (avg_score * 0.70) + (size_bonus * 0.20) + (max_strategic * 0.10)

  grouped_clusters.sort(key=cluster_rank, reverse=True)

  top_clusters: list[dict[str, Any]] = []
  for index, cluster_cells in enumerate(grouped_clusters[:3], start=1):
    sorted_cells = sorted(cluster_cells, key=_cell_sort_key)
    cell_ids = [str(cell["id"]) for cell in sorted_cells]
    avg_score = sum(float(cell.get("final_score", 0.0)) for cell in sorted_cells) / len(sorted_cells)
    verdict, _ = _verdict_for_score(avg_score)
    max_strategic = max(float(cell.get("scores", {}).get("s5_strategic", 0.0)) for cell in sorted_cells)

    top_clusters.append(
      {
        "cluster_id": index,
        "cell_ids": cell_ids,
        "avg_score": round(avg_score, 2),
        "verdict": verdict,
        "bounds": _cluster_bounds(sorted_cells),
        "max_strategic_access": round(max_strategic, 2),
        "rank_score": round(cluster_rank(sorted_cells), 2),
        "label": f"{cell_ids[0]}-{cell_ids[-1]}",
      }
    )

  return top_clusters
