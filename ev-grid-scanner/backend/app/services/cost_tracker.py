from __future__ import annotations

from datetime import datetime


class APICostTracker:
  def __init__(self, daily_budget_inr: float = 1000.0):
    self.daily_budget_inr = daily_budget_inr
    self.today_cost = 0.0
    self.reset_date = datetime.now().date()

  def can_spend(self, cost_inr: float) -> bool:
    self._reset_if_needed()
    return (self.today_cost + cost_inr) <= self.daily_budget_inr

  def record(self, api_name: str, calls: int) -> None:
    self._reset_if_needed()
    rates = {"places_nearby": 2.65, "static_maps": 0.17, "geocoding": 0.42}
    cost = calls * rates.get(api_name, 0)
    self.today_cost += cost

  def status(self) -> dict[str, float]:
    self._reset_if_needed()
    return {
      "today_cost_inr": round(self.today_cost, 2),
      "daily_budget_inr": self.daily_budget_inr,
      "remaining_inr": round(self.daily_budget_inr - self.today_cost, 2),
    }

  def _reset_if_needed(self) -> None:
    today = datetime.now().date()
    if today != self.reset_date:
      self.today_cost = 0.0
      self.reset_date = today


cost_tracker = APICostTracker()
