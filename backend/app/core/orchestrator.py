from app.services import gemini_service
from app.schemas.query import QueryRequest, QueryResponse, DataSource
from app.core.config import DEFAULT_SOURCE_TYPE, DEFAULT_DATABASE_URI
from app.core.data_manager_factory import create_data_manager

def process_query(request: QueryRequest) -> QueryResponse:
    try:
        # Step 1: Determine the data source, using default if not provided
        if request.data_source:
            source = request.data_source
        else:
            source = DataSource(source_type=DEFAULT_SOURCE_TYPE, uri=DEFAULT_DATABASE_URI)

        # Step 2: Create the appropriate data manager using the factory
        manager = create_data_manager(source)

        # Step 3: Get the database schema from the manager
        db_schema = manager.get_schema_representation()
        if not db_schema or "No user-defined tables" in db_schema:
            error_msg = "Could not find any data or tables in the provided source."
            return QueryResponse(sql_query="", explanation=error_msg, data=[{"error": error_msg}])

        # Step 4: Send the schema and question to the LLM
        sql_query, explanation = gemini_service.generate_sql_and_explanation(request.question, db_schema)

        # Step 5: Execute the generated SQL using the manager
        data_result = manager.execute_query(sql_query)

        return QueryResponse(
            sql_query=sql_query,
            explanation=explanation,
            data=data_result
        )
    except Exception as e:
        error_msg = f"An error occurred: {e}"
        print(error_msg)
        return QueryResponse(sql_query="", explanation=error_msg, data=[{"error": error_msg}])