# Green Grid AI (greengrid)

Monorepo for the **greengrid** EV-grid planning app.
EV GridSense is a location-intelligence web application that scientifically determines where to build EV charging stations in Bangalore. It combines satellite imagery analysis via local AI (Gemma 4 E4B), government RTO registration data, BBMP flood zone data, Google Maps infrastructure data, and BESCOM cost models to produce a numerical viability score (1–10) for any 500m×500m grid cell in the city. 1.2 Why It Matters Bangalore has 210,000+ registered EVs across 17 RTO zones but charging infrastructure is distributed based on intuition, not data. BESCOM, Shell, Tata Power, and private developers need a tool that answers: "If I install a 50kW DC fast charger at this exact intersection, will it be used? Will it flood in monsoon? How much will BESCOM charge me? How long until it's live?" EV GridSense answers all four questions in under 60 seconds. 1.3 Success Criteria Table Metric Target Measurement Analysis completion time <60 seconds Backend logs Score accuracy vs ground truth >80% correlation Quarterly validation against installed stations User task completion rate >90% Frontend analytics API uptime >99% Uptime monitoring Demo-to-stakeholder clarity Immediate understanding Qualitative feedback 1.4 Development Investment Timeline: 18 weeks (revised from 14 — solo developer, part-time feasible) Team: 1 full-stack developer (solo build) Infrastructure: Local laptop deployment (zero cloud costs) Running Costs: Google Maps API (~₹200/analysis), OpenRouter free tier

## What’s inside

- `ev-grid-scanner/frontend` — Next.js 14 + TypeScript + Tailwind UI
- `ev-grid-scanner/backend` — FastAPI backend
- `ev-grid-scanner/run_dev.sh` / `ev-grid-scanner/stop_dev.sh` — start/stop both services

## Quick start

### 1) Configure environment variables (do not commit secrets)

Frontend:

```bash
cp ev-grid-scanner/frontend/.env.local.example ev-grid-scanner/frontend/.env.local
```

Backend:

```bash
cp ev-grid-scanner/backend/.env.example ev-grid-scanner/backend/.env
```

### 2) Run

```bash
cd ev-grid-scanner
./run_dev.sh
```

- Frontend: http://localhost:3000
- Backend: http://localhost:8000

To stop:

```bash
cd ev-grid-scanner
./stop_dev.sh
```

## Notes

- `.env` files are intentionally ignored by git.
- Build output folders (`node_modules/`, `.next/`, virtualenvs, logs) are ignored as well.
