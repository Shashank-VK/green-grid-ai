TABLE OF CONTENTS
Executive Summary
Strategic Context
Problem Definition
Target Users & Personas
Product Definition
Complete Feature Specification
Core Algorithm & Scoring Engine
Data Architecture
Technical Architecture
API Specification
UI/UX Design System
AI/ML Specifications
Backend Services Deep Dive
Frontend Component Architecture
Database Schema
Security & Privacy
Performance & Scalability
Error Handling & Edge Cases
Testing Strategy
Deployment & DevOps
Analytics & Monitoring
Post-Launch Roadmap
Appendices
1. EXECUTIVE SUMMARY
1.1 What We Are Building
EV GridSense is a location-intelligence web application that scientifically determines where to build EV charging stations in Bangalore. It combines satellite imagery analysis via local AI (Gemma 4 E4B), government RTO registration data, BBMP flood zone data, Google Maps infrastructure data, and BESCOM cost models to produce a numerical viability score (1–10) for any 500m×500m grid cell in the city.
1.2 Why It Matters
Bangalore has 210,000+ registered EVs across 17 RTO zones but charging infrastructure is distributed based on intuition, not data. BESCOM, Shell, Tata Power, and private developers need a tool that answers:
"If I install a 50kW DC fast charger at this exact intersection, will it be used? Will it flood in monsoon? How much will BESCOM charge me? How long until it's live?"
EV GridSense answers all four questions in under 60 seconds.
1.3 Success Criteria
Table
Metric	Target	Measurement
Analysis completion time	<60 seconds	Backend logs
Score accuracy vs ground truth	>80% correlation	Quarterly validation against installed stations
User task completion rate	>90%	Frontend analytics
API uptime	>99%	Uptime monitoring
Demo-to-stakeholder clarity	Immediate understanding	Qualitative feedback
1.4 Development Investment
Timeline: 18 weeks (revised from 14 — solo developer, part-time feasible)
Team: 1 full-stack developer (solo build)
Infrastructure: Local laptop deployment (zero cloud costs)
Running Costs: Google Maps API (~₹200/analysis), OpenRouter free tier
2. STRATEGIC CONTEXT
2.1 Market Landscape
Karnataka EV Statistics (2026):
Total EV registrations: 177,646 (2024), 169,704 (2025 to Nov)
Bangalore share: ~54% of state total
Public charging stations: 5,960+ operational
EV penetration rate: 11%+ (highest in India)
The Gap: Despite 5,960+ stations, the distribution is uneven. Electronic City (KA-51) has 6,000 EVs but only ~10 public chargers (600:1 ratio). Jayanagar (KA-05) has 23,000 EVs but is relatively better served. Yelahanka (KA-50) has 1,365 EVs today but is growing at 34% QoQ.
2.2 Competitive Landscape
Table
Competitor	Approach	Weakness
BESCOM EV Mitra App	Lists existing chargers only	No viability analysis, no planning tool
Google Maps	Shows charger locations	No scoring, no demand data, no cost estimates
Statiq/Bolt.Earth apps	CPO network maps	Only their own network, no neutral analysis
Traditional consultancies	Manual site surveys	₹5–15L per report, 4–8 weeks turnaround
EV GridSense	AI + data + cost + timeline	First comprehensive tool in India
2.3 Regulatory Environment
MoP EV Charging Guidelines (Jan 2022): Mandates CCS2 for 4W DC fast charging
CEA Regulations 2010: Safety standards for electrical installations
Karnataka EV Policy: Capital subsidy + electricity duty exemptions for public chargers
FAME-II Scheme: ₹5–10L subsidy for public DC fast chargers (verify current tranche)
BESCOM 2026 Single Window Clearance: 7–10 business days for standard load sanction
3. PROBLEM DEFINITION
3.1 Primary Problem
Range anxiety is structural, not technological. Consumers won't buy EVs if they can't see chargers where they drive. Infrastructure builders won't install chargers if they can't prove demand. Both sides need a shared source of truth — a neutral, data-backed viability score.
3.2 Problem Breakdown (5 Whys)
Why don't people buy EVs? Range anxiety.
Why is there range anxiety? Not enough public chargers.
Why aren't there enough chargers? Builders don't know where to build profitably.
Why don't they know? No tool combines demand data, infrastructure readiness, flood risk, and cost in one place.
Why not? Existing tools are either listing apps (passive) or expensive consultants (slow).
3.3 User Pain Points
For Government (BESCOM/BBMP):
No spatial view of EV density vs charger density
Flood zones and electrical infrastructure not overlaid
Approval timelines opaque to applicants
For Private Operators (Shell/Tata Power):
Site selection based on sales territory, not data
No visibility into competitor density
Cost estimation requires 3–4 separate vendor quotes
For Real Estate Developers:
EV amenity seen as checkbox, not revenue driver
No data on whether tenants actually own EVs
Don't know optimal charger type for their location
4. TARGET USERS & PERSONAS
4.1 Persona 1: Rajesh — BESCOM Urban Planner
Age: 45 | Role: Senior Engineer, BESCOM EV Cell
Goal: Identify 50 high-priority locations for government-funded charging hubs
Pain: Uses Excel + Google Maps manually. Takes 2 weeks per zone.
Needs: Batch analysis, PDF reports for government submission, flood zone overlay
Tech Comfort: Moderate. Uses GIS tools but finds them complex.
Quote: "I need to show my director exactly why Yelahanka needs 5 chargers, not 1."
4.2 Persona 2: Priya — Shell Business Development
Age: 34 | Role: BD Manager, Shell EV Infrastructure India
Goal: Find 20 viable sites in Bangalore for FY2027 rollout
Pain: Currently sends field teams to scout. ₹50K per site visit.
Needs: Cost estimates, competitor analysis, BESCOM timeline, shareable reports
Tech Comfort: High. Uses Tableau, Salesforce, expects polished UI.
Quote: "If I can shortlist 20 sites from my laptop, I save ₹10L in field visits."
4.3 Persona 3: Arun — Tech Park Facilities Manager
Age: 38 | Role: VP Facilities, Manyata Tech Park
Goal: Install EV charging as tenant amenity, justify CAPEX to board
Pain: Doesn't know how many employees own EVs or what charger type to install
Needs: Demand projection, charger recommendation, ROI estimate
Tech Comfort: Moderate. Uses dashboards but doesn't build them.
Quote: "My board wants numbers. How many EVs in 5km? What's the payback period?"
4.4 Persona 4: Dr. Mehta — Urban Planning Researcher
Age: 52 | Role: Professor, IISc Bangalore
Goal: Publish research on EV infrastructure equity in Indian cities
Pain: Data is fragmented across RTO, BBMP, BESCOM, private CPOs
Needs: Raw data export, methodology transparency, reproducible analysis
Tech Comfort: Very high. Wants API access, JSON exports, GitHub repo.
Quote: "I need to see your formula. Is it open? Can I cite it?"
5. PRODUCT DEFINITION
5.1 Product Type
Location-intelligence web application — deployed locally as a single-tenant desktop web app. No multi-user auth, no subscription model, and no managed cloud hosting required for v1.0. Internet access is required for Google Maps, Google Places, and optional OpenRouter chat features.
5.2 Core Value Proposition
"In 60 seconds, know exactly where, what type, and how much it costs to build an EV charging station in Bangalore."
5.3 Key Differentiators
Fixed Grid Tessellation: 500m×500m cells ensure consistent density math (not arbitrary radii)
Local AI Vision: Gemma 4 E4B runs on-device for vision analysis, while map, search, and POI enrichment use external internet APIs
Integrated Cost + Timeline: Not just "where" but "how much" and "how long"
Government Data + Private Data: RTO registrations + Google Places + BBMP flood zones
Cluster Recommendation: Recommends zones, not points (avoids building on private property)
5.4 What This Product Is NOT
NOT a charger management system (no OCPP, no billing, no session tracking)
NOT a navigation app for EV drivers (no route planning, no real-time availability)
NOT a multi-city tool (Bangalore-only for v1.0)
NOT a real estate valuation tool (land cost is guidance only, not appraisal)
NOT a BESCOM bill payment portal
5.5 User Journey Map
plain
Copy
DISCOVER → SEARCH → ANALYZE → REVIEW → DECIDE → SHARE

DISCOVER: User hears about tool (word of mouth, demo)
SEARCH: Types "Yelahanka" → map flies to location
ANALYZE: Clicks "Analyze Zone" → 60-second processing
REVIEW: Sees heatmap, top clusters, score breakdown
DECIDE: Downloads PDF report, discusses with team
SHARE: Shares report via WhatsApp/email, schedules site visit
6. COMPLETE FEATURE SPECIFICATION
6.1 Feature Hierarchy
plain
Copy
EV GridSense v1.0
├── CORE FEATURES (Must Have — Phase 1-3)
│   ├── Location Search & Geocoding
│   ├── Fixed Grid Overlay (500m tessellation)
│   ├── Satellite + Terrain Map Display
│   ├── 6-Factor Viability Scoring
│   ├── Gemma 4 Vision Analysis (Local AI)
│   ├── Google Places Integration (Chargers + POIs)
│   ├── BBMP Flood Zone Overlay
│   ├── Top Cluster Detection
│   ├── Viability Verdict (High Priority / Viable / Marginal / Not Recommended)
│   ├── Charger Type Recommendation
│   ├── Cost Estimation Engine
│   ├── BESCOM Timeline Calculator
│   └── PDF Report Generation
│
├── SUPPORTING FEATURES (Should Have — Phase 4-5)
│   ├── Future Growth Prediction Chart
│   ├── RTO Zone Comparison Table
│   ├── AI Chat Assistant (OpenRouter)
│   ├── Mobile Responsive Layout
│   ├── Map Screenshot Export (PNG)
│   ├── Competitor Operator Breakdown
│   └── Data Update Workflow
│
└── ADVANCED FEATURES (Nice to Have — Phase 6+)
    ├── Batch Analysis (multiple zones)
    ├── Custom Grid Size (250m / 1km toggle)
    ├── Sensitivity Analysis (what-if scores)
    ├── Heatmap Animation (time-lapse growth)
    └── API Key Usage Tracker
6.2 Feature Specification: Location Search
ID: F-001 | Priority: P0 | Phase: 1
Description: User types a Bangalore location. System geocodes it, validates it's within Bangalore bounds, and centers the map.
Acceptance Criteria:
[ ] Autocomplete suggestions from Google Places (Bangalore-biased)
[ ] "Use My Location" button (browser geolocation API)
[ ] RTO zone auto-detected from lat/lng (point-in-polygon check)
[ ] If location outside Bangalore → show error: "EV GridSense currently supports Bangalore only. Try: Koramangala, Whitefield, Electronic City..."
[ ] Recent searches cached in localStorage (last 10)
[ ] Search history dropdown
Error States:
Geocoding fails → "Could not find location. Check spelling or try a nearby landmark."
Location in Bangalore but no RTO data → "Location found but RTO data unavailable. Analysis will use city-wide averages."
Network error → "Connection issue. Please check internet and try again."
6.3 Feature Specification: Fixed Grid Overlay
ID: F-002 | Priority: P0 | Phase: 2
Description: A fixed 500m×500m grid is drawn over the map. Grid labels are A1, A2... (rows A-Z, cols 1-N). Grid never resizes with zoom.
Acceptance Criteria:
[ ] Grid cell size = exactly 500m × 500m at ground level
[ ] Grid drawn using Google Maps Polygon API (frontend) OR Pillow-generated overlay (backend)
[ ] Labels visible at zoom ≥ 14, hidden at zoom < 14
[ ] Grid color = semi-transparent white border (15% opacity)
[ ] Label font = JetBrains Mono, 10px, white, bold
[ ] Grid regenerates when new location searched
[ ] Default grid dimensions: 8 rows × 10 cols (4km × 5km coverage area)
Technical Constraint:
plain
Copy
At Bangalore latitude (~13°N):
1° latitude ≈ 110.57 km
1° longitude ≈ 110.32 km × cos(13°) ≈ 107.48 km

