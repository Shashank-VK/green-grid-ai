import httpx
from fastapi import APIRouter

from app.config import settings


router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check() -> dict[str, str]:
  ollama_status = "disconnected"
  gemma_model = "not_found"

  try:
    async with httpx.AsyncClient(timeout=3) as client:
      response = await client.get(f"{settings.ollama_host.rstrip('/')}/api/tags")
      response.raise_for_status()
    ollama_status = "connected"
    model_names = [str(model.get("name", "")) for model in response.json().get("models", [])]
    if settings.ollama_model in model_names:
      gemma_model = settings.ollama_model
  except (httpx.HTTPError, ValueError):
    ollama_status = "disconnected"

  return {
    "status": "ok",
    "version": settings.app_version,
    "ollama": ollama_status,
    "gemma_model": gemma_model,
  }
