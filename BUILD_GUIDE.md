# EV GridSense — Phase-by-Phase Build Guide
## For AI Agent (Codex / VS Code Agent) + Human Collaboration
**Version:** 1.0 | **Date:** April 24, 2026

---

## HOW TO USE THIS DOCUMENT

1. **Save this file** as `BUILD_GUIDE.md` in your project root.
2. **Read the Phase Overview** below to understand the full journey.
3. **Before starting each phase**, read that phase's "What We Build / What We Skip" section.
4. **Copy the Phase Prompt** at the bottom and paste it into your AI agent (Codex / VS Code Agent).
5. **Do what the Manual Tasks section says** while the AI agent works.
6. **If the AI generates errors**, paste the error into your chat with me (Kimi) — I will debug it.
7. **Only after Phase N is fully verified**, move to Phase N+1.

---

## PHASE OVERVIEW

| Phase | Name | Duration | What Gets Built | What Gets Skipped |
|-------|------|----------|-----------------|-------------------|
| **0** | Pre-Flight Setup | Day 1 | Accounts, keys, tools installed | No code written |
| **1** | Foundation & Data | Week 1–2 | Project scaffold, DB schema, seeded data, FastAPI hello-world, Next.js hello-world, health check | No maps, no scoring, no AI |
| **2** | Grid System & Maps | Week 3–4 | Google Maps JS rendering, fixed 500m grid overlay (frontend), grid math library, Static Maps fetch (backend), cell coordinate calculation | No scoring, no Gemma, no Places API |
| **3** | Scoring Engine & APIs | Week 5–6 | 6-factor scoring engine (Python), `/api/analyze` skeleton, `/api/zones` endpoints, score calculation API, frontend score display | No Gemma vision, no cost/timeline, no PDF |
| **4** | AI Vision (Gemma) | Week 7–8 | Ollama setup, Gemma 4 E4B install, vision prompt engineering, screenshot capture, JSON parser with fallback, vision multiplier integration | No chat, no reports |
| **5** | Places API & Intelligence | Week 9–10 | Google Places integration (chargers, POIs, transformers), BBMP flood zone overlay, infrastructure gap scoring, grid readiness scoring | No cost engine, no timeline |
| **6** | Cost, Timeline & Reports | Week 11–12 | Cost estimation engine, BESCOM timeline calculator, ReportLab PDF generator, growth projection (NumPy), `/api/report` endpoint | No chat UI, no mobile polish |
| **7** | Frontend Polish & Chat | Week 13–14 | Anthropic-themed UI, score breakdown bars, cluster cards, chat panel (OpenRouter), responsive layout, loading states, error states | No batch analysis, no multi-user |
| **8** | Testing & Hardening | Week 15–16 | Unit tests, integration tests, E2E tests, error handling, rate limiting, caching, performance optimization | No new features |
| **9** | Deployment & Launch | Week 17–18 | `setup.sh`, `start.sh`, README, documentation, demo prep, 3 showcase locations pre-analyzed | Post-launch features deferred |

**Total: 18 weeks.** Do not rush. Each phase must be verified before proceeding.

---

## PHASE BOUNDARIES (CRITICAL)

### Golden Rule: No Phase Skipping
If Phase 2 (Grid) is not working, do NOT start Phase 3 (Scoring). The scoring engine needs the grid to exist first.

### What "Done" Means
A phase is DONE only when:
- [ ] All files for that phase are created
- [ ] The app starts without errors (`npm run dev` + `uvicorn` both run)
- [ ] The manual verification checklist for that phase is ticked off
- [ ] You (the human) have visually confirmed it works in the browser

---

## AI AGENT vs HUMAN RESPONSIBILITIES

### What the AI Agent (Codex / VS Code Agent) Does
- Writes boilerplate code (project scaffolding, file creation)
- Implements algorithms based on PRD specifications
- Generates React components and Python services
- Writes test cases
- Fixes syntax errors and type errors
- Refactors code for readability
- Generates configuration files (package.json, requirements.txt, etc.)