500m in degrees:
Δlat = 500 / 110570 ≈ 0.004522°
Δlng = 500 / 107480 ≈ 0.004652°
Edge Case: If searched location is near Bangalore edge (e.g., Devanahalli at north edge), grid may extend beyond city. Cells outside Bangalore bounds are flagged "Out of Zone" and scored as "Unknown."
6.4 Feature Specification: 6-Factor Scoring
ID: F-003 | Priority: P0 | Phase: 3
Description: Every grid cell receives a score from 1.0 to 10.0 based on 6 weighted factors.
Formula:
plain
Copy
Final Score = (S1 × 0.25) + (S2 × 0.15) + (S3 × 0.20) + (S4 × 0.15) + (S5 × 0.15) - (S6 × 0.10)
Score Display:
Raw score shown to 1 decimal place (e.g., 8.4)
Color-coded: Coral Red (8–10), Amber (6–7.9), Muted Green (4–5.9), Gray (1–3.9)
Verdict label: "HIGH PRIORITY" / "VIABLE" / "MARGINAL" / "NOT RECOMMENDED"
Score Breakdown UI:
Each factor shown as horizontal progress bar
Bar fill = score × 10%
Bar color = factor-appropriate (e.g., S6 risk bar is red even if score is low risk)
Weight label shown: "Demand Index (25%)"
Tooltip on hover: "Higher EV count in this RTO zone increases demand score"
6.5 Feature Specification: Gemma 4 Vision Analysis
ID: F-004 | Priority: P0 | Phase: 2
Description: Map screenshot sent to local Gemma 4 E4B model. Returns land use classification, flood risk, tree cover, and vision multiplier per cell.
Acceptance Criteria:
[ ] Screenshot captured via Google Static Maps API (satellite + terrain composite)
[ ] Grid overlay drawn by Pillow before sending to Gemma
[ ] Gemma runs via Ollama on localhost:11434
[ ] Response parsed as JSON array
[ ] Each cell gets: land_use, vision_multiplier, flood_risk_score, tree_cover_score, visible_pois, highway_visible, notes
[ ] Malformed JSON handled gracefully (fallback to defaults)
[ ] Vision multiplier applied to base demand calculation
[ ] Analysis shown in UI with Gemma's reasoning text
Performance:
Target: <15 seconds for 25-cell grid, <45 seconds for 80-cell grid
Timeout: 120 seconds
Fallback: If Gemma fails, all cells get multiplier 1.0, land_use "unknown"
Prompt Engineering:
See Section 12.2 for exact prompt template.
6.6 Feature Specification: Google Places Integration
ID: F-005 | Priority: P0 | Phase: 3
Description: Query Google Places API for EV chargers, restaurants, malls, and transformers near each grid cell.
Query Types:
plain
Copy
EV Chargers:     type=ev_charging_station, radius=5000m, location=cell_center
POIs:            type=restaurant|shopping_mall|department_store|movie_theater, radius=1000m
Transformers:    keyword="electrical substation" OR "transformer" OR "BESCOM", radius=500m
Roads:           type=route ( Roads API )
Rate Limiting:
Max 10 requests/second to Places API
Exponential backoff on 429 errors
Cache results per cell for 24 hours
"Quick Mode" uses cached data if available
Cost Management:
Display API cost estimate before analysis: "This analysis will use approximately ₹180 in Google API credits"
"Quick Scan" option: 5×5 grid (~25 Places calls = ~₹100)
"Deep Scan" option: 8×10 grid (~80 Places calls = ~₹300)
Daily usage cap: ₹1000 (configurable in .env)
6.7 Feature Specification: BBMP Flood Zone Overlay
ID: F-006 | Priority: P1 | Phase: 3
Description: Pre-loaded BBMP flood zone data (209 locations) rendered as colored polygons on the map.
Data Source:
58 severely vulnerable locations
151 moderately vulnerable locations
Stored in SQLite as lat/lng points with severity + zone name
Display:
Severe: Red polygon, 25% fill, red border
Moderate: Amber polygon, 20% fill, amber border
Click polygon → popup with BBMP zone name, severity, mitigation status
Scoring Impact:
Cell center within 500m of severe flood point → S6 = 8–10
Cell center within 500m of moderate flood point → S6 = 4–7
No nearby flood point → S6 from Gemma vision only
6.8 Feature Specification: Top Cluster Detection
ID: F-007 | Priority: P0 | Phase: 3
Description: Groups adjacent high-scoring cells into clusters. Recommends top 2–3 clusters as candidate sites.
Algorithm:
Python
Copy
def find_clusters(cells, min_score=6.0):
    high_score_cells = [c for c in cells if c.final_score >= min_score]
    visited = set()
    clusters = []

    for cell in high_score_cells:
        if cell.id in visited:
            continue
        cluster = bfs_neighbors(cell, high_score_cells, visited)
        if len(cluster) >= 2:  # Minimum 2 adjacent cells
            clusters.append(cluster)

    # Rank clusters
    clusters.sort(key=lambda c: (
        sum(cell.final_score for cell in c) / len(c),  # avg score
        len(c),  # size
        max(cell.s5_strategic_access for cell in c)  # best access
    ), reverse=True)

    return clusters[:3]
Display:
Cluster boundary highlighted with dashed coral border (2px, animated)
Cluster label: "Cluster 1: B2–C3 (Avg Score: 8.1)"
Click cluster → zoom to fit bounds
Cluster card in sidebar: cells list, avg score, recommended charger, cost range
6.9 Feature Specification: Charger Type Recommendation
ID: F-008 | Priority: P0 | Phase: 3
Description: Based on final score + commercial value + strategic access, recommend specific charger type.
Decision Matrix:
Table
Final Score	S4 Commercial	S5 Strategic	Recommendation
8–10	High (mall/tech park)	Any	DC Fast 50kW+ (CCS2) — Highway rest stops, malls, tech parks
8–10	Low	High (highway)	DC Fast 50kW+ (CCS2) — Highway priority
6–7.9	High	Any	AC Fast 22kW (3-phase, Type 2) — Malls, offices, hotels
6–7.9	Low	Low	AC Fast 22kW — Residential complexes, apartments
4–5.9	Any	Any	AC Slow 7.4kW (Type 2) — Gated communities, homes
1–3.9	Any	Any	NOT RECOMMENDED — Monitor only
Additional Logic:
If S3 (Grid Readiness) < 3 AND charger = DC Fast → add warning: "Transformer upgrade required. Add 8–12 weeks + ₹2–5L."
If S6 (Env Risk) ≥ 8 → add warning: "Flood zone. Raised platform required. Add ₹2–4L."
If highway visible (S5 = 10) AND score ≥ 8 → recommend dual-gun (CCS2 + optional CHAdeMO)
6.10 Feature Specification: Cost Estimation Engine
ID: F-009 | Priority: P0 | Phase: 4
Description: Calculates equipment + installation + transformer + land costs.
Inputs:
Charger recommendation (from F-008)
Grid Readiness score (transformer distance)
Land ownership status (user toggle)
Flood risk flag (from S6)
Equipment Costs (2026 INR, hardcoded):
Table
Package	Power	Hardware (Min–Max)	Installation (Min–Max)
Residential	3.3–7.4kW AC	₹15K–₹55K	₹10K–₹25K
Retail/Mall	22kW AC	₹80K–₹1.5L	₹75K–₹2L
Highway DC	50kW DC	₹7L–₹12L	₹3L–₹6L
Ultra Hub	120kW+ DC	₹18L–₹35L	₹8L–₹25L
Additional Costs:
plain
Copy
Transformer cabling adder = max(0, (transformer_distance_m - 50) / 100) × ₹1,50,000
Flood platform adder = ₹2,00,000 if S6 >= 8 else ₹0
Land cost (rental) = area_sqft × rate_per_sqft × 12 months
  High-density: ₹800–₹1,500/sqft/month
  Peripheral: ₹150–₹400/sqft/month
Land cost (owned) = ₹0
Space Requirements:
Residential: 20 sqft per bay
Retail: 60 sqft for 2–4 chargers
Highway: 150 sqft minimum
Ultra Hub: 2,000+ sqft
FAME-II Subsidy:
If DC Fast selected → show note: "FAME-II subsidy: ₹5L–₹10L (verify current tranche at india.gov.in/fame)"
Deduct from total in report, but show as "conditional"
UI Display:
Cost shown as range: "₹9,00,000 – ₹18,00,000"
Breakdown accordion: Equipment | Installation | Transformer | Land | Total
Land toggle: "I own this land" / "I need to rent/buy"
If land owned → land section shows ₹0 with green check
6.11 Feature Specification: BESCOM Timeline Calculator
ID: F-010 | Priority: P1 | Phase: 4
Description: Estimates realistic approval + construction timeline.
Base Timelines (2026 BESCOM Guidelines):
Table
Station Type	Approval	Civil	Commissioning	Total
Small (2–4 AC)	4–6 weeks	4–6 weeks	1 week	2–3 months
Medium (4–8 mixed)	8–10 weeks	4–6 weeks	1–2 weeks	4–5 months
Large (8+ DC)	14–20 weeks	8–12 weeks	2 weeks	6–9 months
Modifiers:
Grid Readiness Score 1–3 (no transformer): +8–12 weeks
Tree cutting required (S6 tree flag): +12 weeks (Forest Dept permit)
Flood zone (S6 ≥ 8): +4 weeks (raised platform design)
CEIG approval (>20kW or 3-phase): +2–4 weeks (mandatory, 30-day statutory)
Fire Safety NOC (enclosed parking): +1–2 weeks
UI Display:
Horizontal Gantt-style bar
Segments: Load Sanction → CEIG → Fire NOC → Civil → Install → Live
Each segment colored by phase
Total weeks shown prominently
Warning flags for delay risks
6.12 Feature Specification: PDF Report Generation
ID: F-011 | Priority: P0 | Phase: 4
Description: Generates professional PDF report for stakeholder sharing.
Report Sections:
Cover Page: EV GridSense logo, location name, grid ID, date, session ID
Executive Summary: 3-bullet takeaway, overall verdict, best cluster
Map View: Satellite image with grid overlay, top cluster highlighted
Score Breakdown: Table of all cells with scores + color coding
Top Clusters: Detailed cards for top 3 clusters
Recommendation: Charger type, power, connector, rationale
Cost Estimate: Itemized table with min/max ranges
Timeline: Gantt bar with phase breakdown
Risk Assessment: Flood, tree, transformer, access risks
Future Growth: 5-year projection chart (as embedded image)
Data Sources: RTO data date, BBMP source, Google Maps attribution
Disclaimer: "Estimates only. Verify with BESCOM and licensed contractors."
Technical:
Generated via ReportLab (Python) — not jsPDF
Map image embedded as PNG
Charts embedded as PNG (matplotlib generated)
File name: EV-Grid-Report-{location}-{date}.pdf
File size target: <2MB
6.13 Feature Specification: Future Growth Prediction
ID: F-012 | Priority: P1 | Phase: 4
Description: Projects EV growth for the zone over 1, 3, 5 years.
Method:
Python
Copy
# Polynomial regression (degree 2) on available data
years = [2020, 2024, 2025]
bangalore_evs = [7354, 100150, 91693]
coeffs = np.polyfit(years, bangalore_evs, 2)

# Project
future_years = [2026, 2027, 2028, 2030]
projected = [np.polyval(coeffs, y) for y in future_years]

# Zone-level: apply city growth rate to zone base
zone_growth_rate = projected / current_city_total
zone_projected = zone_current_evs * zone_growth_rate
Special Flags:
If zone is Yelahanka/Devanahalli/KR Puram → flag "RAPID_GROWTH_ZONE"
If zone growth >50% YoY → flag "INFRASTRUCTURE URGENT"
If zone is saturated (score 1–3 for most cells) → flag "MARKET MATURE"
UI:
Recharts area chart
X-axis: Years | Y-axis: Projected EVs
Shaded confidence interval (±15%)
Current count shown as dot
Hover tooltip: "2028: ~12,400 EVs projected"
6.14 Feature Specification: AI Chat Assistant
ID: F-013 | Priority: P1 | Phase: 5
Description: OpenRouter-powered chat that understands the current analysis context.
Context Injection:
plain
Copy
System: You are EV GridSense Advisor. Current analysis:
- Location: {location}
- RTO: {rto_code} ({rto_name})
- Total EVs: {total_evs}
- Best Cluster: {cluster_id} (Avg Score: {avg_score})
- Recommended Charger: {charger_type}
- Estimated Cost: {cost_range}
- Timeline: {timeline_weeks}
Answer questions about this analysis. Be concise and actionable.
Starter Questions (UI buttons):
"Why is this cluster scoring high?"
"What charger type should I install?"
"How much will BESCOM approval cost?"
"Is this location flood-prone?"
"What's the ROI timeline?"
Model: OpenRouter free tier: google/gemma-3-4b-it:free or mistralai/mistral-7b-instruct:free
UI:
Slide-up panel from bottom (mobile) / slide-out from right (desktop)
User messages: right-aligned, coral background
AI messages: left-aligned, dark background
Typing indicator: three-dot pulse
Copy message button
Clear chat button
6.15 Feature Specification: Mobile Responsive Layout
ID: F-014 | Priority: P1 | Phase: 5
Breakpoints:
Desktop (>1280px): 3-column (Sidebar 250px | Map flex | Panel 320px)
Tablet (768–1280px): 2-column (Map + overlay panel)
Mobile (<768px): Stacked (Map 60vh → Score card → Chat → Report)
Mobile Interactions:
Map: Pinch zoom, double-tap to zoom, long-press to select cell
Bottom sheet for cell details (swipe up/down)
Floating action button for "Analyze"
Hamburger menu for sidebar
7. CORE ALGORITHM & SCORING ENGINE
7.1 Algorithm Overview
The scoring engine is the heart of EV GridSense. It transforms raw data into actionable intelligence through a deterministic, auditable pipeline.
plain
Copy
INPUTS → NORMALIZATION → SCORING → WEIGHTING → OUTPUT
Inputs:
RTO EV count (static, monthly updated)
Gemma vision analysis (land use, flood risk, tree cover)
Google Places data (chargers, POIs, transformers)
BBMP flood zones (static, annual updated)
User preferences (land owned, charger type override)
Normalization:
All raw scores mapped to 1.0–10.0 scale
Min-max normalization for demand index
Tiered thresholds for infrastructure gap
Distance-based scoring for grid readiness
Weighting:
Fixed weights (sum to 1.0, with S6 negative)
Weights are configurable via JSON config but default to specified values
Output:
Final score (1.0–10.0)
Verdict category
Charger recommendation
Cost estimate
Timeline estimate
7.2 Score 1: Demand Index (S1) — Weight 25%
Purpose: Measure EV demand density in the grid cell.
Calculation:
Python
Copy
def calculate_s1(grid_cell, rto_zone, max_demand_all_zones):
    # Step 1: Base demand
    base_demand = rto_zone.total_evs / rto_zone.total_grid_cells

    # Step 2: Apply vision multiplier from Gemma
    grid_demand = base_demand * grid_cell.vision_multiplier

    # Step 3: Vehicle type adjustment (if data available)
    if rto_zone.four_wheelers > 0:
        # 4W vehicles count 3x for DC fast charging demand
        fw_ratio = rto_zone.four_wheelers / rto_zone.total_evs
        grid_demand *= (1 + fw_ratio * 2)  # Up to 3x if all 4W

    # Step 4: Normalize to 1-10
    if max_demand_all_zones > 0:
        s1 = ((grid_demand - 0) / max_demand_all_zones) * 9 + 1
    else:
        s1 = 5.0  # Neutral if no comparison data

    return min(10.0, max(1.0, s1))
Vision Multiplier Rules (enforced by Gemma prompt):
Table
Land Use	Multiplier	Rationale
Mall, Tech Park, High-rise	1.5×	High EV ownership, dwell time
Residential, Commercial	1.0×	Average density
Park, Field, Water, Forest	0.2×	Near-zero demand
Industrial, Warehouse	0.5×	Low personal EV use
Highway, Arterial Road	0.8×	Transit, not destination
Example:
Yelahanka (KA-50): 1,365 EVs / 48 grids = 28.4 base
Gemma sees mall → 1.5× → 42.6 grid demand
Max demand in Bangalore = 481 (Jayanagar)
S1 = (42.6 / 481) × 9 + 1 = 1.8 → clamped to 1.8 (but this seems low...)
Correction: The normalization should use max GRID demand, not max base:
Python
Copy
# Better: normalize against the highest grid_demand in current analysis
max_grid_demand = max(c.grid_demand for c in all_cells_in_analysis)
s1 = ((grid_demand - min_grid_demand) / (max_grid_demand - min_grid_demand)) * 9 + 1
7.3 Score 2: Infrastructure Gap (S2) — Weight 15%
Purpose: Measure charger undersupply. More EVs per charger = higher need.
Calculation:
Python
Copy
def calculate_s2(grid_cell, rto_zone):
    chargers_5km = grid_cell.existing_chargers_5km

    if chargers_5km == 0:
        return 10.0  # Absolute priority

    # Use grid demand (not total RTO) for ratio
    ratio = grid_cell.grid_demand / chargers_5km

    # Tiered scoring
    if ratio >= 300:
        return 10.0
    elif ratio >= 100:
        return 9.0
    elif ratio >= 40:
        return 7.5
    elif ratio >= 20:
        return 5.0
    elif ratio >= 10:
        return 3.0
    else:
        return 1.0
