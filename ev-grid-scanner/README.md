# greengrid

Phase 1 foundation for greengrid, a Bangalore EV charging station viability analyzer.

## Stack

- Frontend: Next.js 14, TypeScript, Tailwind CSS
- Backend: FastAPI, SQLAlchemy, SQLite
- Database seed: 10 Bangalore RTO zones

## Setup

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`.

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python db/seed.py
uvicorn app.main:app --reload
```

Backend runs on `http://localhost:8000`, with health available at `http://localhost:8000/api/health`.

## Notes

- API keys are stored only in local env files and are excluded from git.
- The frontend only calls the local FastAPI backend in Phase 1.