### What YOU (the Human) Do Manually
- **API Keys**: Create Google Cloud project, enable APIs, copy keys into `.env` files
- **Ollama**: Install Ollama locally, pull Gemma model, verify it runs
- **Data Entry**: Update RTO EV data when new numbers arrive (monthly/quarterly)
- **Visual Verification**: Open browser, look at the map, confirm colors look right
- **Decision Making**: Choose between Quick Mode vs Deep Mode, approve UI changes
- **Testing on Real Hardware**: Run on your laptop, check RAM usage, confirm Gemma speed
- **Stakeholder Communication**: Show demos, gather feedback, decide on scope changes
- **Debugging Strategy**: When AI hits a wall, you decide whether to simplify, workaround, or escalate to me (Kimi)

### What WE (You + Kimi) Do Together
- **Architecture decisions**: If the AI suggests a tech stack change, we discuss it
- **Error debugging**: You paste errors, I analyze and suggest fixes
- **Scope negotiation**: If a phase is taking too long, we decide what to cut
- **PRD interpretation**: If the AI is confused by a requirement, I clarify

---

## PHASE 0: PRE-FLIGHT SETUP (Day 1 — Before Any Code)

### What We Build
Nothing. This is preparation only.

### What You Do Manually
1. **Google Cloud Console**
   - Create new project (name: `ev-grid-sense`)
   - Enable APIs: Maps JavaScript API, Static Maps API, Places API, Geocoding API
   - Create API key with HTTP referrer restriction: `localhost:3000/*`
   - Copy key to a secure note

2. **OpenRouter**
   - Sign up at openrouter.ai
   - Copy API key to secure note
   - Verify free tier models are available

3. **Install Tools**
   - Node.js 20+ (`node -v` to check)
   - Python 3.11+ (`python --version` to check)
   - Git
   - VS Code with Copilot/Codex extension
   - Cursor AI (optional but recommended)

4. **Ollama**
   - Install from ollama.com
   - Run `ollama pull gemma:4b` (takes time, do this now)
   - Run `ollama list` to confirm
   - Run `ollama run gemma:4b` and ask "Hello" to verify it works
   - Exit with `/bye`

5. **Create Project Folder**
   ```
   mkdir ~/ev-grid-scanner
   cd ~/ev-grid-scanner
   git init
   ```

### What We Skip
- No code written yet
- No Next.js, no FastAPI — those start in Phase 1

### Verification Checklist
- [ ] Google API key copied and restricted
- [ ] OpenRouter key copied
- [ ] Ollama installed, Gemma:4b downloaded, responds to prompts
- [ ] Node.js ≥ 20, Python ≥ 3.11
- [ ] Git initialized in project folder

---

## PHASE 1: FOUNDATION & DATA LAYER (Week 1–2)

### What We Build
1. **Next.js Frontend**
   - Project scaffold with App Router, Tailwind CSS, TypeScript
   - Basic layout (header, main area, footer)
   - Dark theme configured (Anthropic-inspired colors)
   - `page.tsx` shows "EV GridSense — Coming Soon"
   - `globals.css` has all CSS variables from PRD Section 11

2. **FastAPI Backend**
   - Project scaffold with folder structure
   - `main.py` with health check endpoint (`/api/health`)
   - CORS configured for `localhost:3000`
   - SQLite database connection
   - SQLAlchemy models for `rto_ev_data` and `flood_zones`

3. **Database**
   - SQLite file created at `backend/data/ev_grid.db`
   - Tables: `rto_ev_data`, `flood_zones`, `analysis_cache`
   - Seeded with all 10 RTO zones + sample flood zones
   - Seed script `backend/db/seed.py` that populates data

4. **Environment Configuration**
   - `frontend/.env.local` with Google Maps JS key
   - `backend/.env` with all keys (Google server key, OpenRouter, Ollama host)
   - `.gitignore` excludes `.env` files and `node_modules/`

