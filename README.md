# Quer.ai

Conversational analytics that lets you ask questions in natural language and get a single SQL query plus an explanation and results. Quer.ai consists of a FastAPI backend (LLM‑guided NL→SQL over databases/files) and a Next.js frontend (auth, connections, sticky chat UI) with Supabase for auth and storage.

Public Backend URL: `http://64.227.125.131:8000`

## Features

- NL→SQL: Generates one constrained SQL query per question, plus a human‑readable explanation.
- Multi‑source data: PostgreSQL, MySQL, CSV, and Excel; CSV/Excel can be read from S3.
- Semantic focusing: SentenceTransformers + FAISS narrows the prompt to relevant tables/columns.
- Safe execution: SQLAlchemy for DBs, DuckDB for files; results returned as JSON.
- Chat workflow: Stores conversations in Supabase; assistant messages include explanation, SQL, and results.
- Modern UI: Next.js App Router, protected routes, glassmorphism styling, connection CRUD, sticky chat.

## Architecture

- Flow
  1) User signs in (Supabase) and selects a connection.
  2) Frontend fetches secure connection details on the server and calls backend `/api/query`.
  3) Backend focuses the schema semantically and asks Gemini to produce SQL + explanation.
  4) Backend executes the SQL and returns `{ sql_query, explanation, data }`, which the frontend renders and stores in chat.

- Backend (FastAPI, `backend/app`)
  - `main.py`: App and router registration (health endpoint at root).
  - `api/query_router.py`: `POST /api/query` end‑to‑end NL→SQL→execute.
  - `api/chat_router.py`: `POST /api/chat/create`, `POST /api/chat/message` (via Supabase REST).
  - `core/orchestrator.py`: Full pipeline (schema → semantic → LLM → execute).
  - `core/data_manager.py`: `SQLAlchemyManager` (DBs), `DuckDBManager` (files), abstract base.
  - `core/data_manager_factory.py`: Builds managers for `postgresql`/`mysql`/`csv`/`excel`.
  - `core/semantic_search.py`: Embeddings + FAISS index for relevant schema parts.
  - `services/gemini_service.py`: Gemini 2.5 Flash client for SQL + explanation.
  - `schemas/query.py`: Pydantic request/response models.

- Frontend (Next.js, `frontend/querai-app`)
  - Protected pages (`/login`, `/signup`, `/`) with Supabase auth.
  - API proxies: `/api/query`, `/api/chat/create`, `/api/chat/message` forward to the backend.
  - Components: Sticky chat, Details accordion (copyable SQL + table), connection list and forms.
  - Backend base URL via `NEXT_PUBLIC_API_URL` (e.g., `http://64.227.125.131:8000`).

## Directory Layout

```
backend/
  app/
    api/ (query_router.py, chat_router.py)
    core/ (orchestrator.py, data_manager*.py, semantic_search.py, config.py)
    services/ (gemini_service.py)
    schemas/ (query.py)
    main.py

frontend/querai-app/
  app/ (pages, server actions, API routes)
  components/ (ui, chat, layout, connections)
  lib/ (supabase, stores, s3, utils)
  public/, README.md, package.json
```

## API (Backend)

- `GET /` → `{ "status": "Querai API is running." }`
- `POST /api/query` → Body: `{ question, data_source }` → `{ sql_query, explanation, data }`
- `POST /api/chat/create` → `{ user_id, title? }` → `{ chat_id }`
- `POST /api/chat/message` → `{ chat_id, user_id, message }` → `{ explanation, sql, results }`

DataSource
- Databases: `{ source_type: "postgresql"|"mysql", db_details: { host, port, database, username, password } }`
- Files: `{ source_type: "csv"|"excel", file_path: "s3://..." | "/path/..." }`

Privacy: Only schema metadata (table/column names) is sent to the LLM, never data rows.

## Setup (Development)

Prerequisites
- Python 3.11+, Node.js 18+, a Supabase project, a Google Gemini API key.
- Optional for S3 files: AWS credentials with read access.

Backend (FastAPI)
1) `cd backend`
2) Create venv and install deps: `python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt`
3) `.env` variables:
   - `GEMINI_API_KEY` (required)
   - `SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_KEY` (chat routes)
   - `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` (if using S3)
4) Run: `uvicorn app.main:app --reload`

Frontend (Next.js)
1) `cd frontend/querai-app`
2) `.env.local` variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_API_URL` (e.g., `http://64.227.125.131:8000`)
3) `npm ci && npm run dev`

## Deployment (Summary)

- Recommended: DigitalOcean Droplet + systemd + Nginx + Let’s Encrypt for TLS.
- See `backend/README.md` for full commands (packages, systemd unit, Nginx site, TLS, health checks, troubleshooting).
- Frontend must set `NEXT_PUBLIC_API_URL` to the live backend URL.

## Supabase Schema Notes

- `connections`: data source configs (`id`, `user_id`, `name`, `source_type`, `db_details`, `s3_uri`, `created_at`).
- `chats`: chat sessions (`id`, `user_id`, `title`, `data_source_id`, `messages`, `created_at`).
- RLS is recommended so users access only their own rows; the app queries by `user_id` where applicable.

## How It Works (Backend)

1) Schema discovery: SQLAlchemy inspector for DBs; DuckDB DESCRIBE for files.
2) Semantic focusing: Embeds all `schema_elements` and retrieves the most relevant parts; expands with key/name columns.
3) LLM prompt: Sends compact schema + question to Gemini 2.5 Flash with strict constraints (only given schema; JSON `{sql_query, explanation}`).
4) Execute: Runs the SQL with the appropriate manager; returns rows as JSON.

## Roadmap

- SQL safety: sqlglot validation (block DDL/DML, enforce LIMIT/timeout), execution guards.
- Data sources: Parquet and SQLite support.
- Visualization: Plotly charts with auto/manual chart type suggestions.
- NLU/Disambiguation: Interactive ambiguity resolution and minimal dialog memory.
- Performance: Embedding cache/persistence, cold‑start optimization.

## License

Proprietary/internal by default. Add a LICENSE file if you intend to open‑source.
