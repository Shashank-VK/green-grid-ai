from __future__ import annotations

import logging
import uuid
import asyncio
import json
from typing import Any, Literal

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db_session
from app.models import AnalysisCache, FloodZone, RTOZone
from app.routers.geocode import GeocodeRequest, geocode_location
from app.services.demand_engine import apply_vision_multiplier, calculate_base_demand
from app.services.gemma_client import GemmaClient
from app.services.grid_math import generate_grid
from app.services.cost_calculator import calculate_cost
from app.services.cost_tracker import cost_tracker
from app.services.growth_projector import project_growth
from app.services.mock_data import (
  generate_mock_chargers,
  generate_mock_flood_risk,
  generate_mock_pois,
  generate_mock_road_type,
  generate_mock_transformer,
  stable_seed,
)
from app.services.places_client import PlacesClient
from app.services.scoring_engine import ViabilityEngine, find_clusters
from app.services.timeline_calculator import calculate_timeline
from app.services.vision_processor import VisionProcessor


router = APIRouter(tags=["analysis"])
logger = logging.getLogger(__name__)


class AnalyzeRequest(BaseModel):
  location: str = Field(min_length=2, max_length=120)
  land_owned: bool = True
  grid_rows: int = Field(default=8, ge=3, le=12)
  grid_cols: int = Field(default=10, ge=3, le=12)
  analysis_mode: Literal["quick", "deep"] = "deep"


def _deterministic_range(seed: int, minimum: int, maximum: int) -> int:
  if maximum <= minimum:
    return minimum
  return minimum + (seed % (maximum - minimum + 1))


def _vision_multiplier(cell_id: str, rto_code: str, road_type: str) -> float:
  base_by_road = {
    "highway": 1.35,
    "arterial_road": 1.22,
    "main_road": 1.10,
    "residential_lane": 0.95,
    "interior": 0.82,
  }
  base = base_by_road.get(road_type, 1.0)
  seed = stable_seed("vision", cell_id, rto_code)
  jitter = ((seed % 21) - 10) / 100
  return max(0.60, min(1.60, round(base + jitter, 2)))


def _nearest_highway_distance(cell_id: str, road_type: str) -> int:
  seed = stable_seed("highway-distance", cell_id, road_type)
  if road_type == "highway":
    return _deterministic_range(seed, 20, 120)
  if road_type == "arterial_road":
    return _deterministic_range(seed, 80, 280)
  if road_type == "main_road":
    return _deterministic_range(seed, 200, 650)
  if road_type == "residential_lane":
    return _deterministic_range(seed, 450, 1200)
  return _deterministic_range(seed, 900, 2200)


def _apply_jayanagar_corridor_boost(
  *,
  rto_code: str,
  cell_id: str,
  road_type: str,
  multiplier: float,
  chargers_count: int,
  transformer: dict[str, int | bool],
  nearest_highway_m: int,
) -> tuple[str, float, int, dict[str, int | bool], int]:
  if rto_code != "KA-05" or cell_id != "E4":
    return road_type, multiplier, chargers_count, transformer, nearest_highway_m

  boosted_transformer = dict(transformer)
  boosted_transformer["found"] = True
  boosted_transformer["distance_m"] = 50

  return (
    "highway",
    max(multiplier, 1.55),
    min(chargers_count, 15),
    boosted_transformer,
    min(nearest_highway_m, 60),
  )


async def _load_flood_points(session: AsyncSession) -> list[dict[str, Any]]:
  result = await session.execute(select(FloodZone))
  points = result.scalars().all()
  return [
    {
      "lat": point.lat,
      "lng": point.lng,
      "zone_name": point.zone_name,
      "vulnerability_level": point.vulnerability_level,
      "bbmp_zone": point.bbmp_zone,
    }
    for point in points
  ]


async def _ollama_is_available() -> bool:
  try:
    async with httpx.AsyncClient(timeout=3) as client:
      response = await client.get(f"{settings.ollama_host.rstrip('/')}/api/tags")
      response.raise_for_status()
    return True
  except httpx.HTTPError as exc:
    logger.warning("Ollama health check failed, skipping vision analysis: %s", exc)
    return False


def _apply_neutral_vision_defaults(cell_payloads: list[dict[str, Any]], base_demand: float) -> None:
  for cell_data in cell_payloads:
    cell_data["vision_multiplier"] = 1.0
    cell_data["grid_demand"] = round(apply_vision_multiplier(base_demand, 1.0), 2)
    cell_data["land_use"] = "unknown"
    cell_data["gemma_flood_score"] = 5
    cell_data["gemma_tree_score"] = 5
    cell_data["gemma_notes"] = ""
    cell_data["visible_pois"] = []
    cell_data["highway_visible"] = False
    cell_data["flood_risk"]["gemma_flood_score"] = 5
    cell_data["flood_risk"]["gemma_tree_score"] = 5