5. **API Verification**
   - Frontend can call backend health check
   - Backend returns `{"status": "ok"}`
   - No errors in browser console or terminal

### What We Skip (DO NOT BUILD YET)
- ❌ Google Maps rendering (Phase 2)
- ❌ Grid overlay (Phase 2)
- ❌ Scoring engine (Phase 3)
- ❌ Gemma integration (Phase 4)
- ❌ Places API calls (Phase 5)
- ❌ PDF generation (Phase 6)
- ❌ Chat panel (Phase 7)
- ❌ Tests (Phase 8)

### AI Agent Tasks
- Scaffold Next.js project with correct flags
- Scaffold FastAPI project with folder structure
- Write SQLAlchemy models
- Write seed script
- Write health check endpoint
- Configure CORS
- Write `.env` templates

### Human Tasks
- Paste API keys into `.env` files
- Run `python backend/db/seed.py` to verify database populates
- Open `localhost:3000` and confirm page loads
- Open `localhost:8000/api/health` and confirm JSON response
- Verify `.env` files are in `.gitignore`

### Verification Checklist
- [ ] `npm run dev` starts frontend on port 3000
- [ ] `uvicorn app.main:app --reload` starts backend on port 8000
- [ ] Frontend shows dark-themed page with "EV GridSense" header
- [ ] Backend `/api/health` returns `{"status": "ok"}`
- [ ] SQLite file exists and has 10 RTO rows when queried
- [ ] No console errors in browser
- [ ] No Python errors in terminal

---

## PHASE 2: GRID SYSTEM & MAPS (Week 3–4)

### What We Build
1. **Google Maps Integration (Frontend)**
   - `@react-google-maps/api` installed
   - `MapCanvas.tsx` renders satellite map centered on Bangalore
   - Map type toggle: Satellite / Terrain / Roadmap
   - Zoom controls, fullscreen disabled

2. **Grid Math Library**
   - `lib/gridMath.ts` converts meters to degrees at Bangalore latitude
   - `generateGridForZone()` returns array of cells with bounds + center
   - Each cell = 500m × 500m, labeled A1, A2, B1, B2...

3. **Grid Overlay (Frontend)**
   - `GridOverlay.tsx` renders polygons on Google Maps
   - Cells are clickable and hoverable
   - Labels visible at zoom ≥ 14
   - Default: 8 rows × 10 cols

4. **Static Maps Fetcher (Backend)**
   - `services/maps_fetcher.py` fetches satellite + terrain PNG from Google Static Maps API
   - Composite blend (satellite + terrain overlay)
   - Saved to temp folder for Phase 4 (Gemma)

5. **Search Bar**
   - Location search with autocomplete
   - "Use My Location" button
   - Map flies to searched location
   - RTO zone auto-detected and displayed

### What We Skip
- ❌ Scoring colors on grid (Phase 3)
- ❌ Gemma vision analysis (Phase 4)
- ❌ Places API integration (Phase 5)
- ❌ Flood zone overlay (Phase 5)
- ❌ Charger markers (Phase 5)

### AI Agent Tasks
- Implement grid math (meters → degrees conversion)
- Implement MapCanvas with Google Maps
- Implement GridOverlay with polygons
- Implement search bar with geocoding
- Implement Static Maps fetcher

### Human Tasks
- Verify grid cells are exactly 500m by measuring in Google Maps
- Verify labels (A1, B2) are readable
- Test search with 3 locations: "Koramangala", "Yelahanka", "Electronic City"
- Confirm map flies to correct location
- Verify RTO zone detection is correct

---

## PHASE 3: SCORING ENGINE & APIs (Week 5–6)

### What We Build
1. **Scoring Engine (Python)**
   - `services/scoring_engine.py` with `ViabilityEngine` class
   - All 6 factors implemented with exact formulas from PRD
   - `calculate_final_score()` returns score + verdict + recommendation
   - Hard gate: severe flood zones cap at 4.0

