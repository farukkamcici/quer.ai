# Querai

Conversational analytics that lets you ask questions in natural language and get a single SQL query plus an explanation and results. Quer.ai consists of a FastAPI backend (LLM‑guided NL→SQL over databases/files) and a Next.js frontend (auth, connections, sticky chat UI) with Supabase for auth and storage.

## Features

- Connection-aware NL→SQL: Generates a single constrained SQL query or a meta answer per question using Gemini 2.5 Flash with a strict JSON contract.
- Schema caching pipeline: Connection APIs discover schemas, persist `schema_json` + flat elements + size heuristics in Supabase, and reuse them on every query.
- Multi-source data: PostgreSQL, MySQL, CSV, and Excel; CSV/Excel uploads stream to S3 and are executed through DuckDB.
- Chat-first workspace: Dual sidebars for chats and data sources, auto chat creation, delete-all helpers, schema viewer, and copyable SQL/results cards.
- Marketing → app routing: Public landing page at `/` with auth modal, authenticated app under `/home`, shared Supabase session, and persisted theme toggle.

## Architecture

- Flow
  1) Visitors land on the marketing page at `/` (public) and can open the auth modal.
  2) Authenticated sessions redirect to `/home` (App route group) where Supabase is fetched on the server.
  3) Creating or refreshing a connection hits FastAPI `/api/connections*`, which discovers schema artifacts and persists them in Supabase.
  4) Selecting a connection auto-creates a chat; questions post to `/api/chat/message`, which proxies to the backend.
  5) Backend loads cached schema for the `connection_id`, optionally applies FAISS semantic focus, and asks Gemini for SQL or meta output.
  6) SQL executes via SQLAlchemy/DuckDB; responses (including `response_type`) are stored in Supabase chat history and rendered client-side.

- Backend (FastAPI, `backend/app`)
  - `main.py`: Registers query, chat, and connection routers (root health endpoint).
  - `api/query_router.py`: `POST /api/query` consuming `{ question, connection_id, user_id? }`.
  - `api/chat_router.py`: Chat lifecycle (`/api/chat/create`, `/api/chat/message`, `/api/chat/delete_all`).
  - `api/connection_router.py`: CRUD + schema refresh for saved connections via Supabase REST.
  - `core/schema_discovery_service.py`: Discovers schema, builds UX tree, flags large sources.
  - `core/orchestrator.py`: Loads cached schema, performs semantic focus, routes Gemini + execution.
  - `core/data_manager.py` & `data_manager_factory.py`: SQLAlchemy (DBs) + DuckDB (files) managers.
  - `core/semantic_search.py`: SentenceTransformers + FAISS focus when schema is large.
  - `services/gemini_service.py`: Gemini 2.5 Flash client returning typed responses (`sql`/`meta`/`error`).
  - `schemas/query.py`: Pydantic models with `connection_id` + `response_type` field.

- Frontend (Next.js, `frontend/querai-app`)
  - Route groups: `(marketing)` landing page, `(app)/home` authenticated workspace, `/chat/[id]` deep links.
  - Dual sidebars: `ChatSidebar` (history, TTL, delete-all) + `Sidebar` (connections, schema viewer, CRUD).
  - API routes: `/api/query`, `/api/chat/*`, `/api/connections/*` proxy to FastAPI using `PYTHON_BACKEND_URL`.
  - Brand system: `components/brand/*` for glass surfaces, gradients, theme toggle with persisted `data-theme`.
  - Client stores: Zustand chat/connection stores manage selection, cached messages, auto chat creation.

## Directory Layout

```
backend/
  app/
    api/
      chat_router.py
      connection_router.py
      query_router.py
    core/
      config.py
      data_manager.py
      data_manager_factory.py
      orchestrator.py
      schema_discovery_service.py
      semantic_search.py
    schemas/
      query.py
    services/
      gemini_service.py
    main.py

frontend/querai-app/
  app/
    (marketing)/page.jsx
    (app)/home/page.jsx
    chat/[id]/page.jsx
    actions/
      auth.js
      connections.js
    api/
      query/route.js
      chat/
        create/route.js
        message/route.js
        delete-all/route.js
    login/page.jsx
    signup/page.jsx
  components/
    Features.jsx
    Footer.jsx
    Hero.jsx
    auth/
    brand/
    chat/
    connections/
    layout/
    ui/
  lib/
    s3/upload.js
    stores/
      chatStore.js
      connectionStore.js
    supabase/
      client.js
      server.js
    utils.js
  public/
  README.md
  package.json
```

## Frontend UI & Design System

- Tokens: Querai Design System v1 lives in `frontend/querai-app/app/globals.css` under `--qr-*` CSS variables and theme data-attributes that drive both light/dark palettes.
- Core UI components: `components/ui/*.jsx` (button, input, label, dialog, form, select) wrap Radix primitives with consistent focus, disabled, and density treatments.
- Brand surfaces: `components/brand/Surface.jsx`, `Gradient.jsx`, and `Motion.jsx` provide glassmorphism panels, hero gradients, and scroll/entry animations.
- Theme toggle: `components/brand/ThemeToggle.jsx` + root inline script persist the chosen theme in `localStorage` before hydration.
- Pointer affordances: Global rule ensures links/buttons show pointer cursors across marketing, auth, and app views.

### Auth Modal UX Polish (Frontend)