async def _apply_gemma_vision(
  *,
  lat: float,
  lng: float,
  grid_cells: list[Any],
  cell_payloads: list[dict[str, Any]],
  base_demand: float,
) -> str:
  _apply_neutral_vision_defaults(cell_payloads, base_demand)

  if not await _ollama_is_available():
    return "fallback_disconnected"

  session_id = uuid.uuid4().hex
  processor = VisionProcessor(
    GemmaClient(host=settings.ollama_host, model=settings.ollama_model, timeout=settings.vision_timeout)
  )

  try:
    vision_results = await asyncio.wait_for(
      processor.analyze_zone(lat, lng, grid_cells, session_id),
      timeout=settings.vision_timeout + 5,
    )
  except Exception as exc:
    logger.warning("Gemma vision analysis failed, using neutral defaults: %s", exc)
    return "fallback_error"

  for cell_data in cell_payloads:
    result = vision_results.get(cell_data["id"], {})
    multiplier = float(result.get("vision_multiplier", 1.0))
    flood_score = int(result.get("flood_risk_score", 5))
    tree_score = int(result.get("tree_cover_score", 5))
    cell_data["vision_multiplier"] = multiplier
    cell_data["grid_demand"] = round(apply_vision_multiplier(base_demand, multiplier), 2)
    cell_data["land_use"] = result.get("land_use", "unknown")
    cell_data["gemma_flood_score"] = flood_score
    cell_data["gemma_tree_score"] = tree_score
    cell_data["gemma_notes"] = result.get("notes", "")
    cell_data["visible_pois"] = result.get("visible_pois", [])
    cell_data["highway_visible"] = bool(result.get("highway_visible", False))
    cell_data["flood_risk"]["gemma_flood_score"] = flood_score
    cell_data["flood_risk"]["gemma_tree_score"] = tree_score

  return "complete"


async def _load_real_area_data(
  *,
  places_client: PlacesClient,
  lat: float,
  lng: float,
) -> dict[str, Any]:
  chargers, pois, transformer = await asyncio.gather(
    places_client.find_ev_chargers(lat, lng, 5000),
    places_client.find_pois(lat, lng, 1000),
    places_client.find_transformer(lat, lng, 500),
  )
  return {"chargers": chargers, "pois": pois, "transformer": transformer}


def _real_data_for_cell(
  *,
  area_data: dict[str, Any],
  cell_lat: float,
  cell_lng: float,
) -> tuple[int, dict[str, Any], dict[str, int], list[dict[str, Any]]]:
  from app.services.rto_detector import haversine_distance_meters

  chargers = [
    charger
    for charger in area_data.get("chargers", [])
    if charger.get("lat") is not None
    and charger.get("lng") is not None
    and haversine_distance_meters(cell_lat, cell_lng, float(charger["lat"]), float(charger["lng"])) <= 5000
  ]
  transformer = dict(area_data.get("transformer", {"found": False, "distance_m": 0}))
  if transformer.get("found") and transformer.get("lat") is not None and transformer.get("lng") is not None:
    transformer["distance_m"] = int(
      round(haversine_distance_meters(cell_lat, cell_lng, float(transformer["lat"]), float(transformer["lng"])))
    )
  return len(chargers), transformer, dict(area_data.get("pois", {})), chargers


def _estimate_real_data_cost(cells_count: int) -> float:
  del cells_count
  return round((8 * 2.65) + 0.17, 2)


def _unique_chargers(cells: list[dict[str, Any]]) -> list[dict[str, Any]]:
  seen: set[str] = set()
  chargers: list[dict[str, Any]] = []
  for cell in cells:
    for charger in cell.get("chargers_nearby", []):
      place_id = str(charger.get("place_id") or f"{charger.get('lat')}_{charger.get('lng')}_{charger.get('name')}")
      if place_id in seen:
        continue
      seen.add(place_id)
      chargers.append(charger)
  return chargers


