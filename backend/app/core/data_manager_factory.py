from sqlalchemy import create_engine
import duckdb
import pandas as pd
from app.schemas.query import DataSource
from app.core.data_manager import DataSourceManager, SQLAlchemyManager, DuckDBManager


def create_data_manager(source: DataSource) -> DataSourceManager:
    """Creates the appropriate data manager and connection engine from source details."""

    source_type = source.source_type.lower()
    uri = ""

    if source_type in ['postgresql', 'mysql', 'sqlite']:
        if not source.db_details:
            raise ValueError(f"db_details are required for source_type '{source_type}'")

        details = source.db_details

        if source_type == 'postgresql':
            # Driver: psycopg2 (psycopg2-binary ile kuruldu)
            uri = f"postgresql+psycopg2://{details.username}:{details.password}@{details.host}:{details.port}/{details.database}"

        elif source_type == 'mysql':
            # Driver: pymysql (PyMySQL ile kuruldu)
            uri = f"mysql+pymysql://{details.username}:{details.password}@{details.host}:{details.port}/{details.database}"

        elif source_type == 'sqlite':
            # SQLite için sadece dosya yolu yeterli
            uri = f"sqlite:///{details.database}"  # 'database' alanı dosya yolunu tutacak

        engine = create_engine(uri)
        return SQLAlchemyManager(engine)

    elif source_type in ['csv', 'excel']:
        if not source.file_path:
            raise ValueError(f"file_path is required for source_type '{source_type}'")

        if source_type == 'csv':
            df = pd.read_csv(source.file_path)
        if source_type == 'excel':
            df = pd.read_excel(source.file_path)

        con = duckdb.connect(database=':memory:')
        con.execute("CREATE OR REPLACE VIEW data AS SELECT * FROM df")
        return DuckDBManager(con)

    else:
        raise ValueError(f"Unsupported data source type: '{source_type}'")