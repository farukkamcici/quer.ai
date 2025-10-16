import duckdb
import pandas
from typing import List, Dict

DATA_FILE_PATH = "/Users/farukkamcici/PycharmProjects/querai/backend/data/products-1000.csv"

try:
    con = duckdb.connect(database=":memory:", read_only=False)
    con.execute("CREATE TABLE products AS SELECT * FROM read_csv_auto('"+DATA_FILE_PATH+"')")
    print("DuckDB bağlantısı kuruldu ve 'sales' tablosu yüklendi.")
except Exception as e:
    print(f"DuckDB başlatılırken hata oluştu: {e}")
    con = None


def execute_query(sql_query: str) -> List[Dict]:
    """
    Verilen bir SQL sorgusunu DuckDB üzerinde çalıştırır ve sonucu
    bir sözlük listesi olarak döndürür.
    """
    if not con:
        raise ConnectionError("DuckDB bağlantısı mevcut değil.")

    try:
        result = con.execute(sql_query).fetchdf().to_dict(orient='records')
        return result
    except Exception as e:
        # Hatalı sorgu durumunda boş liste ve bir hata mesajı döndürebiliriz
        print(f"Sorgu yürütülürken hata oluştu: {e}")
        return [{"error": str(e)}]