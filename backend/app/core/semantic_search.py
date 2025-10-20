import numpy as np
import faiss
from sentence_transformers import SentenceTransformer

_model_cache = SentenceTransformer('paraphrase-multilingual-mpnet-base-v2')

class SemanticSearch:
    def __init__(self, model_name: str = 'paraphrase-multilingual-mpnet-base-v2'):
        self.model = _model_cache
        self.index = None
        self.schema_elements = []

    def create_vector_store(self, schema_elements: list[str]):
        if not schema_elements:
            raise ValueError("Schema elements cannot be empty.")

        self.schema_elements = schema_elements

        embeddings = self.model.encode(schema_elements)
        dimension = embeddings.shape[1]
        self.index = faiss.IndexFlatL2(dimension)
        self.index.add(np.array(embeddings, dtype=np.float32))

    def find_relevant_schema_parts(self, query: str, k: int = 15) -> list[str]:
        if self.index is None:
            raise RuntimeError("Vector store is not initialized. Please call create_vector_store() first.")

        effective_k = min(k, self.index.ntotal)

        query_embedding = self.model.encode([query])
        _, indices = self.index.search(np.array(query_embedding, dtype=np.float32), effective_k)

        return [self.schema_elements[i] for i in indices[0]]