Example:
Electronic City (KA-51): 5,954 EVs, ~10 chargers
Grid demand (with 1.5× mult): ~186
Ratio: 186 / 10 = 18.6 → S2 = 5.0 (moderate need)
If only 3 chargers: 186 / 3 = 62 → S2 = 7.5 (significant gap)
7.4 Score 3: Grid Readiness (S3) — Weight 20%
Purpose: Measure electrical infrastructure proximity.
Calculation:
Python
Copy
def calculate_s3(grid_cell):
    dist = grid_cell.nearest_transformer_m

    if dist is None:
        return 5.0  # Unknown, neutral

    if dist <= 50:
        return 10.0
    elif dist <= 150:
        return 8.0
    elif dist <= 300:
        return 6.0
    elif dist <= 500:
        return 4.0
    else:
        return 2.0
Transformer Search Strategy:
Query Google Places: keyword="BESCOM" OR "substation" OR "transformer"
If found, calculate haversine distance from cell center
If not found, query Google Maps "electrical substation near {lat},{lng}"
If still not found → None → score 5.0
Cost Impact Table (shown in report):
Table
Distance	S3 Score	Extra Cabling Cost	Timeline Impact
<50m	10	₹0	None
50–150m	8	₹1.5L	+1 week
150–300m	6	₹3.0L	+2 weeks
300–500m	4	₹4.5L	+3 weeks
>500m	2	₹7.5L+	+8–12 weeks (new transformer)
7.5 Score 4: Commercial Value (S4) — Weight 15%
Purpose: Measure dwell-time opportunities.
Calculation:
Python
Copy
def calculate_s4(grid_cell):
    pois = grid_cell.pois_nearby  # From Google Places
    score = 5.0  # Base

    # Count by type
    malls = count_pois(pois, ['shopping_mall'])
    restaurants = count_pois(pois, ['restaurant', 'cafe'])
    hotels = count_pois(pois, ['lodging'])
    theaters = count_pois(pois, ['movie_theater'])
    tech_parks = count_pois(pois, ['tech_park'])  # Custom type if available

    if malls >= 2 or tech_parks >= 1:
        score += 4.0
    elif malls == 1:
        score += 3.0

    if restaurants >= 5:
        score += 2.0
    elif restaurants >= 2:
        score += 1.0

    if hotels >= 2:
        score += 1.5

    if theaters >= 1:
        score += 1.0

    return min(10.0, score)
Dwell Time Logic:
Malls: 1–3 hours → AC 22kW ideal
Restaurants: 30–90 min → AC 22kW or DC 50kW
Highways: 15–30 min → DC 50kW+ mandatory
Offices: 8 hours → AC 7.4kW sufficient
7.6 Score 5: Strategic Access (S5) — Weight 15%
Purpose: Measure road accessibility for EVs.
Calculation:
Python
Copy
def calculate_s5(grid_cell):
    tags = grid_cell.land_use_tags
    score = 5.0

    if 'highway' in tags:
        score = 10.0
    elif 'arterial_road' in tags:
        score = 8.0
    elif 'main_road' in tags:
        score = 6.5
    elif 'residential_lane' in tags:
        score = 4.0
    elif 'interior' in tags or 'dead_end' in tags:
        score = 2.0

    # Google Roads API enhancement
    if grid_cell.nearest_highway_distance_m:
        dist = grid_cell.nearest_highway_distance_m
        if dist < 100:
            score = max(score, 9.0)
        elif dist < 300:
            score = max(score, 7.0)

    return min(10.0, score)
7.7 Score 6: Environmental Safety (S6) — Weight -10% (SUBTRACTED)
Purpose: Penalize flood-prone and tree-heavy locations.
Calculation:
Python
Copy
def calculate_s6(grid_cell, bbmp_flood_data):
    risk = 0.0

    # BBMP flood zone check
    nearest_flood = find_nearest_flood_point(grid_cell.center, bbmp_flood_data)
    if nearest_flood.distance_m < 500:
        if nearest_flood.severity == 'severe':
            risk += 8.0
        elif nearest_flood.severity == 'moderate':
            risk += 5.0

    # Gemma vision tree cover
    if grid_cell.gemma_tree_cover_score >= 7:
        risk += 3.0
    elif grid_cell.gemma_tree_cover_score >= 4:
        risk += 1.5

    # Gemma flood risk from satellite
    if grid_cell.gemma_flood_risk_score >= 7:
        risk += 2.0

    # Water body visible
    if 'water_body' in grid_cell.land_use_tags:
        risk += 2.0

    return min(10.0, risk)
Hard Gate Rule:
Python
Copy
# If severe flood risk, cap final score regardless of other factors
if grid_cell.is_bbmp_severe_flood_zone:
    final_score = min(final_score, 4.0)
    verdict = "NOT RECOMMENDED"
    warning = "Severe flood zone per BBMP. Installation requires raised platform + BBMP clearance."
7.8 Final Score Calculation
Python
Copy
def calculate_final_score(grid_cell, rto_zone, all_cells, bbmp_data):
    max_grid_demand = max(c.grid_demand for c in all_cells)

    s1 = calculate_s1(grid_cell, rto_zone, max_grid_demand)
    s2 = calculate_s2(grid_cell, rto_zone)
    s3 = calculate_s3(grid_cell)
    s4 = calculate_s4(grid_cell)
    s5 = calculate_s5(grid_cell)
    s6 = calculate_s6(grid_cell, bbmp_data)

    final = (
        s1 * 0.25 +
        s2 * 0.15 +
        s3 * 0.20 +
        s4 * 0.15 +
        s5 * 0.15 -
        s6 * 0.10
    )

    final = max(0.0, min(10.0, final))

    # Hard gates
    if grid_cell.is_bbmp_severe_flood_zone:
        final = min(final, 4.0)

    # Verdict
    if final >= 8.0:
        verdict = "HIGH PRIORITY"
        category = "high_priority"
    elif final >= 6.0:
        verdict = "VIABLE"
        category = "viable"
    elif final >= 4.0:
        verdict = "MARGINAL"
        category = "marginal"
    else:
        verdict = "NOT RECOMMENDED"
        category = "not_recommended"

    return {
        "final_score": round(final, 1),
        "verdict": verdict,
        "category": category,
        "s1": round(s1, 1),
        "s2": round(s2, 1),
        "s3": round(s3, 1),
        "s4": round(s4, 1),
        "s5": round(s5, 1),
        "s6": round(s6, 1),
    }
7.9 Cluster Detection Algorithm
Python
Copy
from collections import deque

def get_neighbors(cell_id, all_cells_dict):
    """Get 8-directional neighbors (N, NE, E, SE, S, SW, W, NW)"""
    row, col = cell_id[0], int(cell_id[1:])
    neighbors = []
    for dr in [-1, 0, 1]:
        for dc in [-1, 0, 1]:
            if dr == 0 and dc == 0:
                continue
            nr = chr(ord(row) + dr)
            nc = col + dc
            nid = f"{nr}{nc}"
            if nid in all_cells_dict:
                neighbors.append(all_cells_dict[nid])
    return neighbors

def find_clusters(cells, min_score=6.0, min_size=2):
    cells_dict = {c.id: c for c in cells}
    high_score = {c.id: c for c in cells if c.final_score >= min_score}
    visited = set()
    clusters = []

    for cell_id in high_score:
        if cell_id in visited:
            continue

        # BFS
        cluster = []
        queue = deque([cell_id])
        visited.add(cell_id)

        while queue:
            current_id = queue.popleft()
            cluster.append(cells_dict[current_id])

            for neighbor in get_neighbors(current_id, cells_dict):
                if neighbor.id in high_score and neighbor.id not in visited:
                    visited.add(neighbor.id)
                    queue.append(neighbor.id)

        if len(cluster) >= min_size:
            clusters.append(cluster)

    # Rank clusters
    def cluster_score(cluster):
        avg_score = sum(c.final_score for c in cluster) / len(cluster)
        size_bonus = min(len(cluster) * 0.2, 1.0)  # Up to +1 for large clusters
        access_score = max(c.s5_strategic_access for c in cluster)
        return (avg_score + size_bonus) * 0.7 + access_score * 0.3

    clusters.sort(key=cluster_score, reverse=True)
    return clusters[:3]
8. DATA ARCHITECTURE
8.1 Data Classification
Table
Category	Data Type	Source	Update Frequency	Storage
Static Master	RTO EV counts	Manual (your data)	Monthly/Quarterly	SQLite
Static Master	BBMP flood zones	BBMP/KSNDMC	Annual	SQLite
Static Master	RTO boundaries	Derived from locality lists	Rarely	SQLite
Static Config	Cost tables	Market research	Quarterly	JSON files
Static Config	Timeline rules	BESCOM 2026 guidelines	Annual	JSON files
Live API	Geocoding	Google Geocoding API	Per request	None (transient)
Live API	Map images	Google Static Maps API	Per request	Cached 24h
Live API	POI data	Google Places API	Per request	Cached 24h
Live API	Charger data	Google Places API	Per request	Cached 24h
AI Generated	Vision analysis	Gemma 4 E4B (local)	Per request	Cached per session
User Input	Location, preferences	User	Per session	localStorage
Derived	Scores, clusters, reports	System	Per session	SQLite (cache)
8.2 Data Flow Diagram
plain
Copy
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  USER INPUT     │     │  EXTERNAL APIs  │     │  LOCAL AI       │
│  Location       │────▶│  Google Maps    │────▶│  Gemma 4 E4B    │
│  Land owned?    │     │  Places API     │     │  (Ollama)       │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FASTAPI BACKEND                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ Geocode     │  │ Maps Fetch  │  │ Grid Engine │             │
│  │ Service     │  │ Service     │  │ (Pillow)    │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         │                │                │                     │
│         ▼                ▼                ▼                     │
│  ┌─────────────────────────────────────────────────────┐       │
│  │              ANALYSIS PIPELINE                       │       │
│  │  1. Determine RTO zone from lat/lng                 │       │
│  │  2. Load RTO EV data from SQLite                    │       │
│  │  3. Fetch satellite + terrain images                │       │
│  │  4. Draw grid overlay with Pillow                   │       │
│  │  5. Send to Gemma for vision analysis               │       │
│  │  6. Query Google Places for chargers/POIs           │       │
│  │  7. Check BBMP flood zones                          │       │
│  │  8. Calculate 6-factor scores                       │       │
│  │  9. Detect clusters                                 │       │
│  │  10. Calculate costs + timeline                     │       │
│  │  11. Project future growth                          │       │
│  └─────────────────────────────────────────────────────┘       │
│         │                                                       │
│         ▼                                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ SQLite DB   │  │ PDF Gen     │  │ Cache       │             │
│  │ (Store)     │  │ (ReportLab) │  │ (Session)   │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│  NEXT.JS FRONTEND│
│  Map display    │
│  Score cards    │
│  Chat panel     │
│  PDF download   │
└─────────────────┘
8.3 Data Quality Standards
RTO EV Data:
Source: Vahan portal or direct RTO records
Validation: Total EVs must equal sum of 2W + 3W + 4W + others (if breakdown available)
Freshness: Display last_updated date prominently
If data >6 months old → show warning: "RTO data is 8 months old. Scores may not reflect current demand."
BBMP Flood Zones:
Source: BBMP 2025–2026 assessment (209 points)
Validation: All points within Bangalore bounding box
If point outside bounds → log error, skip point
Google Places Data:
Validation: Must return within 5 seconds or timeout
Deduplication: Same charger found in multiple cells → count once per cell
If API returns zero results → retry once, then assume zero
Gemma Vision Output:
Validation: JSON must contain all required keys
If key missing → use default value
If cell_id not in expected set → discard
If vision_multiplier not in [0.2, 1.0, 1.5] → clamp to nearest valid value
9. TECHNICAL ARCHITECTURE
9.1 System Architecture Diagram
plain
Copy
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌───────────┐ │
│  │ Browser     │  │ Next.js 14  │  │ Tailwind    │  │ Zustand   │ │
│  │ (Chrome/FF) │  │ App Router  │  │ CSS         │  │ State     │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────┬─────┘ │
│         │                │                │               │       │
│  ┌──────▼────────────────▼────────────────▼───────────────▼──────┐ │
│  │                    GOOGLE MAPS JS API                          │ │
│  │  - Interactive map display                                     │ │
│  │  - Polygon overlays (grid cells, flood zones)                  │ │
│  │  - Marker rendering (chargers, POIs)                           │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTP/REST (JSON)
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      API GATEWAY (FastAPI)                           │
│  Uvicorn ASGI server | CORS enabled | Auto-generated OpenAPI docs   │
│  Port: 8000 | Python 3.11+ | Async endpoints                        │
└─────────────────────────────────────────────────────────────────────┘
                                    │
            ┌───────────────────────┼───────────────────────┐
            ▼                       ▼                       ▼