2. **API Endpoints**
   - `POST /api/v1/analyze` — accepts location, returns session ID
   - `GET /api/v1/analyze/{session_id}/status` — polling endpoint
   - `GET /api/v1/zones` — list all RTO zones
   - `GET /api/v1/zones/{rto_code}` — zone details

3. **Frontend Score Display**
   - Score badge component (color-coded)
   - Score breakdown panel (6 progress bars)
   - Verdict label (HIGH PRIORITY / VIABLE / etc.)
   - Charger recommendation display

4. **Mock Data Mode**
   - Since Places API and Gemma aren't ready yet, use mock data
   - Mock charger counts, mock vision multipliers
   - This lets us test scoring logic end-to-end

### What We Skip
- ❌ Real Places API data (Phase 5)
- ❌ Real Gemma vision (Phase 4)
- ❌ Cost estimation (Phase 6)
- ❌ Timeline (Phase 6)
- ❌ PDF (Phase 6)

### AI Agent Tasks
- Implement scoring engine with all 6 factors
- Implement API endpoints
- Implement score display components
- Wire frontend to backend APIs

### Human Tasks
- Verify scores make sense for known zones
- Test: Jayanagar should score higher than Yelahanka
- Test: Electronic City should show high priority for tech parks
- Verify mock data produces consistent results

---

## PHASE 4: AI VISION (Gemma) (Week 7–8)

### What We Build
1. **Ollama Integration**
   - `services/gemma_client.py` sends images to `localhost:11434`
   - Prompt template from PRD Section 12.2
   - JSON response parsing with regex fallback
   - Batch processing (9 cells at a time)

2. **Screenshot Pipeline**
   - Backend captures Static Maps image
   - Pillow draws grid overlay on image
   - Image sent to Gemma for analysis
   - Results stored per cell

3. **Vision Multiplier Integration**
   - Gemma's `vision_multiplier` fed into scoring engine
   - Land use tags stored in database
   - Flood risk score from vision added to S6
   - Tree cover score from vision added to S6

4. **Fallback Handling**
   - If Gemma times out → use multiplier 1.0
   - If JSON malformed → parse partial, fill defaults
   - If Ollama not running → show warning, use defaults

### What We Skip
- ❌ Places API (Phase 5)
- ❌ Cost/timeline (Phase 6)
- ❌ Chat (Phase 7)

### AI Agent Tasks
- Implement Gemma client with Ollama
- Implement JSON parser with fallback
- Implement batch processing
- Integrate vision results into scoring

### Human Tasks
- Monitor Gemma response times on your laptop
- If too slow (>30s), consider `gemma:2b` instead of `gemma:4b`
- Verify vision multipliers make sense (mall areas get 1.5×)
- Test fallback by stopping Ollama mid-analysis

---

## PHASE 5: PLACES API & INTELLIGENCE (Week 9–10)

### What We Build
1. **Google Places Integration**
   - `services/places_client.py` with rate limiting
   - Query EV chargers within 5km of each cell
   - Query POIs (restaurants, malls, hotels) within 1km
   - Query transformers/substations within 500m
   - Cache results for 24 hours

2. **BBMP Flood Zone Overlay**
   - `FloodOverlay.tsx` renders polygons on map
   - Severe = red, Moderate = amber
   - Clickable popups with zone details

3. **Score Refinement**
   - S2 (Infra Gap) uses real charger counts
   - S3 (Grid Readiness) uses real transformer distances
   - S4 (Commercial) uses real POI counts
   - S6 (Env Risk) combines BBMP + Gemma vision

4. **Cost Tracker**
   - Track Google API usage per analysis
   - Display estimated cost before analysis starts
   - Daily budget cap enforcement

### What We Skip
- ❌ Cost estimation engine (Phase 6)
- ❌ Timeline calculator (Phase 6)
- ❌ PDF generation (Phase 6)
- ❌ Chat (Phase 7)

### AI Agent Tasks
- Implement Places client with rate limiting
- Implement flood zone overlay
- Update scoring to use real Places data
- Implement cost tracker

