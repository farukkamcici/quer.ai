import pandas as pd
import duckdb
from abc import ABC, abstractmethod
from sqlalchemy import inspect, Engine
from typing import List, Dict, Any

class DataSourceManager(ABC):
    """Abstract base class for data source operations."""
    @abstractmethod
    def get_schema_representation(self) -> str:
        pass

    @abstractmethod
    def execute_query(self, sql_query: str) -> List[Dict[str, Any]]:
        pass

class SQLAlchemyManager(DataSourceManager):
    """Manages connections and queries for SQLAlchemy-compatible databases."""
    def __init__(self, engine: Engine):
        self._engine = engine

    def get_schema_representation(self) -> str:
        inspector = inspect(self._engine)
        schema_str = ""

        ignore_schemas = [
            'information_schema', 'pg_catalog', 'performance_schema',
            'mysql', 'sys', 'topology', 'tiger', 'tiger_data', 'public'
        ]

        for schema_name in inspector.get_schema_names():
            if schema_name in ignore_schemas:
                continue
            for table_name in inspector.get_table_names(schema=schema_name):
                columns = [col['name'] for col in inspector.get_columns(table_name, schema=schema_name)]
                schema_str += f"Table `{schema_name}.{table_name}` has columns: {', '.join(columns)}\n"

        return schema_str.strip() or "No user-defined tables found in the database."

    def execute_query(self, sql_query: str) -> List[Dict[str, Any]]:
        with self._engine.connect() as connection:
            df = pd.read_sql(sql_query, connection)
            return df.to_dict(orient='records')

class DuckDBManager(DataSourceManager):
    """Manages connections and queries for file-based sources via DuckDB."""
    def __init__(self, connection):
        self._con = connection
        self._table_name = self._get_table_name()

    def _get_table_name(self) -> str:
        return self._con.execute("PRAGMA show_tables;").fetchdf()['name'][0]

    def get_schema_representation(self) -> str:
        columns_df = self._con.execute(f"DESCRIBE SELECT * FROM {self._table_name};").fetchdf()
        columns = columns_df['column_name'].tolist()
        return f"Table `{self._table_name}` has columns: {', '.join(columns)}"

    def execute_query(self, sql_query: str) -> List[Dict[str, Any]]:
        df = self._con.execute(sql_query).fetchdf()
        return df.to_dict(orient='records')