from __future__ import annotations

import base64
import json
import re
from textwrap import dedent
from pathlib import Path
from typing import Any

import httpx

from app.config import settings


VALID_MULTIPLIERS = [0.2, 1.0, 1.5]
VALID_LAND_USES = {
  "residential",
  "commercial",
  "industrial",
  "tech_park",
  "mall",
  "park",
  "water",
  "open_field",
  "highway",
}


def default_vision_analysis(cell_id: str) -> dict[str, Any]:
  return {
    "cell_id": cell_id,
    "land_use": "unknown",
    "vision_multiplier": 1.0,
    "flood_risk_score": 5,
    "tree_cover_score": 5,
    "visible_pois": [],
    "highway_visible": False,
    "notes": "Analysis unavailable",
  }


class GemmaClient:
  def __init__(
    self,
    host: str = "http://localhost:11434",
    model: str = "gemma4:e4b",
    timeout: int | float | None = None,
  ):
    self.host = host.rstrip("/")
    self.model = model
    self.generate_url = f"{self.host}/api/generate"
    self.timeout = timeout if timeout is not None else settings.vision_timeout

  async def analyze_image(self, image_path: str, cell_ids: list[str]) -> dict[str, dict[str, Any]]:
    """
    Sends image to Ollama Gemma 4 E4B with vision prompt.
    Returns dict mapping cell_id -> analysis object.
    """
    encoded_image = base64.b64encode(Path(image_path).read_bytes()).decode("utf-8")
    payload = {
      "model": self.model,
      "prompt": self._build_prompt(cell_ids),
      "images": [encoded_image],
      "stream": False,
      "format": "json",
    }

    async with httpx.AsyncClient(timeout=self.timeout) as client:
      response = await client.post(self.generate_url, json=payload)
      response.raise_for_status()

    raw_text = str(response.json().get("response", ""))
    return self._parse_response(raw_text, cell_ids)

  def _build_prompt(self, cell_ids: list[str]) -> str:
    return dedent(f"""
    You are a spatial analysis AI examining a satellite + terrain map of Bangalore, India.
    The image has a grid overlay. Each cell is labeled with a letter (row) and number (column), like A1, B2, C3.
    Each cell is exactly 500 meters × 500 meters.

    Analyze EACH visible grid cell and return a JSON array. For each cell:
    {{
      "cell_id": "A1",
      "land_use": "residential",
      "vision_multiplier": 1.0,
      "flood_risk_score": 1,
      "tree_cover_score": 2,
      "visible_pois": ["shops", "temple"],
      "highway_visible": false,
      "notes": "Standard residential street with small commercial"
    }}

    Rules:
    - land_use: MUST be one of: residential, commercial, industrial, tech_park, mall, park, water, open_field, highway
    - vision_multiplier: MUST be exactly 1.5, 1.0, or 0.2
      - 1.5 if mall, tech_park, or high-rise apartments visible
      - 1.0 if standard residential or mixed-use
      - 0.2 if park, lake, field, or dense forest visible
    - flood_risk_score: 1-10 (10 = very flood prone, look for blue low-lying areas)
    - tree_cover_score: 1-10 (10 = very dense trees)
    - visible_pois: List what you can see (shops, restaurants, temples, etc.)
    - highway_visible: true if major highway or ORR visible
    - notes: One sentence observation

    Only analyze these cells: {cell_ids}

    Return ONLY a valid JSON array. No markdown, no explanation, no code blocks.
    """).strip()

  def _parse_response(self, raw_text: str, expected_cells: list[str]) -> dict[str, dict[str, Any]]:
    """
    Robust JSON parser with markdown stripping, regex fallback, validation, and defaults.
    """
    cleaned = re.sub(r"```json\s*|```", "", raw_text).strip()
    parsed: Any | None = None

    try:
      parsed = json.loads(cleaned)
    except json.JSONDecodeError:
      match = re.search(r"\[.*\]", cleaned, re.DOTALL)
      if match:
        try:
          parsed = json.loads(match.group(0))
        except json.JSONDecodeError:
          return {}
      else:
        return {}

    if isinstance(parsed, dict) and isinstance(parsed.get("cells"), list):
      parsed = parsed["cells"]
    elif isinstance(parsed, dict) and "cell_id" in parsed:
      parsed = [parsed]
    if not isinstance(parsed, list):
      return {}

    expected_set = set(expected_cells)
    results: dict[str, dict[str, Any]] = {}
    for item in parsed:
      if not isinstance(item, dict):
        continue

      cell_id = str(item.get("cell_id", "")).upper()
      if cell_id not in expected_set:
        continue

      analysis = default_vision_analysis(cell_id)
      land_use = str(item.get("land_use", "unknown")).lower()
      analysis["land_use"] = land_use if land_use in VALID_LAND_USES else "unknown"
      analysis["vision_multiplier"] = self._nearest_multiplier(item.get("vision_multiplier", 1.0))
      analysis["flood_risk_score"] = self._clamp_score(item.get("flood_risk_score", 5))
      analysis["tree_cover_score"] = self._clamp_score(item.get("tree_cover_score", 5))
      analysis["visible_pois"] = self._normalize_pois(item.get("visible_pois", []))
      analysis["highway_visible"] = bool(item.get("highway_visible", False))
      analysis["notes"] = str(item.get("notes", "Analysis unavailable")).strip() or "Analysis unavailable"
      results[cell_id] = analysis

    for cell_id in expected_cells:
      results.setdefault(cell_id, default_vision_analysis(cell_id))

    return results

  def _nearest_multiplier(self, value: Any) -> float:
    try:
      numeric_value = float(value)
    except (TypeError, ValueError):
      numeric_value = 1.0
    return min(VALID_MULTIPLIERS, key=lambda multiplier: abs(multiplier - numeric_value))

  def _clamp_score(self, value: Any) -> int:
    try:
      numeric_value = int(round(float(value)))
    except (TypeError, ValueError):
      numeric_value = 5
    return max(1, min(10, numeric_value))

  def _normalize_pois(self, value: Any) -> list[str]:
    if not isinstance(value, list):
      return []
    return [str(item).strip() for item in value if str(item).strip()]
