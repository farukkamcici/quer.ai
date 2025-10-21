# Quer.ai Backend (FastAPI)

LLM‑guided SQL generation and execution service powering Quer.ai. Exposes a simple HTTP API to turn natural‑language questions into a single SQL query, executes it against supported sources (databases or files), and returns results with a human explanation.

## Features

- Connection-aware NL→SQL: Gemini 2.5 Flash returns a typed payload (`sql` | `meta` | `error`) with explanations.
- Cached schema discovery: Connection endpoints precompute `schema_json`, flat elements, and size heuristics stored in Supabase.
- Semantic focusing: SentenceTransformers + FAISS narrow prompts for large schemas with helpful ID/name expansion.
- Multi-source execution: SQLAlchemy for PostgreSQL/MySQL, DuckDB for CSV/Excel (including `s3://` URIs) with JSON row output.
- Supabase integration: connection CRUD, chat lifecycle, and message persistence via service-role REST calls.

## Architecture

- FastAPI application in `app/`
  - `main.py`: App factory and router registration (root health endpoint).
  - `api/query_router.py`: `POST /api/query` entrypoint (expects `connection_id`, optional `user_id`).
  - `api/chat_router.py`: Chat lifecycle (`/api/chat/create`, `/api/chat/message`, `/api/chat/delete_all`).
  - `api/connection_router.py`: Connection CRUD + schema refresh using Supabase REST.
  - `core/schema_discovery_service.py`: Discovers schema, builds UX tree JSON, and flags large sources.
  - `core/orchestrator.py`: Loads cached schema, applies semantic focus, prompts Gemini, executes SQL/meta.
  - `core/data_manager.py`: Abstract manager + concrete `SQLAlchemyManager`/`DuckDBManager` implementations.
  - `core/data_manager_factory.py`: Instantiates the appropriate manager for DB or file sources.
  - `core/semantic_search.py`: SentenceTransformers embeddings + FAISS `IndexFlatL2` filtering for large schemas.
  - `services/gemini_service.py`: Gemini client returning typed JSON payloads with optional meta answers.
  - `schemas/query.py`: Pydantic models (`QueryRequest` with `connection_id`, typed `QueryResponse`).

## Supported Data Sources

- Databases
  - `postgresql`: via `psycopg2` + SQLAlchemy
  - `mysql`: via `pymysql` + SQLAlchemy
- Files
  - `csv`: read via DuckDB (supports local paths or `s3://...` URIs)
  - `excel`: loaded with pandas/openpyxl and registered to DuckDB

## API

Base URL defaults to `http://localhost:8000`.

- `GET /`
  - Health/status check. Returns `{ "status": "Querai API is running." }`.

### Query

- `POST /api/query`
  - Body: `{ "question": string, "connection_id": string, "user_id"?: string }`
  - Response: `{ "response_type": "sql" | "meta" | "error", "sql_query": string, "explanation": string, "data": any[] }`

### Connections (Supabase service key required)

- `POST /api/connections`
  - Body: `{ user_id, name, source_type, db_details?, s3_uri? }`
  - Discovers schema, stores `schema_json` + `schema_elements_flat` + `is_large`, returns `{ id, is_large, schema_size }`.
- `PUT /api/connections/{connection_id}/refresh?user_id=...`
  - Re-runs discovery for an existing connection and updates schema artifacts.
- `GET /api/connections?user_id=...`
  - Lists connections with non-sensitive fields (`id`, `name`, `source_type`, `created_at`, `schema_json`).
- `DELETE /api/connections/{connection_id}?user_id=...`
  - Deletes a connection owned by the provided user.

### Chats

- `POST /api/chat/create`
  - Body: `{ user_id: string, title?: string }`
  - Response: `{ chat_id: string }`
- `POST /api/chat/message`
  - Body: `{ chat_id: string, user_id: string, message: string }`
  - Response: `{ explanation: string, sql: string, results: any[], response_type: string }`
- `DELETE /api/chat/delete_all?user_id=...`
  - Deletes every chat belonging to the given user.

### Schemas (Pydantic)

