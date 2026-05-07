from __future__ import annotations

from typing import Any

from app.services.cost_calculator import normalize_charger_type


BASE_TIMELINES = {
  "AC_SLOW_7_4KW": {"approval": 4, "civil": 4, "commissioning": 1, "total_weeks": "8-10"},
  "AC_FAST_22KW": {"approval": 8, "civil": 6, "commissioning": 2, "total_weeks": "16-20"},
  "DC_FAST_50KW": {"approval": 14, "civil": 10, "commissioning": 2, "total_weeks": "26-30"},
  "ULTRA_HUB_120KW": {"approval": 20, "civil": 16, "commissioning": 4, "total_weeks": "40-44"},
}


def calculate_timeline(charger_type: str, s3_score: float, s6_score: float, tree_flag: bool) -> dict[str, Any]:
  normalized_type = normalize_charger_type(charger_type)
  base = BASE_TIMELINES.get(normalized_type, BASE_TIMELINES["AC_SLOW_7_4KW"])
  approval = int(base["approval"])
  civil = int(base["civil"])
  commissioning = int(base["commissioning"])
  flags: list[str] = []

  if s3_score <= 3:
    approval += 12
    civil += 4
    flags.append("New transformer or grid augmentation likely")

  if s6_score >= 8:
    civil += 4
    flags.append("Raised platform design for flood mitigation")

  if tree_flag:
    approval += 12
    flags.append("Tree or forest department clearance may be needed")

  if normalized_type in ["DC_FAST_50KW", "ULTRA_HUB_120KW"]:
    flags.append("CEIG inspection required")

  if normalized_type in ["AC_FAST_22KW", "DC_FAST_50KW", "ULTRA_HUB_120KW"]:
    flags.append("Fire safety NOC recommended")

  total_min = approval + civil + commissioning
  total_max = total_min + 4

  return {
    "charger_type": normalized_type,
    "approval_weeks": approval,
    "civil_weeks": civil,
    "commissioning_weeks": commissioning,
    "total_weeks": f"{total_min}-{total_max}",
    "total_months": f"{round(total_min / 4.3, 1)}-{round(total_max / 4.3, 1)}",
    "flags": flags,
  }
