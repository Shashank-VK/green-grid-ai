from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def analyze(location):
    r = client.post(
        "/api/v1/analyze",
        json={
            "location": location,
            "land_owned": True,
            "grid_rows": 8,
            "grid_cols": 10,
            "analysis_mode": "deep",
        },
    )
    return r.status_code, r.json()


sj, j = analyze("Jayanagar")
sy, y = analyze("Yelahanka")
zr = client.get("/api/v1/zones")
z51 = client.get("/api/v1/zones/KA-51")

all_scored = all(
    "scores" in c and isinstance(c.get("final_score"), (int, float))
    for c in j.get("cells", [])
)
high_j = [c for c in j.get("cells", []) if c.get("final_score", 0) >= 8.0]
viable_y = [
    c
    for c in y.get("cells", [])
    if 6.0 <= c.get("final_score", 0) < 8.0 and c.get("existing_chargers_5km", 99) <= 3
]
severe = [
    c
    for c in j.get("cells", [])
    if c.get("flood_risk", {}).get("bbmp_severe") and c.get("final_score", 99) <= 4.0
]
clusters = j.get("top_clusters", [])

print("JAYANAGAR_STATUS", sj)
print("JAYANAGAR_CELLS", len(j.get("cells", [])))
print("ALL_SCORED", all_scored)
print("HIGH_PRIORITY", len(high_j))
print("CLUSTERS", len(clusters))
print("YELAHANKA_STATUS", sy)
print("YELAHANKA_VIABLE", len(viable_y))
print("SEVERE_CAPPED", len(severe))
print("ZONES_STATUS", zr.status_code)
print("ZONES_COUNT", zr.json().get("total_zones"))
print("KA51_STATUS", z51.status_code)
print("KA51_EVS", z51.json().get("total_evs"))
