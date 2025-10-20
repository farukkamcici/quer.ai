from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional


class DBDetails(BaseModel):
    """Holds individual connection parameters for a database."""
    host: str = None
    port: int = None
    username: str = None
    password: str = None
    database: str = None


class DataSource(BaseModel):
    """Defines the source of the data to be queried."""
    source_type: str = Field(..., description="e.g., 'postgresql', 'mysql', 'csv', 'excel'")

    db_details: Optional[DBDetails] = None

    file_path: Optional[str] = None


class QueryRequest(BaseModel):
    """The main request model for the API."""
    question: str
    connection_id: Optional[str] = Field(None, description="ID of a saved connection")
    user_id: Optional[str] = Field(None, description="User ID for ownership checks")


class QueryResponse(BaseModel):
    response_type: Optional[str] = Field(default=None, description="'sql' | 'meta' | 'error'")
    sql_query: str
    explanation: str
    data: List[Dict[str, Any]]
