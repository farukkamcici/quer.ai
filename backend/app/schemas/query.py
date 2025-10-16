from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional


class DBDetails(BaseModel):
    """Holds individual connection parameters for a database."""
    host: Optional[str] = None
    port: Optional[int] = None
    username: Optional[str] = None
    password: Optional[str] = None
    database: Optional[str] = None


class DataSource(BaseModel):
    """Defines the source of the data to be queried."""
    source_type: str = Field(..., description="e.g., 'postgresql', 'mysql', 'sqlite', 'csv', 'excel'")

    db_details: Optional[DBDetails] = None

    # Dosyalar için bu alanı kullanacağız
    file_path: Optional[str] = None


class QueryRequest(BaseModel):
    """The main request model for the API."""
    question: str
    data_source: Optional[DataSource] = Field(None, description="The data source. Uses default if not provided.")


# QueryResponse modelinde değişiklik yok
class QueryResponse(BaseModel):
    sql_query: str
    explanation: str
    data: List[Dict[str, Any]]