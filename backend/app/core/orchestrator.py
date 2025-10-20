import json
import os
from collections import defaultdict
from typing import Dict, Any

import requests

from app.services import gemini_service
from app.schemas.query import QueryRequest, QueryResponse, DataSource, DBDetails
from app.core.data_manager_factory import create_data_manager
from app.core.semantic_search import SemanticSearch


def _build_focused_schema_from_parts(parts: list[str]) -> str:
    """
        Reconstructs a human-readable schema string from a list of relevant parts.
        Example input: ['users.user_id', 'users.name', 'orders.amount']
        Example output:
        Table `users` has columns: user_id, name
        Table `orders` has columns: amount
        """

    tables = defaultdict(list)
    for part in parts:
        split_parts = part.split(".")
        table_name = ".".join(split_parts[:-1])
        column_name = split_parts[-1]
        tables[table_name].append(column_name)

    schema_str = ""
    for table, columns in tables.items():
        column_list = ", ".join(columns)
        schema_str += f"Table {table} has columns: {column_list}\n"

    return schema_str.strip()


SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")


def _sb_headers() -> Dict[str, str]:
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise RuntimeError("Supabase env vars missing (SUPABASE_URL / SUPABASE_SERVICE_KEY)")
    return {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
    }


def _get_connection_row(connection_id: str, user_id: str | None) -> Dict[str, Any]:
    params = {"id": f"eq.{connection_id}", "select": "*"}
    if user_id:
        params["user_id"] = f"eq.{user_id}"
    r = requests.get(f"{SUPABASE_URL}/rest/v1/connections", headers=_sb_headers(), params=params)
    if not r.ok or not r.json():
        raise RuntimeError("Connection not found or cannot be read")
    return r.json()[0]


def process_query(request: QueryRequest) -> QueryResponse:
    try:
        if not request.connection_id:
            error_msg = "A connection_id must be provided in the request."
            return QueryResponse(response_type="error", sql_query="", explanation=error_msg, data=[{"error": error_msg}])

        # Load connection row (includes schema artifacts and execution details)
        conn = _get_connection_row(request.connection_id, request.user_id)

        schema_elements_flat: list[str] = conn.get("schema_elements_flat") or []
        is_large: bool = bool(conn.get("is_large"))

        if not schema_elements_flat:
            error_msg = "No cached schema found for the provided connection."
            return QueryResponse(response_type="error", sql_query="", explanation=error_msg, data=[{"error": error_msg}])

        # Build hybrid context for LLM
        if is_large:
            db_schema = _build_focused_schema_from_parts(schema_elements_flat)
        else:
            # Use semantic search to filter
            search = SemanticSearch()
            search.create_vector_store(schema_elements_flat)
            semantic_parts = search.find_relevant_schema_parts(request.question)

            # Expand with id/name-like columns for matched tables
            relevant_tables = set(".".join(p.split(".")[:-1]) for p in semantic_parts)
            schema_parts = set(semantic_parts)
            identifier_keywords = ['name', 'title', 'label', 'isim', 'ad']
            for element in schema_elements_flat:
                element_table = ".".join(element.split('.')[:-1])
                element_column = element.split('.')[-1].lower()
                if element_table in relevant_tables:
                    if element_column.endswith('_id') or element_column == 'id':
                        schema_parts.add(element)
                    for keyword in identifier_keywords:
                        if keyword in element_column:
                            schema_parts.add(element)

            db_schema = _build_focused_schema_from_parts(list(schema_parts))

        # Send the schema and question to the LLM
        response_type, sql_query, explanation = gemini_service.generate_intelligent_response(request.question,
                                                                                             db_schema)

        # Handle the response based on its type (SQL, Meta, or Error)
        if response_type == "error":
            # Error occurred within the Gemini service
            return QueryResponse(response_type="error", sql_query="", explanation=explanation, data=[{"error": explanation}])

        elif response_type == "meta":
            # This was a meta-question. No SQL is run.
            # The 'explanation' field contains the full answer.
            return QueryResponse(
                response_type="meta",
                sql_query="",  # No SQL was generated or run
                explanation=explanation,
                data=[]  # No data result
            )

        elif response_type == "sql":
            # This was a data query. We must have a SQL query.
            if not sql_query:
                # Safeguard: LLM said 'sql' but sent no query
                error_msg = "The AI identified this as a data query but failed to produce SQL."
                return QueryResponse(response_type="error", sql_query="", explanation=explanation or error_msg, data=[{"error": error_msg}])

            # Build a manager from saved connection details to execute SQL
            st = (conn.get("source_type") or "").lower()
            if st in ("postgresql", "mysql"):
                raw = conn.get("db_details") or "{}"
                details_obj = json.loads(raw) if isinstance(raw, str) else raw
                ds = DataSource(source_type=st, db_details=DBDetails(**details_obj), file_path=None)
            elif st in ("csv", "excel"):
                ds = DataSource(source_type=st, db_details=None, file_path=conn.get("s3_uri"))
            else:
                raise RuntimeError(f"Unsupported source type: {st}")

            manager = create_data_manager(ds)
            data_result = manager.execute_query(sql_query)

            return QueryResponse(
                response_type="sql",
                sql_query=sql_query,
                explanation=explanation,
                data=data_result
            )

        else:
            # Fallback for an unknown response type
            error_msg = f"Received an unknown response type from the AI: {response_type}"
            return QueryResponse(response_type="error", sql_query="", explanation=explanation or error_msg, data=[{"error": error_msg}])

    except Exception as e:
        error_msg = f"An error occurred: {e}"
        print(error_msg)
        return QueryResponse(response_type="error", sql_query="", explanation=error_msg, data=[{"error": error_msg}])
