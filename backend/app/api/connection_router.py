from __future__ import annotations

import json
import os
from typing import Any, Dict, List, Optional

import requests
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.core.schema_discovery_service import SchemaDiscoveryService
from app.schemas.query import DataSource, DBDetails


router = APIRouter()


SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")


def _sb_headers() -> Dict[str, str]:
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise RuntimeError("Supabase env vars missing (SUPABASE_URL / SUPABASE_SERVICE_KEY)")
    return {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        # Ensure PostgREST returns inserted/updated rows so we can read IDs
        "Prefer": "return=representation",
    }


class ConnectionCreateRequest(BaseModel):
    user_id: str
    name: str
    source_type: str = Field(..., description="postgresql | mysql | csv | excel")
    db_details: Optional[DBDetails] = None
    s3_uri: Optional[str] = None


class ConnectionListItem(BaseModel):
    id: Any
    name: str
    source_type: str
    created_at: Optional[str] = None
    schema_json: Optional[List[Dict[str, Any]]] = None


def _build_datasource_from_payload(payload: ConnectionCreateRequest) -> DataSource:
    st = (payload.source_type or "").lower()
    if st in ("postgresql", "mysql"):
        if not payload.db_details:
            raise HTTPException(status_code=400, detail="db_details is required for SQL sources")
        return DataSource(source_type=st, db_details=payload.db_details, file_path=None)
    elif st in ("csv", "excel"):
        if not payload.s3_uri:
            raise HTTPException(status_code=400, detail="s3_uri (or file path) is required for file sources")
        return DataSource(source_type=st, db_details=None, file_path=payload.s3_uri)
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported source_type: {st}")


@router.post("/connections")
def create_connection(req: ConnectionCreateRequest) -> Dict[str, Any]:
    """Create a connection, discover schema, and persist all fields in Supabase."""
    ds = _build_datasource_from_payload(req)

    # Discover schema artifacts
    svc = SchemaDiscoveryService()
    artifacts = svc.discover_and_process_schema(ds)

    # Prepare payload for Supabase
    payload: Dict[str, Any] = {
        "user_id": req.user_id,
        "name": req.name,
        "source_type": req.source_type.lower(),
        # Store db_details as JSON string for compatibility with existing code
        "db_details": json.dumps(req.db_details.dict()) if req.db_details else None,
        "s3_uri": req.s3_uri,
        "schema_json": artifacts.get("schema_json"),
        "schema_elements_flat": artifacts.get("schema_elements_flat"),
        "is_large": artifacts.get("is_large"),
    }

    r = requests.post(f"{SUPABASE_URL}/rest/v1/connections", headers=_sb_headers(), json=payload)
    if not r.ok:
        raise HTTPException(status_code=400, detail=r.text)
    data = r.json()
    # Return a simple envelope
    created = data[0] if isinstance(data, list) and data else data
    return {
        "id": created.get("id"),
        "is_large": artifacts.get("is_large"),
        "schema_size": len(artifacts.get("schema_elements_flat") or []),
    }


@router.put("/connections/{connection_id}/refresh")
def refresh_connection(connection_id: str, user_id: str = Query(...)) -> Dict[str, Any]:
    """Re-discover schema for an existing connection and update only schema fields."""
    # Read existing connection
    gr = requests.get(
        f"{SUPABASE_URL}/rest/v1/connections",
        headers=_sb_headers(),
        params={"id": f"eq.{connection_id}", "user_id": f"eq.{user_id}", "select": "*"},
    )
    if not gr.ok or not gr.json():
        raise HTTPException(status_code=404, detail="Connection not found")
    conn = gr.json()[0]

    st = (conn.get("source_type") or "").lower()
    if st in ("postgresql", "mysql"):
        raw = conn.get("db_details") or "{}"
        details_obj = json.loads(raw) if isinstance(raw, str) else raw
        ds = DataSource(source_type=st, db_details=DBDetails(**details_obj), file_path=None)
    elif st in ("csv", "excel"):
        ds = DataSource(source_type=st, db_details=None, file_path=conn.get("s3_uri"))
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported source type: {st}")

    svc = SchemaDiscoveryService()
    artifacts = svc.discover_and_process_schema(ds)

    pr = requests.patch(
        f"{SUPABASE_URL}/rest/v1/connections?id=eq.{connection_id}",
        headers=_sb_headers(),
        json={
            "schema_json": artifacts.get("schema_json"),
            "schema_elements_flat": artifacts.get("schema_elements_flat"),
            "is_large": artifacts.get("is_large"),
        },
    )
    if not pr.ok:
        raise HTTPException(status_code=400, detail=pr.text)

    return {
        "id": connection_id,
        "is_large": artifacts.get("is_large"),
        "schema_size": len(artifacts.get("schema_elements_flat") or []),
    }


@router.get("/connections", response_model=List[ConnectionListItem])
def list_connections(user_id: str = Query(...)) -> List[ConnectionListItem]:
    """List connections for a user without sensitive fields."""
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/connections",
        headers=_sb_headers(),
        params={
            "user_id": f"eq.{user_id}",
            "select": "id,name,source_type,created_at,schema_json",
            "order": "created_at.desc",
        },
    )
    if not r.ok:
        raise HTTPException(status_code=400, detail=r.text)
    return r.json()


@router.delete("/connections/{connection_id}")
def delete_connection(connection_id: str, user_id: str = Query(...)) -> Dict[str, Any]:
    r = requests.delete(
        f"{SUPABASE_URL}/rest/v1/connections?id=eq.{connection_id}&user_id=eq.{user_id}",
        headers=_sb_headers(),
    )
    if not r.ok:
        raise HTTPException(status_code=400, detail=r.text)
    return {"deleted": True, "id": connection_id}