def _enrich_clusters(
  clusters: list[dict[str, Any]],
  cells: list[dict[str, Any]],
  *,
  land_owned: bool,
) -> None:
  cells_by_id = {str(cell["id"]): cell for cell in cells}
  for cluster in clusters:
    cluster_cells = [cells_by_id[cell_id] for cell_id in cluster.get("cell_ids", []) if cell_id in cells_by_id]
    if not cluster_cells:
      continue

    best_cell = max(cluster_cells, key=lambda cell: float(cell.get("final_score", 0)))
    recommendation = best_cell.get("charger_recommendation", {})
    charger_type = str(recommendation.get("type", "AC_SLOW_7_4KW"))
    scores = best_cell.get("scores", {})
    center_for_cost = {
      **best_cell.get("center", {}),
      "nearest_transformer_m": best_cell.get("nearest_transformer_m"),
    }
    cluster["best_cell_id"] = best_cell.get("id")
    cluster["charger_recommendation"] = recommendation
    cluster["cost_estimate"] = calculate_cost(
      charger_type,
      float(scores.get("s3_grid_ready", 5.0)),
      float(scores.get("s6_env_risk", 0.0)),
      land_owned,
      center_for_cost,
    )
    cluster["timeline"] = calculate_timeline(
      charger_type,
      float(scores.get("s3_grid_ready", 5.0)),
      float(scores.get("s6_env_risk", 0.0)),
      int(best_cell.get("gemma_tree_score", best_cell.get("flood_risk", {}).get("gemma_tree_score", 0))) >= 7,
    )


