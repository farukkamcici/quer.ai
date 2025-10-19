# Quer.ai Backend (FastAPI)

LLM‑guided SQL generation and execution service powering Quer.ai. Exposes a simple HTTP API to turn natural‑language questions into a single SQL query, executes it against supported sources (databases or files), and returns results with a human explanation.

## Features

- Natural language → SQL via Gemini 2.5 Flash with strict JSON contract.
- Multi‑source data access: PostgreSQL, MySQL, CSV, Excel (CSV/Excel can be on S3).
- Schema focusing with SentenceTransformers + FAISS to reduce hallucinations and improve relevance.
- Safe query execution: SQLAlchemy for DBs, DuckDB for file sources; JSON row output.
- Optional chat endpoints that persist messages to Supabase.

## Architecture

- FastAPI application in `app/`
  - `main.py`: App factory and router registration (root health endpoint).
  - `api/query_router.py`: `POST /api/query` entrypoint for NL → SQL → execute.
  - `api/chat_router.py`: Minimal chat APIs using Supabase REST (`/api/chat/create`, `/api/chat/message`).
  - `core/orchestrator.py`: End‑to‑end pipeline: inspect schema → semantic focus → prompt Gemini → execute → format.
  - `core/data_manager.py`: Abstract and concrete managers:
    - `SQLAlchemyManager`: DB schema inspection + query execution.
    - `DuckDBManager`: File schema inspection + query execution.
  - `core/data_manager_factory.py`: Builds a manager for `postgresql`, `mysql`, `csv`, or `excel`.
  - `core/semantic_search.py`: Embeddings (paraphrase‑multilingual‑mpnet‑base‑v2) + FAISS `IndexFlatL2`.
  - `services/gemini_service.py`: Gemini client with a guardrailed prompt returning JSON `{sql_query, explanation}`.
  - `schemas/query.py`: Pydantic models for requests and responses.

## Supported Data Sources

- Databases
  - `postgresql`: via `psycopg2` + SQLAlchemy
  - `mysql`: via `pymysql` + SQLAlchemy
- Files
  - `csv`: read via DuckDB (supports local paths or `s3://...` URIs)
  - `excel`: loaded with pandas/openpyxl and registered to DuckDB

## API

Base URL defaults to `http://localhost:8000`.

- GET `/`
  - Health/status. Returns `{ "status": "Querai API is running." }`.

- POST `/api/query`
  - Body: `QueryRequest`
  - Response: `QueryResponse`

- POST `/api/chat/create`
  - Body: `{ user_id: string, title?: string }`
  - Response: `{ chat_id: string }`

- POST `/api/chat/message`
  - Body: `{ chat_id: string, user_id: string, message: string }`
  - Response: `{ explanation: string, sql: string, results: any[] }`
  - Note: The chat’s `data_source_id` in Supabase must be set to a valid `connections.id` before sending messages.

### Schemas (Pydantic)

```ts
DBDetails = {
  host: string,
  port: number,
  username: string,
  password: string,
  database: string,
}

DataSource =
  | { source_type: 'postgresql' | 'mysql', db_details: DBDetails }
  | { source_type: 'csv' | 'excel', file_path: string };

QueryRequest = {
  question: string,
  data_source: DataSource,
}

QueryResponse = {
  sql_query: string,
  explanation: string,
  data: Array<Record<string, any>>,
}
```

### Example Requests

Database example:
```bash
curl -sS http://localhost:8000/api/query \
  -H 'Content-Type: application/json' \
  -d '{
    "question": "Top 10 customers by revenue this quarter",
    "data_source": {
      "source_type": "postgresql",
      "db_details": {
        "host": "db.example.com",
        "port": 5432,
        "database": "sales",
        "username": "analytics",
        "password": "secret"
      }
    }
  }'
```

S3 CSV example:
```bash
curl -sS http://localhost:8000/api/query \
  -H 'Content-Type: application/json' \
  -d '{
    "question": "Average order value by month",
    "data_source": {
      "source_type": "csv",
      "file_path": "s3://my-bucket/exports/orders.csv"
    }
  }'
```

## How It Works

1) Inspect schema
- DBs: SQLAlchemy inspector enumerates schemas/tables/columns (common system schemas are skipped).
- Files: DuckDB registers a temp table from the file and DESCRIBEs its columns.

2) Semantic focus
- Embeds all `schema_elements` and retrieves top‑K relevant to the question; expands with likely id/name columns per table.

3) LLM SQL
- Sends the compact, table‑grouped schema and user question to Gemini 2.5 Flash with strict constraints (no invented columns, must return JSON).

4) Execute & return
- Runs the SQL with the selected manager and returns rows as JSON along with the generated SQL and explanation.

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

## Project Layout

```
backend/
├─ app/
│  ├─ api/
│  │  ├─ chat_router.py
│  │  └─ query_router.py
│  ├─ core/
│  │  ├─ config.py
│  │  ├─ data_manager.py
│  │  ├─ data_manager_factory.py
│  │  ├─ orchestrator.py
│  │  └─ semantic_search.py
│  ├─ services/
│  │  └─ gemini_service.py
│  ├─ schemas/
│  │  └─ query.py
│  └─ main.py
└─ requirements.txt
```

## License

Proprietary/internal by default. Add a LICENSE if you intend to open‑source.

