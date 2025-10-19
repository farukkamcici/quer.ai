# Quer.ai

Natural‑language analytics: ask questions about your data and get SQL + results. Quer.ai pairs a FastAPI backend (LLM‑guided SQL over databases/files) with a Next.js frontend (auth, connections, sticky chat UI) backed by Supabase.

> Turkish summary: Doğal dille veri sorun, SQL ve sonuçları alın. FastAPI + Next.js + Supabase mimarisiyle sohbet tabanlı analitik.

## Features

- Natural language to SQL: generate a single, constrained SQL query and a human explanation for each question.
- Multi‑source data: PostgreSQL, MySQL, CSV, and Excel. CSV/Excel can be read from S3.
- Smart schema focusing: narrows the prompt to relevant tables/columns via SentenceTransformers + FAISS semantic search.
- Safe execution: executes generated SQL via SQLAlchemy (DBs) or DuckDB (files) and returns rows as JSON.
- Chat workflow: persists conversations in Supabase; assistant messages include explanation, SQL, and result preview.
- Production‑ready UI: Next.js App Router, protected routes, glassmorphism UI, connection CRUD, sticky chat.

## Architecture

High‑level flow:
1) User authenticates in the Next.js app (Supabase) and selects a connection.
2) Frontend server route fetches secure connection details and calls the Python API `/api/query`.
3) Backend builds a focused schema using semantic search and asks Gemini to generate SQL + explanation.
4) Backend executes SQL and returns `{ sql_query, explanation, data }` to the frontend for rendering and chat persistence.

Backend (FastAPI, `backend/app`):
- `main.py`: FastAPI app with health root and routers under `/api`.
- `api/query_router.py`: `POST /api/query` accepts a `QueryRequest` and returns `QueryResponse`.
- `api/chat_router.py`: manages chats in Supabase (`/api/chat/create`, `/api/chat/message`).
- `core/orchestrator.py`: end‑to‑end pipeline; semantic focus + LLM SQL + execution.
- `core/data_manager.py`: abstract + concrete managers for DBs (SQLAlchemy) and files (DuckDB).
- `core/data_manager_factory.py`: builds managers for `postgresql`, `mysql`, `csv`, `excel`.
- `core/semantic_search.py`: SentenceTransformer embeddings + FAISS index to rank relevant schema parts.
- `services/gemini_service.py`: Gemini 2.5 Flash client to produce SQL + explanation with guardrails.
- `schemas/query.py`: Pydantic models (`DBDetails`, `DataSource`, `QueryRequest`, `QueryResponse`).

Frontend (Next.js, `frontend/querai-app`):
- Protected App Router pages (`/login`, `/signup`, `/`) with Supabase auth.
- `/api/query` route proxies to Python backend using a server‑side secret URL.
- Components for chat (sticky input, scrollable history, accordion details with SQL copy + table view) and connections CRUD.
- See `frontend/querai-app/README.md` for a detailed UI/structure guide.

## API

Base URL: Python backend
- `GET /` → `{ "status": "Querai API is running." }`
- `POST /api/query` → body and response below
- `POST /api/chat/create` → `{ user_id, title? }` → `{ chat_id }`
- `POST /api/chat/message` → `{ chat_id, user_id, message }` → `{ explanation, sql, results }`

Types (simplified):
- `DBDetails`: `{ host, port, username, password, database }`
- `DataSource`:
  - Databases: `{ source_type: "postgresql"|"mysql", db_details: DBDetails }`
  - Files: `{ source_type: "csv"|"excel", file_path: "s3://..." | "/path/..." }`
- `QueryRequest`: `{ question: string, data_source: DataSource }`
- `QueryResponse`: `{ sql_query: string, explanation: string, data: Array<Record<string, any>> }`

Example `/api/query` request (database):
```json
{
  "question": "Top 10 customers by revenue this quarter",
  "data_source": {
    "source_type": "postgresql",
    "db_details": {
      "host": "db.example.com",
      "port": 5432,
      "database": "sales",
      "username": "analytics",
      "password": "••••••••"
    }
  }
}
```

Example `/api/query` request (file on S3):
```json
{
  "question": "Average order value by month",
  "data_source": {
    "source_type": "csv",
    "file_path": "s3://my-bucket/exports/orders.csv"
  }
}
```

## Setup

Prerequisites:
- Python 3.11+, Node.js 18+, a Supabase project, a Google Gemini API key.
- Optional for S3 file sources: AWS credentials with read access to your bucket.

Backend (FastAPI):
1) `cd backend`
2) Create a virtualenv and install deps: `python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt`
3) Create `.env` with at least:
   - `GEMINI_API_KEY` (required)
   - `SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_KEY` (for chat routes)
   - `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` (only if accessing S3)
4) Run: `uvicorn app.main:app --reload`

Frontend (Next.js):
1) `cd frontend/querai-app`
2) Create `.env.local` with:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `PYTHON_BACKEND_URL` (e.g., `http://localhost:8000`)
3) Install and run: `npm ci && npm run dev`

## Supabase Schema Notes

Tables used by the app:
- `connections` (stores data source configs)
  - columns: `id uuid pk`, `user_id uuid`, `name text`, `source_type text` ("PostgreSQL"|"MySQL"|"CSV"|"Excel"), `db_details text` (JSON string), `s3_uri text`, `created_at timestamptz`.
- `chats` (stores chat sessions)
  - columns: `id uuid pk`, `user_id uuid`, `title text`, `data_source_id uuid` (references `connections.id`), `messages jsonb`, `created_at timestamptz`.

RLS is recommended so users access only their own rows. The frontend and backend already query by `user_id` where applicable.

## How It Works (Backend)

1) Inspect source schema
   - Databases: SQLAlchemy inspector enumerates schemas/tables/columns (excludes system schemas).
   - Files: DuckDB registers a temp table from CSV/Excel and DESCRIBEs columns.
2) Semantic focus
   - Builds embeddings for all `schema_elements` using `paraphrase-multilingual-mpnet-base-v2` and indexes with FAISS.
   - Retrieves top‑K relevant elements for the question; expands with likely id/name columns from those tables.
3) LLM prompt
   - Sends a compact, table‑grouped schema and the question to Gemini 2.5 Flash with strict constraints (no invented columns; must return JSON with `sql_query` and `explanation`).
4) Execute and return
   - Runs SQL via the appropriate manager and returns rows as JSON along with the generated SQL and explanation.

## Notes & Limitations

- Environment: `GEMINI_API_KEY` must be set; backend import checks it on startup.
- Model downloads: the SentenceTransformers model loads at runtime and may incur a cold start.
- SQL safety: the LLM is constrained by the schema, but review outputs for mission‑critical use.
- Excel handling: reads the first sheet into memory via pandas before registering in DuckDB.
- S3 access: CSV is streamed by DuckDB; Excel is fetched to memory via `s3fs` + pandas.

## License

Proprietary/internal by default. Add a LICENSE file if you intend to open‑source.
