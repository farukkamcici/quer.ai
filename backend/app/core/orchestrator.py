from app.services import gemini_service, db_service  # db_service'i import et
from app.schemas.query import QueryResponse


def process_query(question: str) -> QueryResponse:
    """
    Sorgu işleme akışını yönetir.
    1. LLM servisinden SQL ve açıklama alır.
    2. DB servisinden sorguyu çalıştırıp veriyi alır.
    3. Sonucu uygun formatta döndürür.
    """
    sql_query, explanation = gemini_service.get_sql_query(question)

    data_result = db_service.execute_query(sql_query)

    return QueryResponse(
        sql_query=sql_query,
        explanation=explanation,
        data=data_result
    )