┌───────────────────┐   ┌───────────────────┐   ┌───────────────────┐
│   AI LAYER        │   │   EXTERNAL APIs   │   │   DATA LAYER      │
│                   │   │                   │   │                   │
│  Ollama Server    │   │  Google Maps      │   │  SQLite Database  │
│  localhost:11434  │   │  Platform APIs:   │   │  ev_grid.db       │
│                   │   │                   │   │                   │
│  Model: Gemma     │   │  - Geocoding      │   │  Tables:          │
│  4 E4B            │   │  - Static Maps    │   │  - rto_ev_data    │
│                   │   │  - Places         │   │  - flood_zones    │
│  Input: PNG       │   │  - Roads          │   │  - rto_boundaries │
│  Output: JSON     │   │                   │   │  - analysis_cache │
│                   │   │  OpenRouter API   │   │                   │
│                   │   │  (Chat only)      │   │  JSON Configs:    │
│                   │   │                   │   │  - cost_tables    │
│                   │   │                   │   │  - timelines      │
└───────────────────┘   └───────────────────┘   └───────────────────┘
9.2 Technology Choices & Justifications
Table
Layer	Technology	Version	Why This Choice
Frontend Framework	Next.js	14.x (App Router)	SSR for SEO, file-based routing, API routes for proxying, React Server Components
Styling	Tailwind CSS	3.4+	Utility-first, dark mode with dark: prefix, rapid prototyping, small bundle
State Management	Zustand	4.5+	Lightweight (<1KB), no boilerplate, TypeScript-friendly, persists to localStorage
Maps	Google Maps JS API	v3	Best India coverage, Places integration, polygon overlays, Street View
Charts	Recharts	2.x	React-native, responsive, easy theming, good for growth projections
PDF Export	ReportLab (Python)	3.6+	Programmatic PDF generation, embeds images, professional output
Backend	FastAPI	0.110+	Async Python, auto OpenAPI docs, Pydantic validation, Uvicorn ASGI
Database	SQLite	3.45+	Zero config, single file, ACID, Python stdlib support
ORM	SQLAlchemy	2.0+	Mature, async support, migration tools (Alembic if needed)
Image Processing	Pillow (PIL)	10.x	Grid drawing, image compositing, text rendering
AI Vision	Ollama + Gemma	4b	Local, free, no data leaves laptop, vision-capable
AI Chat	OpenRouter API	v1	Free tier models, proxy to multiple providers, no local RAM usage
HTTP Client	HTTPX (Python)	0.27+	Async, faster than requests, HTTP/2 support
Math/ML	NumPy + SciPy	1.26+	Polynomial regression for growth projection
Dev Tool	Cursor AI	Latest	AI-assisted coding, speeds up solo development
9.3 What We Are NOT Using
Table
Technology	Why Not
MongoDB	Overkill for 10 RTOs + 209 flood points. SQLite is simpler.
PostgreSQL	Requires setup, daemon, credentials. SQLite is zero-config.
Redis	No distributed caching needed. In-memory dict sufficient.
Docker	Adds complexity. Local deployment targets laptop directly.
Kubernetes	Massive overkill for single-user local app.
TensorFlow/PyTorch	Gemma runs via Ollama. No custom model training.
Redux	Zustand is simpler and sufficient.
Material UI	Tailwind gives more control. shadcn/ui components if needed.
jsPDF	ReportLab produces better PDFs with embedded images.
10. API SPECIFICATION
10.1 API Design Principles
RESTful with resource-oriented URLs
JSON request/response bodies
Async endpoints where AI or external APIs are involved
Cached where appropriate (session-based analysis results)
Versioned via URL path (/api/v1/...)
Documented via FastAPI auto-generated OpenAPI/Swagger UI at /docs
10.2 Endpoint Reference
POST /api/v1/analyze
Description: Main analysis pipeline. Triggers full scoring for a location.
Request:
JSON
Copy
{
  "location": "Yelahanka, Bangalore",
  "land_owned": true,
  "grid_rows": 8,
  "grid_cols": 10,
  "analysis_mode": "deep",  // "quick" (5x5) or "deep" (8x10)
  "include_growth": true,
  "include_chat_context": true
}
Response (202 Accepted + polling):
JSON
Copy
{
  "session_id": "sess_abc123def456",
  "status": "processing",
  "estimated_seconds": 45,
  "poll_url": "/api/v1/analyze/sess_abc123def456/status"
}
Poll Response (200 OK when complete):
JSON
Copy
{
  "session_id": "sess_abc123def456",
  "status": "complete",
  "location": {
    "name": "Yelahanka",
    "lat": 13.1007,
    "lng": 77.5963,
    "formatted_address": "Yelahanka, Bengaluru, Karnataka"
  },
  "rto_zone": {
    "code": "KA-50",
    "name": "Yelahanka RTO",
    "total_evs": 1365,
    "demand_profile": "Rapid Residential Growth"
  },
  "analysis_summary": {
    "total_cells": 80,
    "cells_analyzed": 80,
    "high_priority_cells": 3,
    "viable_cells": 12,
    "marginal_cells": 25,
    "not_recommended_cells": 40,
    "api_cost_inr": 185.50,
    "analysis_duration_seconds": 42
  },
  "cells": [
    {
      "id": "B3",
      "center": {"lat": 13.1052, "lng": 77.5981},
      "bounds": {"north": 13.1075, "south": 13.1029, "east": 77.6004, "west": 77.5958},
      "scores": {
        "s1_demand": 4.2,
        "s2_infra_gap": 9.1,
        "s3_grid_ready": 6.5,
        "s4_commercial": 7.0,
        "s5_strategic": 8.0,
        "s6_env_risk": 2.0
      },
      "final_score": 7.8,
      "verdict": "VIABLE",
      "category": "viable",
      "charger_recommendation": "AC_FAST_22KW",
      "gemma_analysis": {
        "land_use": "residential",
        "vision_multiplier": 1.0,
        "flood_risk_score": 2,
        "tree_cover_score": 3,
        "visible_pois": ["small shops", "pharmacy"],
        "highway_visible": false,
        "notes": "Standard residential area with some commercial activity"
      },
      "infrastructure": {
        "existing_chargers_5km": 3,
        "nearest_transformer_m": 180,
        "transformer_found": true,
        "pois_nearby": {
          "restaurants": 4,
          "malls": 0,
          "hotels": 1,
          "theaters": 0
        }
      },
      "flood_risk": {
        "bbmp_zone": "Yelahanka",
        "severity": "none",
        "distance_to_nearest_flood_m": 2500
      }
    }
  ],
  "top_clusters": [
    {
      "cluster_id": 1,
      "cell_ids": ["B2", "B3", "C2", "C3"],
      "avg_score": 8.1,
      "verdict": "HIGH_PRIORITY",
      "charger_recommendation": "DC_FAST_50KW",
      "cost_estimate": {
        "hardware_min": 700000,
        "hardware_max": 1200000,
        "installation_min": 300000,
        "installation_max": 600000,
        "transformer_adder": 225000,
        "flood_platform_adder": 0,
        "land_cost_note": "Land owned by user — ₹0",
        "fame_ii_subsidy_note": "FAME-II subsidy: ₹5L–₹10L (verify current tranche)",
        "total_min": 1225000,
        "total_max": 2025000
      },
      "timeline": {
        "approval_weeks": "10–14",
        "civil_weeks": "4–6",
        "commissioning_weeks": "1–2",
        "total_weeks": "15–22",
        "total_months": "4–5.5",
        "flags": ["CEIG approval required", "Fire Safety NOC required"]
      },
      "bounds": {
        "north": 13.1075,
        "south": 13.0983,
        "east": 77.6028,
        "west": 77.5936
      }
    }
  ],
  "growth_projection": {
    "current_evs": 1365,
    "projected": {
      "2026": 2800,
      "2027": 5900,
      "2028": 12400,
      "2030": 45000
    },
    "growth_rate_cagr": 0.84,
    "flag": "RAPID_GROWTH_ZONE",
    "confidence": "medium"
  },
  "report_url": "/api/v1/report/sess_abc123def456",
  "chat_context": {
    "system_prompt": "You are EV GridSense Advisor. Current analysis: Location Yelahanka, RTO KA-50, 1365 EVs, Best Cluster B2-C3 (Avg 8.1), DC Fast 50kW recommended, Cost ₹12.25L–₹20.25L, Timeline 4–5.5 months."
  }
}
Error Response (400 Bad Request):
JSON
Copy
{
  "error": "LOCATION_OUTSIDE_BANGALORE",
  "message": "The location 'Mumbai' is outside Bangalore. EV GridSense currently supports Bangalore only.",
  "suggested_locations": ["Koramangala", "Whitefield", "Electronic City"]
}
Error Response (429 Too Many Requests):
JSON
Copy
{
  "error": "API_QUOTA_EXCEEDED",
  "message": "Daily Google API budget of ₹1000 exceeded. Analysis paused. Contact administrator.",
  "quota_used_today_inr": 1000.00,
  "quota_reset_time": "2026-04-25T00:00:00Z"
}
GET /api/v1/analyze/{session_id}/status
Description: Poll analysis progress.
Response:
JSON
Copy
{
  "session_id": "sess_abc123def456",
  "status": "processing",  // "queued" | "processing" | "complete" | "failed"
  "progress_percent": 65,
  "current_step": "Querying Google Places for POIs (cell 45/80)",
  "estimated_seconds_remaining": 18
}
GET /api/v1/zones
Description: List all RTO zones.
Response:
JSON
Copy
{
  "zones": [
    {
      "rto_code": "KA-50",
      "office_name": "Yelahanka RTO",
      "total_evs": 1365,
      "demand_profile": "Rapid Residential Growth",
      "major_localities": ["Yelahanka", "Yelahanka New Town", "Jakkur"],
      "last_updated": "2026-03-15"
    }
  ],
  "total_zones": 17,
  "total_evs_bangalore": 210000
}
GET /api/v1/zones/{rto_code}
Description: Detailed zone data.
Response:
JSON
Copy
{
  "rto_code": "KA-50",
  "office_name": "Yelahanka RTO",
  "total_evs": 1365,
  "two_wheelers": 0,
  "four_wheelers": 0,
  "others": 0,
  "demand_profile": "Rapid Residential Growth",
  "major_localities": ["Yelahanka", "Yelahanka New Town", "Jakkur", "Thanisandra"],
  "representative_pincodes": ["560064", "560092", "560077"],
  "growth_flag": "RAPID_GROWTH",
  "last_updated": "2026-03-15"
}
GET /api/v1/zones/{rto_code}/growth
Description: EV growth projection for zone.
Response:
JSON
Copy
{
  "rto_code": "KA-50",
  "current_evs": 1365,
  "projected": {
    "2026": {"value": 2800, "confidence_low": 2400, "confidence_high": 3200},
    "2027": {"value": 5900, "confidence_low": 4800, "confidence_high": 7000},
    "2028": {"value": 12400, "confidence_low": 9500, "confidence_high": 15300},
    "2030": {"value": 45000, "confidence_low": 30000, "confidence_high": 60000}
  },
  "method": "polynomial_regression_degree_2",
  "data_points_used": 3,
  "flag": "RAPID_GROWTH_ZONE",
  "recommendation": "Future-proof with DC fast chargers. Current low EV count is temporary."
}
POST /api/v1/chat
Description: AI chat assistant.
Request:
JSON
Copy
{
  "session_id": "sess_abc123def456",
  "message": "Why is cluster B2-C3 scoring high?",
  "history": [
    {"role": "user", "content": "What charger should I install?"},
    {"role": "assistant", "content": "Based on the analysis..."}
  ]
}
Response:
JSON
Copy
{
  "reply": "Cluster B2-C3 scores 8.1 because: (1) Infrastructure Gap is severe — only 3 chargers serve 1,365 EVs in the zone, (2) Strategic Access is strong — near arterial roads, (3) Commercial Value is high — 4 restaurants and 1 hotel within 1km. The main limitation is Grid Readiness (6.5) — the nearest transformer is 180m away, adding ₹2.25L to cabling costs.",
  "model_used": "google/gemma-3-4b-it:free",
  "tokens_used": 245
}
GET /api/v1/report/{session_id}
Description: Download PDF report.
Response: Binary PDF file with Content-Type: application/pdf and Content-Disposition: attachment; filename="EV-Grid-Report-Yelahanka-2026-04-24.pdf"
GET /api/v1/report/{session_id}/preview
Description: Get report metadata without downloading.
Response:
JSON
Copy
{
  "session_id": "sess_abc123def456",
  "location": "Yelahanka",
  "generated_at": "2026-04-24T14:32:00Z",
  "file_size_bytes": 1843200,
  "pages": 8,
  "download_url": "/api/v1/report/sess_abc123def456",
  "expires_at": "2026-05-24T14:32:00Z"
}
GET /api/v1/health
Description: Health check.
Response:
JSON
Copy
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2026-04-24T14:32:00Z",
  "services": {
    "database": "connected",
    "ollama": "connected",
    "google_maps": "connected"
  },
  "uptime_seconds": 86400
}
10.3 Rate Limiting
Table
Endpoint	Limit	Window
POST /analyze	10	per hour
POST /chat	30	per hour
GET /report/*	50	per hour
GET /zones	100	per hour
Why: Google Places API costs money. Rate limiting prevents accidental budget burn.
10.4 Authentication
v1.0: No authentication. Single-user local deployment. API is open on localhost.
Future: If deployed to network, add simple API key auth via X-API-Key header.
11. UI/UX DESIGN SYSTEM
11.1 Design Philosophy
Anthropic-Inspired Warm Dark Dashboard
Warm near-black backgrounds (not cold blue-gray)
Coral/terracotta accent for CTAs and highlights
Cream/off-white text for readability
Muted secondary text for hierarchy
Data-dense but breathable — information-rich without clutter
Core Principles:
Map-First: The interactive map is the hero. Everything else supports it.
Color-Coded Clarity: At a glance, know what's viable (green), risky (amber), or no-go (red).
Progressive Disclosure: Summary first, drill down into detail.
Action-Oriented: Every viable cluster has a clear "Generate Report" CTA.
Mobile-Last-But-Not-Never: Desktop is primary, but mobile must be fully functional.
11.2 Color Tokens
css
Copy
:root {
  /* Base Surfaces */
  --bg-primary:     #0E0D0C;   /* Near-black, warm */
  --bg-secondary:   #1A1815;   /* Card backgrounds */
  --bg-tertiary:    #252220;   /* Elevated cards, modals */
  --bg-hover:       #2E2B27;   /* Hover states */
  --border-subtle:  #2E2B27;   /* Subtle separators */
  --border-strong:  #3D3935;   /* Stronger borders */

  /* Brand */
  --brand-primary:  #D97757;   /* Coral — CTAs, highlights */
  --brand-hover:    #C4603E;   /* Darker coral */
  --brand-glow:     rgba(217, 119, 87, 0.15);

  /* Text */
  --text-primary:   #F5F0E8;   /* Warm cream */
  --text-secondary: #9E9589;   /* Muted warm gray */
  --text-tertiary:  #6B6660;   /* Very muted */
  --text-inverse:   #0E0D0C;   /* Text on light bg */

  /* Score Colors */
  --score-high:     #C95F5F;   /* 8–10: High Priority */
  --score-viable:   #D4933A;   /* 6–7.9: Viable */
  --score-marginal: #5A9E6F;   /* 4–5.9: Marginal */
  --score-low:      #4A4845;   /* 1–3.9: Not Recommended */

  /* Semantic */
  --success:        #5A9E6F;
  --warning:        #D4933A;
  --danger:         #C95F5F;
  --info:           #5A8FD4;

  /* Grid Overlay */
  --grid-high:      rgba(201, 95, 95, 0.40);
  --grid-viable:    rgba(212, 147, 58, 0.40);
  --grid-marginal:  rgba(90, 158, 111, 0.30);
  --grid-low:       rgba(74, 72, 69, 0.25);
  --grid-border:    rgba(245, 240, 232, 0.15);
}
11.3 Typography
css
Copy
--font-display:  'Space Grotesk', sans-serif;   /* Headers, numbers */
--font-body:     'Inter', sans-serif;            /* Body, UI labels */
--font-mono:     'JetBrains Mono', monospace;    /* Scores, coordinates */

