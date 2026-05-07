from __future__ import annotations

from typing import Any


EQUIPMENT_COSTS = {
  "AC_SLOW_7_4KW": {"hardware_min": 15000, "hardware_max": 55000, "install_min": 10000, "install_max": 25000},
  "AC_FAST_22KW": {"hardware_min": 80000, "hardware_max": 150000, "install_min": 75000, "install_max": 200000},
  "DC_FAST_50KW": {"hardware_min": 700000, "hardware_max": 1200000, "install_min": 300000, "install_max": 600000},
  "ULTRA_HUB_120KW": {"hardware_min": 1800000, "hardware_max": 3500000, "install_min": 800000, "install_max": 2500000},
}


def normalize_charger_type(charger_type: str | None) -> str:
  if not charger_type or charger_type == "NOT_RECOMMENDED":
    return "AC_SLOW_7_4KW"
  if charger_type.startswith("DC_FAST_50KW"):
    return "DC_FAST_50KW"
  if charger_type.startswith("AC_FAST_22KW"):
    return "AC_FAST_22KW"
  if charger_type.startswith("ULTRA_HUB_120KW"):
    return "ULTRA_HUB_120KW"
  return charger_type


def calculate_cost(
  charger_type: str,
  s3_score: float,
  s6_score: float,
  land_owned: bool,
  cell_center: dict[str, Any],
) -> dict[str, Any]:
  normalized_type = normalize_charger_type(charger_type)
  costs = EQUIPMENT_COSTS.get(normalized_type, EQUIPMENT_COSTS["AC_SLOW_7_4KW"])

  transformer_dist = cell_center.get("nearest_transformer_m")
  cabling_adder = max(0, (float(transformer_dist) - 50) / 100) * 150000 if transformer_dist else 0
  if s3_score <= 3 and not transformer_dist:
    cabling_adder = 350000

  flood_adder = 200000 if s6_score >= 8 else 0
  land_cost = 0 if land_owned else 50000

  total_min = costs["hardware_min"] + costs["install_min"] + cabling_adder + flood_adder + land_cost
  total_max = costs["hardware_max"] + costs["install_max"] + cabling_adder + flood_adder + land_cost

  return {
    "charger_type": normalized_type,
    "hardware_min": costs["hardware_min"],
    "hardware_max": costs["hardware_max"],
    "installation_min": costs["install_min"],
    "installation_max": costs["install_max"],
    "transformer_adder": round(cabling_adder),
    "flood_platform_adder": flood_adder,
    "land_cost": land_cost,
    "fame_ii_note": "FAME-II subsidy: Rs 5L-Rs 10L (verify current tranche at india.gov.in/fame)",
    "total_min": round(total_min),
    "total_max": round(total_max),
  }
