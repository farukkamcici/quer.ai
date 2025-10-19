from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
import requests
from typing import Optional, Any, Dict
from app.core.data_manager_factory import create_data_manager
from app.schemas.query import DataSource, QueryResponse
from app.core import orchestrator


class CreateChatRequest(BaseModel):
  user_id: str
  title: Optional[str] = None


class ChatMessageRequest(BaseModel):
  chat_id: str
  user_id: str
  message: str


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
  }


@router.post("/chat/create")
def create_chat(req: CreateChatRequest) -> Dict[str, Any]:
  payload = {"user_id": req.user_id, "title": req.title or None, "data_source_id": None, "messages": []}
  r = requests.post(f"{SUPABASE_URL}/rest/v1/chats", headers=_sb_headers(), json=payload)
  if not r.ok:
    raise HTTPException(status_code=400, detail=r.text)
  data = r.json()
  chat_id = data[0]["id"] if isinstance(data, list) and data else data.get("id")
  return {"chat_id": chat_id}


def _get_chat(chat_id: str, user_id: str) -> Dict[str, Any]:
  r = requests.get(
    f"{SUPABASE_URL}/rest/v1/chats",
    headers=_sb_headers(),
    params={"id": f"eq.{chat_id}", "user_id": f"eq.{user_id}", "select": "*"},
  )
  if not r.ok or not r.json():
    raise HTTPException(status_code=404, detail="Chat not found")
  return r.json()[0]


def _get_connection(conn_id: str, user_id: str) -> Dict[str, Any]:
  r = requests.get(
    f"{SUPABASE_URL}/rest/v1/connections",
    headers=_sb_headers(),
    params={"id": f"eq.{conn_id}", "user_id": f"eq.{user_id}", "select": "*"},
  )
  if not r.ok or not r.json():
    raise HTTPException(status_code=404, detail="Connection not found")
  return r.json()[0]


@router.post("/chat/message")
def chat_message(req: ChatMessageRequest) -> Dict[str, Any]:
  chat = _get_chat(req.chat_id, req.user_id)
  data_source_id = chat.get("data_source_id")
  if not data_source_id:
    raise HTTPException(status_code=400, detail="Please select a data source before chatting.")

  conn = _get_connection(data_source_id, req.user_id)
  st = (conn.get("source_type") or "").lower()
  ds: DataSource
  if st in ("postgresql", "mysql"):
    import json as _json
    details = conn.get("db_details") or "{}"
    try:
      details_obj = _json.loads(details) if isinstance(details, str) else details
    except Exception:
      details_obj = {}
    ds = DataSource(source_type=st, db_details=details_obj, file_path=None)
  elif st in ("csv", "excel"):
    ds = DataSource(source_type=st, file_path=conn.get("s3_uri"), db_details=None)
  else:
    raise HTTPException(status_code=400, detail=f"Unsupported source type: {st}")

  # Build a synthetic QueryRequest and run through orchestrator
  class _QR(BaseModel):
    question: str
    data_source: DataSource

  qr = _QR(question=req.message, data_source=ds)
  resp = orchestrator.process_query(qr)  # returns QueryResponse
  if not isinstance(resp, QueryResponse):
    # fallback: ensure dict
    result = resp
    explanation = result.get("explanation", "")
    sql = result.get("sql_query", "")
    data = result.get("data", [])
  else:
    explanation = resp.explanation
    sql = resp.sql_query
    data = resp.data

  # Append messages to chat
  from datetime import datetime, timezone
  messages = chat.get("messages") or []
  now = datetime.now(timezone.utc).isoformat()
  messages.append({"role": "user", "content": req.message, "timestamp": now})
  messages.append({"role": "assistant", "content": explanation, "timestamp": now, "sql": sql, "results": data})

  ur = requests.patch(
    f"{SUPABASE_URL}/rest/v1/chats?id=eq.{req.chat_id}",
    headers=_sb_headers(),
    json={"messages": messages},
  )
  if not ur.ok:
    # non-fatal; still return the LLM response
    pass

  return {"explanation": explanation, "sql": sql, "results": data}

