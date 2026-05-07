from __future__ import annotations

import json
import logging
from typing import Any

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db_session
from app.models import AnalysisCache


router = APIRouter(tags=["chat"])
logger = logging.getLogger(__name__)

OPENROUTER_FREE_MODELS = [
  "openrouter/free",
  "google/gemma-3-4b-it:free",
  "openai/gpt-oss-20b:free",
  "openai/gpt-oss-120b:free",
  "nvidia/nemotron-3-nano-30b-a3b:free",
  "nvidia/nemotron-nano-9b-v2:free",
]


class ChatMessage(BaseModel):
  role: str
  content: str


class ChatRequest(BaseModel):
  session_id: str
  message: str
  history: list[ChatMessage] = Field(default_factory=list)


@router.post("/chat")
async def chat(payload: ChatRequest, session: AsyncSession = Depends(get_db_session)) -> dict[str, Any]:
  if not settings.openrouter_api_key:
    raise HTTPException(
      status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
      detail={"error": "OPENROUTER_NOT_CONFIGURED", "message": "OPENROUTER_API_KEY is missing in backend .env."},
    )

  result = await session.execute(select(AnalysisCache).where(AnalysisCache.session_id == payload.session_id))
  cache = result.scalar_one_or_none()
  if cache is None or not cache.result_json:
    raise HTTPException(
      status_code=status.HTTP_404_NOT_FOUND,
      detail={"error": "SESSION_NOT_FOUND", "message": "Analysis session was not found."},
    )

  analysis_data = json.loads(cache.result_json)
  system_prompt = _build_system_prompt(analysis_data)
  headers = {
    "Authorization": f"Bearer {settings.openrouter_api_key}",
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "greengrid",
  }
  messages = [{"role": "system", "content": system_prompt}]
  messages.extend({"role": item.role, "content": item.content} for item in payload.history[-8:])
  messages.append({"role": "user", "content": payload.message})
  attempt_errors: list[str] = []

  async with httpx.AsyncClient(timeout=20) as client:
    for model in OPENROUTER_FREE_MODELS:
      try:
        response = await client.post(
          "https://openrouter.ai/api/v1/chat/completions",
          headers=headers,
          json={"model": model, "messages": messages, "max_tokens": 500, "temperature": 0.2},
        )
        data = response.json()
        if response.status_code >= 400:
          error_message = (
            data.get("error", {}).get("message")
            if isinstance(data, dict)
            else None
          ) or response.text
          attempt_errors.append(f"{model} -> {response.status_code}: {error_message}")
          continue
        choices = data.get("choices", []) if isinstance(data, dict) else []
        if not choices:
          attempt_errors.append(f"{model} -> invalid response: missing choices")
          continue
        return {
          "reply": choices[0]["message"]["content"],
          "model_used": model,
          "tokens_used": data.get("usage", {}).get("total_tokens", 0),
        }
      except Exception as exc:
        attempt_errors.append(f"{model} -> exception: {exc}")
        continue

  logger.warning("OpenRouter chat failed for all models: %s", " | ".join(attempt_errors))
  raise HTTPException(
    status_code=status.HTTP_502_BAD_GATEWAY,
    detail={
      "error": "CHAT_PROVIDER_FAILED",
      "message": "OpenRouter did not return a response from available free models.",
      "attempts": attempt_errors,
    },
  )

def _build_system_prompt(analysis_data: dict[str, Any]) -> str:
  zone = analysis_data.get("rto_zone", {})
  clusters = analysis_data.get("top_clusters", [])
  best_cluster = clusters[0] if clusters else {}
  recommendation = best_cluster.get("charger_recommendation", {})
  cost = best_cluster.get("cost_estimate", {})
  timeline = best_cluster.get("timeline", {})
  growth = analysis_data.get("growth_projection", {})
  return (
    "You are the greengrid assistant. Answer concisely using only this analysis context. "
    f"Location: {analysis_data.get('location', {}).get('name')}. "
    f"RTO: {zone.get('code')} {zone.get('name')} with {zone.get('total_evs')} EVs. "
    f"Best cluster: {best_cluster.get('label')} cells {best_cluster.get('cell_ids')} avg score {best_cluster.get('avg_score')}. "
    f"Recommended charger: {recommendation.get('label')}. "
    f"Cost estimate: Rs {cost.get('total_min')} to Rs {cost.get('total_max')}. "
    f"Timeline: {timeline.get('total_weeks')} weeks. "
    f"Growth projection: {growth.get('projected')}. "
    "If asked for ROI, explain that greengrid has not modeled revenue yet and give directional factors."
  )