### Human Tasks
- Monitor Google API billing dashboard
- Verify charger counts match reality (check Google Maps manually)
- Verify flood zones render in correct locations
- Test rate limiting by running multiple analyses quickly

---

## PHASE 6: COST, TIMELINE & REPORTS (Week 11–12)

### What We Build
1. **Cost Estimation Engine**
   - `services/cost_calculator.py`
   - Equipment costs from PRD tables
   - Installation costs from PRD tables
   - Transformer adder based on distance
   - Land cost toggle (owned vs rent)
   - FAME-II subsidy note

2. **Timeline Calculator**
   - `services/timeline_calculator.py`
   - BESCOM approval phases
   - Modifier logic (transformer, tree cutting, flood)
   - Gantt-style visualization

3. **Growth Projection**
   - `services/growth_projector.py`
   - NumPy polynomial regression
   - 1/3/5/10 year projections
   - Recharts area chart on frontend

4. **PDF Report Generator**
   - `services/pdf_generator.py` using ReportLab
   - 8-section report template
   - Map image embedded
   - Charts embedded as PNG

5. **Report API**
   - `GET /api/v1/report/{session_id}` — download PDF
   - `GET /api/v1/report/{session_id}/preview` — metadata

### What We Skip
- ❌ Chat panel (Phase 7)
- ❌ Mobile polish (Phase 7)
- ❌ Advanced animations (Phase 7)

### AI Agent Tasks
- Implement cost calculator
- Implement timeline calculator
- Implement growth projector
- Implement PDF generator
- Implement report endpoints

### Human Tasks
- Verify cost ranges match market reality
- Verify timeline matches BESCOM 2026 guidelines
- Download PDF and verify all 8 sections render correctly
- Check PDF file size (<2MB target)

---

## PHASE 7: FRONTEND POLISH & CHAT (Week 13–14)

### What We Build
1. **Anthropic-Themed UI**
   - Apply all CSS variables from PRD Section 11
   - Score badges with coral/amber/green colors
   - Progress bars with animations
   - Cluster highlight with marching ants border

2. **Right Panel**
   - Score summary card
   - Score breakdown (6 bars)
   - Top clusters cards
   - Cost estimate accordion
   - Timeline Gantt bar
   - Growth chart (Recharts)
   - Download PDF button

3. **Cell Detail Modal**
   - Slide-in panel on cell click
   - All 6 scores with bars
   - Gemma reasoning text
   - Infrastructure details
   - Action buttons

4. **Chat Panel**
   - Slide-out from right (desktop) / bottom (mobile)
   - OpenRouter integration
   - Context injection with analysis data
   - Starter question buttons
   - Message history

5. **Mobile Responsive**
   - Breakpoints: desktop (>1280), tablet (768–1280), mobile (<768)
   - Bottom sheet for cell details
   - Floating action button
   - Touch gestures on map

### What We Skip
- ❌ Batch analysis (post-launch)
- ❌ Custom grid sizes (post-launch)
- ❌ Sensitivity analysis (post-launch)

### AI Agent Tasks
- Implement all UI components
- Implement chat panel
- Implement responsive layout
- Implement animations

### Human Tasks
- Verify UI matches PRD color palette
- Test on mobile device (or Chrome DevTools mobile view)
- Verify chat responses are context-aware
- Check all animations are smooth (no jank)

---

## PHASE 8: TESTING & HARDENING (Week 15–16)

### What We Build
1. **Unit Tests**
   - Scoring engine tests (pytest)
   - Grid math tests
   - JSON parser tests

2. **Integration Tests**
   - API endpoint tests
   - Database query tests
   - Places client mock tests

3. **E2E Tests**
   - Playwright test: full analysis flow
   - Playwright test: PDF download
   - Playwright test: chat interaction

4. **Error Handling**
   - All 12 error types from PRD Section 18
   - Graceful degradation
   - User-friendly error messages

5. **Performance**
   - React Query caching
   - Backend in-memory cache
   - Lazy loading for heavy components

### What We Skip
- ❌ No new features
- ❌ No UI changes unless bug fixes

