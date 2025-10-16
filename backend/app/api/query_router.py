from fastapi import APIRouter
from app.schemas.query import QueryRequest, QueryResponse
from app.core import orchestrator

router = APIRouter()

@router.post("/query", response_model=QueryResponse)
def handle_query(request: QueryRequest) -> QueryResponse:
    response = orchestrator.process_query(request)
    return response