/* Scale */
--text-xs:    0.75rem;   /* 12px — footnotes */
--text-sm:    0.875rem;  /* 14px — secondary */
--text-base:  1rem;      /* 16px — body */
--text-lg:    1.125rem;  /* 18px — panel headings */
--text-xl:    1.25rem;   /* 20px — section titles */
--text-2xl:   1.5rem;    /* 24px — page titles */
--text-3xl:   1.875rem;  /* 30px — big numbers */
--text-4xl:   2.25rem;   /* 36px — hero numbers */
11.4 Layout Specifications
Desktop (>1280px):
plain
Copy
┌─────────────────────────────────────────────────────────────┐
│ HEADER (56px)                                               │
│ [Logo] EV GridSense    [Search Bar]    [Bangalore, KA] [?] │
├──────────┬──────────────────────────────┬───────────────────┤
│          │                              │                   │
│ SIDEBAR  │      MAP CANVAS              │   RIGHT PANEL     │
│ (250px)  │      (flex: 1)               │   (320px)         │
│          │                              │                   │
│ Zones    │   Google Maps JS             │   Score Summary   │
│ Analytics│   + Grid Overlay             │   Score Breakdown │
│ Reports  │   + Flood Zones              │   Top Clusters    │
│ Chat     │   + Charger Markers          │   Cost Estimate   │
│ Settings │                              │   Timeline        │
│          │                              │   [PDF Button]    │
│          │                              │                   │
└──────────┴──────────────────────────────┴───────────────────┘
│ FOOTER (32px) — Data sources, disclaimer                   │
└─────────────────────────────────────────────────────────────┘
Tablet (768–1280px):
Sidebar collapses to icons-only (64px)
Right panel becomes overlay (slides in from right)
Map takes remaining space
Mobile (<768px):
Header: Logo + hamburger menu + search icon
Map: 60vh full width
Bottom sheet: Swipe up for score summary
Full-screen panels for details
FAB (Floating Action Button) for "Analyze"
11.5 Component Specifications
Score Badge:
plain
Copy
Background: score color at 15% opacity
Border: 1px solid score color at 60% opacity
Border-radius: 6px
Padding: 8px 16px
Font: JetBrains Mono 14px bold, score color
Text: "8.4 / 10" + "HIGH PRIORITY" label below
Score Progress Bar:
plain
Copy
Track: --bg-tertiary, height 6px, radius 3px
Fill: gradient from --brand-primary to score color
Width: score × 10%
Label left: Inter 14px --text-secondary
Value right: JetBrains Mono 14px --text-primary
Grid Cell (on Map):
plain
Copy
Fill: score color at 40% opacity
Border: 1px solid white at 15% opacity
Hover: fill opacity 60%, border 2px solid white at 80%
Selected: white border 3px, box-shadow glow
Label: JetBrains Mono 10px bold white, top-left of cell
Cluster Highlight:
plain
Copy
Border: 2px dashed --brand-primary
Border-radius: 4px
Animation: dash-offset 2s linear infinite (marching ants)
Label: --brand-primary background, white text, top-center
Chat Message:
plain
Copy
User: right-aligned, --brand-primary background, --text-inverse text
AI: left-aligned, --bg-tertiary background, --text-primary text
Font: Inter 14px, line-height 1.6
Padding: 12px 16px
Border-radius: 12px (user: 12px 12px 4px 12px, AI: 12px 12px 12px 4px)
Max-width: 80%
11.6 Animation Specifications
Table
Animation	Duration	Easing	Trigger
Grid cell fade-in	50ms stagger	ease-out	Analysis complete
Score bar fill	600ms	cubic-bezier(0.4, 0, 0.2, 1)	Panel open
Panel slide	300ms	cubic-bezier(0.4, 0, 0.2, 1)	Click cell
Map fly-to	600ms	ease-in-out	Search location
Chat typing	1.5s loop	ease-in-out	AI processing
PDF button pulse	2s loop	ease-in-out	Analysis complete
Cluster border	2s loop	linear	Always (subtle)
Loading spinner	1s loop	linear	Analysis running
11.7 Loading States
Analysis Loading:
Full-screen overlay with spinner (coral ring)
Text: "Analyzing Yelahanka..."
Subtext: "Step 3/6: Querying Google Places for charging stations"
Progress bar at bottom
Cancel button (stops analysis, returns to map)
Skeleton Screens:
Score panel: 6 gray bars pulsing
Cluster cards: 3 rectangles with rounded corners
Chat: 3 gray message bubbles
12. AI/ML SPECIFICATIONS
12.1 Gemma 4 E4B Vision Analysis
Model: Gemma 4 E4B via local runtime (Ollama-compatible local deployment)
Hardware: Local laptop (CPU or GPU if available)
Endpoint: POST http://localhost:11434/api/generate
Timeout: 120 seconds
Input: PNG image (satellite + terrain composite with grid overlay)
Output: JSON array of cell analyses
Prompt Template:
plain
Copy
You are a spatial analysis AI examining a satellite + terrain map of Bangalore, India.
The image has a grid overlay. Each cell is labeled with a letter (row) and number (column), like A1, B2, C3.
Each cell is exactly 500 meters × 500 meters.

Analyze EACH visible grid cell and return a JSON array. For each cell:
{
  "cell_id": "A1",
  "land_use": "residential",
  "vision_multiplier": 1.0,
  "flood_risk_score": 1,
  "tree_cover_score": 2,
  "visible_pois": ["shops", "temple"],
  "highway_visible": false,
  "notes": "Standard residential street with small commercial"
}

Rules:
- land_use: MUST be one of: residential, commercial, industrial, tech_park, mall, park, water, open_field, highway
- vision_multiplier: MUST be exactly 1.5, 1.0, or 0.2
  - 1.5 if mall, tech_park, or high-rise apartments visible
  - 1.0 if standard residential or mixed-use
  - 0.2 if park, lake, field, or dense forest visible
- flood_risk_score: 1–10 (10 = very flood prone, look for blue low-lying areas)
- tree_cover_score: 1–10 (10 = very dense trees)
- visible_pois: List what you can see (shops, restaurants, temples, etc.)
- highway_visible: true if major highway or ORR visible
- notes: One sentence observation

Return ONLY a valid JSON array. No markdown, no explanation, no code blocks.
Response Parsing:
Python
Copy
import json
import re

def parse_gemma_response(raw_text: str, expected_cells: list) -> dict:
    """Parse Gemma output safely."""
    # Strip markdown backticks
    cleaned = re.sub(r'```json\s*|\s*```', '', raw_text).strip()

    # Try direct JSON parse
    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError:
        # Try extracting JSON array via regex
        match = re.search(r'\[.*\]', cleaned, re.DOTALL)
        if match:
            try:
                data = json.loads(match.group())
            except:
                data = []
        else:
            data = []

    # Validate and normalize
    result = {}
    for item in data:
        cell_id = item.get("cell_id", "")
        if cell_id not in expected_cells:
            continue

        # Clamp multiplier
        mult = float(item.get("vision_multiplier", 1.0))
        mult = min(1.5, max(0.2, mult))
        if mult not in [0.2, 1.0, 1.5]:
            mult = min([0.2, 1.0, 1.5], key=lambda x: abs(x - mult))

        result[cell_id] = {
            "land_use": item.get("land_use", "unknown"),
            "vision_multiplier": mult,
            "flood_risk_score": min(10, max(1, int(item.get("flood_risk_score", 5)))),
            "tree_cover_score": min(10, max(1, int(item.get("tree_cover_score", 5)))),
            "visible_pois": item.get("visible_pois", []),
            "highway_visible": bool(item.get("highway_visible", False)),
            "notes": item.get("notes", ""),
        }

    # Fill missing cells with defaults
    for cell_id in expected_cells:
        if cell_id not in result:
            result[cell_id] = {
                "land_use": "unknown",
                "vision_multiplier": 1.0,
                "flood_risk_score": 5,
                "tree_cover_score": 5,
                "visible_pois": [],
                "highway_visible": False,
                "notes": "Analysis unavailable",
            }

    return result
Batching Strategy:
For grids >25 cells, batch into groups of 9 (3×3 sections)
Send 3–4 batches sequentially
Merge results
Reduces context window pressure on Gemma
12.2 OpenRouter Chat Configuration
Endpoint: POST https://openrouter.ai/api/v1/chat/completions
Models (free tier):
Primary: google/gemma-3-4b-it:free
Fallback: mistralai/mistral-7b-instruct:free
Fallback 2: huggingfaceh4/zephyr-7b-beta:free
System Prompt:
plain
Copy
You are EV GridSense Advisor, an expert in EV charging infrastructure planning for Bangalore.
You have access to the following analysis context:
- Location: {location}
- RTO Zone: {rto_code} ({rto_name})
- Total EVs in zone: {total_evs}
- Best cluster: {cluster_id} (cells: {cell_ids})
- Cluster average score: {avg_score}/10
- Recommended charger: {charger_type}
- Estimated cost: {cost_range}
- BESCOM timeline: {timeline}
- Future growth: {growth_projection}

Answer user questions concisely and accurately. Use INR for costs. Use months for timelines.
If asked about something outside the analysis context, say "I don't have that information in the current analysis."
Context Injection:
Full analysis JSON appended to system prompt (truncated if >4000 tokens)
Last 10 messages maintained in history
Token limit: 4096 per request
13. BACKEND SERVICES DEEP DIVE
13.1 Service: Geocoder
File: backend/app/services/geocoder.py
Purpose: Convert location string to lat/lng and validate Bangalore bounds.
Python
Copy
import httpx
from typing import Tuple, Optional

BANGALORE_BOUNDS = {
    "north": 13.15,
    "south": 12.85,
    "east": 77.75,
    "west": 77.45
}

async def geocode_location(location: str, api_key: str) -> Tuple[float, float, str]:
    """Returns (lat, lng, formatted_address). Raises ValueError if outside Bangalore."""
    url = "https://maps.googleapis.com/maps/api/geocode/json"
    params = {"address": f"{location}, Bangalore, Karnataka", "key": api_key}

    async with httpx.AsyncClient() as client:
        res = await client.get(url, params=params, timeout=10)
        res.raise_for_status()
        data = res.json()

    if data["status"] != "OK":
        raise ValueError(f"Geocoding failed: {data['status']}")

    result = data["results"][0]
    lat = result["geometry"]["location"]["lat"]
    lng = result["geometry"]["location"]["lng"]
    formatted = result["formatted_address"]

    # Validate Bangalore bounds
    if not (BANGALORE_BOUNDS["south"] <= lat <= BANGALORE_BOUNDS["north"] and
            BANGALORE_BOUNDS["west"] <= lng <= BANGALORE_BOUNDS["east"]):
        raise ValueError(f"Location '{location}' is outside Bangalore.")

    return lat, lng, formatted
13.2 Service: Maps Fetcher
File: backend/app/services/maps_fetcher.py
Purpose: Fetch satellite and terrain images from Google Static Maps API.
Python
Copy
import httpx
from PIL import Image
from io import BytesIO

async def fetch_map_image(lat: float, lng: float, zoom: int, maptype: str, api_key: str, size: str = "800x600") -> Image.Image:
    url = "https://maps.googleapis.com/maps/api/staticmap"
    params = {
        "center": f"{lat},{lng}",
        "zoom": zoom,
        "size": size,
        "maptype": maptype,
        "key": api_key,
        "scale": 2  # Retina quality
    }

    async with httpx.AsyncClient() as client:
        res = await client.get(url, params=params, timeout=15)
        res.raise_for_status()
        img = Image.open(BytesIO(res.content))

    return img
13.3 Service: Grid Engine
File: backend/app/services/grid_engine.py
Purpose: Draw grid overlay on map image using Pillow.
Python
Copy
from PIL import Image, ImageDraw, ImageFont
from typing import List, Dict
import math

class GridEngine:
    CELL_SIZE_M = 500

    def __init__(self, center_lat: float, center_lng: float, rows: int = 8, cols: int = 10):
        self.center_lat = center_lat
        self.center_lng = center_lng
        self.rows = rows
        self.cols = cols
        self.dlat = self.CELL_SIZE_M / 110570  # degrees per meter
        self.dlng = self.CELL_SIZE_M / (110320 * math.cos(math.radians(center_lat)))

    def draw_grid(self, base_image: Image.Image) -> tuple:
        """Returns (labeled_image, cells_data)."""
        img = base_image.copy()
        draw = ImageDraw.Draw(img, 'RGBA')

        width, height = img.size
        cell_w = width / self.cols
        cell_h = height / self.rows

        cells = []
        row_labels = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

        for r in range(self.rows):
            for c in range(self.cols):
                x1 = c * cell_w
                y1 = r * cell_h
                x2 = (c + 1) * cell_w
                y2 = (r + 1) * cell_h

                cell_id = f"{row_labels[r]}{c + 1}"

                # Draw border
                draw.rectangle([x1, y1, x2, y2], outline=(255, 255, 255, 40), width=2)

                # Draw label
                try:
                    font = ImageFont.truetype("arial.ttf", 20)
                except:
                    font = ImageFont.load_default()
                draw.text((x1 + 8, y1 + 8), cell_id, fill=(255, 255, 255, 230), font=font)

                # Calculate real-world coordinates
                lat_north = self.center_lat + (self.rows/2 - r) * self.dlat
                lat_south = lat_north - self.dlat
                lng_west = self.center_lng - (self.cols/2 - c) * self.dlng
                lng_east = lng_west + self.dlng

                cells.append({
                    "id": cell_id,
                    "row": row_labels[r],
                    "col": c + 1,
                    "bounds": {"north": lat_north, "south": lat_south, "east": lng_east, "west": lng_west},
                    "center": {"lat": (lat_north + lat_south) / 2, "lng": (lng_east + lng_west) / 2},
                    "pixel_bounds": {"x1": x1, "y1": y1, "x2": x2, "y2": y2}
                })

        return img, cells
