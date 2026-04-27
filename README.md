# CV Optimizer

AI-assisted CV analysis: upload a CV (PDF, DOCX, or TXT), enter a target job title, and get a structured report with match score, skills gaps, missing sections, and prioritized recommendations.

## Stack

- **Frontend:** React 19, Vite, Tailwind CSS  
- **Backend:** Node.js, Express, OpenAI (GPT-4o), optional RAG with MongoDB  

## Prerequisites

- [Node.js](https://nodejs.org/) 20+ recommended  
- An [OpenAI API key](https://platform.openai.com/)  
- **Optional:** MongoDB — only if `ENABLE_RAG=true` (see below)  

## Setup

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env — at minimum set OPENAI_API_KEY
npm install
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env
# Defaults use http://localhost:3001 — adjust VITE_API_URL if your API runs elsewhere
npm install
```

## Environment

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | OpenAI API key for chat and embeddings |
| `ENABLE_RAG` | No | `true` (default) uses MongoDB for retrieval context; `false` runs the pipeline without MongoDB |
| `MONGODB_URI` | If `ENABLE_RAG=true` | MongoDB connection string |
| `PORT` | No | API port (default `3001`) |

Other backend options (`JUDGE_QUALITY_THRESHOLD`, `MAX_RETRIES`, rate limits) are documented in `backend/.env.example`.

| Frontend | Description |
|----------|-------------|
| `VITE_API_URL` | Base URL of the API (default `http://localhost:3001`) |

## Run (development)

Start the API first, then the UI.

**Terminal 1 — backend**

```bash
cd backend
npm run dev
```

**Terminal 2 — frontend**

```bash
cd frontend
npm run dev
```

Open the Vite dev server URL (usually `http://localhost:5173`). The app calls `POST /api/analyze` with `multipart/form-data` fields `file` and `jobTitle`.

## Build

```bash
cd backend && npm run build && npm start
cd frontend && npm run build && npm run preview
```

## API health

`GET http://localhost:3001/health` — returns status and whether RAG is enabled.

## License

Private / project use unless stated otherwise.
