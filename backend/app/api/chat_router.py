from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
import requests
from typing import Optional, Any, Dict
from app.schemas.query import QueryResponse, QueryRequest
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

  # Build a request to use cached schema by connection id
  qr = QueryRequest(question=req.message, connection_id=data_source_id, user_id=req.user_id)
  resp = orchestrator.process_query(qr)  # returns QueryResponse
  if not isinstance(resp, QueryResponse):
    # fallback: ensure dict
    result = resp
    explanation = result.get("explanation", "")
    sql = result.get("sql_query", "")
    data = result.get("data", [])
    response_type = result.get("response_type", None)
  else:
    explanation = resp.explanation
    sql = resp.sql_query
    data = resp.data
    response_type = resp.response_type

  # Append messages to chat
  from datetime import datetime, timezone
  messages = chat.get("messages") or []
  now = datetime.now(timezone.utc).isoformat()
  messages.append({"role": "user", "content": req.message, "timestamp": now})
  messages.append({"role": "assistant", "content": explanation, "timestamp": now, "sql": sql, "results": data, "response_type": response_type})

  ur = requests.patch(
    f"{SUPABASE_URL}/rest/v1/chats?id=eq.{req.chat_id}",
    headers=_sb_headers(),
    json={"messages": messages},
  )
  if not ur.ok:
    # non-fatal; still return the LLM response
    pass

  return {"explanation": explanation, "sql": sql, "results": data, "response_type": response_type}