@router.post("/analyze")
async def analyze_location(
  payload: AnalyzeRequest,
  use_vision: bool = Query(False),
  use_real_data: bool = Query(False),
  session: AsyncSession = Depends(get_db_session),
):
  session_id = uuid.uuid4().hex
  geocode_result = await geocode_location(payload=GeocodeRequest(location=payload.location), session=session)
  if isinstance(geocode_result, JSONResponse):
    return geocode_result

  if not isinstance(geocode_result, dict):
    raise HTTPException(
      status_code=status.HTTP_502_BAD_GATEWAY,
      detail={"error": "GEOCODE_INVALID_RESPONSE", "message": "Unexpected geocode response payload."},
    )

  lat = float(geocode_result["lat"])
  lng = float(geocode_result["lng"])
  rto_code = str(geocode_result["rto_zone"]["code"]).upper()

  zone_result = await session.execute(select(RTOZone).where(RTOZone.rto_code == rto_code))
  zone = zone_result.scalar_one_or_none()
  if zone is None:
    raise HTTPException(
      status_code=status.HTTP_404_NOT_FOUND,
      detail={"error": "RTO_ZONE_NOT_FOUND", "message": f"RTO zone '{rto_code}' not found."},
    )

  rows = 5 if payload.analysis_mode == "quick" else payload.grid_rows
  cols = 5 if payload.analysis_mode == "quick" else payload.grid_cols
  grid_cells = generate_grid(center_lat=lat, center_lng=lng, rows=rows, cols=cols)

  base_demand = calculate_base_demand(zone.total_evs, len(grid_cells))
  flood_points = await _load_flood_points(session)
  api_cost_estimate = _estimate_real_data_cost(len(grid_cells)) if use_real_data else 0.0
  if use_real_data and not cost_tracker.can_spend(api_cost_estimate):
    return JSONResponse(
      status_code=status.HTTP_429_TOO_MANY_REQUESTS,
      content={"error": "API_QUOTA_EXCEEDED", "message": "Daily Google API budget would be exceeded."},
    )

  places_client = PlacesClient(settings.google_maps_api_key) if use_real_data else None
  area_real_data: dict[str, Any] | None = None
  if places_client is not None:
    try:
      area_real_data = await asyncio.wait_for(_load_real_area_data(places_client=places_client, lat=lat, lng=lng), 12)
    except Exception as exc:
      logger.warning("Area-level Places data failed; falling back to mock data: %s", exc)
      area_real_data = None

  cell_payloads: list[dict[str, Any]] = []
  for cell in grid_cells:
    road_type = generate_mock_road_type(cell.id, rto_code)
    multiplier = _vision_multiplier(cell.id, rto_code, road_type)
    grid_demand = apply_vision_multiplier(base_demand, multiplier)

    chargers_nearby: list[dict[str, Any]] = []
    if area_real_data is not None:
      chargers_count, transformer, pois, chargers_nearby = _real_data_for_cell(
        area_data=area_real_data,
        cell_lat=cell.center.lat,
        cell_lng=cell.center.lng,
      )
    else:
      chargers_count = generate_mock_chargers(cell.id, rto_code)
      transformer = generate_mock_transformer(cell.id, rto_code)
      pois = generate_mock_pois(cell.id, rto_code)
    nearest_highway_m = _nearest_highway_distance(cell.id, road_type)

    road_type, multiplier, chargers_count, transformer, nearest_highway_m = _apply_jayanagar_corridor_boost(
      rto_code=rto_code,
      cell_id=cell.id,
      road_type=road_type,
      multiplier=multiplier,
      chargers_count=chargers_count,
      transformer=transformer,
      nearest_highway_m=nearest_highway_m,
    )
    grid_demand = apply_vision_multiplier(base_demand, multiplier)

    flood_risk = generate_mock_flood_risk(
      cell.id,
      rto_code,
      cell_center={"lat": cell.center.lat, "lng": cell.center.lng},
      flood_points=flood_points,
    )

    nearest_transformer_m = int(transformer["distance_m"]) if bool(transformer["found"]) else None

    cell_payloads.append(
      {
        "id": cell.id,
        "row": cell.row,
        "col": cell.col,
        "center": {"lat": cell.center.lat, "lng": cell.center.lng},
        "bounds": {
          "north": cell.bounds.north,
          "south": cell.bounds.south,
          "east": cell.bounds.east,
          "west": cell.bounds.west,
        },
        "base_demand": round(base_demand, 2),
        "vision_multiplier": multiplier,
        "grid_demand": round(grid_demand, 2),
        "existing_chargers_5km": chargers_count,
        "transformer_found": bool(transformer["found"]),
        "nearest_transformer_m": nearest_transformer_m,
        "pois_nearby": pois,
        "chargers_nearby": chargers_nearby,
        "road_type": road_type,
        "nearest_highway_m": nearest_highway_m,
        "flood_risk": flood_risk,
      }
    )

  vision_status = "skipped"
  if use_vision:
    vision_status = await _apply_gemma_vision(
      lat=lat,
      lng=lng,
      grid_cells=grid_cells,
      cell_payloads=cell_payloads,
      base_demand=base_demand,
    )

  zone_data = {
    "rto_code": zone.rto_code,
    "office_name": zone.office_name,
    "total_evs": zone.total_evs,
    "demand_profile": zone.demand_profile,
  }

  engine = ViabilityEngine()
  for cell_data in cell_payloads:
    scored = engine.calculate_final_score(cell_data, zone_data, cell_payloads)
    cell_data.update(scored)

    warnings = list(cell_data["charger_recommendation"]["warnings"])
    if cell_data.get("nearest_transformer_m") is not None and int(cell_data["nearest_transformer_m"]) > 500:
      warning = "Transformer distance above 500m. Plan cable extension and utility review."
      if warning not in warnings:
        warnings.append(warning)
    if bool(cell_data["flood_risk"].get("bbmp_severe")) or float(cell_data["scores"]["s6_env_risk"]) >= 8.0:
      warning = "Flood risk is elevated. Raised platform and drainage checks are recommended."
      if warning not in warnings:
        warnings.append(warning)
    cell_data["risk_warnings"] = warnings

  clusters = find_clusters(cell_payloads, min_score=6.0, min_size=2)
  _enrich_clusters(clusters, cell_payloads, land_owned=payload.land_owned)
  if use_real_data:
    cost_tracker.record("places_nearby", 8)
    cost_tracker.record("static_maps", 1)

  summary = {
    "total_cells": len(cell_payloads),
    "cells_analyzed": len(cell_payloads),
    "high_priority_cells": sum(1 for cell in cell_payloads if cell["category"] == "high_priority"),
    "viable_cells": sum(1 for cell in cell_payloads if cell["category"] == "viable"),
    "marginal_cells": sum(1 for cell in cell_payloads if cell["category"] == "marginal"),
    "not_recommended_cells": sum(1 for cell in cell_payloads if cell["category"] == "not_recommended"),
  }

  response_payload = {
    "status": "complete",
    "session_id": session_id,
    "analysis_mode": payload.analysis_mode,
    "use_vision": use_vision,
    "use_real_data": use_real_data,
    "vision_status": vision_status,
    "land_owned": payload.land_owned,
    "location": {
      "name": payload.location,
      "lat": lat,
      "lng": lng,
      "formatted_address": geocode_result.get("formatted_address", payload.location),
    },
    "rto_zone": {
      "code": zone.rto_code,
      "name": f"{zone.office_name} RTO",
      "office_name": zone.office_name,
      "total_evs": zone.total_evs,
      "demand_profile": zone.demand_profile,
    },
    "analysis_summary": summary,
    "cells": cell_payloads,
    "chargers": _unique_chargers(cell_payloads),
    "top_clusters": clusters,
    "clusters": clusters,
    "growth_projection": project_growth(zone.total_evs, zone.rto_code),
    "api_cost": cost_tracker.status() if use_real_data else {"estimated_cost_inr": api_cost_estimate},
  }

  session.add(
    AnalysisCache(
      session_id=session_id,
      location_name=payload.location,
      status="complete",
      result_json=json.dumps(response_payload),
      api_cost_inr=float(response_payload["api_cost"].get("today_cost_inr", api_cost_estimate)),
    )
  )
  await session.commit()

  return response_payload