13.4 Service: Places Client
File: backend/app/services/places_client.py
Purpose: Query Google Places API with rate limiting and caching.
Python
Copy
import httpx
import asyncio
from typing import List, Dict
from functools import lru_cache

class PlacesClient:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
        self.semaphore = asyncio.Semaphore(10)  # Max 10 concurrent requests
        self.cache = {}  # Simple dict cache

    async def _query(self, lat: float, lng: float, radius: int, type_filter: str = None, keyword: str = None) -> List[Dict]:
        cache_key = f"{lat:.4f},{lng:.4f},{radius},{type_filter},{keyword}"
        if cache_key in self.cache:
            return self.cache[cache_key]

        params = {
            "location": f"{lat},{lng}",
            "radius": radius,
            "key": self.api_key
        }
        if type_filter:
            params["type"] = type_filter
        if keyword:
            params["keyword"] = keyword

        async with self.semaphore:
            async with httpx.AsyncClient() as client:
                res = await client.get(self.base_url, params=params, timeout=10)
                res.raise_for_status()
                data = res.json()

        results = data.get("results", [])
        self.cache[cache_key] = results
        return results

    async def find_ev_chargers(self, lat: float, lng: float, radius: int = 5000) -> List[Dict]:
        return await self._query(lat, lng, radius, type_filter="electric_vehicle_charging_station")

    async def find_pois(self, lat: float, lng: float, radius: int = 1000) -> Dict[str, int]:
        types = ["restaurant", "shopping_mall", "lodging", "movie_theater"]
        counts = {}
        for t in types:
            results = await self._query(lat, lng, radius, type_filter=t)
            counts[t] = len(results)
        return counts

    async def find_transformer(self, lat: float, lng: float, radius: int = 500) -> Dict:
        results = await self._query(lat, lng, radius, keyword="electrical substation transformer BESCOM")
        if results:
            nearest = results[0]
            return {
                "found": True,
                "name": nearest["name"],
                "distance_m": self._haversine(lat, lng, nearest["geometry"]["location"]["lat"], nearest["geometry"]["location"]["lng"]),
                "location": nearest["geometry"]["location"]
            }
        return {"found": False}

    @staticmethod
    def _haversine(lat1, lng1, lat2, lng2) -> float:
        # Returns distance in meters
        R = 6371000
        phi1, phi2 = math.radians(lat1), math.radians(lat2)
        dphi = math.radians(lat2 - lat1)
        dlng = math.radians(lng2 - lng1)
        a = math.sin(dphi/2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlng/2)**2
        return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1-a))
13.5 Service: PDF Generator
File: backend/app/services/pdf_generator.py
Purpose: Generate professional PDF reports using ReportLab.
Python
Copy
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from io import BytesIO

class PDFGenerator:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            fontSize=24,
            textColor=colors.HexColor('#D97757'),
            spaceAfter=20,
            alignment=1  # Center
        ))

    def generate(self, analysis_data: dict, map_image_path: str) -> bytes:
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=0.5*inch, bottomMargin=0.5*inch)
        story = []

        # Title
        story.append(Paragraph("EV GridSense Viability Report", self.styles['CustomTitle']))
        story.append(Paragraph(f"Location: {analysis_data['location']['name']}", self.styles['Heading2']))
        story.append(Spacer(1, 0.2*inch))

        # Map image
        if map_image_path:
            img = Image(map_image_path, width=6*inch, height=4*inch)
            story.append(img)
            story.append(Spacer(1, 0.2*inch))

        # Score table
        score_data = [["Factor", "Score", "Weight"]]
        scores = analysis_data['cells'][0]['scores']  # Best cell
        weights = {"s1": "25%", "s2": "15%", "s3": "20%", "s4": "15%", "s5": "15%", "s6": "-10%"}
        for key, label in [("s1", "Demand"), ("s2", "Infra Gap"), ("s3", "Grid Ready"), ("s4", "Commercial"), ("s5", "Strategic"), ("s6", "Env Risk")]:
            score_data.append([label, str(scores[key]), weights[key]])

        table = Table(score_data, colWidths=[2*inch, 1.5*inch, 1.5*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1A1815')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#F5F0E8')),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#0E0D0C')),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.HexColor('#9E9589')),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#2E2B27')),
        ]))
        story.append(table)

        doc.build(story)
        buffer.seek(0)
        return buffer.read()
14. FRONTEND COMPONENT ARCHITECTURE
14.1 Component Hierarchy
plain
Copy
App (layout.tsx)
└── Page (page.tsx)
    ├── Header
    │   ├── Logo
    │   ├── SearchBar
    │   └── LocationBadge
    ├── MainLayout
    │   ├── Sidebar
    │   │   ├── NavItem (Map, Analytics, Reports, Chat, Settings)
    │   │   └── ZoneSelector
    │   ├── MapSection
    │   │   ├── MapCanvas (Google Maps)
    │   │   ├── GridOverlay (Polygon layers)
    │   │   ├── FloodOverlay (BBMP zones)
    │   │   ├── ChargerMarkers
    │   │   └── ClusterHighlight
    │   └── RightPanel
    │       ├── ScoreSummary
    │       │   ├── ScoreBadge
    │       │   ├── ViabilityVerdict
    │       │   └── ChargerRecommendation
    │       ├── ScoreBreakdown
    │       │   └── ScoreBar (×6)
    │       ├── TopClusters
    │       │   └── ClusterCard (×3)
    │       ├── CostEstimate
    │       │   ├── CostRow (Equipment, Install, Transformer, Land)
    │       │   ├── LandToggle
    │       │   └── TotalCost
    │       ├── TimelineBar
    │       │   └── TimelineSegment (×6)
    │       ├── GrowthChart
    │       └── ReportActions
    │           ├── GeneratePDFButton
    │           └── ShareButton
    ├── CellDetailModal (overlay)
    │   ├── CellHeader
    │   ├── ScoreBreakdown
    │   ├── GemmaAnalysis
    │   ├── InfrastructureDetails
    │   └── ActionButtons
    ├── ChatPanel (slide-out)
    │   ├── ChatHeader
    │   ├── MessageList
    │   │   ├── UserMessage
    │   │   └── AIMessage
    │   ├── StarterQuestions
    │   └── ChatInput
    ├── AnalysisLoadingOverlay
    │   ├── Spinner
    │   ├── ProgressBar
    │   ├── StepIndicator
    │   └── CancelButton
    └── Footer
        ├── DataSources
        └── Disclaimer
14.2 Key Components
MapCanvas.tsx
TypeScript
Copy
"use client";
import { useCallback, useState, useRef } from "react";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
import GridOverlay from "./GridOverlay";
import FloodOverlay from "./FloodOverlay";
import ChargerMarkers from "./ChargerMarkers";
import ClusterHighlight from "./ClusterHighlight";

const mapContainerStyle = { width: "100%", height: "100%" };
const defaultCenter = { lat: 12.9716, lng: 77.5946 };

const mapOptions: google.maps.MapOptions = {
  mapTypeId: "satellite",
  tilt: 0,
  streetViewControl: false,
  mapTypeControl: true,
  fullscreenControl: false,
  styles: [
    {
      featureType: "all",
      elementType: "labels",
      stylers: [{ visibility: "off" }]
    }
  ]
};

export default function MapCanvas() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const onLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    mapRef.current = mapInstance;
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
    mapRef.current = null;
  }, []);

  const flyTo = useCallback((lat: number, lng: number, zoom: number = 15) => {
    mapRef.current?.panTo({ lat, lng });
    mapRef.current?.setZoom(zoom);
  }, []);

  if (!isLoaded) return <MapSkeleton />;

  return (
    <div className="relative w-full h-full bg-[#0E0D0C]">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={defaultCenter}
        zoom={14}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={mapOptions}
      >
        <GridOverlay map={map} onCellClick={setSelectedCell} />
        <FloodOverlay map={map} />
        <ChargerMarkers map={map} />
        <ClusterHighlight map={map} />
      </GoogleMap>

      {selectedCell && (
        <CellDetailModal
          cellId={selectedCell}
          onClose={() => setSelectedCell(null)}
        />
      )}
    </div>
  );
}
ScoreBar.tsx
TypeScript
Copy
interface ScoreBarProps {
  label: string;
  score: number;
  weight: string;
  color: string;
  tooltip?: string;
}

export default function ScoreBar({ label, score, weight, color, tooltip }: ScoreBarProps) {
  const percentage = Math.min(100, score * 10);

  return (
    <div className="mb-3 group" title={tooltip}>
      <div className="flex justify-between mb-1">
        <span className="text-sm text-[#9E9589]">{label}</span>
        <span className="text-sm font-mono text-[#F5F0E8]">{score}/10</span>
      </div>
      <div className="w-full h-1.5 bg-[#252220] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
          }}
        />
      </div>
      <span className="text-xs text-[#6B6660]">{weight}</span>
    </div>
  );
}
ChatPanel.tsx
TypeScript
Copy
"use client";
import { useState, useRef, useEffect } from "react";
import { useChat } from "@/hooks/useChat";

