from __future__ import annotations

import asyncio
import time
from typing import Any

import httpx

from app.services.rto_detector import haversine_distance_meters


class PlacesClient:
  def __init__(self, api_key: str):
    self.api_key = api_key
    self.base_url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
    self.semaphore = asyncio.Semaphore(5)
    self.cache: dict[str, tuple[float, list[dict[str, Any]]]] = {}
    self.cache_ttl = 86400

  async def _query(
    self,
    lat: float,
    lng: float,
    radius: int,
    type_filter: str | None = None,
    keyword: str | None = None,
  ) -> list[dict[str, Any]]:
    if not self.api_key:
      raise RuntimeError("GOOGLE_MAPS_API_KEY is not configured.")

    cache_key = f"{round(lat, 3)}_{round(lng, 3)}_{radius}_{type_filter}_{keyword}"
    cached = self.cache.get(cache_key)
    now = time.time()
    if cached and now - cached[0] < self.cache_ttl:
      return cached[1]

    params: dict[str, Any] = {
      "location": f"{lat},{lng}",
      "radius": radius,
      "key": self.api_key,
    }
    if type_filter:
      params["type"] = type_filter
    if keyword:
      params["keyword"] = keyword

    async with self.semaphore:
      async with httpx.AsyncClient(timeout=10) as client:
        for attempt in range(3):
          response = await client.get(self.base_url, params=params)
          if response.status_code == 429:
            await asyncio.sleep(2**attempt)
            continue
          response.raise_for_status()
          payload = response.json()
          status = payload.get("status")
          if status == "OVER_QUERY_LIMIT":
            raise RuntimeError("QUOTA_EXCEEDED")
          if status not in {"OK", "ZERO_RESULTS"}:
            raise RuntimeError(f"Places API returned {status}: {payload.get('error_message', '')}")
          results = payload.get("results", [])
          self.cache[cache_key] = (now, results)
          return results

    raise RuntimeError("Places API rate limited after retries.")

  async def find_ev_chargers(self, lat: float, lng: float, radius: int = 5000) -> list[dict[str, Any]]:
    results = await self._query(lat, lng, radius, type_filter="electric_vehicle_charging_station")
    return [
      {
        "place_id": item.get("place_id", ""),
        "name": item.get("name", "EV charging station"),
        "lat": item.get("geometry", {}).get("location", {}).get("lat"),
        "lng": item.get("geometry", {}).get("location", {}).get("lng"),
        "vicinity": item.get("vicinity", ""),
      }
      for item in results
      if item.get("geometry", {}).get("location")
    ]

  async def find_pois(self, lat: float, lng: float, radius: int = 1000) -> dict[str, int]:
    query_map = {
      "restaurants": "restaurant",
      "malls": "shopping_mall",
      "hotels": "lodging",
      "theaters": "movie_theater",
    }
    responses = await asyncio.gather(
      *[self._query(lat, lng, radius, type_filter=type_name) for type_name in query_map.values()],
      return_exceptions=True,
    )
    return {
      key: 0 if isinstance(response, Exception) else len(response)
      for key, response in zip(query_map.keys(), responses)
    }

  async def find_transformer(self, lat: float, lng: float, radius: int = 500) -> dict[str, Any]:
    for keyword in ("electrical substation", "BESCOM", "transformer"):
      results = await self._query(lat, lng, radius, keyword=keyword)
      nearest: dict[str, Any] | None = None
      nearest_distance = float("inf")
      for item in results:
        location = item.get("geometry", {}).get("location", {})
        item_lat = location.get("lat")
        item_lng = location.get("lng")
        if item_lat is None or item_lng is None:
          continue
        distance = haversine_distance_meters(lat, lng, float(item_lat), float(item_lng))
        if distance < nearest_distance:
          nearest_distance = distance
          nearest = {
            "found": True,
            "name": item.get("name", keyword),
            "distance_m": int(round(distance)),
            "lat": float(item_lat),
            "lng": float(item_lng),
          }
      if nearest is not None:
        return nearest

    return {"found": False, "name": "", "distance_m": 0, "lat": None, "lng": None}
