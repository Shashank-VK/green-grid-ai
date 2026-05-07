from __future__ import annotations

import numpy as np


def project_growth(current_evs: int, zone_rto_code: str) -> dict[str, object]:
  years = [2020, 2024, 2025]
  bangalore_evs = [7354, 100150, 91693]
  coeffs = np.polyfit(years, bangalore_evs, 2)

  future_years = [2026, 2027, 2028, 2030]
  city_projected = [max(0, float(np.polyval(coeffs, year))) for year in future_years]
  current_city_total = 210000
  polynomial_rates = [projection / current_city_total for projection in city_projected]

  flag = None
  if zone_rto_code in ["KA-50", "KA-43", "KA-53"]:
    flag = "RAPID_GROWTH_ZONE"
  elif current_evs > 15000:
    flag = "MARKET_MATURE"

  baseline_cagr = 0.24 if flag == "RAPID_GROWTH_ZONE" else 0.16 if flag == "MARKET_MATURE" else 0.20
  zone_projected: dict[str, int] = {}
  previous_value = current_evs
  for index, (year, polynomial_rate) in enumerate(zip(future_years, polynomial_rates), start=1):
    floor_multiplier = (1 + baseline_cagr) ** index
    projected_value = round(current_evs * max(polynomial_rate, floor_multiplier))
    if projected_value <= previous_value:
      projected_value = round(previous_value * 1.08)
    zone_projected[str(year)] = projected_value
    previous_value = projected_value

  return {
    "current_evs": current_evs,
    "projected": zone_projected,
    "growth_rate_cagr": round((zone_projected["2028"] / current_evs) ** (1 / 3) - 1, 2) if current_evs > 0 else 0,
    "flag": flag,
    "confidence": "medium",
  }
