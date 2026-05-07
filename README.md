# Green Grid AI (greengrid)

Monorepo for the **greengrid** EV-grid planning app.

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