export default function ChatPanel({ sessionId, context }: { sessionId: string; context: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const { messages, sendMessage, isLoading } = useChat(sessionId, context);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const starters = [
    "Why is this cluster scoring high?",
    "What charger should I install?",
    "How much will BESCOM approval cost?",
    "Is this location flood-prone?",
  ];

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#D97757] text-white shadow-lg hover:bg-[#C4603E] transition-colors flex items-center justify-center"
      >
        {isOpen ? "✕" : "💬"}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 h-[500px] bg-[#1A1815] border border-[#2E2B27] rounded-xl shadow-2xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-[#2E2B27]">
            <h3 className="text-[#F5F0E8] font-semibold">AI Assistant</h3>
            <p className="text-xs text-[#6B6660]">Powered by OpenRouter</p>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="space-y-2">
                <p className="text-sm text-[#9E9589]">Ask about this analysis:</p>
                {starters.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="block w-full text-left text-sm text-[#D97757] hover:text-[#C4603E] p-2 rounded hover:bg-[#252220] transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${
                    msg.role === "user"
                      ? "bg-[#D97757] text-[#0E0D0C] rounded-br-md"
                      : "bg-[#252220] text-[#F5F0E8] rounded-bl-md"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-[#252220] px-4 py-3 rounded-2xl rounded-bl-md">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-[#9E9589] rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-[#9E9589] rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-[#9E9589] rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-[#2E2B27]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (input.trim()) {
                  sendMessage(input);
                  setInput("");
                }
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about this zone..."
                className="flex-1 bg-[#0E0D0C] border border-[#2E2B27] rounded-lg px-3 py-2 text-sm text-[#F5F0E8] placeholder-[#6B6660] focus:outline-none focus:border-[#D97757]"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#D97757] text-white rounded-lg text-sm font-medium hover:bg-[#C4603E] transition-colors"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
14.3 State Management (Zustand)
TypeScript
Copy
// src/store/gridStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface GridState {
  // Search
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // Location
  location: { lat: number; lng: number; name: string } | null;
  setLocation: (loc: { lat: number; lng: number; name: string }) => void;

  // Analysis
  sessionId: string | null;
  analysisStatus: "idle" | "processing" | "complete" | "failed";
  analysisProgress: number;
  cells: GridCell[];
  clusters: Cluster[];
  growthProjection: GrowthData | null;

  // Selection
  selectedCellId: string | null;
  selectedClusterId: number | null;

  // UI
  sidebarOpen: boolean;
  rightPanelOpen: boolean;
  chatOpen: boolean;

  // Actions
  startAnalysis: () => void;
  setAnalysisProgress: (progress: number) => void;
  completeAnalysis: (data: AnalysisResult) => void;
  failAnalysis: (error: string) => void;
  selectCell: (id: string | null) => void;
  selectCluster: (id: number | null) => void;
  toggleSidebar: () => void;
  toggleRightPanel: () => void;
  toggleChat: () => void;
}

export const useGridStore = create<GridState>()(
  persist(
    (set) => ({
      searchQuery: "",
      setSearchQuery: (q) => set({ searchQuery: q }),

      location: null,
      setLocation: (loc) => set({ location: loc }),

      sessionId: null,
      analysisStatus: "idle",
      analysisProgress: 0,
      cells: [],
      clusters: [],
      growthProjection: null,

      selectedCellId: null,
      selectedClusterId: null,

      sidebarOpen: true,
      rightPanelOpen: true,
      chatOpen: false,

      startAnalysis: () => set({ analysisStatus: "processing", analysisProgress: 0 }),
      setAnalysisProgress: (progress) => set({ analysisProgress: progress }),
      completeAnalysis: (data) => set({
        analysisStatus: "complete",
        sessionId: data.sessionId,
        cells: data.cells,
        clusters: data.clusters,
        growthProjection: data.growthProjection,
        analysisProgress: 100,
      }),
      failAnalysis: (error) => set({ analysisStatus: "failed" }),
      selectCell: (id) => set({ selectedCellId: id }),
      selectCluster: (id) => set({ selectedClusterId: id }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      toggleRightPanel: () => set((s) => ({ rightPanelOpen: !s.rightPanelOpen })),
      toggleChat: () => set((s) => ({ chatOpen: !s.chatOpen })),
    }),
    {
      name: "ev-grid-storage",
      partialize: (state) => ({
        searchQuery: state.searchQuery,
        location: state.location,
      }),
    }
  )
);
15. DATABASE SCHEMA
15.1 Entity Relationship Diagram
plain
Copy
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   rto_ev_data   │       │  flood_zones    │       │ analysis_cache  │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ rto_code (PK)   │       │ id (PK)         │       │ session_id (PK) │
│ office_name     │       │ lat             │       │ location        │
│ total_evs       │       │ lng             │       │ rto_code (FK)   │◄────┐
│ two_wheelers    │       │ zone_name       │       │ created_at      │     │
│ four_wheelers   │       │ vulnerability   │       │ result_json     │     │
│ others          │       │ bbmp_zone       │       │ expires_at      │     │
│ demand_profile  │       │ notes           │       └─────────────────┘     │
│ major_localities│       └─────────────────┘                             │
│ last_updated    │                                                     │
└─────────────────┘                                                     │
         │                                                              │
         │ 1:N (implied)                                                │
         ▼                                                              │
┌─────────────────┐                                                     │
│ rto_boundaries  │                                                     │
├─────────────────┤                                                     │
│ rto_code (PK)   │◄────────────────────────────────────────────────────┘
│ geojson_polygon │
└─────────────────┘
15.2 Table Definitions
sql
Copy
-- ============================================
-- RTO EV Registration Data
-- ============================================
CREATE TABLE rto_ev_data (
    rto_code TEXT PRIMARY KEY,
    office_name TEXT NOT NULL,
    total_evs INTEGER NOT NULL DEFAULT 0,
    two_wheelers INTEGER DEFAULT 0,
    four_wheelers INTEGER DEFAULT 0,
    others INTEGER DEFAULT 0,
    demand_profile TEXT,
    major_localities TEXT,  -- JSON array
    representative_pincodes TEXT,  -- JSON array
    last_updated DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rto_total_evs ON rto_ev_data(total_evs DESC);

-- ============================================
-- BBMP Flood Zone Points
-- ============================================
CREATE TABLE flood_zones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    zone_name TEXT,
    vulnerability_level TEXT CHECK(vulnerability_level IN ('severe', 'moderate', 'low')),
    bbmp_zone TEXT,
    mitigation_status TEXT,
    notes TEXT,
    source TEXT DEFAULT 'BBMP',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_flood_lat_lng ON flood_zones(lat, lng);
CREATE INDEX idx_flood_bbmp ON flood_zones(bbmp_zone);

-- ============================================
-- RTO Zone Boundaries (Simplified Polygons)
-- ============================================
CREATE TABLE rto_boundaries (
    rto_code TEXT PRIMARY KEY,
    geojson_polygon TEXT NOT NULL,  -- GeoJSON Polygon
    center_lat REAL,
    center_lng REAL,
    area_sqkm REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Analysis Session Cache
-- ============================================
CREATE TABLE analysis_cache (
    session_id TEXT PRIMARY KEY,
    location_name TEXT,
    location_lat REAL,
    location_lng REAL,
    rto_code TEXT,
    analysis_mode TEXT CHECK(analysis_mode IN ('quick', 'deep')),
    status TEXT CHECK(status IN ('processing', 'complete', 'failed')),
    result_json TEXT,  -- Full analysis JSON
    api_cost_inr REAL DEFAULT 0,
    duration_seconds INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    FOREIGN KEY (rto_code) REFERENCES rto_ev_data(rto_code)
);

CREATE INDEX idx_cache_status ON analysis_cache(status);
CREATE INDEX idx_cache_expires ON analysis_cache(expires_at);

-- ============================================
-- Charging Stations (Cached from Google Places)
-- ============================================
CREATE TABLE charging_stations (
    place_id TEXT PRIMARY KEY,
    name TEXT,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    address TEXT,
    power_kw REAL,
    connector_types TEXT,  -- JSON array
    operator TEXT,
    status TEXT DEFAULT 'operational',
    source TEXT DEFAULT 'google_places',
    last_verified DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_charger_lat_lng ON charging_stations(lat, lng);
CREATE INDEX idx_charger_operator ON charging_stations(operator);

-- ============================================
-- API Usage Log (for cost tracking)
-- ============================================
CREATE TABLE api_usage_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT,
    api_name TEXT NOT NULL,  -- 'geocoding', 'static_maps', 'places_nearby'
    request_count INTEGER DEFAULT 1,
    estimated_cost_inr REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES analysis_cache(session_id)
);

CREATE INDEX idx_api_usage_session ON api_usage_log(session_id);
CREATE INDEX idx_api_usage_date ON api_usage_log(created_at);
15.3 Seed Data SQL
sql
Copy
-- Insert RTO EV Data
INSERT INTO rto_ev_data (rto_code, office_name, total_evs, two_wheelers, four_wheelers, others, demand_profile, major_localities, last_updated) VALUES
('KA-05', 'Jayanagar RTO', 23090, 15505, 1754, 5831, 'Residential/Solar Hub', '["Jayanagar", "JP Nagar", "Banashankari"]', '2026-03-15'),
('KA-01', 'Koramangala RTO', 11690, 7206, 1123, 3361, 'High-Income/Tech', '["Koramangala", "HSR Layout", "BTM Layout"]', '2026-03-15'),
('KA-02', 'Rajajinagar RTO', 11652, 10456, 787, 409, 'Industrial/Business', '["Rajajinagar", "Vijayanagar", "Basaveshwaranagar"]', '2026-03-15'),
('KA-04', 'Yeshwanthpur RTO', 10665, 9002, 750, 913, 'Commercial/Transit', '["Yeshwanthpur", "Hebbal", "Mathikere"]', '2026-03-15'),
('KA-03', 'Indiranagar RTO', 10585, 8330, 1387, 868, 'Luxury/Corporate', '["Indiranagar", "Domlur", "Marathahalli"]', '2026-03-15'),
('KA-53', 'KR Puram RTO', 8976, 5785, 933, 2258, 'High-Density IT/Suburban', '["KR Puram", "Whitefield", "Hoodi"]', '2026-03-15'),
('KA-51', 'Electronic City RTO', 5954, 5430, 459, 65, 'Very High Tech/Corporate', '["Electronic City", "Bommasandra", "Hebbagodi"]', '2026-03-15'),
('KA-43', 'Devanahalli RTO', 3967, 3290, 499, 178, 'Peripheral/Emerging', '["Devanahalli", "Airport", "Nandi Hills"]', '2026-03-15'),
('KA-50', 'Yelahanka RTO', 1365, 0, 0, 0, 'Rapid Residential Growth', '["Yelahanka", "Yelahanka New Town", "Jakkur"]', '2026-03-15'),
('KA-59', 'Banashankari RTO', 7059, 0, 5044, 0, 'Residential', '["Banashankari", "South-West Suburbs"]', '2026-03-15');

-- Insert sample flood zones (subset of 209)
INSERT INTO flood_zones (lat, lng, zone_name, vulnerability_level, bbmp_zone, notes) VALUES
(13.0358, 77.5970, 'Koramangala Lake Area', 'severe', 'South', 'Historical lakebed, perennial flooding'),
(13.1986, 77.7066, 'Mahadevapura Sai Layout', 'severe', 'Mahadevapura', 'Recurring floods, boat evacuations'),
(12.9698, 77.7499, 'Bellandur Lake Overflow', 'moderate', 'Bommanahalli', 'Lake overflow during heavy rains'),
(13.1007, 77.5963, 'Yelahanka Low-Lying', 'moderate', 'Yelahanka', 'Drainage constriction near railway');
16. SECURITY & PRIVACY
16.1 Threat Model
Table
Threat	Likelihood	Impact	Mitigation
API key exposure in frontend	High	High	API keys ONLY in backend .env; frontend uses proxy endpoints
SQLite injection	Low	Medium	Parameterized queries via SQLAlchemy
Gemma prompt injection	Medium	Low	Strict prompt template, output validation, no user input in vision prompt
OpenRouter key theft	Low	High	Key in backend .env only; rotate monthly
Analysis result tampering	Low	Low	Results are generated, not stored long-term; session IDs are random
Google API quota abuse	Medium	Medium	Rate limiting, daily budget cap, IP-based limits
16.2 API Key Management
plain
Copy
Frontend .env.local:
  NEXT_PUBLIC_API_URL=http://localhost:8000
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=    ← ONLY Maps JS key (restricted to localhost)

Backend .env:
  GOOGLE_MAPS_API_KEY=                ← Full access key (Static Maps, Places, Geocoding)
  OPENROUTER_API_KEY=                 ← Chat API key
  OLLAMA_HOST=http://localhost:11434
  DAILY_API_BUDGET_INR=1000
Google API Key Restrictions:
HTTP referrer restriction: localhost:3000/*
API restriction: Maps JS API, Static Maps API, Places API, Geocoding API only
No server key exposed to frontend
16.3 Data Privacy
No user data collected: No login, no cookies, no tracking pixels
No PII stored: Location searches are transient; only session cache stored
Local AI: Gemma runs on-device for vision analysis; map and POI requests still use external APIs over the internet
Session expiry: Analysis cache auto-deleted after 30 days
GDPR compliance: Not applicable (India-focused, no EU users expected)
17. PERFORMANCE & SCALABILITY
17.1 Performance Budget
Table
Metric	Target	Maximum
Time to First Byte (TTFB)	<200ms	500ms
First Contentful Paint (FCP)	<1.5s	3s
Largest Contentful Paint (LCP)	<2.5s	5s
Time to Interactive (TTI)	<3s	6s
Analysis completion (quick)	<15s	30s
Analysis completion (deep)	<60s	120s
PDF generation	<3s	10s
Chat response	<5s	15s
Map interaction latency	<50ms	100ms
17.2 Optimization Strategies
Frontend:
Next.js Image optimization for map tiles
Dynamic imports for heavy components (Recharts, Chat panel)
React.memo for GridOverlay cells
Debounced search input (300ms)
Virtualized lists for large cell arrays
Backend:
Async endpoints for I/O-bound operations (Places API, Gemma)
Connection pooling for SQLite (via SQLAlchemy)
In-memory caching for analysis results (TTL: 24 hours)
Batch Google Places queries where possible
Compress map images before sending to Gemma (max 800px width)
Caching Strategy:
plain
Copy
Layer 1: Browser cache (localStorage) — recent searches, zone list
Layer 2: Frontend state (Zustand) — current analysis, selected cell
Layer 3: Backend in-memory (Python dict) — analysis results, Places API responses
Layer 4: SQLite — RTO data, flood zones, charger cache
17.3 Scalability Limits
Current Architecture (Local):
Max concurrent analyses: 1 (single user)
Max grid size: 10×10 (100 cells)
Max daily analyses: ~50 (Google API budget constraint)
Max PDF storage: 100 reports (auto-purged after 30 days)
If Multi-User in Future:
SQLite → PostgreSQL
In-memory cache → Redis
Local file storage → S3-compatible (MinIO)
Ollama → Dedicated GPU server
18. ERROR HANDLING & EDGE CASES
18.1 Error Taxonomy
plain
Copy
USER_ERRORS (4xx)
├── LOCATION_NOT_FOUND
├── LOCATION_OUTSIDE_BANGALORE
├── INVALID_GRID_SIZE
├── ANALYSIS_ALREADY_RUNNING
└── API_QUOTA_EXCEEDED

SYSTEM_ERRORS (5xx)
├── GEMMA_TIMEOUT
├── GEMMA_MALFORMED_RESPONSE
├── GOOGLE_API_ERROR
├── PLACES_API_RATE_LIMITED
├── SQLITE_ERROR
├── PDF_GENERATION_FAILED
└── UNKNOWN_ERROR
18.2 Error Handling Matrix
Table
Error	User Message	System Action	Retry
Location not found	"Could not find 'Xyz'. Try a nearby landmark."	Log error	No
Outside Bangalore	"EV GridSense supports Bangalore only."	Reject request	No
Gemma timeout	"AI analysis timed out. Using default scores."	Fallback to multiplier 1.0	No
Gemma malformed JSON	"AI returned unexpected data. Using defaults."	Parse partial, fill defaults	No
Google API error	"Map data temporarily unavailable."	Retry once, then fail	Yes (1x)
Places API rate limited	"Slowing down to respect API limits."	Exponential backoff	Yes (3x)
SQLite locked	"Database busy. Please try again."	Retry with jitter	Yes (3x)
PDF generation failed	"Report generation failed. Retry?"	Log stack trace	Yes (1x)
18.3 Edge Cases
Case 1: Location at Bangalore Edge
Grid extends beyond city bounds
Cells outside bounds: score = "Unknown", color = gray, label = "Out of Zone"
Analysis continues for valid cells only
Case 2: No EV Data for RTO
If RTO not in database → use city-wide average (21,000 EVs / 17 zones ≈ 1,235 per zone)
Show warning: "RTO data unavailable. Using city average."
Case 3: Zero Chargers Found
S2 (Infra Gap) = 10.0 (absolute priority)
Report note: "No chargers found within 5km. This is a greenfield opportunity."
Case 4: Transformer Not Found
S3 (Grid Readiness) = 5.0 (neutral)
Report note: "Transformer proximity unverified. Site visit recommended."
Cost estimate includes transformer adder buffer
Case 5: Severe Flood Zone + High Score
Hard gate: cap final score at 4.0
Verdict: "NOT RECOMMENDED"
Warning: "Severe flood risk per BBMP. Installation requires raised platform + clearance."
Case 6: User Owns Land in Flood Zone
Land cost = ₹0 but flood platform cost still applies
Warning: "You own the land, but flood mitigation is mandatory."
Case 7: Gemma Says "Mall" But Google Places Finds No Malls
Trust Google Places for POI counts (ground truth)
Use Gemma multiplier but verify with Places data
If discrepancy >50% → flag: "AI detected commercial activity but limited POI data found."
Case 8: Mobile Network Slow
Detect slow connection (navigator.connection.effectiveType)
Auto-switch to "Quick Mode" (5×5 grid)
Show compressed map tiles
Disable chat panel by default
19. TESTING STRATEGY
19.1 Testing Pyramid
plain
Copy
        ┌─────────┐
        │   E2E   │  10% — Full user journeys
        │  (3 tests)│
        ├─────────┤
        │Integration│ 30% — API + service combinations
        │  (9 tests)│
        ├─────────┤
        │  Unit   │ 60% — Individual functions
        │ (18 tests)│
        └─────────┘
19.2 Unit Tests
Python
Copy
# tests/test_scoring_engine.py
import pytest
from app.services.scoring_engine import ViabilityEngine, GridSector

engine = ViabilityEngine()

def test_s1_demand_index_normalization():
    grid = GridSector(id="A1", rto_code="KA-05", total_evs_in_rto=23090, total_grids_in_zone=48)
    grid.vision_multiplier = 1.5
    base = 23090 / 48  # 481.0
    grid_demand = base * 1.5  # 721.5
    s1 = engine.calculate_s1(grid_demand, max_demand=721.5)
    assert s1 == 10.0  # Max normalized

def test_s2_infra_gap_zero_chargers():
    grid = GridSector(id="A1", rto_code="KA-50", total_evs_in_rto=1365, total_grids_in_zone=48)
    grid.existing_chargers_5km = 0
    s2 = engine.calculate_s2(grid)
    assert s2 == 10.0

def test_s6_flood_zone_cap():
    grid = GridSector(id="A1", rto_code="KA-50", total_evs_in_rto=1365, total_grids_in_zone=48)
    grid.is_flood_zone = True
    grid.s6_env_risk = 9.0
    final, category, _ = engine.calculate_final_score(grid)
    assert final <= 4.0
    assert category.value == "low_risk"

def test_cluster_detection():
    cells = [
        GridSector(id="B2", final_score=8.5),
        GridSector(id="B3", final_score=8.0),
        GridSector(id="C2", final_score=7.5),
        GridSector(id="C3", final_score=6.5),
        GridSector(id="A1", final_score=3.0),
    ]
    clusters = engine.find_clusters(cells, min_score=6.0)
    assert len(clusters) == 1
    assert len(clusters[0]) == 4
19.3 Integration Tests
Python
Copy
# tests/test_analyze_endpoint.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_analyze_yelahanka():
    response = client.post("/api/v1/analyze", json={
        "location": "Yelahanka, Bangalore",
        "land_owned": True,
        "analysis_mode": "quick"
    })
    assert response.status_code == 202
    data = response.json()
    assert "session_id" in data
    assert data["status"] == "processing"

    # Poll for completion (max 30s)
    import time
    for _ in range(30):
        status = client.get(f"/api/v1/analyze/{data['session_id']}/status")
        if status.json()["status"] == "complete":
            break
        time.sleep(1)

    result = client.get(f"/api/v1/analyze/{data['session_id']}/status")
    assert result.json()["status"] == "complete"

def test_analyze_outside_bangalore():
    response = client.post("/api/v1/analyze", json={
        "location": "Mumbai"
    })
    assert response.status_code == 400
    assert "LOCATION_OUTSIDE_BANGALORE" in response.json()["error"]
19.4 E2E Tests
TypeScript
Copy
// e2e/analyze-flow.spec.ts
import { test, expect } from "@playwright/test";

test("full analysis flow", async ({ page }) => {
  await page.goto("http://localhost:3000");

  // Search
  await page.fill('[data-testid="search-input"]', "Electronic City");
  await page.click('[data-testid="search-button"]');

  // Wait for analysis
  await page.waitForSelector('[data-testid="analysis-complete"]', { timeout: 60000 });

  // Verify score panel
  const score = await page.textContent('[data-testid="top-score"]');
  expect(parseFloat(score!)).toBeGreaterThan(0);

  // Click a grid cell
  await page.click('[data-testid="grid-cell-B3"]');
  await page.waitForSelector('[data-testid="cell-detail-panel"]');

  // Generate PDF
  await page.click('[data-testid="generate-pdf-button"]');
  const download = await page.waitForEvent("download");
  expect(download.suggestedFilename()).toContain("EV-Grid-Report");
});
19.5 Manual Test Checklist
Before Every Release:
[ ] Search all 10 RTO zones → verify correct zone detection
[ ] Click every grid cell → verify detail panel opens
[ ] Generate PDF for 3 zones → verify all 8 sections present
[ ] Chat 5 starter questions → verify context-aware answers
[ ] Mobile: test on 375px width → all features accessible
[ ] Offline: disconnect internet → graceful error messages
[ ] API budget: run 5 deep analyses → verify cost tracker
[ ] Gemma failure: stop Ollama → verify fallback scores
20. DEPLOYMENT & DEVOPS
20.1 Local Deployment
Prerequisites:
Python 3.11+
Node.js 20+
Ollama installed
Google Cloud API key
OpenRouter API key
Setup Script:
bash
Copy
#!/bin/bash
# setup.sh

echo "Setting up EV GridSense..."

# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python db/seed.py

# Frontend
cd ../frontend
npm install

# Ollama
# Install or pull your local Gemma 4 E4B model/runtime before launch

echo "Setup complete. Run ./start.sh to launch."
Start Script:
bash
Copy
#!/bin/bash
# start.sh

echo "Starting EV GridSense..."

# Start Ollama (if not running)
if ! pgrep -x "ollama" > /dev/null; then
    echo "Starting Ollama..."
    ollama serve &
    sleep 5
fi

# Start backend
cd backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# Start frontend
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "========================================"
echo "EV GridSense is running!"
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:8000"
echo "API Docs: http://localhost:8000/docs"
echo "========================================"
echo "Press Ctrl+C to stop all services"
echo ""

trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
20.2 Environment Configuration
backend/.env:
plain
Copy
# Required
DATABASE_URL=sqlite:///./data/ev_grid.db
GOOGLE_MAPS_API_KEY=your_google_server_key
OPENROUTER_API_KEY=your_openrouter_key
OLLAMA_HOST=http://localhost:11434

# Optional
DAILY_API_BUDGET_INR=1000
ANALYSIS_TIMEOUT_SECONDS=120
MAX_GRID_ROWS=10
MAX_GRID_COLS=10
CACHE_TTL_HOURS=24
LOG_LEVEL=INFO
frontend/.env.local:
plain
Copy
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_js_key
20.3 Backup & Recovery
SQLite Backup:
bash
Copy
# Daily backup cron job
cp backend/data/ev_grid.db backup/ev_grid_$(date +%Y%m%d).db
RTO Data Update:
bash
Copy
# When new RTO data arrives
python backend/db/seed.py --update-rto --file data/new_rto_data.json
21. ANALYTICS & MONITORING
21.1 Metrics to Track
Table
Metric	Type	Collection Method
Analyses run	Counter	Backend log
Avg analysis duration	Histogram	Backend log
API cost per analysis	Gauge	Backend log
Gemma success rate	Percentage	Backend log
Most searched zones	Ranking	Backend log
PDF downloads	Counter	Backend log
Chat messages	Counter	Backend log
Frontend errors	Counter	Console.error capture
21.2 Logging
Python
Copy
# backend/app/logging_config.py
import logging
import sys

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("logs/ev_grid.log", maxBytes=10*1024*1024, backupCount=5)
    ]
)

logger = logging.getLogger("ev_grid")

# Usage
logger.info(f"Analysis started: {location}, mode={mode}")
logger.warning(f"Gemma timeout for cell {cell_id}, using defaults")
logger.error(f"Google API error: {error}", exc_info=True)
21.3 Health Dashboard
Simple HTML page at /health/dashboard showing:
Backend status (green/red)
Ollama status (green/red)
Google API status (green/red)
Today's analysis count
Today's API cost
Last error timestamp
Disk usage
22. POST-LAUNCH ROADMAP
Phase 8: Real-Time Data (Month 3)
BESCOM EV Mitra API integration (if available)
Real-time charger availability
Live traffic data for strategic access scoring
Phase 9: Multi-User & Collaboration (Month 4)
Simple user accounts (no auth provider, local SQLite)
Saved analyses
Shareable links
Team comments on reports
Phase 10: City Expansion (Month 5)
Hyderabad (TS RTO data)
Chennai (TN RTO data)
Pune (MH RTO data)
City selector dropdown
Phase 11: ML Enhancement (Month 6)
Historical accuracy tracking (compare predictions vs actual installations)
Retrain scoring weights based on ground truth
Seasonal demand adjustment (monsoon vs summer)
Phase 12: Government Dashboard (Month 7)
Aggregate view across all zones
Infrastructure gap heatmap for entire city
Budget allocation optimizer
Public API for researchers
Phase 13: Mobile App (Month 9)
React Native wrapper
Offline mode (cached zone data)
Photo upload for site visits
GPS-based automatic zone detection
23. APPENDICES
Appendix A: Glossary
Table
Term	Definition
Tessellation	Dividing a map into fixed-size geometric cells (500m×500m)
RTO	Regional Transport Office — vehicle registration authority
BESCOM	Bangalore Electricity Supply Company
BBMP	Bruhat Bengaluru Mahanagara Palike — city corporation
CEIG	Chief Electrical Inspector to Government
FAME-II	Faster Adoption and Manufacturing of Electric Vehicles scheme
CCS2	Combined Charging System Type 2 — DC fast charging standard
OCPP	Open Charge Point Protocol — charger communication standard
CPO	Charge Point Operator — company that runs charging stations
POI	Point of Interest — restaurant, mall, hotel, etc.
Ollama	Tool for running LLMs locally
OpenRouter	API gateway for accessing multiple AI models
Appendix B: RTO Zone Reference
Table
Code	Name	Total EVs	Demand Profile
KA-01	Koramangala	11,690	High-Income/Tech
KA-02	Rajajinagar	11,652	Industrial/Business
KA-03	Indiranagar	10,585	Luxury/Corporate
KA-04	Yeshwanthpur	10,665	Commercial/Transit
KA-05	Jayanagar	23,090	Residential/Solar Hub
KA-41	Jnana Bharathi	—	Medium-High Residential
KA-43	Devanahalli	3,967	Peripheral/Emerging
KA-50	Yelahanka	1,365	Rapid Residential Growth
KA-51	Electronic City	5,954	Very High Tech/Corporate
KA-53	KR Puram	8,976	High-Density IT/Suburban
KA-57	Shanthinagar	—	Public/Para-Transit
KA-58	Chamrajpet	—	Traditional Commercial
KA-59	Banashankari	7,059	Residential
KA-60	RT Nagar	—	Medium Residential
KA-61	Marathahalli	—	High-Density Corporate
Appendix C: BESCOM Cost Reference (2026)
Table
Item	Cost (INR)	Notes
Load Sanction (LT Domestic)	₹0–₹500	Simple upgrade
Load Sanction (LT Commercial)	₹2,000–₹5,000	New connection
Load Sanction (HT)	₹10,000–₹25,000	Dedicated feeder
CEIG Approval	₹0 (no fee)	30-day statutory
Fire Safety NOC	₹1,000–₹5,000	Varies by municipality
Transformer (100kVA)	₹2L–₹5L	If new required
Cabling (per 100m)	₹1.5L	11kV HT cable
Earthing (IS 3043)	₹15K–₹30K	Mandatory
RCCB Type-B	₹3K–₹8K	Mandatory for EV
Appendix D: Equipment Cost Reference (2026)
Table
Brand	Model	Power	Price (INR)	Type
Exicom	Harmony	22kW AC	₹1,20,000	Wall-mount
Delta	AC Max	22kW AC	₹1,50,000	Pedestal
ABB	Terra AC	22kW AC	₹1,80,000	Pedestal
Exicom	Thunder	50kW DC	₹8,50,000	CCS2
Delta	DC City	50kW DC	₹9,50,000	CCS2
Tata Power	EZ Charge	50kW DC	₹10,50,000	CCS2
ABB	Terra HP	120kW DC	₹28,00,000	CCS2
Exicom	Ultra	150kW DC	₹32,00,000	CCS2+CHAdeMO
Appendix E: File Structure (Complete)
plain
Copy
ev-grid-scanner/
├── README.md
├── setup.sh
├── start.sh
├── docs/
│   ├── PRD.md
│   ├── API.md
│   ├── DEPLOYMENT.md
│   └── USER_GUIDE.md
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── logging_config.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── analyze.py
│   │   │   ├── zones.py
│   │   │   ├── chat.py
│   │   │   ├── report.py
│   │   │   └── health.py
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── geocoder.py
│   │   │   ├── maps_fetcher.py
│   │   │   ├── grid_engine.py
│   │   │   ├── gemma_client.py
│   │   │   ├── places_client.py
│   │   │   ├── scoring_engine.py
│   │   │   ├── cluster_detector.py
│   │   │   ├── cost_calculator.py
│   │   │   ├── timeline_calculator.py
│   │   │   ├── growth_projector.py
│   │   │   └── pdf_generator.py
│   │   └── data/
│   │       ├── rto_ev_data.json
│   │       ├── flood_zones.json
│   │       ├── rto_boundaries.geojson
│   │       ├── cost_tables.json
│   │       └── bescom_timelines.json
│   ├── db/
│   │   ├── __init__.py
│   │   ├── seed.py
│   │   └── migrations/
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── test_scoring_engine.py
│   │   ├── test_analyze_endpoint.py
│   │   └── conftest.py
│   ├── data/
│   │   └── ev_grid.db
│   ├── logs/
│   │   └── ev_grid.log
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── map/
│   │   │   │   ├── MapCanvas.tsx
│   │   │   │   ├── GridOverlay.tsx
│   │   │   │   ├── FloodOverlay.tsx
│   │   │   │   ├── ChargerMarkers.tsx
│   │   │   │   └── ClusterHighlight.tsx
│   │   │   ├── ui/
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── SearchBar.tsx
│   │   │   │   ├── ScoreBadge.tsx
│   │   │   │   ├── ScoreBar.tsx
│   │   │   │   ├── ViabilityVerdict.tsx
│   │   │   │   ├── CostBreakdown.tsx
│   │   │   │   ├── TimelineBar.tsx
│   │   │   │   ├── GrowthChart.tsx
│   │   │   │   └── ReportActions.tsx
│   │   │   ├── panels/
│   │   │   │   ├── RightPanel.tsx
│   │   │   │   ├── CellDetailModal.tsx
│   │   │   │   └── AnalysisLoadingOverlay.tsx
│   │   │   └── chat/
│   │   │       ├── ChatPanel.tsx
│   │   │       ├── ChatMessage.tsx
│   │   │       └── StarterQuestions.tsx
│   │   ├── hooks/
│   │   │   ├── useGridScore.ts
│   │   │   ├── useAnalysis.ts
│   │   │   ├── useChat.ts
│   │   │   └── useMapGrid.ts
│   │   ├── store/
│   │   │   └── gridStore.ts
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   ├── mapUtils.ts
│   │   │   └── constants.ts
│   │   └── types/
│   │       └── index.ts
│   ├── public/
│   ├── tests/
│   │   └── e2e/
│   │       └── analyze-flow.spec.ts
│   ├── package.json
│   ├── tailwind.config.ts
│   ├── next.config.js
│   └── .env.local
└── .gitignore