```ts
type DBDetails = {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
};

type ConnectionCreateRequest = {
  user_id: string;
  name: string;
  source_type: 'postgresql' | 'mysql' | 'csv' | 'excel';
  db_details?: DBDetails;
  s3_uri?: string;
};

type QueryRequest = {
  question: string;
  connection_id: string;
  user_id?: string;
};

type QueryResponse = {
  response_type: 'sql' | 'meta' | 'error';
  sql_query: string;
  explanation: string;
  data: Array<Record<string, any>>;
};
```

### Example Requests

Create a PostgreSQL connection (requires Supabase service key configured in backend env):
```bash
curl -sS http://localhost:8000/api/connections \
  -H 'Content-Type: application/json' \
  -d '{
    "user_id": "00000000-0000-0000-0000-000000000000",
    "name": "Warehouse",
    "source_type": "postgresql",
    "db_details": {
      "host": "db.example.com",
      "port": 5432,
      "database": "analytics",
      "username": "app",
      "password": "secret"
    }
  }'
# => {"id":"fd2c...","is_large":false,"schema_size":128}
```

Run a query using the returned connection id:
```bash
curl -sS http://localhost:8000/api/query \
  -H 'Content-Type: application/json' \
  -d '{
    "question": "Top 10 customers by revenue this quarter",
    "connection_id": "fd2c...",
    "user_id": "00000000-0000-0000-0000-000000000000"
  }'
# => {"response_type":"sql","sql_query":"SELECT ...","explanation":"...","data":[...]}
```

For chat messages call `/api/chat/message` with a chat id whose `data_source_id` points to the same connection:
```bash
curl -sS http://localhost:8000/api/chat/message \
  -H 'Content-Type: application/json' \
  -d '{
    "chat_id": "chat-123",
    "user_id": "00000000-0000-0000-0000-000000000000",
    "message": "Summarise order growth by month"
  }'
# => {"response_type":"sql","sql":"SELECT ...","results":[...],"explanation":"..."}
```

## How It Works

1) Schema discovery (connection creation)
- DBs: SQLAlchemy inspector enumerates schemas/tables/columns (system schemas skipped) and records typed columns.
- Files: DuckDB registers the file (supports `s3://` via `httpfs`) and DESCRIBEs columns, mapping them to UX JSON.

2) Cached context loading (query time)
- `process_query` fetches the saved connection by `connection_id`, reading `schema_elements_flat` and `is_large`.
- For large schemas, SentenceTransformers + FAISS retrieve the most relevant columns and expand with helpful IDs/names.

3) Gemini prompt
- Sends the focused schema + user question to Gemini 2.5 Flash with strict JSON guardrails.
- LLM responds with `response_type` (`sql`, `meta`, or `error`) plus explanation (and SQL if applicable).

4) Execute & persist
- SQL responses execute through the appropriate manager; results are returned as JSON and appended to Supabase chat history alongside the request/response pair.

## Setup

Prerequisites
- Python 3.11+
- A Google Gemini API key
- Optional (for S3): AWS credentials with read access

Install
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
```

Environment (.env)
```
# Required
GEMINI_API_KEY=...

# For chat endpoints (Supabase REST)
SUPABASE_URL=...                # or NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_KEY=...

# For S3 file access (optional)
AWS_REGION=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

Run
```bash
uvicorn app.main:app --reload --port 8000
```

## Development Notes

- Model cold start: the SentenceTransformers model will download on first run.
- SQL safety: the LLM is constrained by the provided schema; still review generated SQL for critical use cases.
- Excel handling: reads the first sheet into memory via pandas, then registers to DuckDB.
- Error handling: endpoints return `{ error }` details within the `data` array or as HTTP errors where appropriate.
- Environment guards: `GEMINI_API_KEY`, `SUPABASE_URL`, and `SUPABASE_SERVICE_KEY` must be present at startup or the routers raise immediately.

## Project Layout

```
backend/
├─ app/
│  ├─ api/
│  │  ├─ chat_router.py
│  │  ├─ connection_router.py
│  │  └─ query_router.py
│  ├─ core/
│  │  ├─ config.py
│  │  ├─ data_manager.py
│  │  ├─ data_manager_factory.py
│  │  ├─ orchestrator.py
│  │  ├─ schema_discovery_service.py
│  │  └─ semantic_search.py
│  ├─ schemas/
│  │  └─ query.py
│  ├─ services/
│  │  └─ gemini_service.py
│  └─ main.py
└─ requirements.txt
```

## License

Proprietary/internal by default. Add a LICENSE if you intend to open‑source.
