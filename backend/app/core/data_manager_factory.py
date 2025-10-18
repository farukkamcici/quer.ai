import os
from sqlalchemy import create_engine
import duckdb
import pandas as pd
import s3fs
from app.schemas.query import DataSource
from app.core.data_manager import DataSourceManager, SQLAlchemyManager, DuckDBManager


def create_data_manager(source: DataSource) -> DataSourceManager:
    """Creates the appropriate data manager and connection engine from source details."""

    source_type = source.source_type.lower()
    uri = ""

    # If file_path is provided and source is one of the file-based types, prefer file workflow
    if source.file_path and source_type in ['csv', 'excel']:
        file_path = source.file_path
        con = duckdb.connect(database=':memory:')
        # Enable S3 support
        con.execute("INSTALL httpfs; LOAD httpfs;")
        region = os.getenv("AWS_REGION")
        if region:
            con.execute(f"SET s3_region='{region}'")
        access_key = os.getenv("AWS_ACCESS_KEY_ID")
        secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")
        if access_key and secret_key:
            con.execute(f"SET s3_access_key_id='{access_key}'")
            con.execute(f"SET s3_secret_access_key='{secret_key}'")

        if source_type == 'csv':
            # DuckDB can read CSV directly from s3:// URIs.
            safe_uri = file_path.replace("'", "''")
            con.execute(
                f"CREATE OR REPLACE TEMP VIEW data AS SELECT * FROM read_csv_auto('{safe_uri}', HEADER=TRUE)"
            )
            return DuckDBManager(con)

        if source_type == 'excel':
            # Use pandas + s3fs for Excel, then register
            df = pd.read_excel(file_path)
            con.register("data", df)
            return DuckDBManager(con)


    # Fallback to DB workflow
    if source_type in ['postgresql', 'mysql']:
        if not source.db_details:
            raise ValueError(f"db_details are required for source_type '{source_type}'")

        details = source.db_details

        if source_type == 'postgresql':
            uri = f"postgresql+psycopg2://{details.username}:{details.password}@{details.host}:{details.port}/{details.database}"
        elif source_type == 'mysql':
            uri = f"mysql+pymysql://{details.username}:{details.password}@{details.host}:{details.port}/{details.database}"

        engine = create_engine(uri)
        return SQLAlchemyManager(engine)

    else:
        raise ValueError(f"Unsupported data source type: '{source_type}'")