### AI Agent Tasks
- Write unit tests
- Write integration tests
- Write E2E tests
- Implement error boundaries
- Implement caching

### Human Tasks
- Run all tests, verify they pass
- Manually test all 10 RTO zones
- Generate PDF for 3 zones, verify correctness
- Test error states (disconnect internet, stop Ollama, etc.)

---

## PHASE 9: DEPLOYMENT & LAUNCH (Week 17–18)

### What We Build
1. **Deployment Scripts**
   - `setup.sh` — one-command setup
   - `start.sh` — one-command launch
   - `backup.sh` — SQLite backup

2. **Documentation**
   - `README.md` — setup instructions
   - `API.md` — endpoint reference
   - `DEPLOYMENT.md` — local deployment guide
   - `USER_GUIDE.md` — how to use the app

3. **Demo Prep**
   - Pre-run analysis for 3 showcase locations:
     - Electronic City (high score — impressive)
     - Yelahanka (growth story — future potential)
     - Jayanagar (highest EVs — market leader)
   - Screenshot these for pitch deck

4. **Final Polish**
   - No console errors
   - No Python warnings
   - Clean git history
   - Tagged release: `git tag v1.0.0`

### What We Skip (Deferred to Post-Launch)
- ❌ Real-time charger availability
- ❌ Multi-user accounts
- ❌ City expansion (Hyderabad, Chennai)
- ❌ ML model retraining
- ❌ Government dashboard
- ❌ Mobile app

### AI Agent Tasks
- Write deployment scripts
- Write documentation
- Clean up code
- Generate demo screenshots

### Human Tasks
- Run `./setup.sh` on a fresh machine to verify
- Run `./start.sh` and confirm all services start
- Show demo to one friend/colleague, gather feedback
- Tag release on GitHub

---

## ERROR ESCALATION PROTOCOL

When the AI agent hits an error it cannot solve:

1. **Copy the exact error message** (full stack trace)
2. **Paste it into this chat** (with me, Kimi)
3. **Tell me which phase you're in**
4. **Tell me what you were trying to do**
5. I will analyze and give you:
   - Root cause explanation
   - Exact fix (code or config)
   - Prevention strategy

**Do NOT let the AI agent spin on the same error for more than 30 minutes.** If it's stuck, escalate immediately.

---

## SCOPE CHANGE PROTOCOL

If you want to add something not in the PRD:

1. **Ask me first.** I will tell you which phase it belongs in.
2. **If it delays the current phase by >2 days**, defer it to post-launch.
3. **If it's a bug fix**, do it immediately.
4. **If it's a "nice to have"**, add it to the Phase 9 deferred list.

**The goal is to ship v1.0 in 18 weeks.** Everything else can wait.

---

## PHASE 1 AGENT PROMPT (Copy & Paste This)

Below is the exact prompt to paste into your AI agent (Codex / VS Code Agent) to start Phase 1.

---

```
You are building Phase 1 of EV GridSense — an EV charging station viability analyzer for Bangalore.

GOAL: Create the project foundation — Next.js frontend, FastAPI backend, SQLite database with seeded RTO data, and a working health check connection between frontend and backend.

PROJECT STRUCTURE (create exactly this):
```
ev-grid-scanner/
├── frontend/          # Next.js 14 (App Router, Tailwind, TypeScript)
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   └── ui/
│   │   │       └── Header.tsx
│   │   └── lib/
│   │       └── constants.ts
│   ├── public/
│   ├── package.json
│   ├── tailwind.config.ts
│   ├── next.config.js
│   └── .env.local
├── backend/           # FastAPI + SQLite
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models.py
│   │   └── routers/
│   │       └── health.py
│   ├── db/
│   │   └── seed.py
│   ├── data/
│   │   └── .gitkeep
│   ├── requirements.txt
│   └── .env
├── .gitignore
└── README.md
```

REQUIREMENTS:

1. FRONTEND (Next.js):
   - Use `npx create-next-app@latest` with: TypeScript, Tailwind CSS, App Router, src directory
   - `layout.tsx`: Root layout with dark background (#0E0D0C), warm cream text (#F5F0E8)
   - `page.tsx`: Landing page with "EV GridSense" title, subtitle "Bangalore EV Charging Viability Analyzer", and a placeholder message "Analysis tools coming soon"
   - `globals.css`: Define CSS custom properties for the Anthropic-inspired dark theme (all colors from the design system)
   - `Header.tsx`: Simple header with logo text "EV GridSense" and coral accent color (#D97757)
   - `constants.ts`: Export RTO_CODES array with all 10 Bangalore RTO codes
   - `.env.local`: Template with `NEXT_PUBLIC_API_URL=http://localhost:8000`
   - Must run on `npm run dev` at localhost:3000 without errors