- Location: `components/auth/AuthModal.jsx`, `components/auth/LoginForm.jsx`, `components/auth/SignupForm.jsx`.
- Container: Premium dark glass panel using `#0b1529`, subtle inner ring, backdrop blur, and soft radial halo; enter animation is a short fade + upward shift.
- Inputs: Tokenized surfaces/borders with rounded `--qr-radius-md`, subtle inner inset shadow, focus glow ring; increased height for comfort. Placeholders use a single space (`placeholder=" "`) to enable floating labels reliably.
- Floating labels: Always white; default position at `top-2.5` (13px). On focus/filled move to `-top-2` (≈-0.5rem) and `text-xs`, smooth ease.
- Buttons: Gradient primary (`#2563EB → #7C3AED`) with gentle background‑position motion and light lift on hover.
- Segmented toggle: Simpler, less dominant chip; transparent base with subtle border. Active has soft surface tint; passive gets a light hover fill. Final pass increased white contrast for clarity on dark background.
- Divider: “OR” centered with thin white lines left/right for a clean, minimal look.

Modified files for the polish:
- `frontend/querai-app/components/auth/AuthModal.jsx`
- `frontend/querai-app/components/auth/LoginForm.jsx`
- `frontend/querai-app/components/auth/SignupForm.jsx`
- `frontend/querai-app/components/ui/input.jsx`
- `frontend/querai-app/components/ui/button.jsx`
- `frontend/querai-app/app/globals.css`

## API (Backend)

- `GET /` → `{ "status": "Querai API is running." }`

- Queries
  - `POST /api/query`
    - Body: `{ "question": string, "connection_id": string, "user_id"?: string }`
    - Response: `{ "response_type": "sql" | "meta" | "error", "sql_query": string, "explanation": string, "data": any[] }`

- Connections (require Supabase REST + service key)
  - `POST /api/connections`
    - Body: `{ user_id, name, source_type, db_details?, s3_uri? }`
    - Discovers schema, stores `schema_json`/`schema_elements_flat`/`is_large`, returns `{ id, is_large, schema_size }`.
  - `PUT /api/connections/{connection_id}/refresh?user_id=...`
    - Re-runs discovery for the saved source and updates cached schema artifacts.
  - `GET /api/connections?user_id=...`
    - Lists connections with non-sensitive fields (`id`, `name`, `source_type`, `created_at`, `schema_json`).
  - `DELETE /api/connections/{connection_id}?user_id=...`
    - Deletes a connection owned by the requester.

- Chats
  - `POST /api/chat/create` → `{ user_id, title? }` → `{ chat_id }`
  - `POST /api/chat/message` → `{ chat_id, user_id, message }` → `{ explanation, sql, results, response_type }`
  - `DELETE /api/chat/delete_all?user_id=...` → `{ deleted: true }`

Privacy: Only schema metadata (table/column names) is sent to the LLM, never actual data rows.

## Setup (Development)

Prerequisites
- Python 3.11+, Node.js 18+, a Supabase project, a Google Gemini API key.
- Optional for S3 files: AWS credentials with read access.

Backend (FastAPI)
1) `cd backend`
2) Create venv and install deps: `python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt`
3) `.env` variables:
   - `GEMINI_API_KEY` (required for Gemini)
   - `SUPABASE_URL` (or fallback `NEXT_PUBLIC_SUPABASE_URL`)
   - `SUPABASE_SERVICE_KEY` (required for chat + connection routers)
   - `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` (needed for S3-based CSV/Excel sources)
4) Run: `uvicorn app.main:app --reload`

Frontend (Next.js)
1) `cd frontend/querai-app`
2) `.env.local` variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `PYTHON_BACKEND_URL` (e.g., `http://64.227.125.131:8000`)
   - `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET_NAME` (required for file uploads to connections)
3) `npm ci && npm run dev`

## Deployment (Summary)

- Recommended: DigitalOcean Droplet + systemd + Nginx + Let’s Encrypt for TLS.
- See `backend/README.md` for full commands (packages, systemd unit, Nginx site, TLS, health checks, troubleshooting).
- Frontend must set `PYTHON_BACKEND_URL` to the live backend URL.

## Supabase Schema Notes

- `connections`: records with credentials (`id`, `user_id`, `name`, `source_type`, `db_details` JSON, `s3_uri`, `schema_json`, `schema_elements_flat`, `is_large`, `created_at`).
- `chats`: chat sessions (`id`, `user_id`, `title`, `data_source_id`, `messages` array with response metadata, `created_at`).
- RLS is recommended so users access only their own rows; the app queries by `user_id` where applicable.

## How It Works (Backend)

1) Connection creation hits `SchemaDiscoveryService`, capturing `schema_elements_flat`, UX tree JSON, and an `is_large` heuristic saved in Supabase.
2) `process_query` loads the cached connection by `connection_id`; if the schema is large it builds a FAISS index on demand.
3) Semantic focusing narrows to relevant columns and expands with helpful ID/name fields before prompting Gemini.
4) Gemini returns a typed payload (`sql`/`meta`/`error`); SQL results run through the appropriate manager and both explanation + results are persisted back to Supabase.

## Roadmap

- SQL safety: sqlglot validation (block DDL/DML, enforce LIMIT/timeout), execution guards.
- Data sources: Parquet and SQLite support.
- Visualization: Plotly charts with auto/manual chart type suggestions.
- NLU/Disambiguation: Interactive ambiguity resolution and minimal dialog memory.
- Performance: Embedding cache/persistence, cold‑start optimization.

## License

Proprietary/internal by default. Add a LICENSE file if you intend to open‑source.
