from app.services import gemini_service
from app.schemas.query import QueryRequest, QueryResponse, DataSource
from app.core.data_manager_factory import create_data_manager
from collections import defaultdict
from app.core.semantic_search import SemanticSearch

def _build_focused_schema_from_parts(parts: list[str]) -> str:
    """
        Reconstructs a human-readable schema string from a list of relevant parts.
        Example input: ['users.user_id', 'users.name', 'orders.amount']
        Example output:
        Table `users` has columns: user_id, name
        Table `orders` has columns: amount
        """

    tables = defaultdict(list)
    for part in parts:
        split_parts = part.split(".")
        table_name = ".".join(split_parts[:-1])
        column_name = split_parts[-1]
        tables[table_name].append(column_name)

    schema_str = ""
    for table, columns in tables.items():
        column_list = ", ".join(columns)
        schema_str += f"Table {table} has columns: {column_list}\n"

    return schema_str.strip()

def process_query(request: QueryRequest) -> QueryResponse:
    try:
        # Determine the data source
        if request.data_source:
            source = request.data_source
        else:
            error_msg = "A data source must be provided in the request."
            return QueryResponse(sql_query="", explanation="", data=[{"error": error_msg}])

        # Create the appropriate data manager using the factory
        manager = create_data_manager(source)

        # Get all schema elements from the manager
        all_schema_elements = manager.get_schema_elements()
        if not all_schema_elements:
            error_msg = "Could not find any columns or tables in the provided source."
            return QueryResponse(sql_query="", explanation="", data=[{"error": error_msg}])

        #Do semantic search
        search =SemanticSearch()
        search.create_vector_store(all_schema_elements)
        semantic_parts = search.find_relevant_schema_parts(request.question)

        #Identify the tables involved from the semantic search results
        relevant_tables = set()
        for part in semantic_parts:
            table_name = ".".join(part.split('.')[:-1])
            relevant_tables.add(table_name)

        #Expand the results with key and name columns from those tables
        schema_parts = set(semantic_parts)

        identifier_keywords = ['name', 'title', 'label', 'isim', 'ad']

        for element in all_schema_elements:
            element_table = ".".join(element.split('.')[:-1])
            element_column = element.split('.')[-1].lower()

            if element_table in relevant_tables:
                #Include columns ending with '_id' or being 'id'
                if element_column.endswith('_id') or element_column == 'id':
                    schema_parts.add(element)

                #Always include columns that contain a name-like keyword
                for keyword in identifier_keywords:
                    if keyword in element_column:
                        schema_parts.add(element)

        #Build the final schema for the LLM
        db_schema = _build_focused_schema_from_parts(list(schema_parts))

        #Send the schema and question to the LLM
        sql_query, explanation = gemini_service.generate_sql_and_explanation(request.question, db_schema)

        if not sql_query:
            error_msg = "Could not generate a SQL query."
            return QueryResponse(sql_query="", explanation="", data=[{"error": error_msg}])

        # Execute the generated SQL using the manager
        data_result = manager.execute_query(sql_query)

        return QueryResponse(
            sql_query=sql_query,
            explanation=explanation,
            data=data_result
        )
    except Exception as e:
        error_msg = f"An error occurred: {e}"
        print(error_msg)
        return QueryResponse(sql_query="", explanation="", data=[{"error": error_msg}])