2. BACKEND (FastAPI):
   - `main.py`: FastAPI app with CORS middleware allowing localhost:3000
   - `health.py`: Router with GET `/api/health` returning `{"status": "ok", "version": "1.0.0"}`
   - `database.py`: SQLAlchemy async engine connecting to SQLite at `backend/data/ev_grid.db`
   - `models.py`: SQLAlchemy models for:
     - `RTOZone` (rto_code PK, office_name, total_evs, two_wheelers, four_wheelers, others, demand_profile, last_updated)
     - `FloodZone` (id PK, lat, lng, zone_name, vulnerability_level, bbmp_zone)
     - `AnalysisCache` (session_id PK, location_name, status, created_at)
   - `seed.py`: Script that creates tables and seeds RTOZone with this exact data:
     KA-05 Jayanagar 23090
     KA-01 Koramangala 11690
     KA-02 Rajajinagar 11652
     KA-04 Yeshwanthpur 10665
     KA-03 Indiranagar 10585
     KA-53 KR Puram 8976
     KA-51 Electronic City 5954
     KA-43 Devanahalli 3967
     KA-50 Yelahanka 1365
     KA-59 Banashankari 7059
   - `.env`: Template with DATABASE_URL, placeholder for GOOGLE_MAPS_API_KEY, OPENROUTER_API_KEY, OLLAMA_HOST
   - `requirements.txt`: fastapi, uvicorn, sqlalchemy, pydantic, python-dotenv, httpx
   - Must run on `uvicorn app.main:app --reload` at localhost:8000 without errors

3. CONNECTION:
   - Frontend page.tsx should fetch from `NEXT_PUBLIC_API_URL/api/health` on mount
   - Display the health status on the page ("Backend: Connected" or "Backend: Disconnected")

4. CONFIGURATION:
   - `.gitignore`: Exclude node_modules, .next, __pycache__, .env files, *.db
   - `README.md`: Brief description and setup instructions

5. DESIGN SYSTEM (globals.css must include):
   --bg-primary: #0E0D0C
   --bg-secondary: #1A1815
   --bg-tertiary: #252220
   --brand-primary: #D97757
   --brand-hover: #C4603E
   --text-primary: #F5F0E8
   --text-secondary: #9E9589
   --text-tertiary: #6B6660
   --score-high: #C95F5F
   --score-viable: #D4933A
   --score-marginal: #5A9E6F
   --score-low: #4A4845
   --border-subtle: #2E2B27
   --border-strong: #3D3935

DO NOT build:
- Google Maps integration
- Grid overlay
- Scoring engine
- Gemma integration
- Places API calls
- PDF generation
- Chat panel
- Tests (those come in Phase 8)

AFTER COMPLETING:
1. Run `cd frontend && npm run dev` — confirm localhost:3000 loads with dark theme
2. Run `cd backend && uvicorn app.main:app --reload` — confirm localhost:8000/api/health works
3. Confirm frontend shows "Backend: Connected"
4. Run `python db/seed.py` — confirm SQLite file is created with 10 RTO rows
5. Report back any errors encountered.
```

---

*End of Build Guide*
*Next: Paste the Phase 1 prompt into your AI agent. When done (or if stuck), return here.*
